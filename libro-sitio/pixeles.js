/*
  Píxeles de publicidad de laexperienciaeselcodigo.com
  Un solo archivo para Meta y LinkedIn; las páginas lo cargan con
  <script src="/pixeles.js" defer></script>.

  Para activarlos, reemplaza los dos valores de abajo:
  - META_PIXEL_ID: ID del píxel (solo números) en Meta, Administrador de eventos.
  - LINKEDIN_PARTNER_ID: Partner ID (solo números) en LinkedIn Campaign Manager,
    Activos > Insight Tag.
  Mientras un valor no sea numérico, ese píxel no se carga.
*/
(function () {
  var META_PIXEL_ID = 'PEGAR_ID_META';
  var LINKEDIN_PARTNER_ID = 'PEGAR_ID_LINKEDIN';

  function valido(id) { return /^\d+$/.test(id); }

  // Meta Pixel
  if (valido(META_PIXEL_ID)) {
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  // LinkedIn Insight Tag
  if (valido(LINKEDIN_PARTNER_ID)) {
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(LINKEDIN_PARTNER_ID);
    (function (l) {
      if (!l) { window.lintrk = function (a, b) { window.lintrk.q.push([a, b]); }; window.lintrk.q = []; }
      var s = document.getElementsByTagName('script')[0];
      var b = document.createElement('script');
      b.type = 'text/javascript'; b.async = true;
      b.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
      s.parentNode.insertBefore(b, s);
    })(window.lintrk);
  }
})();
