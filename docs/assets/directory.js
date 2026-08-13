(function () {
  'use strict';

  var config = window.MMC_DIRECTORY_CONFIG;
  var sourceRecords = window.MMC_DIRECTORY_RECORDS || [];
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character];
    });
  }

  function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function optionMarkup(values, firstLabel) {
    return '<option value="">' + firstLabel + '</option>' + values.map(function (value) {
      return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
    }).join('');
  }

  function geographyOptionMarkup() {
    return '<option value="">All placeholder regions and counties</option>' +
      '<optgroup label="Prototype regions">' + config.regions.map(function (value) {
        return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
      }).join('') + '</optgroup>' +
      '<optgroup label="Prototype counties">' + config.counties.map(function (value) {
        return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
      }).join('') + '</optgroup>';
  }

  function badgeMarkup(record) {
    return '<span class="mmc-role-badge mmc-role-badge--' + slug(record.primaryRole) + '">' + escapeHtml(record.primaryRole) + '</span>' +
      (record.ceoPledgeSigner ? '<span class="mmc-credential-badge"><span aria-hidden="true">✓</span> CEO Pledge Signer</span>' : '');
  }

  function sectorTagMarkup(record) {
    return '<div class="mmc-sector-tags" aria-label="Sectors">' + record.sectors.map(function (sector) {
      return '<span>' + escapeHtml(sector) + '</span>';
    }).join('') + '</div>';
  }

  function detailMarkup(record) {
    return '<dl class="mmc-profile-detail-grid">' +
        '<div><dt>' + escapeHtml(config.representativeLabel) + '</dt><dd>' + escapeHtml(record.representativeName) + '<br><span>' + escapeHtml(record.representativeTitle) + '</span></dd></div>' +
        '<div><dt>Sector' + (record.sectors.length > 1 ? 's' : '') + '</dt><dd>' + record.sectors.map(escapeHtml).join('<br>') + '</dd></div>' +
        '<div><dt>Region</dt><dd>' + escapeHtml(record.region) + '</dd></div>' +
        '<div><dt>Counties served</dt><dd>' + record.countiesServed.map(escapeHtml).join(', ') + '</dd></div>' +
        '<div><dt>Website</dt><dd><a class="mmc-text-link" href="' + escapeHtml(record.website) + '" target="_blank" rel="noopener">Website placeholder <span aria-hidden="true">↗</span></a></dd></div>' +
      '</dl>' +
      '<p class="mmc-profile-description">' + escapeHtml(record.shortDescription) + '</p>';
  }

  function cardMarkup(record, index) {
    var id = 'card-profile-' + index + '-' + slug(record.organizationName);
    return '<article class="mmc-directory-card">' +
        '<div class="mmc-directory-card__top">' +
          '<div class="mmc-logo-placeholder" aria-label="Organization logo placeholder">' + escapeHtml(record.organizationLogo) + '</div>' +
          '<div class="mmc-directory-card__heading"><div class="mmc-badge-row">' + badgeMarkup(record) + '</div><h3>' + escapeHtml(record.organizationName) + '</h3><p>' + escapeHtml(record.region) + ' · ' + escapeHtml(record.countiesServed.join(', ')) + '</p></div>' +
        '</div>' +
        '<p class="mmc-directory-card__representative"><span>' + escapeHtml(config.representativeLabel) + '</span>' + escapeHtml(record.representativeName) + ' · ' + escapeHtml(record.representativeTitle) + '</p>' +
        sectorTagMarkup(record) +
        '<button class="mmc-profile-toggle" type="button" data-profile-toggle aria-expanded="false" aria-controls="' + id + '"><span data-toggle-label>View profile</span><span data-toggle-icon aria-hidden="true">+</span></button>' +
        '<div class="mmc-profile-expansion" id="' + id + '" hidden>' + detailMarkup(record) + '</div>' +
      '</article>';
  }

  function listMarkup(record, index) {
    var id = 'row-profile-' + index + '-' + slug(record.organizationName);
    return '<article class="mmc-directory-row">' +
        '<div class="mmc-directory-row__summary">' +
          '<div class="mmc-logo-placeholder" aria-label="Organization logo placeholder">' + escapeHtml(record.organizationLogo) + '</div>' +
          '<div class="mmc-directory-row__content"><div class="mmc-badge-row">' + badgeMarkup(record) + '</div><h3>' + escapeHtml(record.organizationName) + '</h3>' + sectorTagMarkup(record) + '</div>' +
          '<div class="mmc-directory-row__region"><span>Geography</span>' + escapeHtml(record.region) + '<br>' + escapeHtml(record.countiesServed.join(', ')) + '</div>' +
          '<button class="mmc-row-button" type="button" data-profile-toggle aria-expanded="false" aria-controls="' + id + '"><span data-toggle-label>View details</span><span data-toggle-icon aria-hidden="true">+</span></button>' +
        '</div>' +
        '<div class="mmc-directory-row__expansion" id="' + id + '" hidden>' + detailMarkup(record) + '</div>' +
      '</article>';
  }

  document.querySelectorAll('.mmc-directory').forEach(function (root) {
    /*
     * Mandatory privacy gate. No record can enter search, totals, alphabet,
     * geography, badges, or rendering unless consent is explicitly true.
     */
    var records = sourceRecords.filter(function (record) {
      return record.directoryConsent === true;
    });

    var state = { query: '', role: '', sector: '', geography: '', ceo: false, letter: '' };
    var mode = root.getAttribute('data-directory-mode') || 'cards';
    var resultsMount = root.querySelector('[data-directory-results]');
    var countMount = root.querySelector('[data-result-count]');
    var alphabetMount = root.querySelector('[data-alphabet]');

    root.querySelectorAll('[data-directory-sector]').forEach(function (select) {
      select.innerHTML = optionMarkup(config.sectors, 'All sectors');
    });
    root.querySelectorAll('[data-directory-geography]').forEach(function (select) {
      select.innerHTML = geographyOptionMarkup();
    });

    var alphabet = [''].concat('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
    alphabetMount.innerHTML = alphabet.map(function (letter) {
      return '<button type="button" data-letter="' + letter + '"' + (letter === '' ? ' class="is-active" aria-current="true"' : '') + ' aria-label="' + (letter ? 'Show organizations beginning with ' + letter : 'Show all organizations') + '">' + (letter || 'All') + '</button>';
    }).join('');

    function filteredRecords() {
      var query = state.query.trim().toLowerCase();
      return records.filter(function (record) {
        var haystack = [record.organizationName, record.representativeName, record.representativeTitle, record.primaryRole, record.region]
          .concat(record.sectors, record.countiesServed).join(' ').toLowerCase();
        var geographyMatch = !state.geography || record.region === state.geography || record.countiesServed.includes(state.geography);
        return (!query || haystack.includes(query)) &&
          (!state.role || record.primaryRole === state.role) &&
          (!state.sector || record.sectors.includes(state.sector)) &&
          geographyMatch &&
          (!state.ceo || record.ceoPledgeSigner === true) &&
          (!state.letter || record.organizationName.toUpperCase().startsWith(state.letter));
      }).sort(function (a, b) {
        return a.organizationName.localeCompare(b.organizationName, undefined, { numeric: true });
      });
    }

    function syncControls(visibleRecords) {
      root.querySelectorAll('[data-directory-search]').forEach(function (input) {
        if (input.value !== state.query) input.value = state.query;
      });
      root.querySelectorAll('[data-directory-role]').forEach(function (select) { select.value = state.role; });
      root.querySelectorAll('[data-directory-role-button]').forEach(function (button) {
        var active = button.getAttribute('data-directory-role-button') === state.role;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      root.querySelectorAll('[data-directory-sector]').forEach(function (select) { select.value = state.sector; });
      root.querySelectorAll('[data-directory-geography]').forEach(function (select) { select.value = state.geography; });
      root.querySelectorAll('[data-directory-ceo]').forEach(function (input) { input.checked = state.ceo; });
      root.querySelectorAll('[data-map-region]').forEach(function (control) {
        var active = control.getAttribute('data-map-region') === state.geography;
        control.classList.toggle('is-active', active);
        control.setAttribute('aria-pressed', String(active));
      });
      alphabetMount.querySelectorAll('button').forEach(function (button) {
        var active = button.getAttribute('data-letter') === state.letter;
        button.classList.toggle('is-active', active);
        if (active) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
      });

      var activeCount = [state.query.trim(), state.role, state.sector, state.geography, state.ceo, state.letter].filter(Boolean).length;
      root.querySelectorAll('[data-active-filter-count]').forEach(function (mount) {
        mount.textContent = activeCount + ' active';
      });
      root.querySelectorAll('[data-map-selection]').forEach(function (mount) {
        if (state.geography) {
          mount.textContent = 'Selected geography: ' + state.geography + '. ' + visibleRecords.length + ' demonstration profile' + (visibleRecords.length === 1 ? '' : 's') + ' match all active filters.';
        } else {
          mount.textContent = 'All placeholder geographies are included. ' + visibleRecords.length + ' demonstration profile' + (visibleRecords.length === 1 ? '' : 's') + ' match the current filters.';
        }
      });
    }

    function attachResultEvents() {
      resultsMount.querySelectorAll('[data-profile-toggle]').forEach(function (button) {
        button.addEventListener('click', function () {
          var panel = document.getElementById(button.getAttribute('aria-controls'));
          var open = button.getAttribute('aria-expanded') === 'true';
          button.setAttribute('aria-expanded', String(!open));
          button.querySelector('[data-toggle-icon]').textContent = open ? '+' : '−';
          button.querySelector('[data-toggle-label]').textContent = open ? (mode === 'list' ? 'View details' : 'View profile') : (mode === 'list' ? 'Hide details' : 'Hide profile');
          panel.hidden = open;
        });
      });
    }

    function render() {
      var visibleRecords = filteredRecords();
      countMount.textContent = 'Showing ' + visibleRecords.length + ' of ' + records.length + ' demonstration profiles';
      if (!visibleRecords.length) {
        resultsMount.innerHTML = '<div class="mmc-empty-state"><h3>No demonstration profiles match</h3><p>Try another keyword or clear all active filters to return to the complete consented placeholder dataset.</p><button type="button" data-empty-clear>Reset directory filters</button></div>';
      } else {
        resultsMount.innerHTML = visibleRecords.map(mode === 'list' ? listMarkup : cardMarkup).join('');
        attachResultEvents();
      }
      syncControls(visibleRecords);
    }

    function clearFilters() {
      state = { query: '', role: '', sector: '', geography: '', ceo: false, letter: '' };
      render();
      var searches = Array.prototype.slice.call(root.querySelectorAll('[data-directory-search]'));
      var visibleSearch = searches.find(function (input) { return input.offsetParent !== null; });
      if (visibleSearch) {
        visibleSearch.focus();
      } else if (countMount) {
        countMount.setAttribute('tabindex', '-1');
        countMount.focus();
      }
    }

    root.querySelectorAll('[data-directory-search]').forEach(function (input) {
      input.addEventListener('input', function () { state.query = input.value; render(); });
    });
    root.querySelectorAll('[data-directory-role]').forEach(function (select) {
      select.addEventListener('change', function () { state.role = select.value; render(); });
    });
    root.querySelectorAll('[data-directory-role-button]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.role = button.getAttribute('data-directory-role-button');
        render();
      });
    });
    root.querySelectorAll('[data-directory-sector]').forEach(function (select) {
      select.addEventListener('change', function () { state.sector = select.value; render(); });
    });
    root.querySelectorAll('[data-directory-geography]').forEach(function (select) {
      select.addEventListener('change', function () { state.geography = select.value; render(); });
    });
    root.querySelectorAll('[data-directory-ceo]').forEach(function (input) {
      input.addEventListener('change', function () { state.ceo = input.checked; render(); });
    });
    root.querySelectorAll('[data-map-region]').forEach(function (control) {
      control.addEventListener('click', function () {
        var value = control.getAttribute('data-map-region');
        state.geography = state.geography === value ? '' : value;
        render();
        resultsMount.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
      if (control.tagName.toLowerCase() !== 'button') {
        control.addEventListener('keydown', function (event) {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          control.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
      }
    });
    root.querySelectorAll('[data-clear-filters]').forEach(function (button) {
      button.addEventListener('click', clearFilters);
    });
    resultsMount.addEventListener('click', function (event) {
      if (event.target.closest('[data-empty-clear]')) clearFilters();
    });
    alphabetMount.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-letter]');
      if (!button) return;
      state.letter = button.getAttribute('data-letter');
      render();
    });

    render();
  });
})();
