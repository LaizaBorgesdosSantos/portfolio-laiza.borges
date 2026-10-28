/* Gerador de relatório por regras (se/então). Não usa IA nem serviço externo. */
(function (w) {
  var K = w.KPI;
  var NOMES = {
    cliente: { roas: 'retorno por real investido', cpa: 'custo por conversão', ctr: 'taxa de cliques', cpm: 'custo por mil impressões' },
    interno: { roas: 'ROAS', cpa: 'CPA', ctr: 'CTR', cpm: 'CPM' }
  };

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function valid(rows, key) { return rows.filter(function (x) { return x.m[key] !== null; }); }
  function asc(key) { return function (a, b) { return a.m[key] - b.m[key]; }; }

  function gerar(data, publico) {
    var interno = publico === 'interno';
    var n = interno ? NOMES.interno : NOMES.cliente;
    var rows = data.map(function (r) { return { n: r.nome, r: r, m: K.metrics(r) }; });
    var tot = K.totals(data);
    var tm = K.metrics(tot);
    var ranked = valid(rows, 'roas').sort(function (a, b) { return b.m.roas - a.m.roas; });

    if (tot.inv <= 0 || ranked.length < 2) {
      return '## Resumo\nPreencha investimento e receita de ao menos dois canais para gerar o relatório.';
    }

    var best = ranked[0];
    var worst = ranked[ranked.length - 1];
    var igual = best.m.roas === worst.m.roas;
    var L = [];

    /* Resumo */
    var s1, s2;
    if (interno) {
      s1 = 'No período, foram investidos ' + K.fBrl(tot.inv) + ' e gerados ' + K.fBrl(tot.rec) + ' em receita, com ROAS geral de ' + K.fX(tm.roas) + ' e ROI de ' + K.fPct(tm.roi) + '.';
      s2 = igual ? 'Os canais tiveram o mesmo ROAS.'
        : best.n + ' lidera em retorno (' + K.fX(best.m.roas) + ') e ' + worst.n + ' fica por último (' + K.fX(worst.m.roas) + ').';
    } else {
      s1 = 'No período, foram investidos ' + K.fBrl(tot.inv) + ' em mídia e a receita gerada foi de ' + K.fBrl(tot.rec) + ': para cada R$ 1 investido, voltaram ' + K.fBrl(tm.roas) + '.';
      s2 = igual ? 'Os canais tiveram o mesmo retorno.'
        : best.n + ' foi o canal de melhor retorno (' + K.fBrl(best.m.roas) + ' por real) e ' + worst.n + ' o de menor (' + K.fBrl(worst.m.roas) + ' por real).';
    }
    L.push('## Resumo', s1 + ' ' + s2, '');

    /* O que os números mostram */
    var it1 = '- Retorno: ';
    if (igual) {
      it1 += interno ? 'todos os canais com ROAS de ' + K.fX(best.m.roas) + '.'
        : 'todos os canais devolveram ' + K.fBrl(best.m.roas) + ' por real investido.';
    } else if (interno) {
      it1 += ranked.map(function (x) { return x.n + ' ' + K.fX(x.m.roas); }).join(' > ') + '.';
    } else {
      it1 += ranked.map(function (x) { return x.n + ' devolveu ' + K.fBrl(x.m.roas) + ' por real'; }).join('; ') + '.';
    }
    if (!igual) {
      if (worst.m.roas < 1) {
        it1 += ' ' + worst.n + (interno ? ' está abaixo do break-even (ROAS menor que 1×).' : ' devolveu menos do que custou.');
      } else if (worst.m.roas < best.m.roas * 0.6) {
        it1 += ' ' + worst.n + ' retorna ' + K.fInt(worst.m.roas / best.m.roas * 100) + '% do que ' + best.n + ' retorna por real investido.';
      } else {
        it1 += ' Os retornos estão próximos.';
      }
    }

    var cpas = valid(rows, 'cpa').sort(asc('cpa'));
    var it2;
    if (cpas.length < 2) {
      it2 = '- ' + cap(n.cpa) + ': não há conversões suficientes para comparar os canais.';
    } else {
      var lo = cpas[0], hi = cpas[cpas.length - 1], ratio = hi.m.cpa / lo.m.cpa;
      if (hi.m.cpa === lo.m.cpa) {
        it2 = '- ' + cap(n.cpa) + ': igual em todos os canais (' + K.fBrl(lo.m.cpa) + ').';
      } else {
        it2 = '- ' + cap(n.cpa) + ': ' + lo.n + ' tem o menor (' + K.fBrl(lo.m.cpa) + ') e ' + hi.n + ' o maior (' + K.fBrl(hi.m.cpa) + ')' +
          (ratio >= 1.15 ? ', ' + K.fDec(ratio) + '× mais caro.' : ', valores próximos.');
      }
    }

    var ctrs = valid(rows, 'ctr').sort(asc('ctr'));
    var cpms = valid(rows, 'cpm').sort(asc('cpm'));
    var parts = [];
    if (ctrs.length >= 2) {
      var cHi = ctrs[ctrs.length - 1], cLo = ctrs[0];
      parts.push(cHi.m.ctr === cLo.m.ctr
        ? cap(n.ctr) + ': igual em todos os canais (' + K.fPct(cLo.m.ctr) + ').'
        : cap(n.ctr) + ': ' + cHi.n + ' tem a maior (' + K.fPct(cHi.m.ctr) + ') e ' + cLo.n + ' a menor (' + K.fPct(cLo.m.ctr) + ').');
    }
    if (cpms.length >= 2) {
      var pLo = cpms[0], pHi = cpms[cpms.length - 1];
      parts.push(pHi.m.cpm === pLo.m.cpm
        ? cap(n.cpm) + ': igual em todos os canais (' + K.fBrl(pLo.m.cpm) + ').'
        : cap(n.cpm) + ': ' + pLo.n + ' é o mais barato (' + K.fBrl(pLo.m.cpm) + ') e ' + pHi.n + ' o mais caro (' + K.fBrl(pHi.m.cpm) + ').');
    }
    var it3 = parts.length ? '- ' + parts.join(' ') : '- Faltam impressões e cliques para comparar alcance e cliques entre os canais.';
    L.push('## O que os números mostram', it1, it2, it3, '');

    /* Recomendação de verba */
    var r1, r2;
    if (best.m.roas < 1) {
      r1 = 'Nenhum canal cobre o próprio custo (' + (interno ? 'todos abaixo de 1×' : 'todos devolvem menos do que custam') + '): antes de redistribuir a verba, revisar oferta, página de destino e metas.';
      r2 = igual ? 'Como os canais empatam em retorno, comparar o ' + n.cpa + ' antes de decidir onde cortar verba.'
        : 'Se for preciso cortar verba, começar por ' + worst.n + ', o canal de menor retorno.';
    } else if (igual) {
      r1 = 'Manter a distribuição atual de verba: os canais têm retornos equivalentes.';
      r2 = 'Acompanhar mais algumas semanas antes de mexer na verba.';
    } else {
      if (worst.m.roas < 1) {
        r1 = 'Reduzir ou pausar a verba de ' + worst.n + ' até corrigir o retorno: ' + (interno ? 'abaixo de 1×' : 'devolvendo menos do que custa') + ', o canal não se paga, antes de considerar margem.';
      } else if (worst.m.roas < best.m.roas * 0.6) {
        r1 = 'Testar realocar parte da verba de ' + worst.n + ' para ' + best.n + ', que retorna mais por real investido.';
      } else {
        r1 = 'Manter a distribuição atual de verba: os retornos estão próximos.';
      }
      r2 = 'Se a verba de ' + best.n + ' aumentar, fazer em passos graduais e acompanhar se o retorno se mantém (hipótese: o retorno costuma cair com a escala).';
    }
    L.push('## Recomendação de verba', '- ' + r1, '- ' + r2, '');

    /* Próximos testes A/B */
    var t1, t2;
    if (igual) {
      var big = rows.slice().sort(function (a, b) { return b.r.inv - a.r.inv; })[0];
      t1 = 'Testar uma variável por vez (criativo, público ou página de destino) em ' + big.n + ', o canal de maior investimento, para descobrir o que move o retorno.';
    } else if (worst.m.ctr !== null && tm.ctr !== null && worst.m.ctr < tm.ctr) {
      t1 = worst.n + ': testar novos criativos e públicos. ' + cap(n.ctr) + ' de ' + K.fPct(worst.m.ctr) + ', abaixo da média geral (' + K.fPct(tm.ctr) + '); hipótese: a mensagem ou a segmentação atrai menos cliques.';
    } else if (worst.m.tc !== null && tm.tc !== null && worst.m.tc < tm.tc) {
      t1 = worst.n + ': testar página de destino e oferta. Os cliques chegam, mas poucos viram conversão (' + K.fPct(worst.m.tc) + ' dos cliques, contra ' + K.fPct(tm.tc) + ' na média geral); hipótese: a perda acontece depois do clique.';
    } else {
      t1 = worst.n + ': testar variações de criativo e de oferta, uma de cada vez, para isolar o que muda o retorno.';
    }
    t2 = best.n + ': testar um aumento de verba controlado (por exemplo, +20% por uma semana) e comparar o retorno com a semana anterior.';
    L.push('## Próximos testes A/B', '- ' + t1, '- ' + t2, '');

    /* Limites */
    L.push('## Limites desta análise', 'Esta leitura usa só os números informados e não cobre margem, atribuição entre canais, sazonalidade nem a qualidade das conversões.');
    return L.join('\n');
  }

  /* Desenha o texto (títulos "## " e itens "- ") dentro de um elemento. */
  function render(text, el) {
    el.textContent = '';
    var list = null;
    text.split('\n').forEach(function (line) {
      var t = line.trim();
      if (!t) { list = null; return; }
      if (t.indexOf('## ') === 0) {
        list = null;
        var h = document.createElement('h4'); h.textContent = t.slice(3); el.appendChild(h);
      } else if (t.indexOf('- ') === 0) {
        if (!list) { list = document.createElement('ul'); el.appendChild(list); }
        var li = document.createElement('li'); li.textContent = t.slice(2); list.appendChild(li);
      } else {
        list = null;
        var p = document.createElement('p'); p.textContent = t; el.appendChild(p);
      }
    });
  }

  /* Versão em texto simples, para copiar. */
  function plain(text) {
    return text.replace(/^## /gm, '').replace(/^- /gm, '• ');
  }

  w.Relatorio = { gerar: gerar, render: render, plain: plain };
})(window);
