/* Shared nav + footer injection so every page stays in sync from one place. */
(function () {
  'use strict';

  var PAGES = [
    { key: 'about', href: 'index.html', label: 'About' },
    { key: 'cv', href: 'cv.html', label: 'C.V.' },
    { key: 'projects', href: 'projects.html', label: 'Projects' },
    { key: 'rnd', href: 'rnd.html', label: 'R&D' },
    { key: 'publications', href: 'publications.html', label: 'Publications' },
    { key: 'teaching', href: 'teaching.html', label: 'Teaching' },
    { key: 'supervision', href: 'supervision.html', label: 'Supervision' },
    { key: 'work', href: 'work-with-me.html', label: 'Work with me' }
  ];

  function renderNav(current) {
    var links = PAGES.map(function (p) {
      var cls = p.key === current ? ' class="current"' : '';
      return '<a href="' + p.href + '"' + cls + '>' + p.label + '</a>';
    }).join('');
    return (
      '<div class="site-nav-inner">' +
      '<a href="index.html" class="brand">ccorreia<span>.</span>net</a>' +
      '<div class="navlinks">' + links + '</div>' +
      '</div>'
    );
  }

  function renderFooter() {
    return (
      '<div class="site-footer-inner">' +
      '<span>Porto, Portugal &middot; <a href="mailto:ccorreia_at_pm.me">ccorreia_at_pm.me</a></span>' +
      '<span class="mono">&copy; Carlos M. Correia</span>' +
      '</div>'
    );
  }

  function init() {
    var navEl = document.getElementById('site-nav');
    if (navEl) {
      navEl.outerHTML = '<nav class="site-nav">' + renderNav(navEl.getAttribute('data-current')) + '</nav>';
    }
    var footEl = document.getElementById('site-footer');
    if (footEl) {
      footEl.outerHTML = '<footer class="site-footer">' + renderFooter() + '</footer>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
