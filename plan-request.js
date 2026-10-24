// Plan-request form (PF2 Pass B). In form mode every request button opens the <dialog> the build wrote
// inside the pricing markers, and the form posts JSON to <apiBaseUrl>/api/plan-requests (PB1), with an
// Idempotency-Key per attempt. The buttons keep their WhatsApp href, so without this script (JavaScript
// off, a failed load, or anything below throwing) every button is still its WhatsApp link.
// Privacy: nothing here logs, stores or puts a value in a URL.
(function () {
  'use strict';

  var FORM_NOTICE = '(abre un formulario)';
  var ENDPOINT = '/api/plan-requests';
  var DEFAULT_TIMEOUT_MS = 15000;
  var PHONE = /^\+?[0-9 ()-]{7,20}$/;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var FIELDS = ['plan', 'name', 'business', 'phone', 'email', 'city', 'message', 'consent'];
  // The API's three plan fields all belong to the plan <select>.
  var PLAN_FIELDS = { packageCode: true, tierCode: true, bundleCode: true };

  var POLICY_MISMATCH = 'La política de privacidad se actualizó. Recargue la página para continuar.';
  var TEXT = {
    generic: 'No pudimos registrar su solicitud. Puede intentarlo de nuevo o escribirnos por WhatsApp.',
    network: 'No pudimos enviar su solicitud por un problema de conexión. Sus datos siguen aquí: puede reintentar o escribirnos por WhatsApp.',
    server: 'El servicio no está disponible en este momento. Sus datos siguen aquí: puede reintentar en unos segundos o escribirnos por WhatsApp.',
    rateLimited: 'Recibimos varias solicitudes suyas en poco tiempo. Espere unos minutos e inténtelo de nuevo, o escríbanos por WhatsApp.',
    summary: 'Revise los campos marcados:',
    sending: 'Enviando…'
  };
  var LABELS = {
    plan: 'Plan', name: 'Nombre', business: 'Negocio', phone: 'Teléfono o WhatsApp', email: 'Correo electrónico',
    city: 'Ciudad', message: 'Mensaje', consent: 'Autorización'
  };
  var CONTACT_REQUIRED = 'Indique un teléfono o un correo electrónico.';
  var CONSENT_REQUIRED = 'Marque la casilla de autorización para continuar.';
  var PLAN_REQUIRED = 'Elija un plan de la lista.';
  // The limits come from the inputs' minlength/maxlength, written by the build (amendment A1 §1).
  function tooShort(what) { return function (el) { return what + ' debe tener al menos ' + el.minLength + ' caracteres.'; }; }
  function tooLong(what) { return function (el) { return what + ' no puede superar los ' + el.maxLength + ' caracteres.'; }; }
  // One message per field and code, used for the browser's own checks and for the API's 422 alike.
  var MESSAGES = {
    plan: { required: PLAN_REQUIRED, invalid: PLAN_REQUIRED },
    name: { required: 'Escriba su nombre.', too_short: tooShort('El nombre'), too_long: tooLong('El nombre'), invalid: 'Revise su nombre.' },
    business: {
      required: 'Indique el nombre de su negocio, su Instagram o su sitio web.',
      too_short: tooShort('El nombre del negocio'), too_long: tooLong('El nombre del negocio'), invalid: 'Revise el nombre de su negocio.'
    },
    phone: {
      required: CONTACT_REQUIRED, too_long: tooLong('El teléfono'),
      invalid: 'Revise el teléfono: solo números, espacios, paréntesis, guiones y el signo +, entre 7 y 20 caracteres.'
    },
    email: { required: CONTACT_REQUIRED, too_long: tooLong('El correo'), invalid: 'Revise el correo electrónico; por ejemplo, nombre@dominio.com.' },
    city: { too_long: tooLong('La ciudad'), invalid: 'Revise la ciudad.' },
    message: { too_long: tooLong('El mensaje'), invalid: 'Revise el mensaje.' },
    consent: { consent_required: CONSENT_REQUIRED, required: CONSENT_REQUIRED, invalid: CONSENT_REQUIRED }
  };

  // crypto.randomUUID(), or a v4 UUID from getRandomValues where it is missing.
  function uuid() {
    var c = window.crypto;
    if (typeof c.randomUUID === 'function') return c.randomUUID();
    var b = new Uint8Array(16);
    c.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = [];
    for (var i = 0; i < 16; i++) h.push((b[i] + 256).toString(16).slice(1));
    return h.slice(0, 4).join('') + '-' + h.slice(4, 6).join('') + '-' + h.slice(6, 8).join('') + '-' + h.slice(8, 10).join('') + '-' + h.slice(10).join('');
  }

  function parseJson(text) {
    try { return JSON.parse(text); } catch (err) { return null; }
  }

  function init() {
    var cfg = window.GTL_CONFIG;
    var dialog = document.getElementById('request-dialog');
    if (!cfg || cfg.planRequestMode !== 'form' || typeof cfg.apiBaseUrl !== 'string' || !cfg.apiBaseUrl) return;
    if (!dialog || typeof dialog.showModal !== 'function' || !window.fetch || !window.AbortController
      || !window.crypto || typeof window.crypto.getRandomValues !== 'function' || typeof Object.hasOwn !== 'function') return;
    var section = document.getElementById('planes');
    var buttons = [].slice.call(document.querySelectorAll('#planes a[data-request]'));
    var form = dialog.querySelector('[data-request-form]');
    var success = dialog.querySelector('[data-request-success]');
    if (!section || !buttons.length || !form || !success) return;

    var el = function (name) { return form.elements.namedItem(name); };
    var select = el('plan');
    var errorsBox = form.querySelector('[data-request-errors]');
    var banner = form.querySelector('[data-request-banner]');
    var bannerText = form.querySelector('[data-request-banner-text]');
    var retryBtn = form.querySelector('[data-request-retry]');
    var submitBtn = form.querySelector('[data-request-submit]');
    var submitLabel = submitBtn.textContent;
    var successTitle = document.getElementById('request-success-title');
    var whatsappLinks = [].slice.call(dialog.querySelectorAll('[data-request-whatsapp]'));
    var endpoint = cfg.apiBaseUrl.replace(/\/+$/, '') + ENDPOINT;
    var timeoutMs = typeof cfg.requestTimeoutMs === 'number' && cfg.requestTimeoutMs > 0 ? cfg.requestTimeoutMs : DEFAULT_TIMEOUT_MS;
    // retry: the banner text of the last network/timeout/5xx failure while its key may still be replayed, else null.
    var state = { opener: null, key: null, inFlight: false, locked: false, succeeded: false, retry: null };

    // ---------- the buttons ----------

    buttons.forEach(function (a) {
      a.setAttribute('aria-haspopup', 'dialog');
      var note = a.querySelector('.visually-hidden');
      if (note) note.textContent = FORM_NOTICE;
    });
    section.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[data-request]') : null;
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      open(a);
    });

    function planValue(a) {
      var bundle = a.getAttribute('data-bundle');
      if (bundle) return 'bundle:' + bundle;
      var pkg = a.getAttribute('data-package');
      var tier = a.getAttribute('data-tier');
      if (pkg && tier) return 'plan:' + pkg + ':' + tier;
      return 'general';
    }

    function open(a) {
      state.opener = a;
      if (state.succeeded) {
        form.reset();
        state.succeeded = false;
      }
      clearErrors();
      form.hidden = false;
      success.hidden = true;
      dialog.setAttribute('aria-labelledby', 'request-title');
      var before = select.value;
      select.value = planValue(a);
      if (select.selectedIndex < 0) select.value = 'general';
      updateWhatsApp();
      if (state.locked) {
        showBanner(POLICY_MISMATCH, false, false);
      } else if (state.retry !== null && select.value === before) {
        // Reopened from the same plan with nothing changed after a network error, a timeout or a 5xx: the first
        // request may have been stored, so the key is kept (the API replays it) and the banner comes back (A2 §2).
        showBanner(state.retry, true, false);
      } else {
        // One key per attempt, created when the dialog opens (amendment A1 §2).
        hideBanner();
        renewKey();
      }
      dialog.showModal();
      select.focus();
    }

    dialog.addEventListener('close', function () {
      if (state.opener) state.opener.focus();
    });
    [].forEach.call(dialog.querySelectorAll('[data-request-close]'), function (b) {
      b.addEventListener('click', function () { dialog.close(); });
    });

    // Any change to the plan or a field means the next attempt is a new request (A1 §2); a failed one is not replayed.
    function renewKey() { state.key = uuid(); state.retry = null; }
    form.addEventListener('input', renewKey);
    form.addEventListener('change', renewKey);
    select.addEventListener('change', updateWhatsApp);

    // The WhatsApp links in the banner and the success view carry the selected plan's message only.
    function updateWhatsApp() {
      var option = select.options[select.selectedIndex];
      var href = option ? option.getAttribute('data-whatsapp') : null;
      // The build gives both links the general-enquiry href, so the markup is valid before this runs (step 8, N4).
      whatsappLinks.forEach(function (a) {
        if (href) a.setAttribute('href', href);
      });
    }

    // ---------- the form ----------

    function val(name) { return el(name).value.trim(); }
    function orNull(name) { var v = val(name); return v === '' ? null : v; }
    function maxOf(name) { var m = el(name).maxLength; return m > 0 ? m : Infinity; }
    function minOf(name) { var m = el(name).minLength; return m > 0 ? m : 0; }

    function validate() {
      var errors = [];
      var push = function (field, code) { errors.push({ field: field, code: code }); };
      if (!select.value) push('plan', 'required');
      ['name', 'business'].forEach(function (f) {
        var v = val(f);
        if (!v) push(f, 'required');
        else if (v.length < minOf(f)) push(f, 'too_short');
        else if (v.length > maxOf(f)) push(f, 'too_long');
      });
      var phone = val('phone');
      var email = val('email');
      if (!phone && !email) { push('phone', 'required'); push('email', 'required'); }
      if (phone) {
        if (phone.length > maxOf('phone')) push('phone', 'too_long');
        else if (!PHONE.test(phone)) push('phone', 'invalid');
      }
      if (email) {
        if (email.length > maxOf('email')) push('email', 'too_long');
        else if (!EMAIL.test(email)) push('email', 'invalid');
      }
      ['city', 'message'].forEach(function (f) {
        if (val(f).length > maxOf(f)) push(f, 'too_long');
      });
      if (!el('consent').checked) push('consent', 'consent_required');
      return errors;
    }

    // Only the fields and codes written in MESSAGES count. Own properties only: a 422 naming "constructor" or any
    // other Object.prototype name is unknown, not a message (step 8, N6).
    function known(field, code) { return Object.hasOwn(MESSAGES, field) && Object.hasOwn(MESSAGES[field], code); }
    function messageFor(field, code) {
      if (!known(field, code)) return null;
      var m = MESSAGES[field][code];
      return typeof m === 'function' ? m(el(field)) : m;
    }

    function clearErrors() {
      FIELDS.forEach(function (f) {
        var p = document.getElementById('request-' + f + '-error');
        if (p) { p.textContent = ''; p.hidden = true; }
        var control = el(f);
        if (control) control.removeAttribute('aria-invalid');
      });
      errorsBox.hidden = true;
      while (errorsBox.firstChild) errorsBox.removeChild(errorsBox.firstChild);
    }

    // errors: [{ field, code }]. Each message at its field (aria-describedby points there), a summary
    // for screen readers, and focus on the first field in error.
    function showFieldErrors(errors) {
      clearErrors();
      var seen = {};
      var list = document.createElement('ul');
      var first = null;
      errors.forEach(function (e) {
        if (seen[e.field]) return;
        seen[e.field] = true;
        var message = messageFor(e.field, e.code) || messageFor(e.field, 'invalid') || TEXT.generic;
        var p = document.getElementById('request-' + e.field + '-error');
        var control = el(e.field);
        if (p) { p.textContent = message; p.hidden = false; }
        if (control) { control.setAttribute('aria-invalid', 'true'); if (!first) first = control; }
        var li = document.createElement('li');
        li.textContent = (Object.hasOwn(LABELS, e.field) ? LABELS[e.field] : e.field) + ': ' + message;
        list.appendChild(li);
      });
      var intro = document.createElement('p');
      intro.textContent = TEXT.summary;
      errorsBox.appendChild(intro);
      errorsBox.appendChild(list);
      errorsBox.hidden = false;
      if (first) first.focus();
    }

    function showBanner(text, retry, focus) {
      bannerText.textContent = text;
      retryBtn.hidden = !retry;
      banner.hidden = false;
      updateWhatsApp();
      if (focus !== false) (retry ? retryBtn : banner).focus();
    }
    function hideBanner() { banner.hidden = true; }
    // A network error, the timeout or a 5xx: the same key is reused on "Reintentar" (the API replays a stored
    // request), and still if the dialog is closed and reopened from the same plan with nothing changed (A2 §2).
    function showRetry(text) { state.retry = text; showBanner(text, true); }

    function setBusy(on) {
      state.inFlight = on;
      submitBtn.disabled = on || state.locked;
      retryBtn.disabled = on;
      submitBtn.textContent = on ? TEXT.sending : submitLabel;
      form.setAttribute('aria-busy', on ? 'true' : 'false');
    }

    function showSuccess() {
      state.succeeded = true;
      form.hidden = true;
      success.hidden = false;
      dialog.setAttribute('aria-labelledby', 'request-success-title');
      updateWhatsApp();
      successTitle.focus();
    }

    // 422 policy_version_mismatch: the page's policy version is stale; nothing is sent again until a reload.
    function lock() {
      state.locked = true;
      submitBtn.disabled = true;
      showBanner(POLICY_MISMATCH, false);
    }

    // ---------- the request ----------

    function parsePlan(value) {
      var p = value.split(':');
      if (p[0] === 'plan' && p.length === 3) return { packageCode: p[1], tierCode: p[2], bundleCode: null };
      if (p[0] === 'bundle' && p.length === 2) return { packageCode: null, tierCode: null, bundleCode: p[1] };
      return { packageCode: null, tierCode: null, bundleCode: null };
    }

    // The contract's shape, in its order. Optional empty values are null; nickname is the honeypot ("").
    function buildBody() {
      var plan = parsePlan(select.value);
      return {
        packageCode: plan.packageCode,
        tierCode: plan.tierCode,
        bundleCode: plan.bundleCode,
        name: val('name'),
        business: val('business'),
        phone: orNull('phone'),
        email: orNull('email'),
        city: orNull('city'),
        message: orNull('message'),
        consent: el('consent').checked,
        policyVersion: String(cfg.privacyPolicyVersion),
        nickname: el('nickname').value
      };
    }

    function submit() {
      if (state.inFlight || state.locked) return;
      clearErrors();
      var errors = validate();
      if (errors.length) { showFieldErrors(errors); return; }
      hideBanner();
      state.retry = null;
      if (!state.key) state.key = uuid();
      var body = JSON.stringify(buildBody());
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, timeoutMs);
      var done = function () { clearTimeout(timer); setBusy(false); };
      setBusy(true);
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': state.key },
        body: body,
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal
      }).then(function (res) {
        return res.text().then(function (text) { return { status: res.status, ok: res.ok, text: text }; });
      }).then(function (r) {
        done();
        try { handleResponse(r); } catch (err) { state.key = uuid(); showBanner(TEXT.generic, false); }
      }, function () {
        done();
        showRetry(TEXT.network);                                  // a network error or the timeout: same key on retry
      });
    }

    function handleResponse(r) {
      if (r.ok) { showSuccess(); return; }                       // any 2xx, including the replayed 200
      if (r.status >= 500) { showRetry(TEXT.server); return; }      // same key on retry
      state.key = uuid();                                         // any other non-2xx: a new key next time
      var json = parseJson(r.text);
      if (r.status === 422 && json && json.fields && json.fields.length) { handleValidation(json.fields); return; }
      if (r.status === 429) { showBanner(TEXT.rateLimited, false); return; }
      showBanner(TEXT.generic, false);                            // 400, 409, 413 and anything unexpected
    }

    function handleValidation(fields) {
      var mapped = [];
      var unknown = false;
      var policy = false;
      fields.forEach(function (f) {
        var field = Object.hasOwn(PLAN_FIELDS, f.field) ? 'plan' : f.field;
        if (f.field === 'policyVersion' && f.code === 'policy_version_mismatch') { policy = true; return; }
        if (known(field, f.code)) mapped.push({ field: field, code: f.code }); else unknown = true;
      });
      if (policy) { lock(); return; }
      if (unknown || !mapped.length) { showBanner(TEXT.generic, false); return; } // unknown_code, unknown_field, …
      showFieldErrors(mapped);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      try { submit(); } catch (err) { setBusy(false); showBanner(TEXT.generic, false); }
    });
    retryBtn.addEventListener('click', function () {
      try { submit(); } catch (err) { setBusy(false); showBanner(TEXT.generic, false); }
    });
  }

  try {
    init();
  } catch (err) {
    // Leave the page as it is: every button is still its WhatsApp link.
  }
})();
