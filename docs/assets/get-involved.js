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
      description: 'Active participation through one virtual sector committee meeting each quarter, plus occasional between-meeting contribution.'
    }
  };

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.mmc-involved').forEach(function (root) {
    var roleButtons = root.querySelectorAll('[data-role-target]');
    var rolePanels = root.querySelectorAll('[data-role-panel]');
    var pathwayDetails = root.querySelectorAll('.mmc-pathway-details');
    var pathwaysOpen = Array.from(pathwayDetails).some(function (details) { return details.open; });

    function pathwayBodies() {
      return Array.from(pathwayDetails).map(function (details) {
        return details.querySelector('.mmc-pathway-details__body');
      }).filter(Boolean);
    }

    function equalizedExpandedHeight() {
      return pathwayBodies().reduce(function (height, body) {
        return Math.max(height, body.scrollHeight);
      }, 0);
    }

    function setPathwaysOpen(nextOpen) {
      pathwaysOpen = nextOpen;
      var bodies = pathwayBodies();
      pathwayDetails.forEach(function (details) { window.clearTimeout(details._mmcDisclosureTimer); });

      if (nextOpen) {
        pathwayDetails.forEach(function (details) {
          var body = details.querySelector('.mmc-pathway-details__body');
          details.open = true;
          if (!body) return;
          body.style.height = '0px';
          body.style.opacity = '0';
          body.style.transform = 'translateY(-4px)';
        });
        var expand = function () {
          if (!pathwaysOpen) return;
          var targetHeight = equalizedExpandedHeight();
          bodies.forEach(function (body) {
            body.style.height = targetHeight + 'px';
            body.style.opacity = '1';
            body.style.transform = 'translateY(0)';
          });
        };
        if (reducedMotion) expand();
        else {
          if (bodies[0]) void bodies[0].offsetHeight;
          window.requestAnimationFrame(expand);
        }
      } else {
        pathwayDetails.forEach(function (details) {
          var body = details.querySelector('.mmc-pathway-details__body');
          if (!body) {
            details.open = false;
            return;
          }
          if (reducedMotion) {
            details.open = false;
            body.removeAttribute('style');
            return;
          }
          var startHeight = body.getBoundingClientRect().height;
          body.style.height = startHeight + 'px';
          body.style.opacity = '1';
          body.style.transform = 'translateY(0)';
          void body.offsetHeight;
          window.requestAnimationFrame(function () {
            if (pathwaysOpen) return;
            body.style.height = '0px';
            body.style.opacity = '0';
            body.style.transform = 'translateY(-4px)';
            details._mmcDisclosureTimer = window.setTimeout(function () {
              if (!pathwaysOpen) {
                details.open = false;
                body.removeAttribute('style');
              }
            }, 230);
          });
        });
      }
    }

    window.addEventListener('resize', function () {
      if (!pathwaysOpen) return;
      var bodies = pathwayBodies();
      bodies.forEach(function (body) { body.style.height = 'auto'; });
      var targetHeight = equalizedExpandedHeight();
      bodies.forEach(function (body) { body.style.height = targetHeight + 'px'; });
    });

    /* The two comparison cards move as one so neither column jumps independently. */
    pathwayDetails.forEach(function (details) {
      var summary = details.querySelector('summary');
      if (!summary) return;
      summary.addEventListener('click', function (event) {
        event.preventDefault();
        setPathwaysOpen(!pathwaysOpen);
      });
    });

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
