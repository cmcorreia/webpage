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
  var GOATCOUNTER_CODE = 'ccorreia';

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
      '<span>Porto, Portugal &middot; <a class="obf-mail" data-subject="Contact from personal website" href="#">carlos.correia [at] fe.up.pt</a></span>' +
      '<span class="mono">&copy; Carlos M. Correia</span>' +
      '</div>'
    );
  }

  // The mailto link is assembled here; the visible text stays obfuscated ("name [at] domain").
  function fillMailLinks() {
    var addr = ['carlos.correia', 'fe.up.pt'].join(String.fromCharCode(64));
    document.querySelectorAll('a.obf-mail').forEach(function (a) {
      var subject = a.getAttribute('data-subject');
      a.href = 'mailto:' + addr + (subject ? '?subject=' + encodeURIComponent(subject) : '');
    });
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
    fillMailLinks();
  }

  loadCounter();

  // Project and research-topic cards: show how many papers carry each tag; hide the link if none.
  function fillProjectCounts() {
    var links = document.querySelectorAll('a.proj-pubs[data-project], a.proj-pubs[data-topic]');
    if (!links.length) return;
    fetch('data/ccorreiaPublications.bib').then(function (r) { return r.text(); }).then(function (text) {
      var counts = { project: {}, topic: {} };
      text.split(/\n@/).forEach(function (entry) {
        ['project', 'topic'].forEach(function (kind) {
          var m = entry.match(new RegExp('\\n\\s*' + kind + '\\s*=\\s*\\{([^}]*)\\}'));
          if (m) m[1].split(',').forEach(function (p) { p = p.trim().toLowerCase(); if (p) counts[kind][p] = (counts[kind][p] || 0) + 1; });
        });
      });
      links.forEach(function (a) {
        var kind = a.hasAttribute('data-topic') ? 'topic' : 'project';
        var n = counts[kind][a.getAttribute('data-' + kind)] || 0;
        if (!n) { a.hidden = true; return; }
        a.querySelector('span').textContent = 'Publications (' + n + ')';
      });
    }).catch(function () { /* keep plain links */ });
  }
  document.addEventListener('DOMContentLoaded', fillProjectCounts);

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
