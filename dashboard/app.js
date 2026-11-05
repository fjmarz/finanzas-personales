(function () {
  const root = document.getElementById('fx');
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => Array.from(root.querySelectorAll(s));

  /* ---------- formatos ---------- */
  const L = d3.formatLocale({ decimal: ',', thousands: '.', grouping: [3], currency: ['', ''] });
  const f0 = L.format(',.0f');
  const f1 = L.format(',.1f');
  const pct = (v) => (v == null || !isFinite(v) ? '—' : L.format('.0%')(v));
  const spct = (v) => (v == null || !isFinite(v) ? '—' : (v > 0.005 ? '+' : v < -0.005 ? '−' : '') + L.format('.0%')(Math.abs(v)));
  const SYM = { EUR: '€', USD: 'US$', ARS: '$', GBP: '£', MXN: '$', CLP: '$', COP: '$', UYU: '$', BRL: 'R$', PEN: 'S/' };
  const base = () => { const b = dash.data('base'); return (b.status === 'ok' && b.data[0]) || { moneda: 'EUR', ref: '', ref_valor: null }; };
  const money = (v) => {
    if (v == null || !isFinite(v)) return '—';
    const m = base().moneda, n = f0(v);
    return m === 'EUR' ? n + ' €' : SYM[m] ? SYM[m] + ' ' + n : n + ' ' + m;
  };
  const smoney = (v) => (v == null || !isFinite(v) ? '—' : (v > 0.5 ? '+' : v < -0.5 ? '−' : '') + money(Math.abs(v)));
  const kfmt = (v) => (Math.abs(v) >= 1000 ? f0(v / 1000) + 'k' : f0(v));
  const MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const fdate = (iso) => { if (!iso) return '—'; const [, m, d] = iso.split('-'); return `${Number(d)} ${MES[Number(m) - 1].toLowerCase()}`; };
  const fdateY = (iso) => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${Number(d)}/${Number(m)}/${y.slice(2)}`; };
  const tiempo = (meses) => (meses == null || !isFinite(meses) ? '—' : meses >= 24 ? f1(meses / 12) + ' años' : f0(meses) + (Math.round(meses) === 1 ? ' mes' : ' meses'));
  const GRANDES = 'Compras grandes';

  /* Un significado por color: azul entra, verde se guarda, violeta es gasto por categoría,
     gris el gasto total, naranja ir rápido y rojo solo un desvío real. */
  const P = { in: 'var(--fx-in)', save: 'var(--fx-save)', save2: 'var(--fx-save-2)', grandes: 'var(--fx-grandes)', cat: 'var(--fx-cat)', warn: 'var(--fx-warn)', bad: 'var(--fx-bad)', n1: 'var(--fx-n1)', n2: 'var(--fx-n2)', n3: 'var(--fx-n3)', n4: 'var(--fx-n4)' };
  const SRC = ['var(--fx-in)', 'var(--fx-in-2)', 'var(--fx-in-3)'];

  /* ---------- datos y estados ---------- */
  const D = (id) => dash.data(id).data || [];
  const st = (ids) => {
    const s = ids.map((id) => dash.data(id).status);
    if (s.every((x) => x === 'ok')) return 'ok';
    if (s.some((x) => x === 'error' || x === 'connect' || x === 'declined' || x === 'missing')) return 'bad';
    return 'loading';
  };
  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); };
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const hoy = () => D('hoy')[0];
  const K = () => D('kpis')[0];

  // Texto que sale de los datos: la función devuelve el texto o null para dejarlo vacío.
  function T(name, ids, fn) {
    dash.draw(name, (node) => {
      if (st(ids) !== 'ok') { node.textContent = '—'; return; }
      node.classList.remove('dash-skeleton');
      const t = fn(node);
      node.textContent = t == null ? '' : t;
    });
  }
  // Una caja que dibuja la función: gráfico, lista o tabla.
  function B(name, ids, fn) {
    dash.draw(name, (node) => {
      const s = st(ids);
      clear(node);
      if (s !== 'ok') {
        if (s === 'bad') { node.classList.remove('dash-skeleton'); if (node.tagName !== 'TBODY') node.appendChild(el('div', 'fx-fail', 'No cargó')); }
        else if (node.tagName !== 'TBODY') node.classList.add('dash-skeleton');
        return;
      }
      node.classList.remove('dash-skeleton');
      fn(node);
    });
  }
  const redraw = (...names) => names.forEach((n) => dash.draw(n));

  /* ---------- tooltip ---------- */
  let tip = null;
  dash.draw('tip', (node) => { tip = node; clear(node); node.classList.remove('on'); });
  function showTip(evt, title, lines) {
    if (!tip) return;
    clear(tip);
    tip.appendChild(el('div', 't', title));
    for (const ln of lines) {
      if (ln === '-') { tip.appendChild(el('div', 'sep')); continue; }
      const row = el('div', 'l');
      const left = el('span');
      if (ln.color) { const i = el('i'); i.style.background = ln.color; left.appendChild(i); }
      left.appendChild(document.createTextNode(ln.label));
      row.appendChild(left);
      row.appendChild(el('b', ln.cls || null, ln.value));
      tip.appendChild(row);
    }
    const r = root.getBoundingClientRect();
    tip.classList.add('on');
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = evt.clientX - r.left + 14, y = evt.clientY - r.top - th - 12;
    if (x + tw > r.width - 4) x = evt.clientX - r.left - tw - 14;
    if (x < 4) x = 4;
    if (evt.clientY - th - 12 < 0) y = evt.clientY - r.top + 16;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }
  const hideTip = () => { if (tip) tip.classList.remove('on'); };

  /* ---------- svg ---------- */
  function svgIn(box, h) {
    const w = Math.max(280, box.clientWidth);
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('height', h).attr('viewBox', `0 0 ${w} ${h}`);
    return { svg, w, h };
  }
  function textWidth(svg, strings, cls) {
    const g = svg.append('g').attr('opacity', 0);
    let m = 0;
    for (const s of strings) { const t = g.append('text').attr('class', cls || null).text(s); m = Math.max(m, t.node().getComputedTextLength()); }
    g.remove();
    return m;
  }
  function yGrid(svg, y, w, left, fmt, ticks) {
    const g = svg.append('g').attr('class', 'grid');
    for (const t of ticks) {
      g.append('line').attr('x1', left).attr('x2', w).attr('y1', y(t)).attr('y2', y(t));
      g.append('text').attr('x', left - 8).attr('y', y(t)).attr('dy', '0.32em').attr('text-anchor', 'end').text(fmt(t));
    }
  }
  const done = new Set();
  const anim = (key) => { if (done.has(key)) return false; done.add(key); return true; };
  const mesesActivos = () => D('mensual').filter((r) => r.acum_plan != null);

  /* ---------- panel con los movimientos detrás de cada número ---------- */
  const PNL0 = { open: false, tipo: 'Gasto', cats: null, etiqueta: null, titulo: '', mes: null, q: '', orden: 'fecha' };
  const pnl = { ...PNL0 };
  const drawer = $('#fx-drawer');
  const PANEL = ['pnl-eyebrow', 'pnl-title', 'pnl-period', 'pnl-stats', 'pnl-note', 'pnl-list'];
  function syncPanel() {
    drawer.hidden = !pnl.open;
    const h = hoy();
    const cur = h ? h.mes_num : 12;
    $('#pnl-prev').hidden = $('#pnl-next').hidden = pnl.mes == null;
    $('#pnl-prev').disabled = pnl.mes != null && pnl.mes <= 1;
    $('#pnl-next').disabled = pnl.mes != null && pnl.mes >= cur;
    $('#pnl-year').hidden = !!pnl.etiqueta || pnl.mes == null;
    $('#pnl-month').hidden = !!pnl.etiqueta || pnl.mes != null;
    $$('#pnl-orden [data-o]').forEach((b) => { const on = b.dataset.o === pnl.orden; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    if (pnl.open) redraw(...PANEL);
    redraw('ch-cats', 'ch-heat', 'etq-rows');
  }
  function openPanel(o) {
    const same = pnl.open && pnl.tipo === (o.tipo || 'Gasto') && String(pnl.cats) === String(o.cats || null) && pnl.mes === (o.mes ?? null) && pnl.etiqueta === (o.etiqueta || null);
    if (same) { closePanel(); return; }
    Object.assign(pnl, PNL0, o, { open: true });
    $('#pnl-q').value = '';
    hideTip();
    syncPanel();
  }
  function closePanel() { pnl.open = false; syncPanel(); }
  $('#pnl-close').addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pnl.open) closePanel(); });
  $('#pnl-prev').addEventListener('click', () => { if (pnl.mes > 1) { pnl.mes -= 1; syncPanel(); } });
  $('#pnl-next').addEventListener('click', () => { pnl.mes += 1; syncPanel(); });
  $('#pnl-year').addEventListener('click', () => { pnl.mes = null; syncPanel(); });
  $('#pnl-month').addEventListener('click', () => { const h = hoy(); pnl.mes = h ? h.mes_num : 12; syncPanel(); });
  $('#pnl-q').addEventListener('input', (e) => { pnl.q = e.target.value; redraw('pnl-stats', 'pnl-note', 'pnl-list'); });
  $$('#pnl-orden [data-o]').forEach((b) => b.addEventListener('click', () => { pnl.orden = b.dataset.o; syncPanel(); }));

  function panelRows() {
    const h = hoy();
    let rows = D('movimientos').filter((r) => r.tipo === pnl.tipo && r.fecha && Math.abs(r.mi_parte || 0) > 0.004);
    if (pnl.etiqueta) rows = rows.filter((r) => r.etiqueta === pnl.etiqueta);
    else rows = rows.filter((r) => Number(r.fecha.slice(0, 4)) === h.anio && (pnl.mes == null ? Number(r.fecha.slice(5, 7)) <= h.mes_num : Number(r.fecha.slice(5, 7)) === pnl.mes));
    if (pnl.cats) rows = rows.filter((r) => pnl.cats.includes(r.categoria));
    return rows;
  }
  T('pnl-eyebrow', ['movimientos'], () => (pnl.etiqueta ? 'Etiqueta' : pnl.tipo === 'Ingreso' ? 'Ingresos' : 'Gastos'));
  T('pnl-title', ['movimientos'], () => pnl.titulo || (pnl.cats ? pnl.cats.join(', ') : pnl.tipo === 'Ingreso' ? 'Todo lo que entró' : 'Todos los gastos'));
  T('pnl-period', ['movimientos', 'hoy'], () => {
    if (pnl.etiqueta) { const fs = panelRows().map((r) => r.fecha).sort(); return fs.length ? (fs[0] === fs[fs.length - 1] ? fdate(fs[0]) : `${fdate(fs[0])} → ${fdate(fs[fs.length - 1])}`) : ''; }
    return pnl.mes == null ? `Todo ${hoy().anio}` : `${cap(MESL[pnl.mes - 1])} ${hoy().anio}`;
  });
  B('pnl-stats', ['movimientos', 'hoy', 'mensual'], (node) => {
    const rows = panelRows();
    const total = rows.reduce((t, r) => t + r.mi_parte, 0);
    node.appendChild(el('div', 'tot', money(total)));
    const stat = (k, v, cls) => { const d = el('div'); d.appendChild(el('div', 'k', k)); d.appendChild(el('div', 'v' + (cls ? ' ' + cls : ''), v)); node.appendChild(d); };
    stat('Movimientos', String(rows.length));
    stat('Promedio por movimiento', rows.length ? money(total / rows.length) : '—');
  });
  T('pnl-note', ['movimientos'], () => {
    const n = panelRows().length;
    const q = pnl.q.trim().toLowerCase();
    let t = '';
    if (q) t += `${panelRows().filter((r) => [r.descripcion, r.nota, r.cuenta, r.compartido_con, r.categoria].join(' ').toLowerCase().includes(q)).length} de ${n} coinciden con "${pnl.q}". `;
    if (pnl.tipo === 'Gasto') t += 'Cada monto es tu parte: lo compartido entra por lo que te toca.';
    return t;
  });
  B('pnl-list', ['movimientos', 'hoy'], (tb) => {
    const q = pnl.q.trim().toLowerCase();
    let rows = panelRows();
    if (q) rows = rows.filter((r) => [r.descripcion, r.nota, r.cuenta, r.compartido_con, r.categoria].join(' ').toLowerCase().includes(q));
    rows = rows.slice().sort((a, b) => (pnl.orden === 'monto' ? Math.abs(b.mi_parte) - Math.abs(a.mi_parte) : b.fecha > a.fecha ? 1 : b.fecha < a.fecha ? -1 : 0));
    const maxV = d3.max(rows, (r) => Math.abs(r.mi_parte)) || 1;
    for (const r of rows) {
      const tr = el('tr'); tr.dataset.key = r.id;
      tr.appendChild(el('td', 'dim', fdate(r.fecha)));
      const d = el('td', 'desc');
      const t1 = el('div', 'fx-pm-name', r.descripcion);
      if (r.revisado === 'No') { const u = el('i', 'fx-pm-new'); u.title = 'Sin revisar'; t1.prepend(u); }
      d.appendChild(t1);
      const meta = [];
      if (!pnl.cats || pnl.cats.length > 1 || pnl.etiqueta) meta.push(r.categoria);
      if (r.cuenta) meta.push(r.cuenta);
      if (r.compartido_con) meta.push(`con ${r.compartido_con}${r.pago === 'Otro' ? ' (pagó ' + r.compartido_con + ')' : ''}`);
      if (meta.length) d.appendChild(el('div', 'fx-pm-meta', meta.filter(Boolean).join(' · ')));
      const bar = el('div', 'fx-pm-bar'); const bi = el('i'); bi.style.width = (Math.abs(r.mi_parte) / maxV) * 100 + '%'; bi.style.background = pnl.tipo === 'Ingreso' ? P.in : P.cat; bar.appendChild(bi); d.appendChild(bar);
      tr.appendChild(d);
      const a = el('td', 'amt', money(r.mi_parte));
      if (r.compartido_con && r.monto_base && Math.abs(r.monto_base - r.mi_parte) > 0.01) a.appendChild(el('div', 'fx-pm-meta', 'de ' + money(r.monto_base)));
      tr.appendChild(a);
      tb.appendChild(tr);
    }
    if (!rows.length) { const tr = el('tr'); const td = el('td', 'dim', q ? 'Nada coincide con la búsqueda.' : 'No hay movimientos en este período.'); td.colSpan = 3; tr.appendChild(td); tb.appendChild(tr); }
  });

  /* ---------- encabezado ---------- */
  T('hoy-txt', ['hoy'], () => { const h = hoy(); return `${cap(MESL[h.mes_num - 1])} ${h.anio} · día ${h.dia} de ${h.dias_mes}`; });
  T('lede-pat', ['kpis', 'base'], () => money(K().patrimonio));
  T('lede-aho', ['kpis', 'base'], () => money(K().ahorro_anio));
  T('lede-plan', ['kpis', 'base'], () => { const v = K().vs_plan; return v == null ? '' : `, ${money(Math.abs(v))} ${v >= 0 ? 'por encima' : 'por debajo'} del presupuesto`; });
  T('lede-run', ['kpis'], () => tiempo(K().runway_meses));
  T('k-pat', ['kpis', 'base'], () => money(K().patrimonio));
  T('k-pat-ref', ['kpis', 'base'], () => (K().patrimonio_ref == null ? '' : `≈ ${f0(K().patrimonio_ref)} ${base().ref}`));
  T('k-delta', ['kpis', 'base'], (node) => {
    const v = K().delta_cierre;
    node.className = v == null ? '' : v >= 0 ? 'good' : 'bad';
    return v == null ? '' : `· ${smoney(v)} desde el último cierre`;
  });
  T('k-aho', ['kpis', 'base'], () => money(K().ahorro_anio));
  T('k-plan', ['kpis', 'base'], (node) => { const v = K().vs_plan; node.className = v == null ? '' : v >= 0 ? 'good' : 'bad'; return smoney(v); });
  T('k-tasa', ['kpis'], () => pct(K().tasa_ahorro));
  T('k-run', ['kpis'], () => tiempo(K().runway_meses));

  /* ---------- 01 este mes ---------- */
  const totalMes = () => D('mes').find((r) => r.categoria === 'Total gastos') || {};
  T('mes-lede', ['mes', 'base'], () => {
    const tot = totalMes();
    const over = tot.restante < 0;
    let t = over ? `Vas ${money(-tot.restante)} por encima del presupuesto del mes` : `Te quedan ${money(tot.restante)} del presupuesto del mes`;
    const gr = D('mes').find((r) => r.categoria === GRANDES);
    if (gr && gr.gastado) t += `, y ${money(gr.gastado)} de lo gastado son compras grandes`;
    t += '.';
    const pasadas = D('mes').filter((r) => r.categoria !== 'Total gastos' && r.estado === 'Pasado').map((r) => r.categoria);
    if (pasadas.length) t += ` Se pasaron: ${pasadas.join(', ')}.`;
    const rapidas = D('mes').filter((r) => r.estado === 'Rápido').map((r) => r.categoria);
    if (rapidas.length) t += ` Van rápido: ${rapidas.join(', ')}.`;
    return t;
  });
  T('mes-left-lab', ['mes'], () => (totalMes().restante < 0 ? 'Te pasaste' : 'Te quedan'));
  T('mes-restante', ['mes', 'base'], (node) => { const r = totalMes().restante; node.classList.toggle('bad', r < 0); return money(Math.abs(r)); });
  T('mes-gastado', ['mes', 'base'], () => money(totalMes().gastado));
  T('mes-presu', ['mes', 'base'], () => money(totalMes().presupuesto));
  B('mes-track', ['mes', 'hoy'], (node) => {
    const tot = totalMes(), h = hoy();
    const ritmo = h.dia / h.dias_mes;
    const usado = tot.presupuesto ? tot.gastado / tot.presupuesto : 0;
    const i = el('i'); i.style.width = Math.min(100, usado * 100) + '%'; i.style.background = usado > 1 ? P.bad : usado > ritmo ? P.warn : P.n1;
    const u = el('u'); u.style.left = `calc(${ritmo * 100}% - 1px)`;
    node.append(i, u);
  });
  B('mes-cats', ['mes', 'hoy', 'base'], (box) => {
    const tot = totalMes(), h = hoy();
    const ritmo = h.dia / h.dias_mes;
    const capt = el('div', 'fx-track-cap');
    capt.append(el('span', null, `Usaste el ${f0(tot.presupuesto ? (tot.gastado / tot.presupuesto) * 100 : 0)}% del presupuesto`), el('span', null, `pasó el ${f0(ritmo * 100)}% del mes`));
    box.appendChild(capt);
    const cats = D('mes').filter((r) => r.categoria !== 'Total gastos' && (r.presupuesto || r.gastado));
    const max = d3.max(cats, (r) => Math.max(r.presupuesto, r.gastado)) || 1;
    for (const r of cats) {
      const row = el('div', 'fx-cat');
      row.appendChild(el('div', 'nm', r.categoria));
      const t = el('div', 'tr');
      const i = el('i');
      const over = r.presupuesto && r.gastado > r.presupuesto;
      i.style.width = (r.presupuesto ? (over ? r.presupuesto / r.gastado : r.gastado / r.presupuesto) : r.gastado / max) * 100 + '%';
      i.style.background = r.estado === 'Rápido' ? P.warn : P.cat;
      if (anim('mes-' + r.categoria)) i.classList.add('fx-grow');
      t.appendChild(i);
      if (over) { const ex = el('s'); ex.style.width = (1 - r.presupuesto / r.gastado) * 100 + '%'; t.appendChild(ex); }
      if (r.presupuesto && r.ritmo === 'Variable') { const u = el('u'); u.style.left = ritmo * (over ? r.presupuesto / r.gastado : 1) * 100 + '%'; t.appendChild(u); }
      row.appendChild(t);
      const v = el('div', 'vl');
      v.appendChild(el('b', null, money(r.gastado)));
      v.append(r.presupuesto ? ` / ${money(r.presupuesto)}` : ' sin presupuesto');
      row.appendChild(v);
      row.addEventListener('click', () => openPanel({ cats: [r.categoria], mes: h.mes_num }));
      box.appendChild(row);
    }
  });
  T('inc-total', ['ingresos_mes', 'base'], () => money(D('ingresos_mes').reduce((s, r) => s + r.este_mes, 0)));
  B('inc-rows', ['ingresos_mes', 'hoy', 'base'], (box) => {
    const h = hoy();
    const ant = MESL[(h.mes_num + 10) % 12];
    const rows = D('ingresos_mes').slice().sort((a, b) => b.este_mes + b.mes_anterior - a.este_mes - a.mes_anterior);
    rows.forEach((r, k) => {
      const row = el('div', 'fx-inc-row');
      const l = el('div');
      const nm = el('div', 'nm'); const sw = el('i', 'fx-sw'); sw.style.background = SRC[Math.min(k, SRC.length - 1)]; nm.append(sw, r.categoria);
      l.append(nm, el('div', 'ref', `${ant}: ${r.mes_anterior ? money(r.mes_anterior) : '—'}`));
      const rt = el('div');
      rt.appendChild(el('span', 'num fx-mid', r.este_mes ? money(r.este_mes) : '—'));
      if (!r.este_mes && r.mes_anterior > 0) rt.appendChild(el('span', 'fx-pill', 'falta'));
      row.append(l, rt);
      row.addEventListener('click', () => openPanel({ tipo: 'Ingreso', cats: [r.categoria], titulo: r.categoria, mes: h.mes_num }));
      box.appendChild(row);
    });
  });

  /* ---------- 02 el año ---------- */
  T('anio-lede', ['mensual', 'base'], () => {
    const rows = mesesActivos().filter((r) => r.estado !== 'futuro');
    if (!rows.length) return 'Todavía no hay movimientos este año.';
    const sum = (f) => rows.reduce((s, r) => s + r[f], 0);
    const cerr = rows.filter((r) => r.estado === 'cerrado');
    let t = `Desde ${MESL[rows[0].n - 1]} entraron ${money(sum('ingresos'))} y salieron ${money(sum('gastos'))}.`;
    if (cerr.length) { const best = cerr.reduce((a, b) => (b.resultado > a.resultado ? b : a), cerr[0]); t += ` El mejor mes cerrado fue ${MESL[best.n - 1]}, con ${smoney(best.resultado)}.`; }
    return t;
  });
  B('ch-mensual', ['mensual', 'base'], (box) => {
    const rows = mesesActivos();
    const H = 280;
    const { svg, w } = svgIn(box, H);
    const max = d3.max(rows, (r) => Math.max(r.ingresos, r.gastos)) || 1;
    const y = d3.scaleLinear([0, max], [H - 26, 12]).nice();
    const ticks = y.ticks(4);
    const left = textWidth(svg, ticks.map(kfmt)) + 12;
    yGrid(svg, y, w, left, kfmt, ticks);
    const x = d3.scaleBand(rows.map((r) => r.mes), [left, w]).paddingInner(0.28).paddingOuter(0.1);
    const bw = Math.min(28, x.bandwidth() / 2 - 1);
    const first = anim('mensual');
    rows.forEach((r) => {
      const cx = x(r.mes) + x.bandwidth() / 2;
      const grp = svg.append('g').attr('opacity', r.estado === 'futuro' ? 0.3 : 1);
      const bar = (x0, v, color) => grp.append('rect').attr('x', x0).attr('width', bw).attr('y', y(v)).attr('height', Math.max(0, y(0) - y(v))).attr('rx', Math.min(4, bw / 2)).attr('fill', color).attr('class', first ? 'fx-rise' : null);
      bar(cx - bw - 1, r.ingresos, P.in);
      bar(cx + 1, r.gastos, P.n2);
      if (r.grandes) bar(cx + 1, r.grandes, P.grandes);
      svg.append('text').attr('x', cx).attr('y', H - 6).attr('text-anchor', 'middle').attr('fill', r.estado === 'en curso' ? 'var(--color-fg)' : null).text(r.mes);
      svg.append('rect').attr('x', x(r.mes) - 4).attr('width', x.bandwidth() + 8).attr('y', 0).attr('height', H - 22).attr('fill', 'transparent')
        .style('cursor', r.estado === 'futuro' ? null : 'pointer')
        .on('mousemove', (e) => showTip(e, cap(MESL[r.n - 1]) + (r.estado === 'en curso' ? ' (en curso)' : ''), [
          { label: 'Ingresos', value: money(r.ingresos), color: P.in },
          { label: 'Gastos', value: money(r.gastos), color: P.n2 },
          ...(r.grandes ? [{ label: 'de eso, compras grandes', value: money(r.grandes) }] : []), '-',
          { label: 'Resultado', value: smoney(r.resultado), cls: r.resultado >= 0 ? 'good' : 'bad' },
        ]))
        .on('mouseleave', hideTip)
        .on('click', () => { if (r.estado !== 'futuro') openPanel({ mes: r.n }); });
    });
  });
  B('ch-acum', ['mensual', 'base'], (box) => {
    const rows = mesesActivos();
    const H = 240;
    const { svg, w } = svgIn(box, H);
    const real = rows.filter((r) => r.acum_real != null);
    const vals = [...real.map((r) => r.acum_real), ...rows.map((r) => r.acum_plan)];
    const y = d3.scaleLinear([Math.min(0, d3.min(vals)), Math.max(1, d3.max(vals))], [H - 26, 14]).nice();
    const ticks = y.ticks(4);
    const left = textWidth(svg, ticks.map(kfmt)) + 12;
    const last = real[real.length - 1];
    const endLab = last ? textWidth(svg, [money(last.acum_real)]) + 14 : 0;
    yGrid(svg, y, w - endLab, left, kfmt, ticks);
    const x = d3.scalePoint(rows.map((r) => r.mes), [left + 8, w - endLab - 8]);
    rows.forEach((r, i) => { if (rows.length <= 7 || i % 2 === 0 || w >= 480) svg.append('text').attr('x', x(r.mes)).attr('y', H - 6).attr('text-anchor', 'middle').text(r.mes); });
    const line = (f) => d3.line().x((r) => x(r.mes)).y((r) => y(r[f]));
    svg.append('path').datum(rows).attr('d', line('acum_plan')).attr('fill', 'none').attr('stroke', 'var(--cds-chart-reference)').attr('stroke-width', 1.5).attr('stroke-dasharray', '4 4');
    const gid = 'fxg-acum';
    const grad = svg.append('defs').append('linearGradient').attr('id', gid).attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
    [[0, 0.26], [0.25, 0.16], [0.5, 0.08], [0.75, 0.03], [1, 0]].forEach(([o, a]) => grad.append('stop').attr('offset', o).attr('style', `stop-color:${P.save};stop-opacity:${a}`));
    svg.append('path').datum(real).attr('d', d3.area().x((r) => x(r.mes)).y0(y(Math.max(0, y.domain()[0]))).y1((r) => y(r.acum_real))).attr('fill', `url(#${gid})`);
    svg.append('path').datum(real).attr('d', line('acum_real')).attr('fill', 'none').attr('stroke', P.save).attr('stroke-width', 2).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');
    if (last) {
      svg.append('circle').attr('cx', x(last.mes)).attr('cy', y(last.acum_real)).attr('r', 4).attr('fill', P.save);
      svg.append('text').attr('x', x(last.mes) + 8).attr('y', y(last.acum_real)).attr('dy', '0.32em').attr('fill', 'var(--color-fg)').text(money(last.acum_real));
    }
    rows.forEach((r) => {
      svg.append('rect').attr('x', x(r.mes) - x.step() / 2).attr('width', x.step()).attr('y', 0).attr('height', H - 22).attr('fill', 'transparent')
        .on('mousemove', (e) => showTip(e, cap(MESL[r.n - 1]), [
          ...(r.acum_real != null ? [{ label: 'Real', value: money(r.acum_real), color: P.save }] : []),
          { label: 'Presupuesto', value: money(r.acum_plan) },
          ...(r.acum_real != null ? [{ label: 'Diferencia', value: smoney(r.acum_real - r.acum_plan), cls: r.acum_real >= r.acum_plan ? 'good' : 'bad' }] : []),
        ]))
        .on('mouseleave', hideTip);
    });
  });
  B('ch-resultado', ['mensual', 'base'], (box) => {
    const rows = mesesActivos();
    const H = 240;
    const { svg, w } = svgIn(box, H);
    const ext = d3.extent(rows, (r) => r.resultado);
    const y = d3.scaleLinear([Math.min(0, ext[0] || 0), Math.max(1, ext[1] || 0)], [H - 26, 12]).nice();
    const ticks = y.ticks(4);
    const left = textWidth(svg, ticks.map(kfmt)) + 12;
    yGrid(svg, y, w, left, kfmt, ticks);
    const x = d3.scaleBand(rows.map((r) => r.mes), [left, w]).paddingInner(0.35).paddingOuter(0.1);
    const bw = Math.min(28, x.bandwidth());
    svg.append('line').attr('x1', left).attr('x2', w).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', 'var(--cds-chart-axis)');
    rows.forEach((r) => {
      const cx = x(r.mes) + x.bandwidth() / 2, v = r.resultado;
      svg.append('rect').attr('x', cx - bw / 2).attr('width', bw).attr('y', y(Math.max(0, v))).attr('height', Math.abs(y(v) - y(0))).attr('rx', Math.min(4, bw / 2)).attr('fill', v >= 0 ? P.save : P.bad).attr('opacity', r.estado === 'futuro' ? 0.3 : 1);
      svg.append('text').attr('x', cx).attr('y', H - 6).attr('text-anchor', 'middle').text(r.mes);
      svg.append('rect').attr('x', x(r.mes) - 4).attr('width', x.bandwidth() + 8).attr('y', 0).attr('height', H - 22).attr('fill', 'transparent')
        .style('cursor', r.estado === 'futuro' ? null : 'pointer')
        .on('mousemove', (e) => showTip(e, cap(MESL[r.n - 1]), [{ label: 'Resultado', value: smoney(v), cls: v >= 0 ? 'good' : 'bad' }, { label: 'Ingresos', value: money(r.ingresos) }, { label: 'Gastos', value: money(r.gastos) }]))
        .on('mouseleave', hideTip)
        .on('click', () => { if (r.estado !== 'futuro') openPanel({ mes: r.n }); });
    });
  });

  /* ---------- 03 flujo ---------- */
  const flow = { modo: 'anio', mes: null };
  const FLOW = ['flujo-lede', 'flujo-sum', 'ch-sankey'];
  $$('#flujo-modo [data-modo]').forEach((b) => b.addEventListener('click', () => {
    flow.modo = b.dataset.modo;
    $$('#flujo-modo [data-modo]').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
    $$('[data-draw="flujo-meses"]').forEach((m) => { m.hidden = flow.modo !== 'mes'; });
    redraw('flujo-meses', ...FLOW);
  }));
  const periodo = () => { const h = hoy(); if (flow.mes == null) flow.mes = h.mes_num; return flow.modo === 'mes' ? 'm' + flow.mes : flow.modo; };
  const cuando = () => (flow.modo === 'anio' ? 'en lo que va del año' : flow.modo === 'promedio' ? 'en un mes promedio' : `en ${MESL[flow.mes - 1]}${flow.mes === hoy().mes_num ? ' (en curso)' : ''}`);
  B('flujo-meses', ['mensual', 'hoy'], (box) => {
    if (flow.mes == null) flow.mes = hoy().mes_num;
    mesesActivos().filter((r) => r.estado !== 'futuro').forEach((r) => {
      const b = el('button', 'fx-chip' + (flow.mes === r.n ? ' on' : ''), r.mes);
      b.addEventListener('click', () => { flow.mes = r.n; redraw('flujo-meses', ...FLOW); });
      box.appendChild(b);
    });
  });
  const flujoTot = () => {
    const all = D('flujos').filter((r) => r.periodo === periodo() && r.valor > 0.5);
    const tot = (t) => all.filter((r) => r.tipo === t).reduce((s, r) => s + r.valor, 0);
    return { all, entro: tot('ingreso'), gasto: tot('gasto'), ahorro: tot('ahorro'), deficit: tot('deficit') };
  };
  B('flujo-sum', ['flujos', 'hoy', 'base'], (box) => {
    const f = flujoTot();
    const cell = (k, v, cls) => { const d = el('div'); d.append(el('div', 'k', k), el('div', 'v' + (cls ? ' ' + cls : ''), v)); box.appendChild(d); };
    cell('Entró', money(f.entro));
    cell('Gastaste', money(f.gasto));
    if (f.deficit > 0) cell('Salió de tus ahorros', money(f.deficit), 'bad'); else cell('Ahorraste', money(f.ahorro), 'good');
    cell('Tasa de ahorro', f.entro > 0 ? pct((f.entro - f.gasto) / f.entro) : '—', f.entro - f.gasto >= 0 ? null : 'bad');
  });
  T('flujo-lede', ['flujos', 'hoy', 'base'], () => {
    const f = flujoTot();
    if (!f.all.length) return 'No hay movimientos en este período.';
    if (f.deficit > 0) return `${cap(cuando())} gastaste ${money(f.deficit)} más de lo que entró: esa diferencia salió de lo ahorrado.`;
    const per = (v) => f0((v / f.entro) * 100);
    const g = f.all.filter((r) => r.tipo === 'gasto').sort((a, b) => b.valor - a.valor);
    let t = `De cada 100 que entraron ${cuando()}, ${per(f.ahorro)} quedaron como ahorro`;
    if (g[0]) t += `, ${per(g[0].valor)} fueron a ${g[0].hacia}`;
    if (g[1]) t += ` y ${per(g[1].valor)} a ${g[1].hacia}`;
    return t + '.';
  });
  B('ch-sankey', ['flujos', 'hoy', 'base'], (box) => {
    const f = flujoTot();
    if (!f.all.length) { box.appendChild(el('div', 'fx-fail', 'No hay movimientos en este período')); return; }
    const links = f.all.map((l) => ({ ...l }));
    const depth = { ingreso: [0, 1], deficit: [0, 1], gasto: [1, 2], ahorro: [1, 2] };
    const nodes = new Map();
    const node = (id, d) => { if (!nodes.has(id)) nodes.set(id, { id, d, vin: 0, vout: 0, ins: [], outs: [] }); return nodes.get(id); };
    for (const l of links) {
      const [ds, dt] = depth[l.tipo];
      l.s = node(l.desde, ds); l.t = node(l.hacia, dt);
      l.s.vout += l.valor; l.t.vin += l.valor; l.s.outs.push(l); l.t.ins.push(l);
    }
    const list = Array.from(nodes.values());
    list.forEach((n) => { n.v = Math.max(n.vin, n.vout); n.op = 1; n.color = n.id === 'Ahorros previos' ? P.bad : n.id === 'Ahorro' ? P.save : n.d === 2 ? P.cat : P.in; });
    const cols = [0, 1, 2].map((d) => list.filter((n) => n.d === d));
    cols[0].sort((a, b) => (a.id === 'Ahorros previos') - (b.id === 'Ahorros previos') || b.v - a.v).forEach((n, i) => { if (n.id !== 'Ahorros previos') n.color = SRC[Math.min(i, SRC.length - 1)]; });
    cols[2].sort((a, b) => (a.id === 'Ahorro') - (b.id === 'Ahorro') || b.v - a.v).forEach((n, i) => { if (n.id !== 'Ahorro') n.op = Math.max(0.4, 1 - i * 0.07); });
    const H = Math.max(360, Math.min(640, cols[2].length * 34 + 40));
    const { svg, w } = svgIn(box, H);
    const label = (n) => (n.id === 'Ingresos' && f.deficit > 0 ? 'Ingresos y ahorros' : n.id);
    const leftW = textWidth(svg, cols[0].map((n) => label(n) + '  ' + money(n.v)), 'nl') + 12;
    const rightW = textWidth(svg, cols[2].map((n) => label(n) + '  ' + money(n.v)), 'nl') + 12;
    const nw = 12, pad = 12, top = 8, bottom = 8;
    const span = w - leftW - rightW - nw;
    const k = d3.min(cols.filter((c) => c.length), (c) => (H - top - bottom - pad * (c.length - 1)) / d3.sum(c, (n) => n.v));
    cols.forEach((c, d) => {
      const used = d3.sum(c, (n) => n.v * k) + pad * (c.length - 1);
      let yy = top + (H - top - bottom - used) / 2;
      c.forEach((n) => { n.x = leftW + (span * d) / 2; n.y = yy; n.h = Math.max(1.5, n.v * k); yy += n.h + pad; });
    });
    list.forEach((n) => {
      let so = 0, to = 0;
      n.outs.sort((a, b) => a.t.y - b.t.y).forEach((l) => { l.sy = n.y + so; so += l.valor * k; });
      n.ins.sort((a, b) => a.s.y - b.s.y).forEach((l) => { l.ty = n.y + to; to += l.valor * k; });
    });
    const share = (v) => (f.entro ? pct(v / f.entro) + ' de lo que entró' : '');
    const pm = flow.modo === 'mes' ? flow.mes : null;
    const query = (n) => {
      if (n.id === 'Ahorro' || n.id === 'Ahorros previos') return null;
      if (n.id === 'Ingresos') return { tipo: 'Ingreso', titulo: 'Todo lo que entró', mes: pm };
      if (n.d === 0) return { tipo: 'Ingreso', cats: [n.id], titulo: n.id, mes: pm };
      return { cats: [n.id], mes: pm };
    };
    const baseOp = (l) => (l.tipo === 'ingreso' ? 0.42 : 0.32 * (l.t.op || 1));
    const lg = svg.append('g');
    for (const l of links) {
      const h = Math.max(1, l.valor * k);
      const x0 = l.s.x + nw, x1 = l.t.x, xm = (x0 + x1) / 2;
      const d = `M${x0},${l.sy} C${xm},${l.sy} ${xm},${l.ty} ${x1},${l.ty} L${x1},${l.ty + h} C${xm},${l.ty + h} ${xm},${l.sy + h} ${x0},${l.sy + h} Z`;
      const color = l.tipo === 'ingreso' || l.tipo === 'deficit' ? l.s.color : l.t.color;
      const p = lg.append('path').datum(l).attr('d', d).attr('fill', color).attr('fill-opacity', baseOp(l));
      p.on('mousemove', (e) => { p.attr('fill-opacity', 0.65); showTip(e, `${label(l.s)} → ${label(l.t)}`, [{ label: money(l.valor), value: share(l.valor) }]); })
        .on('mouseleave', () => { p.attr('fill-opacity', baseOp(l)); hideTip(); });
      const q = query(l.tipo === 'ingreso' ? l.s : l.t);
      if (q) p.style('cursor', 'pointer').on('click', () => openPanel(q));
    }
    for (const n of list) {
      const g = svg.append('g');
      g.append('rect').attr('x', n.x).attr('y', n.y).attr('width', nw).attr('height', n.h).attr('rx', 3).attr('fill', n.color).attr('fill-opacity', n.op);
      g.on('mousemove', (e) => { lg.selectAll('path').attr('fill-opacity', (dd) => (dd.s === n || dd.t === n ? 0.7 : 0.08)); showTip(e, label(n), [{ label: money(n.v), value: share(n.v) }]); })
        .on('mouseleave', () => { lg.selectAll('path').attr('fill-opacity', baseOp); hideTip(); });
      const q = query(n);
      if (q) g.style('cursor', 'pointer').on('click', () => openPanel(q));
      if (n.h < 9 && n.d !== 1) continue;
      const leftSide = n.d === 0;
      const t = svg.append('text').attr('x', leftSide ? n.x - 8 : n.x + nw + 8).attr('y', n.y + n.h / 2).attr('dy', '0.32em').attr('text-anchor', leftSide ? 'end' : 'start').attr('pointer-events', 'none');
      t.append('tspan').attr('class', 'nl').attr('font-weight', n.d <= 1 ? 500 : null).text(label(n));
      t.append('tspan').attr('class', 'nv').attr('dx', 6).text(money(n.v));
      if (n.d === 1) {
        const bb = t.node().getBBox();
        svg.insert('rect', () => t.node()).attr('x', bb.x - 4).attr('y', bb.y - 2).attr('width', bb.width + 8).attr('height', bb.height + 4).attr('rx', 4).attr('fill', 'var(--color-panel)').attr('fill-opacity', 0.85).attr('pointer-events', 'none');
      }
    }
  });

  /* ---------- 04 categorías ---------- */
  const selCat = () => (pnl.open && pnl.tipo === 'Gasto' && pnl.cats && pnl.cats.length === 1 ? pnl.cats[0] : null);
  T('cat-lede', ['categorias_anio', 'base'], () => {
    const rows = D('categorias_anio').filter((r) => r.categoria !== GRANDES && r.total).sort((a, b) => b.total - a.total);
    if (rows.length < 2) return '';
    let t = `${rows[0].categoria} y ${rows[1].categoria} se llevan el ${pct(rows[0].parte + rows[1].parte)} de todo lo que gastaste este año.`;
    const over = D('categorias_anio').filter((r) => r.presup_hoy && r.vs_presup < 0).sort((a, b) => a.vs_presup - b.vs_presup);
    if (over.length) t += ` Donde más te pasaste del presupuesto: ${over.slice(0, 2).map((r) => `${r.categoria} (${money(-r.vs_presup)})`).join(' y ')}.`;
    return t;
  });
  B('ch-cats', ['categorias_anio', 'base'], (box) => {
    const rows = D('categorias_anio').filter((r) => r.total || r.presup_hoy).sort((a, b) => b.total - a.total);
    const rh = 30, H = rows.length * rh + 10;
    const { svg, w } = svgIn(box, H);
    const labW = textWidth(svg, rows.map((r) => r.categoria)) + 14;
    const valW = textWidth(svg, rows.map((r) => money(r.total))) + 10;
    const max = d3.max(rows, (r) => Math.max(r.total, r.presup_hoy)) || 1;
    const x = d3.scaleLinear([0, max], [labW, w - valW]);
    const first = anim('cats'), sc = selCat();
    rows.forEach((r, i) => {
      const yy = i * rh + 4;
      const g = svg.append('g').attr('class', 'row').attr('opacity', sc && sc !== r.categoria ? 0.35 : 1).on('click', () => openPanel({ cats: [r.categoria], mes: null }));
      g.append('rect').attr('x', 0).attr('y', yy - 4).attr('width', w).attr('height', rh).attr('fill', 'transparent');
      g.append('text').attr('x', 0).attr('y', yy + 10).attr('dy', '0.32em').attr('fill', 'var(--color-fg)').style('font-size', '12px').text(r.categoria);
      const fill = !r.presup_hoy ? (r.categoria === GRANDES ? P.grandes : P.cat) : r.total > r.presup_hoy * 1.1 ? P.bad : r.total > r.presup_hoy ? P.warn : P.cat;
      g.append('rect').attr('x', labW).attr('y', yy + 4).attr('height', 12).attr('width', Math.max(2, x(r.total) - labW)).attr('rx', 4).attr('fill', fill).attr('class', first ? 'fx-grow' : null);
      if (r.presup_hoy) g.append('line').attr('x1', x(r.presup_hoy)).attr('x2', x(r.presup_hoy)).attr('y1', yy).attr('y2', yy + 20).attr('stroke', 'var(--color-fg)').attr('stroke-width', 1.5);
      g.append('text').attr('x', w).attr('y', yy + 10).attr('dy', '0.32em').attr('text-anchor', 'end').attr('fill', 'var(--color-fg)').text(money(r.total));
      g.on('mousemove', (e) => showTip(e, r.categoria, [
        { label: 'Gastado en el año', value: money(r.total) },
        ...(r.presup_hoy ? [{ label: 'Presupuesto a hoy', value: money(r.presup_hoy) }, { label: 'Diferencia', value: smoney(r.vs_presup), cls: r.vs_presup >= 0 ? 'good' : 'bad' }] : [{ label: 'Presupuesto', value: 'sin' }]),
        { label: 'Parte del gasto total', value: pct(r.parte) },
      ])).on('mouseleave', hideTip);
    });
  });
  B('ch-heat', ['categorias_anio', 'mensual', 'base'], (box) => {
    const rows = D('categorias_anio').filter((r) => r.total).sort((a, b) => b.total - a.total);
    const months = mesesActivos().filter((r) => r.estado !== 'futuro');
    const rh = 30, top = 18, H = rows.length * rh + top + 6;
    const { svg, w } = svgIn(box, H);
    const labW = textWidth(svg, rows.map((r) => r.categoria)) + 12;
    const x = d3.scaleBand(months.map((m) => m.n), [labW, w]).paddingInner(0.08);
    const cur = months.length ? months[months.length - 1].n : 0;
    months.forEach((m) => svg.append('text').attr('x', x(m.n) + x.bandwidth() / 2).attr('y', 10).attr('text-anchor', 'middle').attr('fill', m.n === cur ? 'var(--color-fg)' : null).text(x.bandwidth() < 26 ? m.mes.charAt(0) : m.mes));
    const sc = selCat();
    rows.forEach((r, j) => {
      const yy = top + j * rh;
      const vals = months.map((m) => r['m' + m.n] || 0);
      const mx = d3.max(vals) || 1;
      svg.append('text').attr('x', 0).attr('y', yy + rh / 2 - 2).attr('dy', '0.32em').attr('fill', 'var(--color-fg)').style('font-size', '12px').text(r.categoria);
      months.forEach((m) => {
        const v = r['m' + m.n] || 0;
        const on = (sc == null || sc === r.categoria) && (pnl.mes == null || !sc || pnl.mes === m.n);
        svg.append('rect').attr('class', 'cell').attr('x', x(m.n)).attr('y', yy).attr('width', x.bandwidth()).attr('height', rh - 4).attr('rx', 4)
          .attr('fill', v ? P.cat : 'var(--color-border-line)').attr('fill-opacity', v ? 0.1 + 0.9 * (v / mx) : 0.5).attr('opacity', on ? 1 : 0.25)
          .on('mousemove', (e) => showTip(e, `${r.categoria} · ${MESL[m.n - 1]}`, [{ label: 'Gastado', value: money(v) }, { label: 'Promedio por mes', value: money(d3.mean(vals)) }]))
          .on('mouseleave', hideTip)
          .on('click', () => openPanel({ cats: [r.categoria], mes: m.n }));
        if (v && x.bandwidth() > 40) svg.append('text').attr('x', x(m.n) + x.bandwidth() / 2).attr('y', yy + (rh - 4) / 2).attr('dy', '0.32em').attr('text-anchor', 'middle').attr('pointer-events', 'none')
          .attr('fill', v / mx > 0.7 ? '#fff' : 'var(--color-fg)').style('font-size', '10px').text(kfmt(v));
      });
    });
  });
  B('tbl-movs', ['movimientos', 'hoy', 'base'], (tb) => {
    const y = hoy().anio;
    const rows = D('movimientos').filter((r) => r.tipo === 'Gasto' && r.categoria !== GRANDES && r.fecha && Number(r.fecha.slice(0, 4)) === y)
      .sort((a, b) => (b.mi_parte || 0) - (a.mi_parte || 0)).slice(0, 15);
    for (const r of rows) {
      const tr = el('tr'); tr.dataset.key = r.id;
      tr.appendChild(el('td', 'dim', fdate(r.fecha)));
      tr.appendChild(el('td', 'desc', r.descripcion));
      tr.appendChild(el('td', 'dim hide-sm', r.categoria || ''));
      tr.appendChild(el('td', 'dim hide-sm', r.compartido_con || ''));
      tr.appendChild(el('td', 'dim hide-sm', r.cuenta || ''));
      tr.appendChild(el('td', 'amt', money(r.mi_parte)));
      tb.appendChild(tr);
    }
  });

  /* ---------- 05 etiquetas ---------- */
  const etq = () => D('etiquetas');
  const etqTot = () => etq().reduce((s, v) => s + v.total, 0);
  T('etq-lede', ['etiquetas', 'base'], () => {
    const all = etq();
    if (!all.length) return 'Todavía no hay movimientos con Etiqueta. Cuando etiquetes los gastos de un viaje o un proyecto, aparecen acá.';
    const big = all.reduce((a, b) => (b.total > a.total ? b : a), all[0]);
    return `Gastaste ${money(etqTot())} en ${all.length} ${all.length === 1 ? 'etiqueta' : 'etiquetas'}. La más cara fue ${big.etiqueta}, con ${money(big.total)}.`;
  });
  T('etq-total', ['etiquetas', 'base'], () => money(etqTot()));
  T('etq-count', ['etiquetas'], () => `${etq().length} ${etq().length === 1 ? 'etiqueta' : 'etiquetas'}`);
  T('etq-share', ['etiquetas', 'mensual', 'hoy'], () => {
    const y = hoy().anio;
    const gasto = D('mensual').filter((r) => r.estado !== 'futuro').reduce((s, r) => s + r.gastos - r.grandes, 0);
    const deAnio = etq().filter((v) => Number(v.cuando.slice(0, 4)) === y).reduce((s, v) => s + v.total, 0);
    return gasto > 0 ? pct(deAnio / gasto) : '—';
  });
  T('etq-prom', ['etiquetas', 'base'], () => (etq().length ? money(etqTot() / etq().length) : '—'));
  T('etq-top', ['etiquetas'], () => { const all = etq(); if (!all.length) return ''; return 'la más cara, ' + all.reduce((a, b) => (b.total > a.total ? b : a), all[0]).etiqueta; });
  B('etq-rows', ['etiquetas', 'base'], (box) => {
    const all = etq().slice().reverse();
    if (!all.length) { box.appendChild(el('p', 'fx-fine', 'Sin etiquetas todavía.')); return; }
    const max = d3.max(all, (v) => v.total) || 1;
    const first = anim('etq');
    for (const v of all) {
      const row = el('div', 'fx-trip' + (pnl.open && pnl.etiqueta === v.etiqueta ? ' on' : ''));
      const l = el('div');
      l.append(el('div', null, v.etiqueta), el('div', 'dt', v.desde === v.hasta ? fdate(v.desde) : `${fdate(v.desde)} → ${fdate(v.hasta)}`));
      const bar = el('div', 'bar');
      const pc = JSON.parse(v.por_categoria);
      const parts = Object.entries(pc).sort((a, b) => b[1] - a[1]);
      parts.forEach(([c, x], i) => { const s = el('i'); s.style.flex = String(x); s.style.background = P.cat; s.style.opacity = String(Math.max(0.35, 1 - i * 0.2)); bar.appendChild(s); });
      bar.style.width = (v.total / max) * 100 + '%';
      if (first) bar.classList.add('fx-grow');
      const vl = el('div', 'vl', money(v.total)); vl.appendChild(el('small', null, `${v.movimientos} mov.`));
      row.append(l, bar, vl);
      row.addEventListener('mousemove', (e) => showTip(e, v.etiqueta, [...parts.map(([c, x], i) => ({ label: c, value: money(x) })), '-', { label: 'Total', value: money(v.total) }]));
      row.addEventListener('mouseleave', hideTip);
      row.addEventListener('click', () => openPanel({ etiqueta: v.etiqueta, titulo: v.etiqueta }));
      box.appendChild(row);
    }
  });

  /* ---------- 06 cuentas ---------- */
  T('cta-lede', ['cuentas', 'base'], () => {
    const rows = D('cuentas').filter((r) => r.saldo_base);
    const total = rows.reduce((s, r) => s + r.saldo_base, 0);
    if (!rows.length || total <= 0) return '';
    const top = rows.reduce((a, b) => (b.saldo_base > a.saldo_base ? b : a), rows[0]);
    const otra = rows.filter((r) => r.moneda !== base().moneda).reduce((s, r) => s + r.saldo_base, 0);
    let t = `El ${pct(top.saldo_base / total)} de lo que tenés en cuentas está en una sola: ${top.cuenta}.`;
    if (otra > 0) t += ` El ${pct(otra / total)} está en otras monedas.`;
    const viejas = D('cuentas').filter((r) => r.dif != null && Math.abs(r.dif) > 1).map((r) => r.cuenta);
    if (viejas.length) t += ` No cuadran: ${viejas.join(', ')}.`;
    return t;
  });
  T('cta-total', ['kpis', 'base'], () => money(K().liquido));
  B('tbl-cuentas', ['cuentas', 'base'], (tb) => {
    const rows = D('cuentas').filter((r) => r.fecha).slice().sort((a, b) => (b.saldo_base || 0) - (a.saldo_base || 0));
    const max = d3.max(rows, (r) => Math.abs(r.saldo_base || 0)) || 1;
    const first = anim('cta');
    for (const r of rows) {
      const tr = el('tr'); tr.dataset.key = r.cuenta;
      tr.appendChild(el('td', 'desc', r.cuenta));
      const c = el('td', 'hide-sm'); c.appendChild(el('span', 'fx-tag', r.moneda)); tr.appendChild(c);
      tr.appendChild(el('td', 'amt hide-sm muted', f0(r.saldo) + ' ' + r.moneda));
      const td = el('td', 'amt'); const wrap = el('div', 'cell');
      const b = el('div', 'b'); const i = el('i'); i.style.width = (Math.abs(r.saldo_base || 0) / max) * 100 + '%'; i.style.background = r.saldo_base < 0 ? P.bad : P.n1; if (first) i.classList.add('fx-grow'); b.appendChild(i);
      wrap.append(b, el('span', null, money(r.saldo_base))); td.appendChild(wrap); tr.appendChild(td);
      tr.appendChild(el('td', 'dim hide-sm', fdateY(r.fecha)));
      tr.appendChild(el('td', 'amt hide-sm ' + (r.dif != null && Math.abs(r.dif) > 1 ? 'warn' : 'muted'), r.dif == null ? '' : Math.abs(r.dif) <= 1 ? '0' : f0(r.dif)));
      tb.appendChild(tr);
    }
  });

  /* ---------- 07 patrimonio ---------- */
  const partes = () => { const k = K(); return [
    { key: 'liquido', label: 'Cuentas', v: k.liquido, c: P.save2, note: 'disponible' },
    { key: 'inversiones', label: 'Inversiones', v: k.inversiones, c: P.save, note: 'rinde' },
    { key: 'bienes', label: 'Bienes', v: k.bienes, c: P.n3, note: 'casa, auto, cosas que duran' },
    { key: 'te_deben', label: 'Te deben', v: k.te_deben, c: P.n4, note: 'neto a cobrar' },
  ]; };
  T('pat-lede', ['kpis', 'base'], () => {
    const k = K(), tot = Math.max(1, partes().reduce((s, p) => s + Math.max(0, p.v), 0));
    let t = `${pct(k.liquido / tot)} de tu patrimonio es plata en cuentas, ${pct(k.inversiones / tot)} está invertido y ${pct(k.bienes / tot)} son bienes.`;
    if (k.delta_cierre != null) t += ` Desde el último cierre ${k.delta_cierre >= 0 ? 'subió' : 'bajó'} ${money(Math.abs(k.delta_cierre))}.`;
    return t;
  });
  T('pat-total', ['kpis', 'base'], () => money(K().patrimonio));
  B('pat-stack', ['kpis', 'base'], (box) => {
    const ps = partes(), tot = ps.reduce((s, p) => s + Math.max(0, p.v), 0) || 1;
    const first = anim('stack');
    for (const p of ps) {
      const d = el('div'); d.style.flex = String(Math.max(0, p.v) / tot); d.style.background = p.c;
      if (first) d.classList.add('fx-grow');
      d.addEventListener('mousemove', (e) => showTip(e, p.label, [{ label: p.note, value: money(p.v) }, { label: 'del total', value: pct(p.v / tot) }]));
      d.addEventListener('mouseleave', hideTip);
      box.appendChild(d);
    }
  });
  B('pat-leg', ['kpis', 'base'], (box) => {
    const ps = partes(), tot = ps.reduce((s, p) => s + Math.max(0, p.v), 0) || 1;
    for (const p of ps) {
      const it = el('div', 'it'); const i = el('i'); i.style.background = p.c; it.appendChild(i);
      const t = el('div'); t.append(el('div', 'k', p.label), el('div', 'v', money(p.v)), el('div', 'p', `${pct(p.v / tot)} · ${p.note}`));
      it.appendChild(t); box.appendChild(it);
    }
  });
  B('ch-pat', ['patrimonio_hist', 'base'], (box) => {
    const rows = D('patrimonio_hist');
    if (rows.length < 2) { box.appendChild(el('div', 'fx-fail', 'Hace falta al menos un cierre en la pestaña Cierres')); return; }
    const H = 240;
    const { svg, w } = svgIn(box, H);
    const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    const vals = rows.map((r) => r.patrimonio);
    const y = d3.scaleLinear([Math.min(0, d3.min(vals)), d3.max(vals)], [H - 26, 14]).nice();
    const ticks = y.ticks(4);
    const left = textWidth(svg, ticks.map(kfmt)) + 12;
    const last = rows[rows.length - 1];
    const endW = textWidth(svg, [money(last.patrimonio)]) + 14;
    yGrid(svg, y, w - endW, left, kfmt, ticks);
    const x = d3.scaleTime(d3.extent(rows, (r) => parse(r.fecha)), [left + 8, w - endW - 8]);
    rows.forEach((r, i) => { if (rows.length <= 8 || i % 2 === 0 || r.hoy) svg.append('text').attr('x', x(parse(r.fecha))).attr('y', H - 6).attr('text-anchor', 'middle').attr('fill', r.hoy ? 'var(--color-fg)' : null).text(r.hoy ? 'hoy' : MES[Number(r.fecha.slice(5, 7)) - 1]); });
    const gid = 'fxg-pat';
    const grad = svg.append('defs').append('linearGradient').attr('id', gid).attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
    [[0, 0.26], [0.25, 0.16], [0.5, 0.08], [0.75, 0.03], [1, 0]].forEach(([o, a]) => grad.append('stop').attr('offset', o).attr('style', `stop-color:${P.save};stop-opacity:${a}`));
    svg.append('path').datum(rows).attr('d', d3.area().x((r) => x(parse(r.fecha))).y0(y(Math.max(0, y.domain()[0]))).y1((r) => y(r.patrimonio))).attr('fill', `url(#${gid})`);
    svg.append('path').datum(rows).attr('d', d3.line().x((r) => x(parse(r.fecha))).y((r) => y(r.patrimonio))).attr('fill', 'none').attr('stroke', P.save).attr('stroke-width', 2).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');
    rows.forEach((r) => svg.append('circle').attr('cx', x(parse(r.fecha))).attr('cy', y(r.patrimonio)).attr('r', r.hoy ? 4 : 2.5).attr('fill', P.save));
    svg.append('text').attr('x', x(parse(last.fecha)) + 8).attr('y', y(last.patrimonio)).attr('dy', '0.32em').attr('fill', 'var(--color-fg)').text(money(last.patrimonio));
    const bis = d3.bisector((r) => parse(r.fecha)).center;
    svg.append('rect').attr('x', left).attr('width', w - endW - left).attr('y', 0).attr('height', H - 22).attr('fill', 'transparent')
      .on('mousemove', (e) => { const r = rows[bis(rows, x.invert(d3.pointer(e)[0]))]; showTip(e, r.hoy ? 'Hoy' : `Cierre ${fdate(r.fecha)}`, [{ label: 'Patrimonio', value: money(r.patrimonio), color: P.save }]); })
      .on('mouseleave', hideTip);
  });
  B('tbl-activos', ['activos', 'base'], (tb) => {
    const rows = D('activos').slice().sort((a, b) => (a.tipo === b.tipo ? b.valor - a.valor : a.tipo === 'Inversión' ? -1 : 1));
    for (const r of rows) {
      const tr = el('tr'); tr.dataset.key = r.activo;
      tr.appendChild(el('td', 'desc', r.activo));
      tr.appendChild(el('td', 'dim hide-sm', r.tipo));
      tr.appendChild(el('td', 'amt hide-sm muted', money(r.invertido)));
      tr.appendChild(el('td', 'amt', money(r.valor)));
      tr.appendChild(el('td', 'amt ' + (r.ganancia_pct > 0.005 ? 'good' : r.ganancia_pct < -0.005 ? 'bad' : 'muted'), r.ganancia_pct == null ? '–' : spct(r.ganancia_pct)));
      tb.appendChild(tr);
    }
    if (!rows.length) { const tr = el('tr'); const td = el('td', 'dim', 'Todavía no cargaste activos.'); td.colSpan = 5; tr.appendChild(td); tb.appendChild(tr); }
  });

  /* ---------- 08 deudas ---------- */
  T('deu-lede', ['personas', 'base'], () => {
    const rows = D('personas').filter((r) => Math.abs(r.saldo) >= 1);
    if (!rows.length) return 'Estás al día con todos.';
    const tot = rows.reduce((s, r) => s + r.saldo, 0);
    const top = rows.reduce((a, b) => (Math.abs(b.saldo) > Math.abs(a.saldo) ? b : a), rows[0]);
    return `${tot >= 0 ? `Tenés ${money(tot)} para cobrar` : `Debés ${money(-tot)} en total`}. El saldo más grande es con ${top.persona}: ${money(Math.abs(top.saldo))}.`;
  });
  T('deu-total', ['kpis', 'base'], () => money(K().te_deben));
  B('deu-rows', ['personas', 'base'], (box) => {
    const rows = D('personas').filter((r) => Math.abs(r.saldo) >= 1).sort((a, b) => b.saldo - a.saldo);
    const max = d3.max(rows, (r) => Math.abs(r.saldo)) || 1;
    const first = anim('deu');
    for (const r of rows) {
      const row = el('div', 'fx-debt');
      row.appendChild(el('div', null, r.persona));
      const b = el('div', 'b'); const i = el('i'); i.style.width = (Math.abs(r.saldo) / max) * 100 + '%'; i.style.background = r.saldo >= 0 ? P.n1 : P.bad; if (first) i.classList.add('fx-grow'); b.appendChild(i);
      row.appendChild(b);
      const v = el('div', 'num'); v.append(el('span', null, money(Math.abs(r.saldo))), el('span', 'muted', r.saldo >= 0 ? ' te debe' : ' le debés'));
      row.appendChild(v);
      box.appendChild(row);
    }
    if (!rows.length) box.appendChild(el('p', 'fx-fine', 'Nadie te debe ni le debés nada.'));
  });

  /* ---------- 09 libertad ---------- */
  const ctl = { gasto: null, ahorro: null, ret: 5, swr: 4 };
  const inp = { gasto: $('#c-gasto'), ahorro: $('#c-ahorro'), ret: $('#c-ret'), swr: $('#c-swr') };
  const FREE = ['c-gasto-v', 'c-ahorro-v', 'c-ret-v', 'c-swr-v', 'f-runway', 'f-runway-s', 'f-renta', 'f-renta-s', 'f-numero', 'f-anios', 'f-prog', 'f-prog-l', 'f-prog-r', 'ch-libertad'];
  Object.entries(inp).forEach(([k, i]) => i.addEventListener('input', () => { ctl[k] = Number(i.value); redraw(...FREE); }));
  function lib() {
    const k = K();
    if (ctl.gasto == null) { ctl.gasto = Math.max(200, Math.round((k.gasto_mes || 1000) / 50) * 50); inp.gasto.value = ctl.gasto; }
    if (ctl.ahorro == null) { ctl.ahorro = Math.max(0, Math.round((k.ahorro_mes || 0) / 50) * 50); inp.ahorro.value = ctl.ahorro; }
    const cap = k.capital;
    const target = (ctl.gasto * 12) / (ctl.swr / 100);
    const r = Math.pow(1 + ctl.ret / 100, 1 / 12) - 1;
    const pts = [{ t: 0, v: cap }];
    let v = cap, hit = cap >= target ? 0 : null;
    for (let m = 1; m <= 12 * 40; m++) {
      v = v * (1 + r) + ctl.ahorro;
      if (hit == null && v >= target) hit = m;
      if (m % 3 === 0) pts.push({ t: m / 12, v });
      if (hit != null && m >= hit + 24 && m % 12 === 0) break;
    }
    return { cap, target, hit, pts, renta: (cap * ctl.swr / 100) / 12, runway: cap / ctl.gasto };
  }
  T('c-gasto-def', ['kpis', 'base'], () => money(K().gasto_mes));
  T('c-ahorro-def', ['kpis', 'base'], () => money(K().ahorro_mes));
  T('c-gasto-v', ['kpis', 'base'], () => { lib(); return money(ctl.gasto) + ' al mes'; });
  T('c-ahorro-v', ['kpis', 'base'], () => { lib(); return money(ctl.ahorro); });
  T('c-ret-v', ['kpis'], () => L.format('.1f')(ctl.ret) + '%');
  T('c-swr-v', ['kpis'], () => L.format('.2~f')(ctl.swr) + '%');
  T('f-runway', ['kpis'], () => tiempo(lib().runway));
  T('f-runway-s', ['kpis', 'base'], () => `viviendo de lo que ya tenés (${money(lib().cap)}), gastando ${money(ctl.gasto)} por mes.`);
  T('f-renta', ['kpis', 'base'], () => money(lib().renta) + ' al mes');
  T('f-renta-s', ['kpis'], () => `Es el ${L.format('.2~f')(ctl.swr)}% anual de tu capital: cubre el ${pct(lib().renta / ctl.gasto)} de ese gasto.`);
  T('f-compra', ['kpis'], () => (K().meses_por_mes == null ? '—' : f1(K().meses_por_mes)));
  T('f-numero', ['kpis', 'base'], () => money(lib().target));
  T('f-anios', ['kpis'], () => { const h = lib().hit; return h === 0 ? 'Ya llegaste' : h == null ? 'Más de 40 años' : tiempo(h); });
  B('f-prog', ['kpis'], (box) => { const l = lib(); const i = el('i'); i.style.width = Math.min(1, l.cap / l.target) * 100 + '%'; box.appendChild(i); });
  T('f-prog-l', ['kpis', 'base'], () => { const l = lib(); return `Tenés ${money(l.cap)}: el ${pct(Math.min(1, l.cap / l.target))} del camino.`; });
  T('f-prog-r', ['kpis', 'base', 'hoy'], () => {
    const l = lib();
    if (l.hit === 0) return 'Tu capital ya cubre ese gasto.';
    if (l.hit == null) return 'Con este ahorro no llegás en 40 años.';
    return `Ahorrando ${money(ctl.ahorro)} por mes y rindiendo ${L.format('.1f')(ctl.ret)}%, en ${hoy().anio + Math.ceil(l.hit / 12)}.`;
  });
  B('ch-libertad', ['kpis', 'base', 'hoy'], (box) => {
    const l = lib(), year = hoy().anio;
    const H = 260;
    const { svg, w } = svgIn(box, H);
    const maxT = l.pts[l.pts.length - 1].t;
    const y = d3.scaleLinear([0, Math.max(l.target * 1.15, d3.max(l.pts, (p) => p.v))], [H - 26, 12]).nice();
    const ticks = y.ticks(4);
    const left = textWidth(svg, ticks.map(kfmt)) + 12;
    const endW = textWidth(svg, ['Libertad ' + kfmt(l.target)]) + 12;
    yGrid(svg, y, w - endW, left, kfmt, ticks);
    const x = d3.scaleLinear([0, maxT], [left + 4, w - endW]);
    const step = maxT > 24 ? 5 : maxT > 10 ? 2 : 1;
    for (let t = 0; t <= maxT + 0.01; t += step) svg.append('text').attr('x', x(t)).attr('y', H - 6).attr('text-anchor', 'middle').text(String(year + t));
    svg.append('line').attr('x1', left).attr('x2', w - endW).attr('y1', y(l.target)).attr('y2', y(l.target)).attr('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '4 4');
    svg.append('text').attr('x', w - endW + 6).attr('y', y(l.target)).attr('dy', '0.32em').attr('fill', 'var(--color-fg)').text('Libertad ' + kfmt(l.target));
    const gid = 'fxg-free';
    const grad = svg.append('defs').append('linearGradient').attr('id', gid).attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
    [[0, 0.26], [0.25, 0.16], [0.5, 0.08], [0.75, 0.03], [1, 0]].forEach(([o, a]) => grad.append('stop').attr('offset', o).attr('style', `stop-color:${P.save};stop-opacity:${a}`));
    svg.append('path').datum(l.pts).attr('d', d3.area().x((p) => x(p.t)).y0(y(0)).y1((p) => y(p.v))).attr('fill', `url(#${gid})`);
    svg.append('path').datum(l.pts).attr('d', d3.line().x((p) => x(p.t)).y((p) => y(p.v))).attr('fill', 'none').attr('stroke', P.save).attr('stroke-width', 2).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');
    if (l.hit) svg.append('circle').attr('cx', x(l.hit / 12)).attr('cy', y(l.target)).attr('r', 5).attr('fill', 'var(--color-panel)').attr('stroke', P.save).attr('stroke-width', 2);
    const dot = svg.append('circle').attr('r', 4).attr('fill', P.save).attr('opacity', 0);
    const bis = d3.bisector((p) => p.t).center;
    svg.append('rect').attr('x', left).attr('width', w - endW - left).attr('y', 0).attr('height', H - 22).attr('fill', 'transparent')
      .on('mousemove', (e) => {
        const p = l.pts[bis(l.pts, x.invert(d3.pointer(e)[0]))];
        dot.attr('cx', x(p.t)).attr('cy', y(p.v)).attr('opacity', 1);
        showTip(e, String(Math.floor(year + p.t)), [{ label: 'Capital', value: money(p.v), color: P.save }, { label: 'Te pagaría por mes', value: money((p.v * ctl.swr) / 100 / 12) }, { label: 'Meta', value: money(l.target) }]);
      })
      .on('mouseleave', () => { hideTip(); dot.attr('opacity', 0); });
  });

  /* ---------- de qué planilla lee ---------- */
  const srcIn = $('#src-input'), srcBad = $('#src-bad');
  const idDe = (s) => { const t = String(s || '').trim(); const m = t.match(/\/d\/([A-Za-z0-9_-]{25,60})/); return m ? m[1] : /^[A-Za-z0-9_-]{25,60}$/.test(t) ? t : null; };
  $('#src-go').addEventListener('click', () => {
    const id = idDe(srcIn.value);
    srcBad.hidden = !!id;
    if (id) { ctl.gasto = ctl.ahorro = null; dash.setParams({ planilla: id }); }
  });
  $('#src-reset').addEventListener('click', () => { srcBad.hidden = true; ctl.gasto = ctl.ahorro = null; dash.resetParams(); });
  dash.onData(() => { if (srcIn !== document.activeElement) srcIn.value = dash.params().planilla || ''; });

  /* ---------- navegación ---------- */
  const nav = $('#fx-nav');
  nav.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { const t = document.getElementById(b.dataset.go); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); dash.setLink(b.dataset.go); } }));
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) nav.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.go === en.target.id));
  }, { root: document, rootMargin: '-40% 0px -55% 0px' });
  nav.querySelectorAll('button').forEach((b) => { const s = document.getElementById(b.dataset.go); if (s) io.observe(s); });
  let linked = false;
  dash.onData(() => {
    if (!linked && dash.data('kpis').status === 'ok') {
      linked = true;
      const named = document.getElementById(location.hash.slice(1));
      if (named && named.closest('#fx')) setTimeout(() => named.scrollIntoView(), 0);
    }
  });
})();
