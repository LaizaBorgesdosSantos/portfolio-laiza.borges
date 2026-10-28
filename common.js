/* Botão de copiar o e-mail (páginas Início e Currículo). */
(function () {
  var btn = document.getElementById('copy');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var el = document.getElementById('email');
    var msg = document.getElementById('copy-msg');
    function fallback() {
      var r = document.createRange(); r.selectNodeContents(el);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      msg.textContent = 'Selecionado. Use Ctrl+C ou o menu de copiar.';
    }
    try {
      navigator.clipboard.writeText(el.textContent).then(function () { msg.textContent = 'E-mail copiado.'; }, fallback);
    } catch (e) { fallback(); }
  });
})();
