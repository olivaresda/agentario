/* Páginas estáticas de Agentario: copiar el prompt y medir con GoatCounter (misma cuenta que la página principal). */
(() => {
  const activo = /^https?:$/.test(location.protocol) && /laexperienciaeselcodigo\.com$/.test(location.hostname);
  if (activo) {
    const s = document.createElement('script');
    s.async = true; s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = 'https://agentario.goatcounter.com/count';
    document.head.appendChild(s);
  }
  const evento = (path, title) => {
    if (!activo) return;
    try { window.goatcounter.count({ path, title: title || path, event: true }); } catch (e) {}
  };
  const caso = document.body.dataset.caso || '';
  const lugarPagina = caso || location.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'inicio';

  document.addEventListener('click', async e => {
    const t = e.target.closest('a,button'); if (!t) return;

    if (t.dataset.copiar) {
      const el = document.getElementById(t.dataset.copiar);
      evento('copiar-prompt-pagina/' + caso, 'Copiar prompt (página): ' + document.title);
      try { await navigator.clipboard.writeText(el.textContent); t.textContent = 'Prompt copiado'; }
      catch (err) {
        const r = document.createRange(); r.selectNodeContents(el);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
        t.textContent = 'Selecciona el texto para copiarlo';
      }
      setTimeout(() => { t.textContent = 'Copiar prompt'; }, 2200);
      return;
    }

    if (t.tagName !== 'A') return;
    if (t.classList.contains('via')) evento('clic-alianza/' + caso, 'Clic Agent Use Cases: ' + document.title);
    if (t.classList.contains('fo')) evento('clic-fuente/' + caso, 'Clic fuente: ' + document.title);
    if (t.hostname === 'laexperienciaeselcodigo.com') {
      const lugar = t.dataset.libro || 'otro';
      const u = new URL(t.href);
      u.searchParams.set('utm_source', 'agentario');
      u.searchParams.set('utm_medium', lugar);
      u.searchParams.set('utm_campaign', 'preventa');
      u.searchParams.set('utm_content', lugarPagina);
      t.href = u.toString();
      evento('clic-libro/' + lugar + '/' + lugarPagina, 'Clic al libro: ' + lugar + ' · ' + document.title);
    }
  });
})();
