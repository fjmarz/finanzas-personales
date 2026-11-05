/* Cálculos: los números que salen de combinar pestañas de la planilla.
   "Mi parte" es lo que cuenta en ingresos y gastos: lo compartido entra por tu parte.
   La categoría "Compras grandes" se separa del gasto normal (cosas que duran años). */

dash.calc('base', {
  title: 'Moneda',
  description: 'La moneda base de la planilla y cuánto vale la moneda de referencia en ella.',
  inputs: ['parametros', 'monedas'],
  fn: (parametros, monedas) => {
    const p = (k) => (parametros.find((r) => r.parametro === k) || {}).valor;
    const moneda = p('Moneda base') || 'EUR';
    const ref = p('Moneda de referencia') || '';
    const v = (monedas.find((r) => r.moneda === ref) || {}).valor;
    return [{ moneda, ref, ref_valor: v || null }];
  },
});

dash.calc('mes', {
  title: 'Este mes por categoría',
  description: 'Presupuesto, gastado y ritmo de cada categoría de gasto en el mes en curso, más el total.',
  inputs: ['categorias', 'movimientos', 'hoy'],
  fn: (categorias, movimientos, hoy) => {
    const h = hoy[0];
    const pre = `${h.anio}-${String(h.mes_num).padStart(2, '0')}`;
    const frac = h.dia / h.dias_mes;
    const gastos = movimientos.filter((r) => r.tipo === 'Gasto' && r.fecha && r.fecha.startsWith(pre));
    const suma = (rs) => rs.reduce((s, r) => s + (r.mi_parte || 0), 0);
    const estado = (p, g, ritmo) => (!g || !p ? '' : g > p + 0.5 ? 'Pasado' : ritmo === 'Variable' && frac < 1 && g > p * frac * 1.1 ? 'Rápido' : 'OK');
    const rows = categorias.filter((c) => c.tipo === 'Gasto').map((c) => {
      const g = suma(gastos.filter((r) => r.categoria === c.categoria));
      return { categoria: c.categoria, ritmo: c.ritmo, presupuesto: c.presupuesto, gastado: g, restante: c.presupuesto - g, estado: estado(c.presupuesto, g, c.ritmo) };
    });
    const P = rows.reduce((s, r) => s + r.presupuesto, 0);
    const G = suma(gastos);
    rows.unshift({ categoria: 'Total gastos', ritmo: '', presupuesto: P, gastado: G, restante: P - G, estado: G > P + 0.5 ? 'Pasado' : 'OK' });
    return rows;
  },
});

dash.calc('ingresos_mes', {
  title: 'Lo que entró este mes',
  description: 'Cada categoría de ingreso: lo cobrado este mes y el anterior.',
  inputs: ['categorias', 'movimientos', 'hoy'],
  fn: (categorias, movimientos, hoy) => {
    const h = hoy[0];
    const ym = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
    const act = ym(h.anio, h.mes_num);
    const ant = h.mes_num === 1 ? ym(h.anio - 1, 12) : ym(h.anio, h.mes_num - 1);
    const suma = (cat, pre) => movimientos.filter((r) => r.tipo === 'Ingreso' && r.categoria === cat && r.fecha && r.fecha.startsWith(pre)).reduce((s, r) => s + (r.mi_parte || 0), 0);
    return categorias.filter((c) => c.tipo === 'Ingreso').map((c) => ({ categoria: c.categoria, este_mes: suma(c.categoria, act), mes_anterior: suma(c.categoria, ant) }));
  },
});

dash.calc('mensual', {
  title: 'Mes a mes',
  description: 'Ingresos, gastos, compras grandes, resultado y ahorro acumulado (real y presupuestado) de cada mes del año. El acumulado arranca en el primer mes con movimientos.',
  inputs: ['movimientos', 'categorias', 'hoy'],
  fn: (movimientos, categorias, hoy) => {
    const h = hoy[0];
    const NOM = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const presu = (t) => categorias.filter((c) => c.tipo === t).reduce((s, c) => s + c.presupuesto, 0);
    const plan = presu('Ingreso') - presu('Gasto');
    const m = NOM.map(() => ({ ingresos: 0, gastos: 0, grandes: 0, n: 0 }));
    for (const r of movimientos) {
      if (!r.fecha || Number(r.fecha.slice(0, 4)) !== h.anio) continue;
      const x = m[Number(r.fecha.slice(5, 7)) - 1];
      if (r.tipo === 'Ingreso') x.ingresos += r.mi_parte || 0;
      if (r.tipo === 'Gasto') { x.gastos += r.mi_parte || 0; if (r.categoria === 'Compras grandes') x.grandes += r.mi_parte || 0; }
      x.n += 1;
    }
    const first = Math.min(h.mes_num, m.findIndex((x) => x.n > 0) + 1 || h.mes_num);
    let real = 0, pl = 0;
    return NOM.map((mes, i) => {
      const n = i + 1, x = m[i], res = x.ingresos - x.gastos;
      if (n >= first) { pl += plan; if (n <= h.mes_num) real += res; }
      return {
        mes, n, estado: n < h.mes_num ? 'cerrado' : n === h.mes_num ? 'en curso' : 'futuro', con_datos: x.n > 0,
        ingresos: x.ingresos, gastos: x.gastos, grandes: x.grandes, resultado: res,
        acum_real: n >= first && n <= h.mes_num ? real : null, acum_plan: n >= first ? pl : null,
      };
    });
  },
});

dash.calc('categorias_anio', {
  title: 'Categorías del año',
  description: 'Lo gastado en el año en cada categoría contra su presupuesto hasta hoy (desde el primer mes con movimientos), su parte del total y el detalle mes a mes.',
  inputs: ['movimientos', 'categorias', 'mensual', 'hoy'],
  fn: (movimientos, categorias, mensual, hoy) => {
    const h = hoy[0];
    const meses = mensual.filter((r) => r.acum_plan != null && r.n <= h.mes_num).length || 1;
    const gastos = movimientos.filter((r) => r.tipo === 'Gasto' && r.fecha && Number(r.fecha.slice(0, 4)) === h.anio);
    const total = gastos.reduce((s, r) => s + (r.mi_parte || 0), 0) || 1;
    return categorias.filter((c) => c.tipo === 'Gasto').map((c) => {
      const o = { categoria: c.categoria, presupuesto: c.presupuesto, presup_hoy: c.presupuesto * meses, total: 0 };
      for (let i = 1; i <= 12; i++) o['m' + i] = 0;
      for (const r of gastos) if (r.categoria === c.categoria) { o['m' + Number(r.fecha.slice(5, 7))] += r.mi_parte || 0; o.total += r.mi_parte || 0; }
      o.vs_presup = o.presup_hoy - o.total;
      o.parte = o.total / total;
      return o;
    });
  },
});

dash.calc('fuentes', {
  title: 'Ingresos por categoría',
  description: 'Cada categoría de ingreso, mes a mes en el año.',
  inputs: ['movimientos', 'categorias', 'hoy'],
  fn: (movimientos, categorias, hoy) => {
    const h = hoy[0];
    return categorias.filter((c) => c.tipo === 'Ingreso').map((c) => {
      const o = { categoria: c.categoria, total: 0 };
      for (let i = 1; i <= 12; i++) o['m' + i] = 0;
      for (const r of movimientos) {
        if (r.tipo !== 'Ingreso' || r.categoria !== c.categoria || !r.fecha || Number(r.fecha.slice(0, 4)) !== h.anio) continue;
        o['m' + Number(r.fecha.slice(5, 7))] += r.mi_parte || 0; o.total += r.mi_parte || 0;
      }
      return o;
    });
  },
});

dash.calc('flujos', {
  title: 'Flujo de la plata',
  description: 'De dónde entró la plata y a dónde fue: el año, un mes promedio (el año dividido por los meses con movimientos) y cada mes.',
  inputs: ['fuentes', 'categorias_anio', 'mensual', 'hoy'],
  fn: (fuentes, categorias_anio, mensual, hoy) => {
    const h = hoy[0];
    const activos = mensual.filter((r) => r.acum_plan != null && r.n <= h.mes_num).map((r) => r.n);
    const k = activos.length || 1;
    const sum = (r) => activos.reduce((s, n) => s + (r['m' + n] || 0), 0);
    const periodos = [['anio', sum], ['promedio', (r) => sum(r) / k], ...activos.map((n) => ['m' + n, (r) => r['m' + n] || 0])];
    const out = [];
    for (const [periodo, v] of periodos) {
      let entra = 0, sale = 0;
      for (const r of fuentes) { const x = v(r); if (x > 0) { entra += x; out.push({ periodo, desde: r.categoria, hacia: 'Ingresos', valor: x, tipo: 'ingreso' }); } }
      for (const r of categorias_anio) { const x = v(r); if (x > 0) { sale += x; out.push({ periodo, desde: 'Ingresos', hacia: r.categoria, valor: x, tipo: 'gasto' }); } }
      if (entra > sale) out.push({ periodo, desde: 'Ingresos', hacia: 'Ahorro', valor: entra - sale, tipo: 'ahorro' });
      else if (sale > entra) out.push({ periodo, desde: 'Ahorros previos', hacia: 'Ingresos', valor: sale - entra, tipo: 'deficit' });
    }
    return out;
  },
});

dash.calc('etiquetas', {
  title: 'Viajes y etiquetas',
  description: 'Cada etiqueta de Movimientos (un viaje, un proyecto): lo gastado, cuándo y en qué categorías.',
  inputs: ['movimientos'],
  fn: (movimientos) => {
    const g = new Map();
    for (const r of movimientos) {
      if (!r.etiqueta || r.tipo !== 'Gasto' || !r.mi_parte || !r.fecha) continue;
      if (!g.has(r.etiqueta)) g.set(r.etiqueta, { etiqueta: r.etiqueta, desde: r.fecha, hasta: r.fecha, total: 0, movimientos: 0, por_categoria: {}, dias: {} });
      const v = g.get(r.etiqueta);
      v.total += r.mi_parte; v.movimientos += 1;
      if (r.fecha < v.desde) v.desde = r.fecha;
      if (r.fecha > v.hasta) v.hasta = r.fecha;
      v.por_categoria[r.categoria || 'Sin categoría'] = (v.por_categoria[r.categoria || 'Sin categoría'] || 0) + r.mi_parte;
      v.dias[r.fecha] = (v.dias[r.fecha] || 0) + 1;
    }
    // Cuándo fue: el día con más movimientos, así un pasaje comprado semanas antes no lo corre.
    return Array.from(g.values()).map((v) => ({
      etiqueta: v.etiqueta, cuando: Object.entries(v.dias).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1))[0][0],
      desde: v.desde, hasta: v.hasta, total: v.total, movimientos: v.movimientos, por_categoria: JSON.stringify(v.por_categoria),
    })).sort((a, b) => (a.cuando < b.cuando ? -1 : 1));
  },
});

dash.calc('kpis', {
  title: 'Números principales',
  description: 'Patrimonio (cuentas + inversiones + bienes + lo que te deben), ahorro del año y los promedios por mes que usa Libertad. Los promedios usan los meses cerrados con movimientos, sin compras grandes.',
  inputs: ['cuentas', 'activos', 'personas', 'cierres', 'mensual', 'base'],
  fn: (cuentas, activos, personas, cierres, mensual, base) => {
    const sum = (arr, f) => arr.reduce((s, r) => s + (f(r) || 0), 0);
    const liquido = sum(cuentas, (r) => r.saldo_base);
    const inversiones = sum(activos.filter((r) => r.tipo === 'Inversión'), (r) => r.valor);
    const bienes = sum(activos.filter((r) => r.tipo !== 'Inversión'), (r) => r.valor);
    const te_deben = sum(personas, (r) => r.saldo);
    const patrimonio = liquido + inversiones + bienes + te_deben;
    const ult = cierres.slice().sort((a, b) => (a.fecha < b.fecha ? -1 : 1)).pop() || null;
    const hasta = mensual.filter((r) => r.estado !== 'futuro');
    const ingresos_anio = sum(hasta, (r) => r.ingresos);
    const ahorro_anio = sum(hasta, (r) => r.resultado);
    const actual = hasta[hasta.length - 1] || {};
    const cerrados = mensual.filter((r) => r.estado === 'cerrado' && r.con_datos);
    const ref = cerrados.length ? cerrados : hasta.filter((r) => r.con_datos);
    const gasto_mes = ref.length ? sum(ref, (r) => r.gastos - r.grandes) / ref.length : 0;
    const ahorro_mes = ref.length ? sum(ref, (r) => r.resultado) / ref.length : 0;
    const capital = liquido + inversiones;
    const b = base[0] || {};
    return [{
      patrimonio, patrimonio_ref: b.ref_valor ? patrimonio / b.ref_valor : null, liquido, inversiones, bienes, te_deben,
      cierre_fecha: ult ? ult.fecha : null, delta_cierre: ult && ult.patrimonio != null ? patrimonio - ult.patrimonio : null,
      ingresos_anio, ahorro_anio, plan_a_hoy: actual.acum_plan, vs_plan: actual.acum_plan == null ? null : ahorro_anio - actual.acum_plan,
      tasa_ahorro: ingresos_anio ? ahorro_anio / ingresos_anio : null,
      gasto_mes, ahorro_mes, capital, runway_meses: gasto_mes ? capital / gasto_mes : null, meses_por_mes: gasto_mes ? ahorro_mes / gasto_mes : null,
    }];
  },
});

dash.calc('patrimonio_hist', {
  title: 'Patrimonio en el tiempo',
  description: 'El patrimonio de cada cierre mensual, más el de hoy.',
  inputs: ['cierres', 'kpis', 'hoy'],
  fn: (cierres, kpis, hoy) => {
    const h = hoy[0];
    const hoyIso = `${h.anio}-${String(h.mes_num).padStart(2, '0')}-${String(h.dia).padStart(2, '0')}`;
    const rows = cierres.filter((r) => r.patrimonio != null).map((r) => ({ fecha: r.fecha, patrimonio: r.patrimonio, hoy: false })).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
    if (kpis[0]) rows.push({ fecha: hoyIso, patrimonio: kpis[0].patrimonio, hoy: true });
    return rows;
  },
});
