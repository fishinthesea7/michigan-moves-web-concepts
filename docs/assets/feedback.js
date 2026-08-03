(function () {
  'use strict';

  var STORAGE_KEY = 'mmcPrototypeFeedbackV1';
  var DRAFT_STORAGE_KEY = 'mmcPrototypeFeedbackDraftsV1';
  var CHANGE_EVENT = 'mmc-feedback-changed';
  var fallbackStore = { version: 1, pages: {} };
  var fallbackDraftStore = { version: 1, pages: {} };

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

  function getComments(pageId) {
    var page = ensurePage(readStore(), pageId);
    return page.comments
      .filter(function (comment) {
        return comment && typeof comment.id === 'string' && typeof comment.text === 'string';
      })
      .slice()
      .sort(function (a, b) { return a.number - b.number; });
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'comment-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function createComment(pageId, values) {
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

  function updateComment(pageId, commentId, values) {
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

  function deleteComment(pageId, commentId) {
    var store = readStore();
    var page = ensurePage(store, pageId);
    var originalLength = page.comments.length;
    page.comments = page.comments.filter(function (item) { return item.id !== commentId; });
    if (page.comments.length === originalLength) return false;
    if (!page.comments.length) delete store.pages[pageId];
    writeStore(store, pageId);
    return true;
  }

  function subscribe(callback) {
    window.addEventListener(CHANGE_EVENT, callback);
    window.addEventListener('storage', function (event) {
      if (event.key === STORAGE_KEY) callback();
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
          '<p class="mmc-feedback-drawer__storage">Saved comments and in-progress drafts remain in this browser on this device.</p>' +
          '<div class="mmc-feedback-drawer__comments">' +
            '<h2>Your comments <span data-feedback-drawer-count>0</span></h2>' +
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

      editor.querySelector('form').addEventListener('submit', function (event) {
        event.preventDefault();
        var text = textarea.value.trim();
        var error = editor.querySelector('.mmc-feedback-editor__error');
        if (!text) {
          error.hidden = false;
          textarea.focus();
          return;
        }
        var xPercent = Math.max(0, Math.min(100, activeEditor.anchorX / pageWidth() * 100));
        if (activeEditor.commentId) {
          clearDraft(pageId, activeEditor.commentId);
          updateComment(pageId, activeEditor.commentId, { text: text, xPercent: xPercent, y: activeEditor.anchorY });
        } else {
          clearDraft(pageId);
          createComment(pageId, { text: text, xPercent: xPercent, y: activeEditor.anchorY });
        }
        closeEditor();
      });

      editor.querySelector('.mmc-feedback-editor__cancel').addEventListener('click', function () {
        clearDraft(pageId, activeEditor.commentId || undefined);
        closeEditor();
      });
      var deleteButton = editor.querySelector('.mmc-feedback-editor__delete');
      if (deleteButton) {
        var deleteArmed = false;
        var deleteResetTimer = null;
        deleteButton.addEventListener('click', function () {
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
          clearDraft(pageId, existing.id);
          deleteComment(pageId, existing.id);
          closeEditor();
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
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!textarea.value.trim()) {
        textarea.focus();
        return;
      }
      clearDraft(pageId, comment.id);
      updateComment(pageId, comment.id, { text: textarea.value });
    });
    var removeArmed = false;
    var removeResetTimer = null;
    remove.addEventListener('click', function () {
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
      clearDraft(pageId, comment.id);
      deleteComment(pageId, comment.id);
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
    list.replaceChildren();
    empty.hidden = comments.length > 0;
    comments.forEach(function (comment) {
      list.appendChild(createHubCommentItem(pageId, comment));
    });
  }

  function initHubFeedback() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('.hub-feedback[data-feedback-page]'));
    if (!panels.length) return;
    function renderAll() { panels.forEach(renderHubPanel); }
    subscribe(renderAll);
    renderAll();
  }

  window.MMCFeedback = {
    storageKey: STORAGE_KEY,
    draftStorageKey: DRAFT_STORAGE_KEY,
    getComments: getComments,
    getDraft: getDraft,
    createComment: createComment,
    updateComment: updateComment,
    deleteComment: deleteComment
  };

  var pageId = document.body.getAttribute('data-feedback-page');
  if (pageId) {
    initPrototypeFeedback(pageId, document.body.getAttribute('data-feedback-title') || 'Website concept');
  }
  initHubFeedback();
})();
