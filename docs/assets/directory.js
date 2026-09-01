(function () {
  'use strict';

  var config = window.MMC_DIRECTORY_CONFIG;
  var sourceRecords = window.MMC_DIRECTORY_RECORDS || [];

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
    return '<div class="mmc-profile-expansion__intro"><p>' + escapeHtml(record.shortDescription) + '</p></div>' +
      '<dl class="mmc-profile-detail-grid">' +
        '<div><dt>' + escapeHtml(config.representativeLabel) + '</dt><dd>' + escapeHtml(record.representativeName) + '<br><span>' + escapeHtml(record.representativeTitle) + '</span></dd></div>' +
        '<div><dt>Sector' + (record.sectors.length > 1 ? 's' : '') + '</dt><dd>' + record.sectors.map(escapeHtml).join('<br>') + '</dd></div>' +
        '<div><dt>Website</dt><dd><a class="mmc-text-link" href="' + escapeHtml(record.website) + '" target="_blank" rel="noopener">Visit website <span aria-hidden="true">↗</span><span class="mmc-visually-hidden"> (opens in a new tab)</span></a></dd></div>' +
      '</dl>';
  }

  function cardMarkup(record, index) {
    var id = 'card-profile-' + index + '-' + slug(record.organizationName);
    var buttonId = id + '-toggle';
    return '<article class="mmc-directory-card">' +
        '<div class="mmc-directory-card__top">' +
          '<div class="mmc-logo-placeholder" aria-label="Organization logo">' + escapeHtml(record.organizationLogo) + '</div>' +
          '<div class="mmc-directory-card__heading"><div class="mmc-badge-row">' + badgeMarkup(record) + '</div><h3>' + escapeHtml(record.organizationName) + '</h3></div>' +
        '</div>' +
        '<p class="mmc-directory-card__representative"><span>' + escapeHtml(config.representativeLabel) + '</span>' + escapeHtml(record.representativeName) + ' · ' + escapeHtml(record.representativeTitle) + '</p>' +
        sectorTagMarkup(record) +
        '<button class="mmc-profile-toggle" id="' + buttonId + '" type="button" data-profile-toggle aria-expanded="false" aria-controls="' + id + '"><span data-toggle-label>View profile</span><span data-toggle-icon aria-hidden="true">+</span></button>' +
        '<div class="mmc-profile-expansion" id="' + id + '" role="region" aria-labelledby="' + buttonId + '" hidden>' + detailMarkup(record) + '</div>' +
      '</article>';
  }

  document.querySelectorAll('.mmc-directory').forEach(function (root) {
    /* Privacy gate: only explicit public-directory consent enters any UI state. */
    var records = sourceRecords.filter(function (record) {
      return record.directoryConsent === true;
    });

    var state = { query: '', roles: [], sector: '', ceo: false };
    var resultsMount = root.querySelector('[data-directory-results]');
    var countMount = root.querySelector('[data-result-count]');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!config || !Array.isArray(config.sectors) || !resultsMount || !countMount) {
      if (resultsMount) {
        resultsMount.innerHTML = '<div class="mmc-empty-state"><h3>The directory could not load</h3><p>Please refresh the page or contact Michigan Moves if the problem continues.</p></div>';
      }
      if (countMount) countMount.textContent = 'Directory unavailable';
      return;
    }

    root.querySelectorAll('[data-directory-sector]').forEach(function (select) {
      select.innerHTML = optionMarkup(config.sectors, 'All sectors');
    });

    function filteredRecords() {
      var query = state.query.trim().toLowerCase();
      return records.filter(function (record) {
        var haystack = [record.organizationName, record.representativeName, record.representativeTitle, record.primaryRole]
          .concat(record.sectors).join(' ').toLowerCase();
        return (!query || haystack.includes(query)) &&
          (!state.roles.length || state.roles.includes(record.primaryRole)) &&
          (!state.sector || record.sectors.includes(state.sector)) &&
          (!state.ceo || record.ceoPledgeSigner === true);
      }).sort(function (a, b) {
        return a.organizationName.localeCompare(b.organizationName, undefined, { numeric: true });
      });
    }

    function syncControls() {
      root.querySelectorAll('[data-directory-search]').forEach(function (input) {
        if (input.value !== state.query) input.value = state.query;
      });
      root.querySelectorAll('[data-directory-role-button]').forEach(function (button) {
        var active = state.roles.includes(button.getAttribute('data-directory-role-button'));
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      root.querySelectorAll('[data-directory-sector]').forEach(function (select) { select.value = state.sector; });
      root.querySelectorAll('[data-directory-ceo]').forEach(function (input) { input.checked = state.ceo; });

      var activeCount = [state.query.trim(), state.roles.length > 0, state.sector, state.ceo].filter(Boolean).length;
      root.querySelectorAll('[data-clear-filters]').forEach(function (button) {
        button.disabled = activeCount === 0;
      });
    }

    function setProfileState(button, open) {
      var panel = document.getElementById(button.getAttribute('aria-controls'));
      if (!panel) return;
      button.setAttribute('aria-expanded', String(open));
      button.querySelector('[data-toggle-icon]').textContent = open ? '−' : '+';
      button.querySelector('[data-toggle-label]').textContent = open ? 'Hide profile' : 'View profile';
      panel.hidden = !open;
    }

    function attachResultEvents() {
      resultsMount.querySelectorAll('[data-profile-toggle]').forEach(function (button) {
        button.addEventListener('click', function () {
          var shouldOpen = button.getAttribute('aria-expanded') !== 'true';
          resultsMount.querySelectorAll('[data-profile-toggle]').forEach(function (otherButton) {
            setProfileState(otherButton, false);
          });
          if (shouldOpen) setProfileState(button, true);
        });
      });
    }

    function render() {
      resultsMount.setAttribute('aria-busy', 'true');
      var visibleRecords = filteredRecords();
      countMount.textContent = 'Showing ' + visibleRecords.length + ' of ' + records.length + ' profiles';
      if (!visibleRecords.length) {
        resultsMount.innerHTML = '<div class="mmc-empty-state"><h3>No profiles match</h3><p>Try another name or clear the active filters.</p><button type="button" data-empty-clear>Reset directory filters</button></div>';
      } else {
        resultsMount.innerHTML = visibleRecords.map(cardMarkup).join('');
        attachResultEvents();
      }
      syncControls();
      resultsMount.setAttribute('aria-busy', 'false');
    }

    function clearFilters() {
      state = { query: '', roles: [], sector: '', ceo: false };
      render();
      var search = root.querySelector('[data-directory-search]');
      if (search) search.focus();
    }

    root.querySelectorAll('[data-directory-search-jump]').forEach(function (button) {
      button.addEventListener('click', function () {
        var search = root.querySelector('[data-directory-search]');
        var section = root.querySelector('.mmc-directory-command-section');
        if (!search || !section) return;
        section.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        window.setTimeout(function () {
          search.focus({ preventScroll: true });
        }, reducedMotion ? 0 : 350);
      });
    });

    root.querySelectorAll('[data-directory-search]').forEach(function (input) {
      input.addEventListener('input', function () { state.query = input.value; render(); });
    });
    root.querySelectorAll('[data-directory-role-button]').forEach(function (button) {
      button.addEventListener('click', function () {
        var value = button.getAttribute('data-directory-role-button');
        var index = state.roles.indexOf(value);
        if (index === -1) state.roles.push(value); else state.roles.splice(index, 1);
        render();
      });
    });
    root.querySelectorAll('[data-directory-sector]').forEach(function (select) {
      select.addEventListener('change', function () { state.sector = select.value; render(); });
    });
    root.querySelectorAll('[data-directory-ceo]').forEach(function (input) {
      input.addEventListener('change', function () { state.ceo = input.checked; render(); });
    });
    root.querySelectorAll('[data-clear-filters]').forEach(function (button) {
      button.addEventListener('click', clearFilters);
    });
    resultsMount.addEventListener('click', function (event) {
      if (event.target.closest('[data-empty-clear]')) clearFilters();
    });

    render();
  });
})();
