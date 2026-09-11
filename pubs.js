/* Static publication list renderer.
   Replaces bibtexbrowser.php (PHP, unavailable on GitHub Pages) with a
   client-side parser + renderer for the same .bib file, so publications.html
   keeps working purely from static files: just edit the .bib and push. */
(function () {
  'use strict';

  var ACCENTS = {
    "'": { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', y: 'ý', n: 'ń', c: 'ć', s: 'ś', z: 'ź',
      A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú', N: 'Ń' },
    '`': { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù', A: 'À', E: 'È' },
    '^': { a: 'â', e: 'ê', i: 'î', o: 'ô', u: 'û', A: 'Â', E: 'Ê', I: 'Î', O: 'Ô', U: 'Û' },
    '"': { a: 'ä', e: 'ë', i: 'ï', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü' },
    '~': { n: 'ñ', N: 'Ñ', o: 'õ', a: 'ã', O: 'Õ', A: 'Ã' }
  };

  var TYPE_LABELS = {
    article: 'Journal',
    inproceedings: 'Conference',
    proceedings: 'Conference',
    seminar: 'Seminar',
    phdthesis: 'Thesis',
    techreport: 'Report',
    misc: 'Misc'
  };

  function typeLabel(type) {
    return TYPE_LABELS[type] || (type.charAt(0).toUpperCase() + type.slice(1));
  }

  // ---- BibTeX parsing --------------------------------------------------

  function stripComments(text) {
    return text.split('\n').filter(function (line) {
      return !/^\s*%/.test(line);
    }).join('\n');
  }

  function parseBibtex(text) {
    text = stripComments(text);
    var entries = [];
    var i = 0;
    var n = text.length;
    while (i < n) {
      var at = text.indexOf('@', i);
      if (at === -1) break;
      var brace = text.indexOf('{', at);
      if (brace === -1) break;
      var type = text.slice(at + 1, brace).trim().toLowerCase();
      var comma = text.indexOf(',', brace);
      if (comma === -1) break;
      var key = text.slice(brace + 1, comma).trim();

      // find matching closing brace for the entry, tracking nested braces
      var depth = 1;
      var j = brace + 1;
      while (j < n && depth > 0) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        j++;
      }
      var body = text.slice(comma + 1, j - 1);
      var fields = parseFields(body);
      entries.push({ type: type, key: key, fields: fields });
      i = j;
    }
    return entries;
  }

  function parseFields(body) {
    var fields = {};
    var i = 0;
    var n = body.length;
    while (i < n) {
      // skip whitespace/commas
      while (i < n && /[\s,]/.test(body[i])) i++;
      if (i >= n) break;
      var eq = body.indexOf('=', i);
      if (eq === -1) break;
      var name = body.slice(i, eq).trim().toLowerCase();
      var k = eq + 1;
      while (k < n && /\s/.test(body[k])) k++;
      var value = '';
      if (body[k] === '{') {
        var depth = 1;
        var start = k + 1;
        k++;
        while (k < n && depth > 0) {
          if (body[k] === '{') depth++;
          else if (body[k] === '}') depth--;
          k++;
        }
        value = body.slice(start, k - 1);
      } else if (body[k] === '"') {
        var s2 = k + 1;
        k++;
        while (k < n && body[k] !== '"') k++;
        value = body.slice(s2, k);
        k++;
      } else {
        var s3 = k;
        while (k < n && body[k] !== ',') k++;
        value = body.slice(s3, k).trim();
      }
      fields[name] = value;
      i = k;
    }
    return fields;
  }

  // ---- LaTeX -> text cleanup --------------------------------------------

  function cleanLatex(str) {
    if (!str) return '';
    str = str.replace(/\\i\b/g, 'i').replace(/\\j\b/g, 'j').replace(/\\ss\b/g, 'ß');
    str = str.replace(/\\c\s?\{?([a-zA-Z])\}?/g, function (m, c) {
      return c === 'c' ? 'ç' : (c === 'C' ? 'Ç' : c);
    });
    str = str.replace(/\\(['`^"~])\s?\{?([a-zA-Z])\}?/g, function (m, accent, letter) {
      var map = ACCENTS[accent];
      return (map && map[letter]) || letter;
    });
    str = str.replace(/\\&/g, '&')
      .replace(/\\%/g, '%')
      .replace(/\\#/g, '#')
      .replace(/\\\[/g, '[')
      .replace(/\\\]/g, ']')
      .replace(/---/g, '—')
      .replace(/--/g, '–')
      .replace(/~/g, ' ')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return str;
  }

  // ---- Author formatting --------------------------------------------

  function formatAuthors(raw) {
    if (!raw) return '';
    var parts = raw.split(/\s+and\s+/i);
    if (parts.length === 1) {
      var commaCount = (raw.match(/,/g) || []).length;
      if (commaCount >= 2) {
        parts = raw.split(',');
      }
    }
    var names = parts.map(function (p) { return cleanLatex(p.trim()); }).filter(Boolean);
    var joined = names.join('; ');
    return joined.replace(/Correia/g, '<strong>Correia</strong>');
  }

  // ---- Venue / links --------------------------------------------

  function venueFor(entry) {
    var f = entry.fields;
    switch (entry.type) {
      case 'article': return cleanLatex(f.journal);
      case 'inproceedings':
      case 'proceedings': return cleanLatex(f.booktitle);
      case 'techreport': return cleanLatex(f.institution);
      case 'phdthesis': return cleanLatex(f.school);
      default: return cleanLatex(f.booktitle || f.journal || f.howpublished || '');
    }
  }

  function detailsFor(entry) {
    var f = entry.fields;
    var bits = [];
    if (f.volume) bits.push(f.volume + (f.number ? '(' + f.number + ')' : ''));
    if (f.pages) bits.push('pp. ' + cleanLatex(f.pages));
    return bits.join(', ');
  }

  function linksFor(entry) {
    var f = entry.fields;
    var links = [];
    var doi = f.doi || f.Doi;
    if (doi) links.push('<a href="https://doi.org/' + encodeURI(doi.replace(/^doi:\s*/i, '')) + '" target="_blank" rel="noopener">DOI</a>');
    if (f.eprint && /arxiv/i.test(f.archiveprefix || '')) {
      links.push('<a href="https://arxiv.org/abs/' + encodeURIComponent(f.eprint) + '" target="_blank" rel="noopener">arXiv</a>');
    }
    if (f.pdf) links.push('<a href="' + f.pdf + '" target="_blank" rel="noopener">PDF</a>');
    var url = f.url || f.URL || f.Url;
    if (url && !doi) links.push('<a href="' + url + '" target="_blank" rel="noopener">link</a>');
    return links.join(' &middot; ');
  }

  // ---- Rendering --------------------------------------------

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }

  function renderEntry(entry, num) {
    var f = entry.fields;
    var title = cleanLatex(f.title);
    var authors = formatAuthors(f.author);
    var venue = venueFor(entry);
    var details = detailsFor(entry);
    var month = f.month ? cleanLatex(f.month) + ' ' : '';
    var year = f.year || '';
    var links = linksFor(entry);
    var type = typeLabel(entry.type);

    var searchText = (cleanLatex(f.author) + ' ' + title + ' ' + venue).toLowerCase();

    var html = '<li class="pub-entry" data-year="' + escapeAttr(year) + '" data-type="' +
      escapeAttr(type) + '" data-search="' + escapeAttr(searchText) + '">';
    html += '<span class="pub-num">' + num + '.</span> ';
    html += '<span class="pub-authors">' + authors + '</span>. ';
    html += '<span class="pub-title">' + title + '</span>';
    if (venue) html += '. <span class="pub-venue">' + venue + '</span>';
    if (details) html += ', ' + details;
    html += ' <span class="pub-year">(' + month + year + ')</span>';
    html += ' <span class="pub-type">' + type + '</span>';
    if (links) html += '<div class="pub-links">' + links + '</div>';
    html += '</li>';
    return html;
  }

  var DEFAULT_TYPE = 'Journal';

  function renderFilterBar(years, types) {
    var html = '<div class="pubs-filters">';
    html += '<input type="search" class="pubs-filter-search" placeholder="Search title or author&hellip;">';
    html += '<select class="pubs-filter-year"><option value="" data-label="All years">All years</option>';
    years.forEach(function (y) { html += '<option value="' + y + '" data-label="' + y + '">' + y + '</option>'; });
    html += '</select>';
    html += '<select class="pubs-filter-type"><option value="" data-label="All types">All types</option>';
    types.forEach(function (t) {
      var sel = t === DEFAULT_TYPE ? ' selected' : '';
      html += '<option value="' + escapeAttr(t) + '" data-label="' + escapeAttr(t) + '"' + sel + '>' + t + '</option>';
    });
    html += '</select>';
    html += '<span class="pubs-filter-count"></span>';
    html += '</div>';
    return html;
  }

  function updateFacetCounts(root, search, year, type) {
    var entries = root.querySelectorAll('.pub-entry');
    var typeCounts = {}, allTypesCount = 0;
    var yearCounts = {}, allYearsCount = 0;

    entries.forEach(function (li) {
      var y = li.getAttribute('data-year');
      var t = li.getAttribute('data-type');
      var s = li.getAttribute('data-search');
      if (search && s.indexOf(search) === -1) return;

      if (!year || y === year) {
        typeCounts[t] = (typeCounts[t] || 0) + 1;
        allTypesCount++;
      }
      if (!type || t === type) {
        yearCounts[y] = (yearCounts[y] || 0) + 1;
        allYearsCount++;
      }
    });

    Array.prototype.forEach.call(root.querySelector('.pubs-filter-type').options, function (opt) {
      var label = opt.getAttribute('data-label');
      var c = opt.value === '' ? allTypesCount : (typeCounts[opt.value] || 0);
      opt.textContent = label + ' (' + c + ')';
    });
    Array.prototype.forEach.call(root.querySelector('.pubs-filter-year').options, function (opt) {
      var label = opt.getAttribute('data-label');
      var c = opt.value === '' ? allYearsCount : (yearCounts[opt.value] || 0);
      opt.textContent = label + ' (' + c + ')';
    });
  }

  function applyFilters(root) {
    var search = root.querySelector('.pubs-filter-search').value.trim().toLowerCase();
    var year = root.querySelector('.pubs-filter-year').value;
    var type = root.querySelector('.pubs-filter-type').value;
    var visible = 0;

    root.querySelectorAll('.pub-entry').forEach(function (li) {
      var matches =
        (!year || li.getAttribute('data-year') === year) &&
        (!type || li.getAttribute('data-type') === type) &&
        (!search || li.getAttribute('data-search').indexOf(search) !== -1);
      li.hidden = !matches;
      if (matches) visible++;
    });

    root.querySelectorAll('.pubs-year-group').forEach(function (section) {
      var anyVisible = section.querySelector('.pub-entry:not([hidden])');
      section.hidden = !anyVisible;
    });

    var count = root.querySelector('.pubs-filter-count');
    var noResults = root.querySelector('.pubs-no-results');
    if (visible === 0) {
      if (!noResults) {
        noResults = document.createElement('p');
        noResults.className = 'pubs-no-results';
        noResults.textContent = 'No publications match your filters.';
        root.querySelector('.pubs-list').appendChild(noResults);
      }
    } else if (noResults) {
      noResults.remove();
    }
    count.textContent = visible + (visible === 1 ? ' publication' : ' publications');

    updateFacetCounts(root, search, year, type);
  }

  function render(container, entries) {
    entries = entries.filter(function (e) { return e.fields.year; });
    entries.sort(function (a, b) {
      return (b.fields.year || 0) - (a.fields.year || 0);
    });

    var byYear = {};
    var order = [];
    var typesPresent = {};
    entries.forEach(function (e) {
      var y = e.fields.year;
      if (!byYear[y]) { byYear[y] = []; order.push(y); }
      byYear[y].push(e);
      typesPresent[typeLabel(e.type)] = true;
    });

    var total = entries.length;
    var num = total;
    var listHtml = '<div class="pubs-list">';
    order.forEach(function (year) {
      listHtml += '<section class="pubs-year-group" data-year="' + year + '">';
      listHtml += '<h3 class="pubs-year">' + year + '</h3><ol class="pubs-year-list" reversed start="' + num + '">';
      byYear[year].forEach(function (e) {
        listHtml += renderEntry(e, num);
        num--;
      });
      listHtml += '</ol></section>';
    });
    listHtml += '</div>';

    container.innerHTML = renderFilterBar(order, Object.keys(typesPresent).sort()) + listHtml;

    var updateNow = function () { applyFilters(container); };
    container.querySelector('.pubs-filter-search').addEventListener('input', updateNow);
    container.querySelector('.pubs-filter-year').addEventListener('change', updateNow);
    container.querySelector('.pubs-filter-type').addEventListener('change', updateNow);
    updateNow();
  }

  function init() {
    var container = document.getElementById('pubs-list');
    if (!container) return;
    var bibUrl = container.getAttribute('data-bib') || 'data/ccorreiaPublications.bib';
    fetch(bibUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (text) {
        var entries = parseBibtex(text);
        render(container, entries);
      })
      .catch(function (err) {
        container.innerHTML = '<p class="pubs-error">Could not load publications (' + err.message +
          '). See the <a href="' + bibUrl + '">raw BibTeX file</a>.</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
