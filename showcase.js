// Feature tour: WAI-ARIA tabs (automatic activation) that slide a looped carousel of product screens.
// The active screen sits in the middle with its neighbours peeking at the sides; a tap on a neighbour
// or a horizontal swipe also moves it. While the tour is on screen it plays on its own: the selected tab
// fills with the brand gradient over the screen's turn (its data-duration), and when the fill reaches the
// end the next screen slides in. Meanwhile the screen plays a short demo: a cursor moves to a control and
// clicks it, and the screen answers. Hovering the tour or keyboard focus on its tabs holds the countdown;
// the Pause button stops the countdown and the demos; with reduced motion the tour starts paused and the
// screens stay still. Without this script every screen is listed one after another.
// Customer stories: WAI-ARIA tabs (automatic activation), a column on wide screens and a row on phones, so
// every arrow key moves. Without this script, or if it fails, every story is listed with its heading.
(function () {
  var section = document.getElementById('stories');
  var list = section && section.querySelector('[data-story-tabs]');
  if (!list) return;
  var tabs = [].slice.call(list.querySelectorAll('[data-story]'));
  var panel = function (t) { return document.getElementById('story-' + t.getAttribute('data-story')); };
  try {
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', list.getAttribute('data-label'));
    tabs.forEach(function (t) {
      var p = panel(t);
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-controls', p.id);
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', t.id);
    });
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle('is-active', on);
        panel(t).hidden = !on;
      });
      if (focus) tab.focus();
      // On phones the row scrolls: keep the selected kind in view.
      if (list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
      }
    };
    list.addEventListener('click', function (e) {
      var t = e.target.closest('[data-story]');
      if (t) select(t, true);
    });
    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (n === undefined) return;
      e.preventDefault();
      select(tabs[(n + tabs.length) % tabs.length], true);
    });
    select(tabs[0], false);
    section.classList.add('is-tabbed');
  } catch (err) {
    section.classList.remove('is-tabbed');
    list.removeAttribute('role');
    tabs.forEach(function (t) {
      var p = panel(t);
      p.hidden = false;
      p.removeAttribute('role');
      p.removeAttribute('aria-labelledby');
    });
  }
})();

// Escoge TU negocio: a chip picks a kind of business, and only its features show, in their groups. Without
// this script every feature is listed.
(function () {
  var box = document.querySelector('[data-biz-chips]');
  if (!box) return;
  var chips = [].slice.call(box.querySelectorAll('[data-biz]'));
  var root = document.querySelector('[data-biz-features]');
  var feats = [].slice.call(root.querySelectorAll('.feat'));
  var groups = [].slice.call(root.querySelectorAll('.feat-group'));
  var dream = document.querySelector('[data-biz-dream]');
  var pick = function (chip) {
    var code = chip.getAttribute('data-biz');
    chips.forEach(function (c) {
      var on = c === chip;
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
      c.classList.toggle('is-on', on);
    });
    feats.forEach(function (f) { f.hidden = (' ' + f.getAttribute('data-for') + ' ').indexOf(' ' + code + ' ') < 0; });
    groups.forEach(function (g) { g.hidden = !g.querySelector('.feat:not([hidden])'); });
    if (dream) dream.hidden = code !== 'otro';
  };
  box.addEventListener('click', function (e) {
    var c = e.target.closest('[data-biz]');
    if (c) pick(c);
  });
  pick(chips[0]);
})();

// Falco: the carrier pigeon flies from side to side until Pause (the button shows only where it moves), and the
// chats play once, when the section comes into view. Without the script, without IntersectionObserver or with
// reduced motion, every message shows from the start.
(function () {
  var section = document.getElementById('falco');
  if (!section) return;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var toggle = section.querySelector('[data-falco-toggle]');
  if (toggle) {
    var label = toggle.querySelector('[data-falco-toggle-label]');
    var show = function () { toggle.hidden = motion.matches; };
    var paused = false;
    toggle.addEventListener('click', function () {
      paused = !paused;
      section.classList.toggle('is-paused', paused);
      toggle.classList.toggle('is-paused', paused);
      label.textContent = paused ? 'Reanudar animación' : 'Pausar animación';
    });
    if (motion.addEventListener) motion.addEventListener('change', show);
    else if (motion.addListener) motion.addListener(show);
    show();
  }
  if (!('IntersectionObserver' in window) || motion.matches) return;
  section.classList.add('is-armed');
  var io = new IntersectionObserver(function (entries) {
    if (!entries[entries.length - 1].isIntersecting) return;
    section.classList.add('is-playing');
    io.disconnect();
  }, { threshold: 0.25 });
  io.observe(section);
})();

// Falco's demo chat: a scripted sample, not an AI. A click on a question adds it to the chat, Falco "types" for a
// moment and gives one of that question's five answers at random (never the same one twice running). The texts are
// Spanish here; i18n.js holds their English and translates each message as it is added.
(function () {
  var box = document.querySelector('[data-falco-demo]');
  if (!box) return;
  var log = box.querySelector('[data-falco-log]');
  var QA = {
    calendar: { q: "\u00bfC\u00f3mo va mi calendario hoy?", a: [
      "Hoy tienes 18 citas: 15 confirmadas, 2 por confirmar y 1 cancelaci\u00f3n. Tu primer espacio libre es a las 2:00\u00a0p.\u00a0m.",
      "D\u00eda lleno: 21 citas y solo queda un espacio, a las 4:30\u00a0p.\u00a0m. con Andr\u00e9s. \u00bfLo ofrezco a la lista de espera?",
      "Vas bien: 16 citas, todas confirmadas. Camila tiene la ma\u00f1ana completa y Valentina est\u00e1 libre desde las 3:00\u00a0p.\u00a0m.",
      "Hoy hay 14 citas. Dos pacientes pidieron cambiar de hora y ya los reubiqu\u00e9; no tienes cruces.",
      "Tienes 19 citas y 3 valoraciones de pacientes nuevos. La primera es a las 8:00\u00a0a.\u00a0m. con Sof\u00eda Arango."
    ] },
    tomorrow: { q: "Dame la agenda de ma\u00f1ana.", a: [
      "Ma\u00f1ana empiezas a las 8:00\u00a0a.\u00a0m. con Mateo C\u00e1rdenas y terminas a las 6:00\u00a0p.\u00a0m. Son 15 citas y el almuerzo est\u00e1 bloqueado de 12:00 a 1:00.",
      "Ma\u00f1ana tienes 12 citas. La tarde est\u00e1 suave: hay tres espacios libres despu\u00e9s de las 3:00\u00a0p.\u00a0m.",
      "Ma\u00f1ana: 17 citas, 2 clases de pilates llenas y una valoraci\u00f3n nueva a las 10:30\u00a0a.\u00a0m.",
      "Ma\u00f1ana es tu d\u00eda m\u00e1s ocupado de la semana: 20 citas. Ya confirm\u00e9 18 de ellas.",
      "Ma\u00f1ana tienes 13 citas. Daniel Ospina pidi\u00f3 pasar su cita de las 11:00 a las 4:00\u00a0p.\u00a0m. \u00bfLa muevo?"
    ] },
    sales: { q: "\u00bfCu\u00e1nto vend\u00ed esta semana?", a: [
      "Esta semana llevas $\u00a011.850.000, un 9\u00a0% m\u00e1s que la semana pasada. El mejor d\u00eda fue el martes.",
      "Vas en $\u00a09.420.000 esta semana. Fisioterapia aporta el 58\u00a0% de las ventas.",
      "Llevas $\u00a012.300.000 en 96 ventas. Tu ticket promedio subi\u00f3 a $\u00a0128.000.",
      "Esta semana: $\u00a010.760.000. Te faltan $\u00a01.240.000 para igualar tu mejor semana del mes.",
      "$\u00a08.990.000 hasta hoy, con 71 ventas. El 64\u00a0% se pag\u00f3 con tarjeta o Nequi."
    ] },
    unpaid: { q: "\u00bfQui\u00e9n no ha pagado?", a: [
      "Tienes 2 ventas pendientes por $\u00a01.135.000: Laura Henao (paquete de 10 sesiones) y Carolina Zapata (abono del 50\u00a0%).",
      "Solo una: Laura Henao debe $\u00a01.080.000 de su paquete. Le envi\u00e9 el link de pago ayer. \u00bfSe lo recuerdo?",
      "Hay 3 saldos pendientes que suman $\u00a0640.000. El m\u00e1s antiguo es de hace 9 d\u00edas.",
      "Hoy est\u00e1s al d\u00eda: no hay pagos pendientes. La \u00faltima cuenta por cobrar se pag\u00f3 esta ma\u00f1ana.",
      "Faltan 4 pagos por $\u00a0912.000. Dos son de pacientes con cita ma\u00f1ana; puedo cobrarles al llegar."
    ] },
    taxes: { q: "\u00bfCu\u00e1ndo debo pagar impuestos?", a: [
      "Con el NIT de ejemplo de Alba, tu declaraci\u00f3n de renta vence el 12 de mayo. Te aviso una semana antes.",
      "Lo m\u00e1s cercano es el IVA del bimestre: vence el 14 de enero seg\u00fan el NIT de ejemplo de Alba.",
      "Este mes solo tienes la retenci\u00f3n en la fuente, el d\u00eda 16. La declaraci\u00f3n de renta vence en mayo (fechas de ejemplo de Alba).",
      "Tu pr\u00f3ximo vencimiento es el ICA de Bogot\u00e1, el 23 de enero. Ya tengo listo el resumen para tu contador (fechas de ejemplo).",
      "Tienes tres fechas este trimestre: retenci\u00f3n el 16, IVA el 14 de enero y renta en mayo. Son fechas de ejemplo para el NIT de Alba."
    ] },
    top: { q: "\u00bfCu\u00e1l es mi servicio m\u00e1s vendido?", a: [
      "Fisioterapia: 142 sesiones este mes, el 58\u00a0% de tus ingresos. Le sigue el masaje terap\u00e9utico.",
      "Este mes gana Fisioterapia con $\u00a017.040.000. Pilates cl\u00ednico es el que m\u00e1s creci\u00f3: 22\u00a0%.",
      "Tu servicio estrella es Fisioterapia. El paquete de 10 sesiones se vendi\u00f3 9 veces este mes.",
      "Fisioterapia va primero y Rehabilitaci\u00f3n deportiva segundo. Juntos son 3 de cada 4 pesos que entran.",
      "Fisioterapia, con 38 sesiones esta semana. El masaje terap\u00e9utico se vende m\u00e1s los viernes."
    ] },
    friday: { q: "\u00bfTengo espacios libres el viernes?", a: [
      "S\u00ed, 5 espacios: 8:15 y 10:45\u00a0a.\u00a0m. con Camila, y 2:00, 4:30 y 5:15\u00a0p.\u00a0m. con Andr\u00e9s.",
      "El viernes quedan 3 espacios, todos en la tarde. \u00bfLos publico en tu p\u00e1gina de reservas?",
      "Solo uno: a las 11:30\u00a0a.\u00a0m. con Valentina. El resto del viernes est\u00e1 lleno.",
      "Tienes 7 espacios libres el viernes. La ma\u00f1ana est\u00e1 casi vac\u00eda; puede ser buen d\u00eda para una promoci\u00f3n.",
      "S\u00ed: 4 espacios entre las 2:00 y las 5:00\u00a0p.\u00a0m. Las clases de pilates del viernes ya est\u00e1n llenas."
    ] },
    new: { q: "\u00bfCu\u00e1ntos clientes nuevos tuve este mes?", a: [
      "Este mes llegaron 34 pacientes nuevos, 8 m\u00e1s que el mes pasado. 21 reservaron desde tu p\u00e1gina web.",
      "Llevas 27 pacientes nuevos. La mayor\u00eda te encontr\u00f3 en Google buscando \u00abfisioterapia en chic\u00f3\u00bb.",
      "41 pacientes nuevos este mes, tu mejor cifra del a\u00f1o. 6 de cada 10 ya agendaron su segunda cita.",
      "Este mes: 29 nuevos. 12 llegaron recomendados por otros pacientes.",
      "Tienes 31 pacientes nuevos y 19 ya compraron un paquete de sesiones."
    ] }
  };
  var last = {};
  var busy = false;
  var say = function (cls, text) {
    var m = document.createElement('div');
    m.className = 'fc-msg ' + cls;
    if (text) m.textContent = text;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  };
  var answer = function (id) {
    var list = QA[id].a;
    var i;
    do { i = Math.floor(Math.random() * list.length); } while (i === last[id]);
    last[id] = i;
    return list[i];
  };
  box.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-q]');
    if (!chip || busy || !Object.prototype.hasOwnProperty.call(QA, chip.getAttribute('data-q'))) return;
    var id = chip.getAttribute('data-q');
    busy = true;
    box.classList.add('is-busy');
    say('fc-user', QA[id].q);
    var typing = say('fc-bot fc-typing');
    typing.setAttribute('aria-hidden', 'true');
    typing.innerHTML = '<i></i><i></i><i></i>';
    setTimeout(function () {
      log.removeChild(typing);
      say('fc-bot', answer(id));
      busy = false;
      box.classList.remove('is-busy');
    }, 900);
  });
  // For the tests: the questions and their answers.
  window.gtlFalcoDemo = QA;
})();

// Why our logo: the clip plays once when it comes into view (not with reduced motion), and the button plays it
// again from the start. Without the script the video keeps its own controls.
(function () {
  var box = document.querySelector('[data-logo-story]');
  var video = box && box.querySelector('video');
  var replay = box && box.querySelector('[data-logo-replay]');
  if (!video || !replay) return;
  video.removeAttribute('controls');
  replay.hidden = false;
  var play = function () {
    try { video.currentTime = 0; } catch (err) { /* not loaded yet: it starts from the beginning anyway */ }
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  };
  replay.addEventListener('click', play);
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io = new IntersectionObserver(function (entries) {
    if (!entries[entries.length - 1].isIntersecting) return;
    io.disconnect();
    play();
  }, { threshold: 0.6 });
  io.observe(video);
})();

// Clients: the logo rows drift until Pause; the button only shows where they move (no reduced motion).
(function () {
  var section = document.getElementById('clients');
  var toggle = section && section.querySelector('[data-clients-toggle]');
  if (!toggle) return;
  var label = toggle.querySelector('[data-clients-toggle-label]');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var show = function () { toggle.hidden = motion.matches; };
  var paused = false;
  toggle.addEventListener('click', function () {
    paused = !paused;
    section.classList.toggle('is-paused', paused);
    toggle.classList.toggle('is-paused', paused);
    label.textContent = paused ? 'Reanudar logos' : 'Pausar logos';
  });
  // Keyboard focus on the button holds them too, while it is there.
  toggle.addEventListener('focus', function () { if (toggle.matches(':focus-visible')) section.classList.add('is-held'); });
  toggle.addEventListener('blur', function () { section.classList.remove('is-held'); });
  if (motion.addEventListener) motion.addEventListener('change', show);
  else if (motion.addListener) motion.addListener(show);
  show();
})();

(function () {
  var root = document.querySelector('[data-showcase]');
  if (!root) return;
  var list = root.querySelector('[data-showcase-tabs]');
  var stage = root.querySelector('[data-showcase-stage]');
  var toggle = root.querySelector('[data-showcase-toggle]');
  var tabs = [].slice.call(list.querySelectorAll('[data-feature]'));
  var slides = tabs.map(function (t) { return document.getElementById('feature-' + t.getAttribute('data-feature')); });

  try {
    var n = tabs.length;
    var current = 0;
    var pending = [];
    var timer = 0;
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var SLIDE = 700;         // the slide transition in style.css
    var HOLD = 2500;         // a finished demo waits this long, while the countdown is held, before it replays
    var durations = tabs.map(function (t) { return Number(t.getAttribute('data-duration')) || 6000; });

    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', list.getAttribute('data-label'));
    tabs.forEach(function (t, i) {
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-controls', slides[i].id);
      slides[i].setAttribute('role', 'tabpanel');
      slides[i].setAttribute('aria-labelledby', t.id);
    });

    // Where slide i sits, in slide widths from the middle, when `active` is shown.
    var offset = function (i, active) {
      var d = (i - active + n) % n;
      return d > n / 2 ? d - n : d;
    };

    var place = function (slide, pos, jump) {
      slide.classList.toggle('is-jump', jump);
      slide.style.setProperty('--pos', pos);
    };

    // Slides that left the view on one side finish by jumping, unseen, to the other side.
    var settle = function () {
      clearTimeout(timer);
      pending.forEach(function (p) { place(p[0], p[1], true); });
      pending = [];
    };

    var revealTab = function (tab, smooth) {
      if (list.scrollWidth <= list.clientWidth) return;
      var left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
      list.scrollTo({ left: left, behavior: smooth && !motion.matches ? 'smooth' : 'auto' });
    };

    // ---------- Screen demos ----------

    // A demo is a list of [ms, step] on one screen. Its steps only switch classes, stacked text lines
    // (data-show) and inline transforms, and move the cursor; each element they touch is noted first,
    // so reset() puts the screen back exactly as the page wrote it.
    var makeDemo = function (slide, script, duration) {
      var mock = slide.querySelector('.mock');
      var saved = [];
      var cursor = null;
      var at = { x: 0, y: 0 };
      var q = function (s) { return mock.querySelector(s); };

      var keep = function (el) {
        for (var k = 0; k < saved.length; k++) if (saved[k].el === el) return;
        saved.push({ el: el, cls: el.getAttribute('class'), style: el.getAttribute('style'), show: el.getAttribute('data-show') });
      };
      var put = function (el, name, value) {
        if (value === null) el.removeAttribute(name);
        else el.setAttribute(name, value);
      };

      var point = function (x, y, time) {
        if (!cursor) {
          var layer = document.createElement('span');
          layer.className = 'm-cursor-layer';
          layer.innerHTML = '<span class="m-cursor"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
            + '<path d="M5 2.8v16.4l4.2-4 2.9 6.6 2.8-1.2-2.9-6.5h5.8z"/></svg></span>';
          mock.appendChild(layer);
          cursor = layer.firstChild;
          park();
          void cursor.offsetWidth;
        }
        at = { x: x, y: y };
        cursor.style.setProperty('--ct', time + 'ms');
        cursor.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      };
      // Off the right edge, where the layer clips it.
      var park = function () {
        if (!cursor) return;
        at = { x: mock.clientWidth + 12, y: mock.clientHeight * 0.72 };
        cursor.style.setProperty('--ct', '0ms');
        cursor.style.transform = 'translate(' + at.x + 'px,' + at.y + 'px)';
        cursor.classList.remove('is-click');
      };

      var d = {
        cls: function (el, name, on) {
          if (!el) return;
          keep(el);
          el.classList.toggle(name, on !== false);
        },
        // Select el among its siblings.
        pick: function (el) {
          if (!el) return;
          [].forEach.call(el.parentNode.children, function (c) { d.cls(c, 'is-on', c === el); });
        },
        show: function (el, i) {
          if (!el) return;
          keep(el);
          el.setAttribute('data-show', i);
        },
        showAll: function (selector, i) {
          [].forEach.call(mock.querySelectorAll(selector), function (el) { d.show(el, i); });
        },
        shift: function (el, y) {
          if (!el) return;
          keep(el);
          el.style.transform = y ? 'translateY(' + (-y).toFixed(1) + 'px)' : '';
        },
        // Glide to a point of el, given as fractions of its box (the middle by default); skipped when the
        // narrower layouts hide el.
        to: function (el, time, fx, fy) {
          if (!el || !el.getClientRects().length) return;
          var r = el.getBoundingClientRect();
          var m = mock.getBoundingClientRect();
          point(r.left - m.left + r.width * (fx == null ? 0.5 : fx), r.top - m.top + r.height * (fy == null ? 0.55 : fy), time);
        },
        by: function (dx, dy, time) {
          if (cursor) point(at.x + dx, at.y + dy, time);
        },
        click: function () {
          if (!cursor) return;
          cursor.classList.remove('is-click');
          void cursor.offsetWidth;
          cursor.classList.add('is-click');
        },
      };

      return {
        steps: script(d, q),
        loop: duration + HOLD,
        t: 0,
        i: 0,
        timer: 0,
        reset: function () {
          saved.forEach(function (s) {
            put(s.el, 'class', s.cls);
            put(s.el, 'style', s.style);
            put(s.el, 'data-show', s.show);
          });
          saved = [];
          park();
        },
      };
    };

    var hourHeight = function (q) { return q('.m-hours > span').offsetHeight; };

    var scripts = {
      // An appointment is dragged to a free slot, another one is cancelled, then on to next week.
      calendar: function (d, q) {
        var laura = q('.m-ev-laura');
        var daniel = q('.m-ev-daniel');
        var pop = q('.m-pop');
        var cancel = q('.m-pop-cancel');
        var toast = q('.m-toast');
        return [
          [300, function () { d.to(laura, 800); }],
          [1150, function () { d.cls(laura, 'is-hover'); }],
          [1400, function () { d.click(); d.cls(laura, 'is-lift'); }],
          [1650, function () { d.cls(laura, 'is-drag'); d.by(0, 2.25 * hourHeight(q), 850); }],
          [2550, function () {
            d.cls(laura, 'is-lift', false);
            d.cls(laura, 'is-drag', false);
            d.cls(laura, 'is-hover', false);
            d.cls(laura, 'is-moved');
            d.show(laura.querySelector('.m-swap'), 1);
            d.cls(toast, 'is-on');
          }],
          [2950, function () { d.to(daniel, 700, 0.4); }],
          [3800, function () { d.cls(toast, 'is-on', false); }],
          [4000, function () { d.click(); d.cls(daniel, 'is-hover'); d.cls(pop, 'is-on'); }],
          [4350, function () { d.to(cancel, 450, 0.35); }],
          [4800, function () { d.cls(cancel, 'is-hover'); }],
          [5000, function () {
            d.click();
            d.cls(pop, 'is-on', false);
            d.cls(daniel, 'is-hover', false);
            d.cls(daniel, 'is-cancel');
            d.show(daniel.querySelector('.m-swap'), 1);
          }],
          [5350, function () { d.to(q('.m-next'), 750); }],
          [6150, function () {
            d.click();
            d.cls(q('.m-cal-next'), 'is-on');
            d.cls(q('.m-now'), 'is-off');
            d.showAll('.m-date .m-swap', 1);
          }],
          [6700, function () { d.by(-50, 70, 900); }],
        ];
      },

      // A patient picks a professional, a day and a time, and books.
      booking: function (d, q) {
        var staff = q('.m-book-staff').children;
        var days = q('.m-book-days').children;
        var am = q('.m-book-am').children;
        var pm = q('.m-book-pm').children;
        var go = q('.m-book-go');
        return [
          [300, function () { d.to(staff[1], 750); }],
          [1100, function () { d.click(); d.pick(staff[1]); }],
          [1350, function () { d.to(days[3], 600); }],
          [2000, function () {
            d.click();
            d.pick(days[3]);
            // Thursday's free times: 8:15 and 2:00 are taken, 9:00 is open.
            d.cls(pm[1], 'is-on', false);
            d.cls(am[0], 'is-off');
            d.cls(am[1], 'is-off', false);
            d.cls(pm[0], 'is-off');
          }],
          [2250, function () { d.to(pm[2], 600); }],
          [2900, function () { d.click(); d.pick(pm[2]); d.show(go.querySelector('.m-swap'), 1); }],
          [3250, function () { d.to(go, 650, 0.6); }],
          [4000, function () { d.click(); d.cls(q('.m-booked'), 'is-on'); }],
          [4600, function () { d.by(40, 60, 900); }],
        ];
      },

      // The list scrolls back to yesterday's sales, then a service filter is picked.
      sales: function (d, q) {
        var body = q('.m-tbody');
        var all = q('.m-tlist');
        var rows = all.querySelectorAll('.m-tr');
        var sep = q('.m-tsep');
        var filter = q('.m-filter');
        var menu = q('.m-menu');
        var choice = q('.m-menu-pick');
        var scroll = function (y) { d.shift(all, Math.max(0, Math.min(y, all.offsetHeight - body.clientHeight))); };
        return [
          [300, function () { d.to(rows[2], 800, 0.4); }],
          [1100, function () { d.cls(rows[2], 'is-hover'); }],
          [1400, function () { d.cls(rows[2], 'is-hover', false); scroll(sep.offsetTop - 2 * rows[0].offsetHeight); }],
          [2600, function () { scroll(sep.offsetTop + 4 * rows[0].offsetHeight); }],
          [3700, function () { d.to(filter, 700); }],
          [4450, function () { d.click(); d.cls(menu, 'is-on'); }],
          [4700, function () { d.to(choice, 450, 0.3); }],
          [5150, function () { d.cls(choice, 'is-hover'); }],
          [5300, function () {
            d.click();
            d.cls(menu, 'is-on', false);
            d.cls(filter, 'is-set');
            d.show(filter.querySelector('.m-swap'), 1);
            d.cls(q('.m-tlist--fisio'), 'is-on');
          }],
          [5800, function () { d.to(q('.m-tlist--fisio > .m-tr:nth-child(4)'), 700, 0.35); }],
        ];
      },

      // The view goes from months to quarters to years, and every figure follows.
      finance: function (d, q) {
        var seg = q('.m-fin-seg').children;
        var plot = q('.m-plot');
        var view = function (i, cls) {
          d.pick(seg[i]);
          d.cls(plot, 'is-q', cls === 'is-q');
          d.cls(plot, 'is-y', cls === 'is-y');
          d.showAll('.m-swap', i);
        };
        return [
          [300, function () { d.to(seg[1], 800); }],
          [1150, function () { d.click(); view(1, 'is-q'); }],
          [1650, function () { d.to(q('.m-plot > :last-child'), 900, 0.5, 0.3); }],
          [3300, function () { d.to(seg[2], 800); }],
          [4150, function () { d.click(); view(2, 'is-y'); }],
          [4650, function () { d.to(q('.m-hbar') || plot, 900, 0.6); }],
        ];
      },

      // Chats are looked over, a new one comes in, and a patient's question gets a quick reply.
      messages: function (d, q) {
        var convs = q('.m-convs');
        var rows = convs.children;
        var sofia = q('.m-conv-sofia');
        var box = q('.m-msgs');
        var track = q('.m-msgs-track');
        var ask = q('.m-msg--ask');
        var reply = q('.m-msg--reply');
        var quick = q('.m-quick-addr');
        var compose = q('.m-compose-text');
        // Scroll the thread just enough to show el in full.
        var follow = function (el) {
          var s = getComputedStyle(box);
          var room = box.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom);
          var over = el.offsetTop + el.offsetHeight - room;
          if (over > 0) d.shift(track, over);
        };
        var preview = function (i) {
          d.show(sofia.querySelector('small'), i);
          d.show(sofia.querySelector('time'), i);
        };
        return [
          [300, function () { d.to(rows[2], 800, 0.4); }],
          [1100, function () { d.cls(rows[2], 'is-hover'); }],
          [1500, function () { d.cls(rows[2], 'is-hover', false); d.to(rows[3], 450, 0.4); }],
          [1950, function () { d.cls(rows[3], 'is-hover'); }],
          [2300, function () { d.cls(rows[3], 'is-hover', false); d.cls(convs, 'is-new'); }],
          [2900, function () { d.cls(ask, 'is-typing'); follow(ask); }],
          [3900, function () { d.cls(ask, 'is-typing', false); d.cls(ask, 'is-on'); preview(1); }],
          [4200, function () { d.to(quick, 800); }],
          [5050, function () { d.click(); d.cls(quick, 'is-hover'); d.show(compose, 1); }],
          [5400, function () { d.to(q('.m-send'), 600); }],
          [6050, function () {
            d.click();
            d.cls(quick, 'is-hover', false);
            d.show(compose, 0);
            d.cls(reply, 'is-on');
            follow(reply);
            preview(2);
          }],
          [6500, function () { d.by(-60, -50, 900); }],
        ];
      },
    };

    var demos = slides.map(function (slide, i) {
      var script = scripts[tabs[i].getAttribute('data-feature')];
      return script ? makeDemo(slide, script, durations[i]) : null;
    });
    var demo = null;         // the selected screen's demo, from the start of its turn

    // The selected screen's demo starts from its first step; the one that left is put back once it is
    // out of the middle.
    var switchDemo = function (index) {
      if (demo) {
        var old = demo;
        old.timer = setTimeout(old.reset, SLIDE);
      }
      demo = motion.matches ? null : demos[index];
      if (demo) {
        clearTimeout(demo.timer);
        demo.reset();
        demo.t = 0;
        demo.i = 0;
      }
    };

    var stopDemo = function () {
      if (!demo) return;
      demo.reset();
      demo = null;
    };

    var advance = function (dt) {
      var d = demo;
      d.t += dt;
      try {
        while (d.i < d.steps.length && d.steps[d.i][0] <= d.t) d.steps[d.i++][1]();
      } catch (err) {
        stopDemo();
        return;
      }
      if (d.t >= d.loop) {
        d.reset();
        d.t = 0;
        d.i = 0;
      }
    };

    var select = function (index, focus, animate) {
      settle();
      var step = offset(index, current);
      slides.forEach(function (slide, i) {
        var from = offset(i, current);
        var to = offset(i, index);
        if (!animate || from - step === to) {
          place(slide, to, !animate);
        } else if (Math.abs(from) <= 1) {
          // Visible now: slide out with the others, then wrap around.
          place(slide, from - step, false);
          pending.push([slide, to]);
        } else {
          // Out of view now: wrap first, then slide in with the others.
          place(slide, to + step, true);
          void slide.offsetWidth;
          place(slide, to, false);
        }
        var on = i === index;
        slide.classList.toggle('is-active', on);
        slide.inert = !on;
        // Older assistive technology ignores inert; the faded neighbours are decoration.
        if (on) slide.removeAttribute('aria-hidden');
        else slide.setAttribute('aria-hidden', 'true');
        tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
        tabs[i].tabIndex = on ? 0 : -1;
        tabs[i].classList.toggle('is-active', on);
        if (!on) tabs[i].style.removeProperty('--fill');
      });
      if (pending.length) timer = setTimeout(settle, SLIDE);
      current = index;
      if (focus) tabs[index].focus();
      revealTab(tabs[index], animate);
      switchDemo(index);
    };

    // ---------- Autoplay ----------

    var playing = !motion.matches;
    var hovered = false;
    var keyboard = false;
    var onScreen = true;
    var elapsed = 0;       // how long the countdown has run on the selected tab
    var painted = -1;      // the fill last drawn on it
    var raf = 0;
    var last = 0;

    var visible = function () { return onScreen && !document.hidden; };
    var running = function () { return playing && !hovered && !keyboard && visible(); };
    var demoRunning = function () { return !!demo && playing && visible(); };
    var needed = function () { return running() || demoRunning(); };

    var paint = function () {
      var f = Math.min(1, elapsed / durations[current]);
      if (f === painted) return;
      painted = f;
      tabs[current].style.setProperty('--fill', f.toFixed(4));
    };

    var frame = function (now) {
      raf = 0;
      var dt = last ? Math.min(50, Math.max(0, now - last)) : 0;
      last = now;
      if (running()) {
        elapsed += dt;
        if (elapsed >= durations[current]) goTo((current + 1) % n, false);
      }
      paint();
      if (demoRunning()) advance(dt);
      // goTo() may already have asked for the next frame.
      if (!raf && needed()) raf = requestAnimationFrame(frame);
      else if (!raf) last = 0;
    };

    // One frame now (to redraw after a change); it keeps going while something moves.
    var kick = function () { if (!raf) raf = requestAnimationFrame(frame); };

    var goTo = function (index, focus) {
      select(index, focus, true);
      elapsed = 0;
      painted = -1;
      kick();
    };

    var label = toggle.querySelector('[data-showcase-toggle-label]');
    var setPlaying = function (on) {
      playing = on;
      root.classList.toggle('is-paused', !on);
      toggle.classList.toggle('is-paused', !on);
      label.textContent = on ? 'Pausar recorrido' : 'Reanudar recorrido';
      kick();
    };

    // ---------- Input ----------

    list.addEventListener('click', function (e) {
      var t = e.target.closest('[data-feature]');
      if (t) goTo(tabs.indexOf(t), true);
    });
    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      goTo((next + n) % n, true);
    });

    // The neighbours are inert, so their clicks land on the stage: move toward the side clicked.
    stage.addEventListener('click', function (e) {
      var active = slides[current];
      if (active.contains(e.target)) return;
      var box = active.getBoundingClientRect();
      if (e.clientX < box.left) goTo((current - 1 + n) % n, false);
      else if (e.clientX > box.right) goTo((current + 1) % n, false);
    });

    // Touch swipes; vertical drags keep scrolling the page (touch-action: pan-y).
    var start = null;
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') start = { id: e.pointerId, x: e.clientX, y: e.clientY };
    });
    stage.addEventListener('pointerup', function (e) {
      if (!start || e.pointerId !== start.id) return;
      var dx = e.clientX - start.x;
      var dy = e.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) goTo((current + (dx < 0 ? 1 : -1) + n) % n, false);
    });
    stage.addEventListener('pointercancel', function () { start = null; });

    // A mouse on a tab button or on the selected screen holds the countdown; the rest of the tab row,
    // including the gaps between the buttons, does not. The faded neighbours are inert, so they never
    // count, and touch has no hover. The screen's demo goes on meanwhile.
    tabs.concat(slides.map(function (s) { return s.querySelector('.mock'); })).forEach(function (el) {
      el.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') { hovered = true; kick(); } });
      el.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') { hovered = false; kick(); } });
    });

    // Keyboard focus on the tabs holds it too (a mouse click that focuses a tab does not).
    list.addEventListener('focusin', function (e) {
      try { keyboard = e.target.matches(':focus-visible'); } catch (err) { keyboard = true; }
      kick();
    });
    list.addEventListener('focusout', function (e) {
      if (!list.contains(e.relatedTarget)) { keyboard = false; kick(); }
    });

    toggle.addEventListener('click', function () { setPlaying(!playing); });
    var onMotion = function () {
      if (motion.matches) {
        stopDemo();
        setPlaying(false);
      } else {
        if (!demo) switchDemo(current);
        kick();
      }
    };
    if (motion.addEventListener) motion.addEventListener('change', onMotion);
    else if (motion.addListener) motion.addListener(onMotion);

    // Only while the tour is on screen: off screen, or in a background tab, it waits where it was.
    // The first time it comes into view, the photos on the screens beside it load too.
    var eager = function () {
      [].forEach.call(root.querySelectorAll('img[loading="lazy"]'), function (img) { img.loading = 'eager'; });
      eager = function () {};
    };
    document.addEventListener('visibilitychange', kick);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[entries.length - 1].isIntersecting;
        if (onScreen) eager();
        kick();
      }, { rootMargin: '-15% 0px -15% 0px' }).observe(root);
    }

    select(0, false, false);
    setPlaying(playing);
  } catch (err) {
    // Back to the list of every screen, with no tab semantics left behind.
    root.classList.add('is-static');
    list.removeAttribute('role');
    slides.forEach(function (s) {
      s.inert = false;
      s.removeAttribute('role');
      s.removeAttribute('aria-hidden');
      s.removeAttribute('aria-labelledby');
    });
  }
})();
