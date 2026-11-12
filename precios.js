// Pricing page: the features, by category. Each category is a <details> (only one open at a time); inside,
// the functions are WAI-ARIA tabs in a column, selected by a click, by focus or by a mouse passing over them,
// and each shows its description and its picture. Without this script every function is listed with its text.
(function () {
  var root = document.querySelector('[data-pr-cats]');
  if (!root) return;
  var cats = [].slice.call(root.querySelectorAll('details'));
  try {
    // One open at a time, also where <details name> is not supported yet.
    cats.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) cats.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
    cats.forEach(function (d) {
      var list = d.querySelector('[data-fns]');
      var tabs = [].slice.call(list.querySelectorAll('[data-fn]'));
      var panel = function (t) { return document.getElementById('fn-panel-' + t.getAttribute('data-fn')); };
      list.setAttribute('role', 'tablist');
      list.setAttribute('aria-orientation', 'vertical');
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
      tabs.forEach(function (t) {
        t.addEventListener('click', function () { select(t, false); });
        t.addEventListener('focus', function () { select(t, false); });
        t.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') select(t, false); });
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
    });
  } catch (err) {
    document.documentElement.classList.add('no-precios');
    [].forEach.call(root.querySelectorAll('.pr-fn-panel'), function (p) {
      p.hidden = false;
      p.removeAttribute('role');
      p.removeAttribute('aria-labelledby');
    });
    [].forEach.call(root.querySelectorAll('[data-fns]'), function (l) { l.removeAttribute('role'); });
  }
})();
