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

  // Visit counter: GoatCounter is cookieless and privacy-friendly. Set the site code
  // (the part before .goatcounter.com) to switch it on; leave empty to disable.
  var GOATCOUNTER_CODE = '';

  function loadCounter() {
    if (!GOATCOUNTER_CODE) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', 'https://' + GOATCOUNTER_CODE + '.goatcounter.com/count');
    document.head.appendChild(s);
  }

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

  loadCounter();

  // Video thumbnails link to the video page; with JS they play in place (loaded only on click).
  document.addEventListener('click', function (ev) {
    var thumb = ev.target.closest && ev.target.closest('.video-thumb[data-embed]');
    if (!thumb || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    ev.preventDefault();
    var frame = document.createElement('iframe');
    frame.src = 'https://www.dailymotion.com/embed/video/' + thumb.getAttribute('data-embed') + '?autoplay=1';
    frame.setAttribute('allow', 'autoplay; fullscreen');
    frame.setAttribute('allowfullscreen', '');
    frame.title = thumb.getAttribute('aria-label') || 'Video';
    thumb.innerHTML = '';
    thumb.appendChild(frame);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
