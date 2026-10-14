// Pricing tabs (WAI-ARIA tabs, automatic activation). Without this script every package stays visible.
// If anything here throws, the "js" class is dropped so every package stays listed (step 8, N8).
(function () {
  try {
    var list = document.querySelector('[data-tabs]');
    if (!list) return;
    var tabs = [].slice.call(list.querySelectorAll('[data-tab]'));
    var panel = function (t) { return document.getElementById('panel-' + t.getAttribute('data-tab')); };

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
        panel(t).classList.toggle('is-active', on);
        panel(t).hidden = !on;
      });
      if (focus) tab.focus();
    };

    list.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tab]');
      if (t) select(t, true);
    });
    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (n === undefined) return;
      e.preventDefault();
      select(tabs[(n + tabs.length) % tabs.length], true);
    });

    select(document.getElementById('tab-agenda') || tabs[0], false);
  } catch (err) {
    // Back to the no-JavaScript page: every panel listed, no tab semantics left behind.
    document.documentElement.classList.remove('js');
    var row = document.querySelector('[data-tabs]');
    if (row) row.removeAttribute('role');
    [].forEach.call(document.querySelectorAll('.pricing-panel'), function (p) {
      p.hidden = false;
      p.removeAttribute('role');
      p.removeAttribute('aria-labelledby');
    });
  }
})();
