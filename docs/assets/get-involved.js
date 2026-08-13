(function () {
  'use strict';

  document.documentElement.classList.add('mmc-js');

  var roleContent = {
    ambassador: {
      name: 'Coalition Ambassador',
      description: 'Flexible, low-lift involvement with no required meetings.'
    },
    member: {
      name: 'Coalition Member',
      description: 'Active participation through four virtual sector meetings per year, plus occasional between-meeting contribution.'
    }
  };

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.mmc-involved').forEach(function (root) {
    var roleButtons = root.querySelectorAll('[data-role-target]');
    var rolePanels = root.querySelectorAll('[data-role-panel]');

    function activateRole(role, moveFocus) {
      roleButtons.forEach(function (button) {
        var selected = button.getAttribute('data-role-target') === role;
        button.setAttribute('aria-selected', String(selected));
        button.classList.toggle('is-active', selected);
        button.setAttribute('tabindex', selected ? '0' : '-1');
        if (selected && moveFocus) button.focus();
      });
      rolePanels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-role-panel') !== role;
      });
    }

    function preserveSelectedPathway(role) {
      var content = roleContent[role];
      var joinSection = root.querySelector('[data-join-section]');
      if (!content || !joinSection) return;

      root.setAttribute('data-selected-role', role);
      root.querySelectorAll('[data-select-role]').forEach(function (button) {
        var selected = button.getAttribute('data-select-role') === role;
        button.setAttribute('aria-pressed', String(selected));
      });
      root.querySelectorAll('[data-role-card]').forEach(function (card) {
        card.classList.toggle('is-selected', card.getAttribute('data-role-card') === role);
      });
      root.querySelectorAll('[data-selected-pathway]').forEach(function (notice) {
        notice.hidden = false;
        var name = notice.querySelector('[data-selected-pathway-name]');
        if (name) name.textContent = content.name;
      });
      root.querySelectorAll('[data-process-pathway]').forEach(function (notice) {
        notice.classList.add('has-selection');
        var name = notice.querySelector('[data-process-pathway-name]');
        var description = notice.querySelector('[data-process-pathway-description]');
        if (name) name.textContent = content.name;
        if (description) description.textContent = content.description;
      });
      root.querySelectorAll('[data-next-role]').forEach(function (details) {
        details.open = details.getAttribute('data-next-role') === role;
      });

      joinSection.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      var selectedNotice = joinSection.querySelector('[data-selected-pathway]');
      if (selectedNotice) {
        window.setTimeout(function () {
          selectedNotice.focus({ preventScroll: true });
        }, reducedMotion ? 0 : 350);
      }
    }

    roleButtons.forEach(function (button, index) {
      button.addEventListener('click', function () {
        activateRole(button.getAttribute('data-role-target'), false);
      });
      button.addEventListener('keydown', function (event) {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        var next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % roleButtons.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + roleButtons.length) % roleButtons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = roleButtons.length - 1;
        activateRole(roleButtons[next].getAttribute('data-role-target'), true);
      });
    });

    if (roleButtons.length) {
      var initiallySelected = root.querySelector('[data-role-target][aria-selected="true"]') || roleButtons[0];
      activateRole(initiallySelected.getAttribute('data-role-target'), false);
    }

    root.querySelectorAll('[data-scroll-role]').forEach(function (link) {
      link.addEventListener('click', function () {
        var role = link.getAttribute('data-scroll-role');
        var target = root.querySelector('[data-role-card="' + role + '"]') || root.querySelector('[data-role-panel="' + role + '"]');
        if (target) {
          if (roleButtons.length) activateRole(role, false);
          target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      });
    });

    root.querySelectorAll('[data-select-role]').forEach(function (button) {
      button.addEventListener('click', function () {
        var role = button.getAttribute('data-select-role');
        if (roleButtons.length) activateRole(role, false);
        preserveSelectedPathway(role);
      });
    });

    root.querySelectorAll('.mmc-step-accordion__button').forEach(function (button, index) {
      var panel = document.getElementById(button.getAttribute('aria-controls'));
      var openByDefault = index === 0;
      button.setAttribute('aria-expanded', String(openByDefault));
      panel.hidden = !openByDefault;
      button.addEventListener('click', function () {
        var open = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!open));
        panel.hidden = open;
      });
    });
  });
})();
