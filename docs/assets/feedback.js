(function () {
  'use strict';

  var STORAGE_KEY = 'mmcPrototypeFeedbackV1';
  var DRAFT_STORAGE_KEY = 'mmcPrototypeFeedbackDraftsV1';
  var SHARED_CACHE_KEY = 'mmcPrototypeSharedFeedbackCacheV1';
  var CHANGE_EVENT = 'mmc-feedback-changed';
  var fallbackStore = { version: 1, pages: {} };
  var fallbackDraftStore = { version: 1, pages: {} };
  var fallbackSharedStore = { version: 1, pages: {} };
  var sharedConfig = normalizeSharedConfig(window.MMC_FEEDBACK_CONFIG);
  var sharedPages = [];
  var sharedPollTimer = null;
  var sharedRequestInFlight = null;
  var sharedStatus = sharedConfig.enabled ? 'connecting' : 'local';
  var sharedStatusMessage = '';

  function normalizeSharedConfig(value) {
    var config = value && typeof value === 'object' ? value : {};
    var url = typeof config.supabaseUrl === 'string'
      ? config.supabaseUrl.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/$/, '')
      : '';
    var key = typeof config.supabasePublishableKey === 'string' ? config.supabasePublishableKey.trim() : '';
    var table = typeof config.table === 'string' && /^[a-z0-9_]+$/i.test(config.table) ? config.table : 'prototype_comments';
    var interval = Number(config.pollIntervalMs);
    var validHostedUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url);
    var validLocalTestUrl = config.allowLocalTesting === true && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/i.test(url);
    return {
      enabled: (validHostedUrl || validLocalTestUrl) && /^sb_publishable_/.test(key),
      url: url,
      key: key,
      table: table,
      pollIntervalMs: Number.isFinite(interval) ? Math.max(10000, interval) : 15000
    };
  }

  function cleanStore(value) {
    if (!value || typeof value !== 'object') return { version: 1, pages: {} };
    if (!value.pages || typeof value.pages !== 'object') value.pages = {};
    value.version = 1;
    return value;
  }

  function readStore() {
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      fallbackStore = cleanStore(saved ? JSON.parse(saved) : fallbackStore);
    } catch (error) {
      fallbackStore = cleanStore(fallbackStore);
    }
    return fallbackStore;
  }

  function writeStore(store, pageId) {
    fallbackStore = cleanStore(store);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackStore));
    } catch (error) {
      // The in-memory fallback keeps the interface usable when storage is blocked.
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { pageId: pageId } }));
  }

  function readSharedStore() {
    try {
      var saved = window.localStorage.getItem(SHARED_CACHE_KEY);
      fallbackSharedStore = cleanStore(saved ? JSON.parse(saved) : fallbackSharedStore);
    } catch (error) {
      fallbackSharedStore = cleanStore(fallbackSharedStore);
    }
    return fallbackSharedStore;
  }

  function writeSharedStore(store, pageId) {
    fallbackSharedStore = cleanStore(store);
    try {
      window.localStorage.setItem(SHARED_CACHE_KEY, JSON.stringify(fallbackSharedStore));
    } catch (error) {
      // The in-memory shared cache still keeps the current page synchronized.
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { pageId: pageId } }));
  }

  function readDraftStore() {
    try {
      var saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      fallbackDraftStore = cleanStore(saved ? JSON.parse(saved) : fallbackDraftStore);
    } catch (error) {
      fallbackDraftStore = cleanStore(fallbackDraftStore);
    }
    return fallbackDraftStore;
  }

  function getDraft(pageId) {
    var draft = readDraftStore().pages[pageId];
    if (!draft || typeof draft !== 'object' || typeof draft.text !== 'string') return null;
    return {
      commentId: typeof draft.commentId === 'string' ? draft.commentId : null,
      text: draft.text,
      xPercent: Number.isFinite(Number(draft.xPercent)) ? Number(draft.xPercent) : 50,
      y: Number.isFinite(Number(draft.y)) ? Number(draft.y) : 80,
      updatedAt: typeof draft.updatedAt === 'string' ? draft.updatedAt : ''
    };
  }

  function saveDraft(pageId, values) {
    var store = readDraftStore();
    store.pages[pageId] = {
      commentId: typeof values.commentId === 'string' ? values.commentId : null,
      text: typeof values.text === 'string' ? values.text : '',
      xPercent: Number.isFinite(Number(values.xPercent)) ? Number(values.xPercent) : 50,
      y: Number.isFinite(Number(values.y)) ? Number(values.y) : 80,
      updatedAt: new Date().toISOString()
    };
    fallbackDraftStore = cleanStore(store);
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(fallbackDraftStore));
    } catch (error) {
      // The in-memory fallback keeps draft recovery available for this page view.
    }
  }

  function clearDraft(pageId, commentId) {
    var store = readDraftStore();
    var existing = store.pages[pageId];
    if (!existing) return;
    if (typeof commentId === 'string' && existing.commentId !== commentId) return;
    delete store.pages[pageId];
    fallbackDraftStore = cleanStore(store);
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(fallbackDraftStore));
    } catch (error) {
      // Keep the cleared in-memory state when storage is blocked.
    }
  }

  function ensurePage(store, pageId) {
    if (!store.pages[pageId] || typeof store.pages[pageId] !== 'object') {
      store.pages[pageId] = { nextNumber: 1, comments: [] };
    }
    var page = store.pages[pageId];
    if (!Array.isArray(page.comments)) page.comments = [];
    var highestNumber = page.comments.reduce(function (highest, comment) {
      return Math.max(highest, Number(comment.number) || 0);
    }, 0);
    if (!Number.isFinite(page.nextNumber) || page.nextNumber <= highestNumber) {
      page.nextNumber = highestNumber + 1;
    }
    return page;
  }

  function commentsFromPage(page) {
    return page.comments
      .filter(function (comment) {
        return comment && typeof comment.id === 'string' && typeof comment.text === 'string';
      })
      .slice()
      .sort(function (a, b) { return a.number - b.number; });
  }

  function getLocalComments(pageId) {
    return commentsFromPage(ensurePage(readStore(), pageId));
  }

  function getComments(pageId) {
    var source = sharedConfig.enabled ? readSharedStore() : readStore();
    return commentsFromPage(ensurePage(source, pageId));
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'comment-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function createLocalComment(pageId, values) {
    var store = readStore();
    var page = ensurePage(store, pageId);
    var now = new Date().toISOString();
    var comment = {
      id: makeId(),
      number: page.nextNumber,
      text: values.text.trim(),
      xPercent: values.xPercent,
      y: values.y,
      createdAt: now,
      updatedAt: now
    };
    page.nextNumber += 1;
    page.comments.push(comment);
    writeStore(store, pageId);
    return comment;
  }

  function updateLocalComment(pageId, commentId, values) {
    var store = readStore();
    var page = ensurePage(store, pageId);
    var comment = page.comments.find(function (item) { return item.id === commentId; });
    if (!comment) return null;
    if (typeof values.text === 'string') comment.text = values.text.trim();
    if (Number.isFinite(values.xPercent)) comment.xPercent = values.xPercent;
    if (Number.isFinite(values.y)) comment.y = values.y;
    comment.updatedAt = new Date().toISOString();
    writeStore(store, pageId);
    return comment;
  }

  function deleteLocalComment(pageId, commentId) {
    var store = readStore();
    var page = ensurePage(store, pageId);
    var originalLength = page.comments.length;
    page.comments = page.comments.filter(function (item) { return item.id !== commentId; });
    if (page.comments.length === originalLength) return false;
    if (!page.comments.length) delete store.pages[pageId];
    writeStore(store, pageId);
    return true;
  }

  function registerSharedPage(pageId) {
    if (typeof pageId !== 'string' || sharedPages.indexOf(pageId) !== -1) return;
    sharedPages.push(pageId);
  }

  function sharedStatusText() {
    if (!sharedConfig.enabled) return 'Shared comments are awaiting database setup. Comments currently remain in this browser.';
    if (sharedStatus === 'connecting') return 'Connecting to shared comments…';
    if (sharedStatus === 'error') return sharedStatusMessage || 'Shared comments could not be reached. Showing the most recent saved copy.';
    return 'Saved comments sync across devices. Unfinished text remains in this browser until Save is selected.';
  }

  function renderSharedStatus() {
    document.querySelectorAll('[data-feedback-sync-status]').forEach(function (element) {
      element.textContent = sharedStatusText();
      element.classList.toggle('is-error', sharedStatus === 'error');
      element.classList.toggle('is-ready', sharedStatus === 'ready');
    });
  }

  function setSharedStatus(status, message) {
    sharedStatus = status;
    sharedStatusMessage = message || '';
    renderSharedStatus();
  }

  function mapSharedRow(row) {
    return {
      id: String(row.id),
      number: Number(row.comment_number),
      text: String(row.text || ''),
      xPercent: Number(row.x_percent),
      y: Number(row.y),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  function sharedHeaders(prefer) {
    var headers = {
      apikey: sharedConfig.key,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
    if (prefer) headers.Prefer = prefer;
    return headers;
  }

  async function sharedRequest(path, options) {
    var request = options || {};
    var response;
    try {
      response = await window.fetch(sharedConfig.url + '/rest/v1/' + path, {
        method: request.method || 'GET',
        headers: sharedHeaders(request.prefer),
        body: request.body ? JSON.stringify(request.body) : undefined,
        cache: 'no-store'
      });
    } catch (error) {
      throw new Error('Shared comments are temporarily unreachable. Your unfinished text is still saved in this browser.');
    }

    var responseText = await response.text();
    var data = null;
    if (responseText) {
      try { data = JSON.parse(responseText); } catch (error) { data = null; }
    }
    if (!response.ok) {
      var detail = data && (data.message || data.hint || data.details);
      throw new Error(detail || 'The shared comment service returned an error.');
    }
    return data;
  }

  function replaceSharedRows(rows) {
    var store = { version: 1, pages: {} };
    sharedPages.forEach(function (pageId) { ensurePage(store, pageId); });
    (Array.isArray(rows) ? rows : []).forEach(function (row) {
      var pageId = String(row.page_id || '');
      if (!pageId) return;
      ensurePage(store, pageId).comments.push(mapSharedRow(row));
    });
    Object.keys(store.pages).forEach(function (pageId) { ensurePage(store, pageId); });
    writeSharedStore(store, 'all');
  }

  function upsertSharedRow(row) {
    var pageId = String(row.page_id || '');
    var comment = mapSharedRow(row);
    var store = readSharedStore();
    var page = ensurePage(store, pageId);
    var index = page.comments.findIndex(function (item) { return item.id === comment.id; });
    if (index === -1) page.comments.push(comment);
    else page.comments[index] = comment;
    ensurePage(store, pageId);
    writeSharedStore(store, pageId);
    return comment;
  }

  async function refreshSharedComments() {
    if (!sharedConfig.enabled) {
      setSharedStatus('local');
      return getComments(sharedPages[0] || '');
    }
    if (sharedRequestInFlight) return sharedRequestInFlight;

    if (sharedStatus !== 'ready') setSharedStatus('connecting');
    var fields = 'id,page_id,comment_number,text,x_percent,y,created_at,updated_at';
    sharedRequestInFlight = sharedRequest(
      encodeURIComponent(sharedConfig.table) + '?select=' + fields + '&order=page_id.asc,comment_number.asc&limit=1000'
    ).then(function (rows) {
      replaceSharedRows(rows);
      setSharedStatus('ready');
      return rows;
    }).catch(function (error) {
      setSharedStatus('error', error.message);
      throw error;
    }).finally(function () {
      sharedRequestInFlight = null;
    });
    return sharedRequestInFlight;
  }

  function startSharedSync() {
    renderSharedStatus();
    if (!sharedConfig.enabled) return;
    refreshSharedComments().catch(function () { /* Status is shown in the interface. */ });
    if (!sharedPollTimer) {
      sharedPollTimer = window.setInterval(function () {
        if (document.visibilityState === 'visible') {
          refreshSharedComments().catch(function () { /* Status is shown in the interface. */ });
        }
      }, sharedConfig.pollIntervalMs);
      window.addEventListener('focus', function () {
        refreshSharedComments().catch(function () { /* Status is shown in the interface. */ });
      });
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
          refreshSharedComments().catch(function () { /* Status is shown in the interface. */ });
        }
      });
    }
  }

  async function createSharedComment(pageId, values) {
    var fields = 'id,page_id,comment_number,text,x_percent,y,created_at,updated_at';
    var rows = await sharedRequest(
      encodeURIComponent(sharedConfig.table) + '?select=' + fields,
      {
        method: 'POST',
        prefer: 'return=representation',
        body: {
          page_id: pageId,
          text: values.text.trim().slice(0, 5000),
          x_percent: Math.max(0, Math.min(100, Number(values.xPercent))),
          y: Math.max(0, Math.min(100000, Number(values.y)))
        }
      }
    );
    if (!Array.isArray(rows) || !rows[0]) throw new Error('The shared comment was not returned after saving.');
    setSharedStatus('ready');
    clearDraft(pageId);
    return upsertSharedRow(rows[0]);
  }

  async function updateSharedComment(pageId, commentId, values) {
    var fields = 'id,page_id,comment_number,text,x_percent,y,created_at,updated_at';
    var body = {};
    if (typeof values.text === 'string') body.text = values.text.trim().slice(0, 5000);
    if (Number.isFinite(values.xPercent)) body.x_percent = Math.max(0, Math.min(100, values.xPercent));
    if (Number.isFinite(values.y)) body.y = Math.max(0, Math.min(100000, values.y));
    var rows = await sharedRequest(
      encodeURIComponent(sharedConfig.table) + '?id=eq.' + encodeURIComponent(commentId) + '&page_id=eq.' + encodeURIComponent(pageId) + '&select=' + fields,
      { method: 'PATCH', prefer: 'return=representation', body: body }
    );
    if (!Array.isArray(rows) || !rows[0]) throw new Error('The shared comment could not be found for editing.');
    setSharedStatus('ready');
    clearDraft(pageId, commentId);
    return upsertSharedRow(rows[0]);
  }

  async function deleteSharedComment(pageId, commentId) {
    var rows = await sharedRequest(
      encodeURIComponent(sharedConfig.table) + '?id=eq.' + encodeURIComponent(commentId) + '&page_id=eq.' + encodeURIComponent(pageId) + '&select=id,page_id',
      { method: 'DELETE', prefer: 'return=representation' }
    );
    if (!Array.isArray(rows) || !rows[0]) throw new Error('The shared comment could not be found for deletion.');
    clearDraft(pageId, commentId);
    var store = readSharedStore();
    var page = ensurePage(store, pageId);
    page.comments = page.comments.filter(function (item) { return item.id !== commentId; });
    writeSharedStore(store, pageId);
    setSharedStatus('ready');
    return true;
  }

  async function createComment(pageId, values) {
    if (!sharedConfig.enabled) {
      clearDraft(pageId);
      return createLocalComment(pageId, values);
    }
    return createSharedComment(pageId, values);
  }

  async function updateComment(pageId, commentId, values) {
    if (!sharedConfig.enabled) {
      clearDraft(pageId, commentId);
      return updateLocalComment(pageId, commentId, values);
    }
    return updateSharedComment(pageId, commentId, values);
  }

  async function deleteComment(pageId, commentId) {
    if (!sharedConfig.enabled) {
      clearDraft(pageId, commentId);
      return deleteLocalComment(pageId, commentId);
    }
    return deleteSharedComment(pageId, commentId);
  }

  async function publishLocalComments(pageId) {
    if (!sharedConfig.enabled) throw new Error('Shared comments are not configured yet.');
    var comments = getLocalComments(pageId);
    var published = 0;
    for (var index = 0; index < comments.length; index += 1) {
      var comment = comments[index];
      await createSharedComment(pageId, {
        text: comment.text,
        xPercent: comment.xPercent,
        y: comment.y
      });
      deleteLocalComment(pageId, comment.id);
      published += 1;
    }
    await refreshSharedComments();
    return published;
  }

  function renderMigrationControl(container, pageId) {
    if (!container) return;
    var localComments = getLocalComments(pageId);
    container.hidden = !sharedConfig.enabled || !localComments.length;
    if (container.hidden) return;
    var copy = container.querySelector('[data-feedback-migration-copy]');
    var migrationButton = container.querySelector('[data-feedback-migration-button]');
    var countLabel = localComments.length === 1 ? '1 browser-only comment' : localComments.length + ' browser-only comments';
    copy.textContent = countLabel + ' can be added to the shared review.';
    migrationButton.textContent = 'Publish to shared review';
    migrationButton.disabled = false;
    if (migrationButton.getAttribute('data-feedback-migration-bound') === 'true') return;
    migrationButton.setAttribute('data-feedback-migration-bound', 'true');
    migrationButton.addEventListener('click', async function () {
      migrationButton.disabled = true;
      migrationButton.textContent = 'Publishing…';
      try {
        await publishLocalComments(pageId);
        container.hidden = true;
      } catch (error) {
        copy.textContent = error.message || 'The browser-only comments could not be published.';
        copy.classList.add('is-error');
        migrationButton.textContent = 'Try again';
        migrationButton.disabled = false;
        setSharedStatus('error', error.message);
      }
    });
  }

  function subscribe(callback) {
    window.addEventListener(CHANGE_EVENT, callback);
    window.addEventListener('storage', function (event) {
      if (event.key === STORAGE_KEY || event.key === SHARED_CACHE_KEY) callback();
    });
  }

  function button(label, className) {
    var element = document.createElement('button');
    element.type = 'button';
    element.className = className || '';
    element.textContent = label;
    return element;
  }

  function initPrototypeFeedback(pageId, pageTitle) {
    registerSharedPage(pageId);
    var layer = document.createElement('div');
    layer.className = 'mmc-feedback-layer';
    layer.setAttribute('data-preview-only', '');
    document.body.appendChild(layer);

    var drawer = document.createElement('aside');
    drawer.className = 'mmc-feedback-drawer';
    drawer.id = 'mmc-feedback-drawer';
    drawer.setAttribute('aria-label', 'Prototype feedback guide');
    drawer.setAttribute('data-preview-only', '');
    drawer.innerHTML = '' +
      '<button class="mmc-feedback-drawer__toggle" type="button" aria-expanded="false" aria-controls="mmc-feedback-drawer-panel">' +
        '<span class="mmc-feedback-drawer__arrow" aria-hidden="true">‹</span>' +
        '<span class="mmc-visually-hidden">Open feedback guide</span>' +
      '</button>' +
      '<div class="mmc-feedback-drawer__panel" id="mmc-feedback-drawer-panel">' +
        '<div class="mmc-feedback-drawer__header">' +
          '<p>Prototype feedback</p>' +
          '<strong>' + pageTitle + '</strong>' +
        '</div>' +
        '<div class="mmc-feedback-drawer__scroll">' +
          '<p class="mmc-feedback-drawer__instructions"><strong>Right-click or double-click</strong> non-interactive page content to add a pinned comment. Drag the editor header to move it, then select Save.</p>' +
          '<p class="mmc-feedback-drawer__storage" data-feedback-sync-status>Connecting to shared comments…</p>' +
          '<div class="mmc-feedback-migration" data-feedback-migration hidden>' +
            '<p data-feedback-migration-copy></p>' +
            '<button type="button" data-feedback-migration-button>Publish to shared review</button>' +
          '</div>' +
          '<div class="mmc-feedback-drawer__comments">' +
            '<h2>Page comments <span data-feedback-drawer-count>0</span></h2>' +
            '<ol data-feedback-drawer-list></ol>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(drawer);

    var toggle = drawer.querySelector('.mmc-feedback-drawer__toggle');
    var toggleLabel = toggle.querySelector('.mmc-visually-hidden');
    var toggleArrow = toggle.querySelector('.mmc-feedback-drawer__arrow');
    var activeEditor = null;
    var hintTimer = null;

    function setDrawer(open) {
      drawer.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggleLabel.textContent = open ? 'Close feedback guide' : 'Open feedback guide';
      toggleArrow.textContent = open ? '›' : '‹';
    }

    toggle.addEventListener('click', function () {
      if (hintTimer) window.clearTimeout(hintTimer);
      setDrawer(!drawer.classList.contains('is-open'));
    });

    function layerSize() {
      layer.style.height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) + 'px';
    }

    function pageWidth() {
      return Math.max(document.documentElement.clientWidth, document.documentElement.scrollWidth, 1);
    }

    function markerPosition(comment) {
      return {
        x: Math.max(18, Math.min(pageWidth() - 18, pageWidth() * (Number(comment.xPercent) || 0) / 100)),
        y: Math.max(18, Number(comment.y) || 18)
      };
    }

    function renderMarkers() {
      layerSize();
      layer.querySelectorAll('.mmc-feedback-marker').forEach(function (marker) { marker.remove(); });
      getComments(pageId).forEach(function (comment) {
        var position = markerPosition(comment);
        var marker = button(String(comment.number), 'mmc-feedback-marker');
        marker.style.left = position.x + 'px';
        marker.style.top = position.y + 'px';
        marker.setAttribute('aria-label', 'Open comment ' + comment.number + ': ' + comment.text);
        marker.title = 'Comment ' + comment.number;
        marker.addEventListener('click', function () { openEditor(comment); });
        layer.appendChild(marker);
      });
    }

    function renderDrawer() {
      var comments = getComments(pageId);
      renderMigrationControl(drawer.querySelector('[data-feedback-migration]'), pageId);
      drawer.querySelector('[data-feedback-drawer-count]').textContent = String(comments.length);
      var list = drawer.querySelector('[data-feedback-drawer-list]');
      list.replaceChildren();
      if (!comments.length) {
        var empty = document.createElement('li');
        empty.className = 'mmc-feedback-drawer__empty';
        empty.textContent = 'No comments yet.';
        list.appendChild(empty);
        return;
      }
      comments.forEach(function (comment) {
        var item = document.createElement('li');
        var openButton = button('', 'mmc-feedback-drawer__comment');
        var number = document.createElement('span');
        number.textContent = String(comment.number);
        var text = document.createElement('span');
        text.textContent = comment.text;
        openButton.append(number, text);
        openButton.setAttribute('aria-label', 'Open comment ' + comment.number + ' on the page');
        openButton.addEventListener('click', function () {
          var position = markerPosition(comment);
          window.scrollTo({ top: Math.max(0, position.y - 140), behavior: 'smooth' });
          openEditor(comment);
        });
        item.appendChild(openButton);
        list.appendChild(item);
      });
    }

    function closeEditor() {
      if (!activeEditor) return;
      activeEditor.element.remove();
      activeEditor = null;
    }

    function persistActiveDraft() {
      if (!activeEditor || !activeEditor.textarea) return;
      saveDraft(pageId, {
        commentId: activeEditor.commentId,
        text: activeEditor.textarea.value,
        xPercent: Math.max(0, Math.min(100, activeEditor.anchorX / pageWidth() * 100)),
        y: activeEditor.anchorY
      });
      if (activeEditor.draftStatus) activeEditor.draftStatus.textContent = 'Draft saved automatically in this browser.';
    }

    function editorPlacement(anchorX, anchorY, width, height) {
      var minimumLeft = window.scrollX + 12;
      var maximumLeft = window.scrollX + window.innerWidth - width - 12;
      var minimumTop = window.scrollY + 12;
      var maximumTop = window.scrollY + window.innerHeight - height - 12;
      return {
        left: Math.max(minimumLeft, Math.min(maximumLeft, anchorX + 14)),
        top: Math.max(minimumTop, Math.min(maximumTop, anchorY + 14))
      };
    }

    function moveEditor(left, top) {
      if (!activeEditor) return;
      var maximumLeft = Math.max(8, pageWidth() - activeEditor.element.offsetWidth - 8);
      var maximumTop = Math.max(8, Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - activeEditor.element.offsetHeight - 8);
      var nextLeft = Math.max(8, Math.min(maximumLeft, left));
      var nextTop = Math.max(8, Math.min(maximumTop, top));
      activeEditor.element.style.left = nextLeft + 'px';
      activeEditor.element.style.top = nextTop + 'px';
      activeEditor.anchorX = nextLeft;
      activeEditor.anchorY = nextTop;
      activeEditor.dragged = true;
      persistActiveDraft();
    }

    function openEditor(comment, point, restoredDraft) {
      closeEditor();
      var existing = comment || null;
      var comments = getComments(pageId);
      var number = existing ? existing.number : comments.reduce(function (highest, item) {
        return Math.max(highest, item.number);
      }, 0) + 1;
      var anchor = restoredDraft ? {
        x: pageWidth() * restoredDraft.xPercent / 100,
        y: restoredDraft.y
      } : existing ? markerPosition(existing) : point;
      var editor = document.createElement('section');
      editor.className = 'mmc-feedback-editor';
      editor.setAttribute('role', 'dialog');
      editor.setAttribute('aria-modal', 'false');
      editor.setAttribute('aria-labelledby', 'mmc-feedback-editor-title');
      editor.innerHTML = '' +
        '<div class="mmc-feedback-editor__handle" tabindex="0" role="button" aria-label="Drag comment editor, or use arrow keys to move it">' +
          '<strong id="mmc-feedback-editor-title">Comment ' + number + '</strong>' +
          '<span aria-hidden="true">Drag to move ↕</span>' +
        '</div>' +
        '<form>' +
          '<label for="mmc-feedback-text">Feedback</label>' +
          '<textarea id="mmc-feedback-text" rows="5" required placeholder="Type your feedback here..."></textarea>' +
          '<p class="mmc-feedback-editor__error" role="alert" hidden>Please enter a comment before saving.</p>' +
          '<p class="mmc-feedback-editor__draft-status" aria-live="polite">Changes save automatically in this browser.</p>' +
          '<div class="mmc-feedback-editor__actions">' +
            '<button class="mmc-feedback-editor__save" type="submit">Save</button>' +
            '<button class="mmc-feedback-editor__cancel" type="button">Cancel</button>' +
            (existing ? '<button class="mmc-feedback-editor__delete" type="button">Delete</button>' : '') +
          '</div>' +
        '</form>';
      layer.appendChild(editor);

      var placement = editorPlacement(anchor.x, anchor.y, editor.offsetWidth, editor.offsetHeight);
      editor.style.left = placement.left + 'px';
      editor.style.top = placement.top + 'px';
      activeEditor = {
        element: editor,
        commentId: existing ? existing.id : null,
        anchorX: anchor.x,
        anchorY: anchor.y,
        dragged: false,
        textarea: null,
        draftStatus: editor.querySelector('.mmc-feedback-editor__draft-status')
      };

      var textarea = editor.querySelector('textarea');
      activeEditor.textarea = textarea;
      textarea.value = restoredDraft ? restoredDraft.text : existing ? existing.text : '';
      textarea.focus();
      textarea.addEventListener('input', function () {
        editor.querySelector('.mmc-feedback-editor__error').hidden = true;
        persistActiveDraft();
      });

      editor.querySelector('form').addEventListener('submit', async function (event) {
        event.preventDefault();
        var text = textarea.value.trim();
        var error = editor.querySelector('.mmc-feedback-editor__error');
        if (!text) {
          error.hidden = false;
          textarea.focus();
          return;
        }
        var xPercent = Math.max(0, Math.min(100, activeEditor.anchorX / pageWidth() * 100));
        var commentId = activeEditor.commentId;
        var anchorY = activeEditor.anchorY;
        var actionButtons = editor.querySelectorAll('.mmc-feedback-editor__actions button');
        actionButtons.forEach(function (actionButton) { actionButton.disabled = true; });
        activeEditor.draftStatus.textContent = sharedConfig.enabled ? 'Saving to shared review…' : 'Saving in this browser…';
        try {
          if (commentId) {
            await updateComment(pageId, commentId, { text: text, xPercent: xPercent, y: anchorY });
          } else {
            await createComment(pageId, { text: text, xPercent: xPercent, y: anchorY });
          }
          clearDraft(pageId, commentId || undefined);
          closeEditor();
        } catch (saveError) {
          error.textContent = saveError.message || 'The comment could not be saved.';
          error.hidden = false;
          activeEditor.draftStatus.textContent = 'Your unfinished text is still saved in this browser.';
          actionButtons.forEach(function (actionButton) { actionButton.disabled = false; });
        }
      });

      editor.querySelector('.mmc-feedback-editor__cancel').addEventListener('click', function () {
        clearDraft(pageId, activeEditor.commentId || undefined);
        closeEditor();
      });
      var deleteButton = editor.querySelector('.mmc-feedback-editor__delete');
      if (deleteButton) {
        var deleteArmed = false;
        var deleteResetTimer = null;
        deleteButton.addEventListener('click', async function () {
          if (!deleteArmed) {
            deleteArmed = true;
            deleteButton.textContent = 'Confirm delete';
            deleteResetTimer = window.setTimeout(function () {
              deleteArmed = false;
              deleteButton.textContent = 'Delete';
            }, 5000);
            return;
          }
          if (deleteResetTimer) window.clearTimeout(deleteResetTimer);
          deleteButton.disabled = true;
          activeEditor.draftStatus.textContent = sharedConfig.enabled ? 'Deleting from shared review…' : 'Deleting…';
          try {
            await deleteComment(pageId, existing.id);
            clearDraft(pageId, existing.id);
            closeEditor();
          } catch (deleteError) {
            var error = editor.querySelector('.mmc-feedback-editor__error');
            error.textContent = deleteError.message || 'The comment could not be deleted.';
            error.hidden = false;
            activeEditor.draftStatus.textContent = 'The comment remains available.';
            deleteButton.disabled = false;
            deleteArmed = false;
            deleteButton.textContent = 'Delete';
          }
        });
      }

      var handle = editor.querySelector('.mmc-feedback-editor__handle');
      var dragStart = null;
      handle.addEventListener('pointerdown', function (event) {
        if (event.button !== 0) return;
        dragStart = {
          pointerX: event.clientX,
          pointerY: event.clientY,
          left: editor.offsetLeft,
          top: editor.offsetTop
        };
        handle.setPointerCapture(event.pointerId);
        editor.classList.add('is-dragging');
        event.preventDefault();
      });
      handle.addEventListener('pointermove', function (event) {
        if (!dragStart) return;
        moveEditor(dragStart.left + event.clientX - dragStart.pointerX, dragStart.top + event.clientY - dragStart.pointerY);
      });
      function stopDrag() {
        dragStart = null;
        editor.classList.remove('is-dragging');
      }
      handle.addEventListener('pointerup', stopDrag);
      handle.addEventListener('pointercancel', stopDrag);
      handle.addEventListener('keydown', function (event) {
        var distance = event.shiftKey ? 25 : 10;
        var deltaX = event.key === 'ArrowLeft' ? -distance : event.key === 'ArrowRight' ? distance : 0;
        var deltaY = event.key === 'ArrowUp' ? -distance : event.key === 'ArrowDown' ? distance : 0;
        if (!deltaX && !deltaY) return;
        event.preventDefault();
        moveEditor(editor.offsetLeft + deltaX, editor.offsetTop + deltaY);
      });
    }

    function shouldIgnoreTarget(target) {
      return Boolean(target.closest('.mmc-feedback-drawer, .mmc-feedback-layer, a, button, input, textarea, select, option, label, summary, iframe, [contenteditable="true"]'));
    }

    document.addEventListener('contextmenu', function (event) {
      if (shouldIgnoreTarget(event.target)) return;
      event.preventDefault();
      openEditor(null, { x: event.pageX, y: event.pageY });
    });

    document.addEventListener('dblclick', function (event) {
      if (shouldIgnoreTarget(event.target)) return;
      event.preventDefault();
      openEditor(null, { x: event.pageX, y: event.pageY });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && activeEditor) closeEditor();
    });

    subscribe(function () {
      renderMarkers();
      renderDrawer();
    });
    window.addEventListener('resize', renderMarkers);
    window.addEventListener('load', renderMarkers);
    renderMarkers();
    renderDrawer();

    var restoredDraft = getDraft(pageId);
    if (restoredDraft) {
      var restoredComment = restoredDraft.commentId ? getComments(pageId).find(function (comment) {
        return comment.id === restoredDraft.commentId;
      }) : null;
      if (restoredDraft.commentId && !restoredComment) {
        clearDraft(pageId, restoredDraft.commentId);
      } else {
        openEditor(restoredComment, null, restoredDraft);
      }
    }

    var sessionKey = 'mmcFeedbackHintSeen:' + pageId;
    var hasSeenHint = false;
    try { hasSeenHint = window.sessionStorage.getItem(sessionKey) === 'true'; } catch (error) { hasSeenHint = false; }
    if (!hasSeenHint) {
      setDrawer(true);
      try { window.sessionStorage.setItem(sessionKey, 'true'); } catch (error) { /* no-op */ }
      hintTimer = window.setTimeout(function () {
        if (!drawer.matches(':hover') && !drawer.matches(':focus-within')) setDrawer(false);
      }, 6500);
    }
  }

  function createHubCommentItem(pageId, comment) {
    var item = document.createElement('li');
    item.className = 'hub-feedback-item';

    var display = document.createElement('div');
    display.className = 'hub-feedback-item__display';
    var heading = document.createElement('div');
    heading.className = 'hub-feedback-item__heading';
    var label = document.createElement('strong');
    label.textContent = 'Comment ' + comment.number;
    var edit = button('Edit', 'hub-feedback-item__edit');
    heading.append(label, edit);
    var copy = document.createElement('p');
    copy.textContent = comment.text;
    display.append(heading, copy);

    var form = document.createElement('form');
    form.className = 'hub-feedback-item__form';
    form.hidden = true;
    var fieldLabel = document.createElement('label');
    fieldLabel.className = 'hub-sr-only';
    fieldLabel.setAttribute('for', 'hub-feedback-' + pageId + '-' + comment.number);
    fieldLabel.textContent = 'Edit comment ' + comment.number;
    var textarea = document.createElement('textarea');
    textarea.id = fieldLabel.getAttribute('for');
    textarea.rows = 3;
    textarea.required = true;
    var restoredDraft = getDraft(pageId);
    var matchingDraft = restoredDraft && restoredDraft.commentId === comment.id ? restoredDraft : null;
    textarea.value = matchingDraft ? matchingDraft.text : comment.text;
    var draftStatus = document.createElement('p');
    draftStatus.className = 'hub-feedback-item__draft-status';
    draftStatus.textContent = matchingDraft ? 'Recovered unsaved draft.' : 'Changes save automatically in this browser.';
    var actions = document.createElement('div');
    actions.className = 'hub-feedback-item__actions';
    var save = document.createElement('button');
    save.type = 'submit';
    save.textContent = 'Save';
    var cancel = button('Cancel');
    var remove = button('Delete', 'is-delete');
    actions.append(save, cancel, remove);
    form.append(fieldLabel, textarea, draftStatus, actions);

    if (matchingDraft) {
      display.hidden = true;
      form.hidden = false;
    }

    edit.addEventListener('click', function () {
      display.hidden = true;
      form.hidden = false;
      textarea.focus();
    });
    textarea.addEventListener('input', function () {
      saveDraft(pageId, {
        commentId: comment.id,
        text: textarea.value,
        xPercent: comment.xPercent,
        y: comment.y
      });
      draftStatus.textContent = 'Draft saved automatically in this browser.';
    });
    cancel.addEventListener('click', function () {
      clearDraft(pageId, comment.id);
      textarea.value = comment.text;
      form.hidden = true;
      display.hidden = false;
    });
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!textarea.value.trim()) {
        textarea.focus();
        return;
      }
      save.disabled = true;
      cancel.disabled = true;
      remove.disabled = true;
      draftStatus.classList.remove('is-error');
      draftStatus.textContent = sharedConfig.enabled ? 'Saving to shared review…' : 'Saving in this browser…';
      try {
        await updateComment(pageId, comment.id, { text: textarea.value });
        clearDraft(pageId, comment.id);
        form.hidden = true;
        display.hidden = false;
        renderHubPanel(item.closest('.hub-feedback[data-feedback-page]'));
      } catch (error) {
        draftStatus.textContent = error.message || 'The comment could not be saved.';
        draftStatus.classList.add('is-error');
        save.disabled = false;
        cancel.disabled = false;
        remove.disabled = false;
      }
    });
    var removeArmed = false;
    var removeResetTimer = null;
    remove.addEventListener('click', async function () {
      if (!removeArmed) {
        removeArmed = true;
        remove.textContent = 'Confirm delete';
        removeResetTimer = window.setTimeout(function () {
          removeArmed = false;
          remove.textContent = 'Delete';
        }, 5000);
        return;
      }
      if (removeResetTimer) window.clearTimeout(removeResetTimer);
      remove.disabled = true;
      save.disabled = true;
      cancel.disabled = true;
      draftStatus.classList.remove('is-error');
      draftStatus.textContent = sharedConfig.enabled ? 'Deleting from shared review…' : 'Deleting…';
      try {
        await deleteComment(pageId, comment.id);
        clearDraft(pageId, comment.id);
        form.hidden = true;
        renderHubPanel(item.closest('.hub-feedback[data-feedback-page]'));
      } catch (error) {
        draftStatus.textContent = error.message || 'The comment could not be deleted.';
        draftStatus.classList.add('is-error');
        remove.disabled = false;
        save.disabled = false;
        cancel.disabled = false;
        removeArmed = false;
        remove.textContent = 'Delete';
      }
    });

    item.append(display, form);
    return item;
  }

  function renderHubPanel(panel) {
    var pageId = panel.getAttribute('data-feedback-page');
    var comments = getComments(pageId);
    var count = panel.querySelector('[data-feedback-count]');
    var list = panel.querySelector('[data-feedback-list]');
    var empty = panel.querySelector('[data-feedback-empty]');
    count.textContent = comments.length === 1 ? '1 comment' : comments.length + ' comments';
    if (panel.querySelector('.hub-feedback-item__form:not([hidden])')) {
      renderSharedStatus();
      return;
    }
    list.replaceChildren();
    empty.hidden = comments.length > 0;
    var migration = panel.querySelector('[data-feedback-migration]');
    if (!migration) {
      migration = document.createElement('div');
      migration.className = 'mmc-feedback-migration mmc-feedback-migration--hub';
      migration.setAttribute('data-feedback-migration', '');
      migration.hidden = true;
      migration.innerHTML = '<p data-feedback-migration-copy></p><button type="button" data-feedback-migration-button>Publish to shared review</button>';
      panel.querySelector('[data-feedback-sync-status]').insertAdjacentElement('afterend', migration);
    }
    renderMigrationControl(migration, pageId);
    comments.forEach(function (comment) {
      list.appendChild(createHubCommentItem(pageId, comment));
    });
    renderSharedStatus();
  }

  function initHubFeedback() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('.hub-feedback[data-feedback-page]'));
    if (!panels.length) return;
    panels.forEach(function (panel) { registerSharedPage(panel.getAttribute('data-feedback-page')); });
    function renderAll() { panels.forEach(renderHubPanel); }
    subscribe(renderAll);
    renderAll();
  }

  window.MMCFeedback = {
    storageKey: STORAGE_KEY,
    draftStorageKey: DRAFT_STORAGE_KEY,
    sharedCacheKey: SHARED_CACHE_KEY,
    sharedEnabled: sharedConfig.enabled,
    getComments: getComments,
    getLocalComments: getLocalComments,
    getDraft: getDraft,
    createComment: createComment,
    updateComment: updateComment,
    deleteComment: deleteComment,
    publishLocalComments: publishLocalComments,
    refreshSharedComments: refreshSharedComments
  };

  var pageId = document.body.getAttribute('data-feedback-page');
  if (pageId) {
    initPrototypeFeedback(pageId, document.body.getAttribute('data-feedback-title') || 'Website concept');
  }
  initHubFeedback();
  startSharedSync();
})();
