/* Loaders: cada rango de la planilla como filas.
   La plantilla usa configuración regional es_ES: montos como 1.234,56 y fechas como dd/mm/aaaa. */

dash.loader('movimientos', {
  description: 'La pestaña Movimientos: una fila por movimiento, con la fecha como AAAA-MM-DD y los montos como números.',
  fn: ({ answer }) => {
    const a = typeof answer === 'string' ? JSON.parse(answer) : answer;
    if (!a || !a.range) throw new Error('Google Sheets no devolvió la pestaña Movimientos.');
    const num = (s) => { if (s == null) return null; let t = String(s).replace(/[€$%\s ≈]/g, ''); if (t === '') return null; if (t === '–' || t === '-') return 0; t = t.replace(/\./g, '').replace(',', '.'); const n = Number(t); return Number.isFinite(n) ? n : null; };
    const day = (s) => { const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null; };
    const cols = ['id', 'fecha', 'tipo', 'descripcion', 'categoria', 'monto', 'moneda', 'monto_base', 'mi_parte', 'cuenta', 'cuenta_destino', 'compartido_con', 'pago', 'etiqueta', 'origen', 'revisado', 'nota', 'efecto'];
    const numeric = new Set(['monto', 'monto_base', 'mi_parte', 'efecto']);
    const rows = (a.values || []).slice(1).filter((r) => r && r[0] && r[1]).map((r) => {
      const o = {};
      cols.forEach((k, i) => { const c = r[i] == null ? '' : r[i]; o[k] = numeric.has(k) ? num(c) : k === 'fecha' ? day(c) : c; });
      return o;
    });
    return { columns: cols, rows };
  },
});

dash.loader('categorias', {
  description: 'Las categorías de Config: tipo (Gasto o Ingreso), presupuesto mensual, ritmo y qué entra en cada una.',
  fn: ({ answer }) => {
    const a = typeof answer === 'string' ? JSON.parse(answer) : answer;
    if (!a || !a.range) throw new Error('Google Sheets no devolvió las categorías de Config.');
    const num = (s) => { if (s == null) return null; let t = String(s).replace(/[€$%\s ≈]/g, ''); if (t === '') return null; if (t === '–' || t === '-') return 0; t = t.replace(/\./g, '').replace(',', '.'); const n = Number(t); return Number.isFinite(n) ? n : null; };
    const rows = (a.values || []).filter((r) => r && r[0] && (r[1] === 'Gasto' || r[1] === 'Ingreso')).map((r) => ({
      categoria: r[0], tipo: r[1], presupuesto: num(r[2]) || 0, ritmo: r[3] || '', que_entra: r[4] || '',
    }));
    return { columns: ['categoria', 'tipo', 'presupuesto', 'ritmo', 'que_entra'], rows };
  },
});

dash.loader('parametros', {
  description: 'Los parámetros de Config: la moneda base y la de referencia.',
  fn: ({ answer }) => {
    const a = typeof answer === 'string' ? JSON.parse(answer) : answer;
    if (!a || !a.range) throw new Error('Google Sheets no devolvió los parámetros de Config.');
    const rows = (a.values || []).filter((r) => r && r[0]).map((r) => ({ parametro: r[0], valor: r[1] || '' }));
    return { columns: ['parametro', 'valor'], rows };
  },
});

dash.loader('monedas', {
  description: 'Los tipos de cambio de Config: cuánto vale una unidad de cada moneda en la moneda base.',
  fn: ({ answer }) => {
    const a = typeof answer === 'string' ? JSON.parse(answer) : answer;
    if (!a || !a.range) throw new Error('Google Sheets no devolvió las monedas de Config.');
    const num = (s) => { if (s == null) return null; let t = String(s).replace(/[€$%\s ≈]/g, ''); if (t === '') return null; t = t.replace(/\./g, '').replace(',', '.'); const n = Number(t); return Number.isFinite(n) ? n : null; };
    const rows = (a.values || []).filter((r) => r && r[0] && r[0] !== 'Moneda').map((r) => ({ moneda: r[0], valor: num(r[1]) }));
    return { columns: ['moneda', 'valor'], rows };
  },
});

dash.loader('hoy', {
  description: 'El encabezado de Inicio: el mes, el año y el día de hoy según la planilla.',
  fn: ({ answer }) => {
    const a = typeof answer === 'string' ? JSON.parse(answer) : answer;
    const t = String(((a && a.values) || [[]])[0][0] || '');
    const m = t.match(/^(\S+)\s+(\d{4}).*?(\d+)\s+(?:de|of)\s+(\d+)/i);
    if (!m) throw new Error('No encontré el mes en la celda B3 de Inicio.');
    const es = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const en = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const k = m[1].toLowerCase();
    const mes_num = Math.max(es.indexOf(k), en.indexOf(k)) + 1;
    if (!mes_num) throw new Error('No reconocí el mes "' + m[1] + '" en Inicio.');
    return { columns: ['anio', 'mes_num', 'dia', 'dias_mes'], rows: [{ anio: Number(m[2]), mes_num, dia: Number(m[3]), dias_mes: Number(m[4]) }] };
  },
});

dash.loader('cuentas', {
  description: 'La tabla Cuentas de Patrimonio: último saldo cargado, movimientos desde entonces y saldo de hoy, en su moneda y en la moneda base.',
  fn: ({ answer }) => {
    const a = typeof answer === 'string' ? JSON.parse(answer) : answer;
    if (!a || !a.range) throw new Error('Google Sheets no devolvió las cuentas de Patrimonio.');
    const num = (s) => { if (s == null) return null; let t = String(s).replace(/[€$%\s ≈]/g, ''); if (t === '') return null; if (t === '–' || t === '-') return 0; t = t.replace(/\./g, '').replace(',', '.'); const n = Number(t); return Number.isFinite(n) ? n : null; };
    const day = (s) => { const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null; };
    const rows = (a.values || []).slice(1).filter((r) => r && r[0]).map((r) => ({
      cuenta: r[0], moneda: r[1] || '', fecha: day(r[2]), ultimo_saldo: num(r[3]), mov_desde: num(r[4]),
      saldo: num(r[5]), saldo_base: num(r[6]), dif: r[7] === '' || r[7] == null ? null : num(r[7]),
    }));
    return { columns: ['cuenta', 'moneda', 'fecha', 'ultimo_saldo', 'mov_desde', 'saldo', 'saldo_base', 'dif'], rows };
  },
});

dash.loader('personas', {
  description: 'La tabla Personas de Patrimonio: cuánto te debe cada uno (positivo) o le debés (negativo).',
  fn: ({ answer }) => {
    const a = typeof answer === 'string' ? JSON.parse(answer) : answer;
    if (!a || !a.range) throw new Error('Google Sheets no devolvió las personas de Patrimonio.');
    const num = (s) => { if (s == null) return null; let t = String(s).replace(/[€$%\s ≈]/g, ''); if (t === '') return null; if (t === '–' || t === '-') return 0; t = t.replace(/\./g, '').replace(',', '.'); const n = Number(t); return Number.isFinite(n) ? n : null; };
    const rows = (a.values || []).slice(1).filter((r) => r && r[0] && r[0] !== 'Todo saldado').map((r) => ({ persona: r[0], saldo: num(r[1]) || 0 }));
    return { columns: ['persona', 'saldo'], rows };
  },
});

dash.loader('activos', {
  description: 'La pestaña Activos: inversiones y bienes con lo invertido, lo que valen hoy y la ganancia.',
  fn: ({ answer }) => {
    const a = typeof answer === 'string' ? JSON.parse(answer) : answer;
    if (!a || !a.range) throw new Error('Google Sheets no devolvió la pestaña Activos.');
    const num = (s) => { if (s == null) return null; let t = String(s).replace(/[€$%\s ≈]/g, ''); if (t === '') return null; if (t === '–' || t === '-') return 0; t = t.replace(/\./g, '').replace(',', '.'); const n = Number(t); return Number.isFinite(n) ? n : null; };
    const day = (s) => { const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null; };
    const rows = (a.values || []).slice(1).filter((r) => r && r[0]).map((r) => ({
      activo: r[0], tipo: r[1] || '', cantidad: num(r[2]), moneda: r[3] || '', precio: num(r[4]), fecha_precio: day(r[5]),
      invertido: num(r[6]) || 0, nota: r[7] || '', valor: num(r[8]) || 0, ganancia: num(r[9]),
      ganancia_pct: r[10] && String(r[10]).includes('%') ? num(r[10]) / 100 : null,
    }));
    return { columns: ['activo', 'tipo', 'cantidad', 'moneda', 'precio', 'fecha_precio', 'invertido', 'nota', 'valor', 'ganancia', 'ganancia_pct'], rows };
  },
});

dash.loader('cierres', {
  description: 'La pestaña Cierres: la foto del patrimonio al final de cada mes.',
  fn: ({ answer }) => {
    const a = typeof answer === 'string' ? JSON.parse(answer) : answer;
    if (!a || !a.range) throw new Error('Google Sheets no devolvió la pestaña Cierres.');
    const num = (s) => { if (s == null) return null; let t = String(s).replace(/[€$%\s ≈]/g, ''); if (t === '') return null; if (t === '–' || t === '-') return 0; t = t.replace(/\./g, '').replace(',', '.'); const n = Number(t); return Number.isFinite(n) ? n : null; };
    const day = (s) => { const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null; };
    const rows = (a.values || []).slice(1).filter((r) => r && r[0]).map((r) => ({
      fecha: day(r[0]), liquido: num(r[1]), inversiones: num(r[2]), bienes: num(r[3]), te_deben: num(r[4]),
      patrimonio: num(r[5]), patrimonio_ref: num(r[6]), nota: r[7] || '',
    })).filter((r) => r.fecha);
    return { columns: ['fecha', 'liquido', 'inversiones', 'bienes', 'te_deben', 'patrimonio', 'patrimonio_ref', 'nota'], rows };
  },
});
