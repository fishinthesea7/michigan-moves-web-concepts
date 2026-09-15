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

  function sectorOptionMarkup(values) {
    return values.map(function (value, index) {
      var id = 'directory-sector-' + index + '-' + slug(value);
      return '<label for="' + id + '"><input id="' + id + '" type="checkbox" value="' + escapeHtml(value) + '" data-directory-sector-option> <span>' + escapeHtml(value) + '</span></label>';
    }).join('');
  }

  function sectorSelectMarkup(values) {
    return '<option value="">All sectors</option>' + values.map(function (value) {
      return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
    }).join('');
  }

  function badgeMarkup(record) {
    return '<span class="mmc-role-badge mmc-role-badge--' + slug(record.primaryRole) + '">' + escapeHtml(record.primaryRole) + '</span>' +
      (record.ceoPledgeSigner ? '<span class="mmc-credential-badge"><span aria-hidden="true">✓</span> CEO Pledge Signer</span>' : '');
  }

  function sectorTagMarkup(record) {
    if (!record.sectors.length) return '';
    return '<div class="mmc-sector-tags" aria-label="Sectors">' + record.sectors.map(function (sector) {
      return '<span>' + escapeHtml(sector) + '</span>';
    }).join('') + '</div>';
  }

  function safeUrl(value) {
    try { var url = new URL(value, document.baseURI); return /^https?:$/.test(url.protocol) ? url.href : ''; } catch (_) { return ''; }
  }

  function organizationInitials(record) {
    if (record.organizationInitials) return record.organizationInitials;
    return record.organizationName.split(/[\s-]+/).filter(function (word) {
      return word && !['and', 'of', 'the'].includes(word.toLowerCase());
    }).map(function (word) { return word.charAt(0); }).join('').slice(0, 6);
  }

  function organizationLogoMarkup(record) {
    var color = Array.from(record.organizationName).reduce(function (sum, char) { return sum + char.codePointAt(0); }, 0) % 3;
    var logo = record.organizationLogoUrl ? safeUrl(record.organizationLogoUrl) : '';
    var requestedPadding = Number(record.organizationLogoPadding);
    var logoPadding = Number.isFinite(requestedPadding) && requestedPadding >= 0 && requestedPadding <= 20 ? requestedPadding : 8;
    return '<div class="mmc-org-logo mmc-org-logo--' + color + (logo ? ' mmc-org-logo--has-image' : '') + '" style="--mmc-logo-padding:' + logoPadding + 'px" aria-hidden="true"><span>' + escapeHtml(organizationInitials(record)) + '</span>' + (logo ? '<img src="' + escapeHtml(logo) + '" alt="" loading="lazy" decoding="async">' : '') + '</div>';
  }

  function websiteLinkMarkup(website, organizationName, extraClass) {
    var url = website ? safeUrl(website) : '';
    return url ? '<a class="mmc-profile-website mmc-card-website' + (extraClass ? ' ' + extraClass : '') + '" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' + escapeHtml(organizationName) + ' website <span aria-hidden="true">↗</span><span class="mmc-visually-hidden"> (opens in a new tab)</span></a>' : '';
  }

  function workMarkup(record) {
    if (!Array.isArray(record.affiliations) || !record.affiliations.length) {
      return '<p class="mmc-person-work"><strong>' + escapeHtml(record.representativeTitle) + '</strong><span>' + escapeHtml(record.organizationName) + '</span></p>';
    }
    var primary = record.affiliations[0];
    var additional = record.affiliations.slice(1);
    var additionalLabel = 'See ' + additional.length + ' more ' + (additional.length === 1 ? 'role and organization' : 'roles and organizations');
    var primaryMarkup = '<div class="mmc-affiliation mmc-affiliation--primary"><p class="mmc-person-work"><strong>' + escapeHtml(primary.title) + '</strong><span>' + escapeHtml(primary.organizationName) + '</span></p>' + websiteLinkMarkup(primary.website, primary.organizationName, 'mmc-affiliation__website') + '</div>';
    if (!additional.length) return '<div class="mmc-affiliations" aria-label="Titles and organizations">' + primaryMarkup + '</div>';
    var additionalMarkup = additional.map(function (affiliation) {
      return '<div class="mmc-affiliation"><p class="mmc-person-work"><strong>' + escapeHtml(affiliation.title) + '</strong><span>' + escapeHtml(affiliation.organizationName) + '</span></p>' + websiteLinkMarkup(affiliation.website, affiliation.organizationName, 'mmc-affiliation__website') + '</div>';
    }).join('');
    return '<div class="mmc-affiliations" aria-label="Titles and organizations">' + primaryMarkup + '<details class="mmc-affiliations-more"><summary>' + escapeHtml(additionalLabel) + ' <span aria-hidden="true">+</span></summary><div class="mmc-affiliations-more__body"><div class="mmc-affiliations-more__content">' + additionalMarkup + '</div></div></details></div>';
  }

  function websiteMarkup(record) {
    if (Array.isArray(record.affiliations) && record.affiliations.length) return '';
    return websiteLinkMarkup(record.website, record.organizationName, '');
  }

  function cardMarkup(record) {
    return '<article class="mmc-directory-card">' +
        '<div class="mmc-directory-card__top">' +
          organizationLogoMarkup(record) +
          '<div class="mmc-directory-card__heading"><h3>' + escapeHtml(record.representativeName) + '</h3><div class="mmc-badge-row">' + badgeMarkup(record) + '</div></div>' +
        '</div>' +
        workMarkup(record) +
        sectorTagMarkup(record) +
        websiteMarkup(record) +
      '</article>';
  }

  document.querySelectorAll('.mmc-directory').forEach(function (root) {
    /* Privacy gate: only explicit public-directory consent enters any UI state. */
    var records = sourceRecords.filter(function (record) {
      return record.directoryConsent === true;
    });

    var state = { query: '', roles: [], sectors: [], ceo: false };
    var resultsMount = root.querySelector('[data-directory-results]');
    var countMount = root.querySelector('[data-result-count]');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    root.querySelectorAll('[data-directory-jump]').forEach(function (button) {
      button.addEventListener('click', function () {
        var search = root.querySelector('[data-directory-search]');
        if (!search) return;
        search.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
        window.setTimeout(function () { search.focus({ preventScroll: true }); }, 350);
      });
    });

    if (!config || !Array.isArray(config.sectors) || !resultsMount || !countMount) {
      if (resultsMount) {
        resultsMount.innerHTML = '<div class="mmc-empty-state"><h3>The directory could not load</h3><p>Please refresh the page or contact Michigan Moves if the problem continues.</p></div>';
      }
      if (countMount) countMount.textContent = 'Directory unavailable';
      return;
    }

    root.querySelectorAll('[data-directory-sector-options]').forEach(function (mount) {
      mount.innerHTML = sectorOptionMarkup(config.sectors);
    });
    root.querySelectorAll('[data-directory-sector]').forEach(function (select) {
      select.innerHTML = sectorSelectMarkup(config.sectors);
    });

    function filteredRecords() {
      var query = state.query.trim().toLowerCase();
      return records.filter(function (record) {
        var haystack = [record.organizationName, record.representativeName, record.representativeTitle, record.primaryRole]
          .concat(record.sectors).join(' ').toLowerCase();
        if (Array.isArray(record.affiliations)) {
          haystack += ' ' + record.affiliations.map(function (affiliation) {
            return affiliation.title + ' ' + affiliation.organizationName;
          }).join(' ').toLowerCase();
        }
        return (!query || haystack.includes(query)) &&
          (!state.roles.length || state.roles.includes(record.primaryRole)) &&
          (!state.sectors.length || state.sectors.some(function (sector) { return record.sectors.includes(sector); })) &&
          (!state.ceo || record.ceoPledgeSigner === true);
      }).sort(function (a, b) {
        var organizationOrder = a.organizationName.localeCompare(b.organizationName, undefined, { numeric: true });
        return organizationOrder || a.representativeName.localeCompare(b.representativeName, undefined, { numeric: true });
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
      root.querySelectorAll('[data-directory-sector-option]').forEach(function (input) {
        input.checked = state.sectors.includes(input.value);
      });
      root.querySelectorAll('[data-directory-sector]').forEach(function (select) {
        select.value = state.sectors.length === 1 ? state.sectors[0] : '';
      });
      root.querySelectorAll('[data-sector-summary]').forEach(function (summary) {
        if (!state.sectors.length) summary.textContent = 'All sectors';
        else if (state.sectors.length === 1) summary.textContent = state.sectors[0];
        else summary.textContent = state.sectors.length + ' sectors selected';
      });
      root.querySelectorAll('[data-clear-sectors]').forEach(function (button) {
        button.disabled = state.sectors.length === 0;
      });
      root.querySelectorAll('[data-directory-ceo]').forEach(function (input) { input.checked = state.ceo; });

      var activeCount = [state.query.trim(), state.roles.length > 0, state.sectors.length > 0, state.ceo].filter(Boolean).length;
      root.querySelectorAll('[data-clear-filters]').forEach(function (button) {
        button.disabled = activeCount === 0;
      });
    }

    function attachResultEvents() {
      resultsMount.querySelectorAll('.mmc-org-logo img').forEach(function (image) {
        image.addEventListener('error', function () { image.remove(); });
        if (image.complete && !image.naturalWidth) image.remove();
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
      state = { query: '', roles: [], sectors: [], ceo: false };
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
    root.querySelectorAll('[data-directory-sector-option]').forEach(function (input) {
      input.addEventListener('change', function () {
        var index = state.sectors.indexOf(input.value);
        if (input.checked && index === -1) state.sectors.push(input.value);
        if (!input.checked && index !== -1) state.sectors.splice(index, 1);
        render();
      });
    });
    root.querySelectorAll('[data-directory-sector]').forEach(function (select) {
      select.addEventListener('change', function () {
        state.sectors = select.value ? [select.value] : [];
        render();
      });
    });
    root.querySelectorAll('[data-clear-sectors]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.sectors = [];
        render();
      });
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
