/* Dados, fórmulas e formatação compartilhados pelas páginas de projeto. */
(function (w) {
  var DEFAULT = [
    { nome: 'Meta Ads',   inv: 12000, imp: 840000, cli: 16800, con: 420, rec: 31500 },
    { nome: 'Google Ads', inv: 9000,  imp: 210000, cli: 8400,  con: 336, rec: 26880 },
    { nome: 'TikTok',     inv: 6000,  imp: 720000, cli: 7200,  con: 108, rec: 7560 }
  ];
  var FIELDS = ['inv', 'imp', 'cli', 'con', 'rec'];
  var LABELS = { inv: 'Investimento', imp: 'Impressões', cli: 'Cliques', con: 'Conversões', rec: 'Receita' };
  var KEY = 'lb-portfolio-kpi-v1';

  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var dec = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var int = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function div(a, b) { return b > 0 ? a / b : null; }

  function metrics(r) {
    var cpm = div(r.inv, r.imp);
    return {
      cpm: cpm === null ? null : cpm * 1000,
      ctr: div(r.cli, r.imp),
      cpc: div(r.inv, r.cli),
      cpa: div(r.inv, r.con),
      tc: div(r.con, r.cli),
      roas: div(r.rec, r.inv),
      roi: r.inv > 0 ? (r.rec - r.inv) / r.inv : null
    };
  }

  function totals(data) {
    var t = { inv: 0, imp: 0, cli: 0, con: 0, rec: 0 };
    data.forEach(function (r) { FIELDS.forEach(function (k) { t[k] += r[k]; }); });
    return t;
  }

  function fBrl(v) { return v === null ? '—' : brl.format(v); }
  function fPct(v) { return v === null ? '—' : dec.format(v * 100) + '%'; }
  function fX(v) { return v === null ? '—' : dec.format(v) + '×'; }
  function fDec(v) { return v === null ? '—' : dec.format(v); }
  function fInt(v) { return v === null ? '—' : int.format(v); }

  function valid(d) {
    if (!Array.isArray(d) || d.length !== DEFAULT.length) return false;
    return d.every(function (r, i) {
      return r && r.nome === DEFAULT[i].nome && FIELDS.every(function (k) { return typeof r[k] === 'number' && isFinite(r[k]) && r[k] >= 0; });
    });
  }

  /* Os números editados num projeto aparecem nos outros (guardados só neste navegador). */
  function load() {
    try {
      var s = localStorage.getItem(KEY);
      if (s) { var d = JSON.parse(s); if (valid(d)) return d; }
    } catch (e) {}
    return clone(DEFAULT);
  }
  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }
  function reset(data) {
    try { localStorage.removeItem(KEY); } catch (e) {}
    data.length = 0;
    clone(DEFAULT).forEach(function (r) { data.push(r); });
    return data;
  }

  function renderInputs(tbody, data) {
    tbody.innerHTML = data.map(function (r, i) {
      return '<tr><th scope="row">' + r.nome + '</th>' + FIELDS.map(function (k) {
        return '<td><input type="number" inputmode="decimal" min="0" step="any" data-i="' + i + '" data-k="' + k + '" value="' + r[k] + '" aria-label="' + LABELS[k] + ' ' + r.nome + '"></td>';
      }).join('') + '</tr>';
    }).join('');
  }
  function bindInputs(tbody, data, onChange) {
    renderInputs(tbody, data);
    tbody.addEventListener('input', function (e) {
      var t = e.target;
      if (!t.dataset || t.dataset.i === undefined) return;
      var v = parseFloat(t.value);
      data[+t.dataset.i][t.dataset.k] = isFinite(v) && v > 0 ? v : 0;
      save(data);
      onChange();
    });
  }

  w.KPI = {
    FIELDS: FIELDS, metrics: metrics, totals: totals,
    fBrl: fBrl, fPct: fPct, fX: fX, fDec: fDec, fInt: fInt,
    load: load, save: save, reset: reset, renderInputs: renderInputs, bindInputs: bindInputs
  };
})(window);
