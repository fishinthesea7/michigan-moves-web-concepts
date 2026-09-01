(function () {
  'use strict';

  var siteRoot = document.body.getAttribute('data-site-root') || './';
  var variation = document.body.getAttribute('data-variation') || 'a';
  var logoDark = 'https://mimoves.org/wp-content/uploads/2024/03/Michigan-Moves_Logo-file-02-scaled-e1778529809704-1024x288.png';
  var logoLight = 'https://mimoves.org/wp-content/uploads/2024/03/Michigan-Moves_Logo-file-04-scaled-e1778529166370-1024x343.png';

  function headerMarkup(active) {
    var navItems = [
      ['Home', 'https://mimoves.org/', 'home'],
      ['Michigan Physical Activity Plan', 'https://mimoves.org/mpap/', 'mpap'],
      ['About', 'https://mimoves.org/about/', 'about'],
      ['Get Involved', siteRoot + 'get-involved/variation-' + variation + '/', 'involved'],
      ['Coalition Directory', siteRoot + 'directory/variation-' + variation + '/', 'directory'],
      ['Contact us', 'https://mimoves.org/contact-us/', 'contact']
    ];
    var links = navItems.map(function (item) {
      var current = item[2] === active;
      return '<li><a href="' + item[1] + '"' + (current ? ' aria-current="page" class="is-active"' : '') + '>' + item[0] + '</a></li>';
    }).join('');

    return '' +
      '<a class="mmc-skip-link" href="#main-content">Skip to content</a>' +
      '<header class="mmc-preview-header" data-preview-only>' +
        '<div class="mmc-preview-header__inner">' +
          '<a class="mmc-preview-brand" href="https://mimoves.org/" aria-label="Michigan Moves Coalition home">' +
            '<img src="' + logoDark + '" alt="Michigan Moves Coalition">' +
          '</a>' +
          '<button class="mmc-menu-toggle" type="button" aria-expanded="false" aria-controls="mmc-mobile-nav">' +
            '<span class="mmc-menu-toggle__icon" aria-hidden="true"><span></span><span></span><span></span></span>' +
            '<span class="mmc-visually-hidden">Open menu</span>' +
          '</button>' +
          '<nav class="mmc-desktop-nav" aria-label="Primary navigation"><ul>' + links + '</ul></nav>' +
          '<a class="mmc-donate-button" href="https://mimoves.org/mpap-donation/">Donate</a>' +
        '</div>' +
        '<nav class="mmc-mobile-nav" id="mmc-mobile-nav" aria-label="Mobile navigation" hidden>' +
          '<ul>' + links + '<li><a href="https://mimoves.org/mpap-donation/">Donate</a></li></ul>' +
        '</nav>' +
      '</header>';
  }

  function footerMarkup() {
    return '' +
      '<footer class="mmc-preview-footer" data-preview-only>' +
        '<div class="mmc-preview-footer__inner">' +
          '<div class="mmc-preview-footer__brand">' +
            '<a href="https://mimoves.org/" aria-label="Michigan Moves Coalition home"><img src="' + logoLight + '" alt="Michigan Moves Coalition"></a>' +
            '<p>Established in 2022 to unify Michigan’s physical activity community and amplify its impact.</p>' +
          '</div>' +
          '<div>' +
            '<h2>Contact Us</h2>' +
            '<p>4710 S State Rd.<br>Ann Arbor, MI 48108</p>' +
            '<p><a href="https://mimoves.org/contact-us/">Send a message</a></p>' +
          '</div>' +
          '<div>' +
            '<h2>Join Michigan Moves</h2>' +
            '<p>Choose the involvement level that fits how you want to contribute.</p>' +
            '<p><a href="https://wkf.ms/4gKvw3b" target="_blank" rel="noopener">Open the registration form <span aria-hidden="true">↗</span><span class="mmc-visually-hidden"> (opens in a new tab)</span></a></p>' +
          '</div>' +
          '<div>' +
            '<h2>Connect</h2>' +
            '<div class="mmc-social-links">' +
              '<a href="https://www.instagram.com/mimovescoalition/" target="_blank" rel="noopener" aria-label="Michigan Moves on Instagram">Instagram</a>' +
              '<a href="https://www.linkedin.com/company/michigan-moves-coalition" target="_blank" rel="noopener" aria-label="Michigan Moves on LinkedIn">LinkedIn</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="mmc-preview-footer__bottom"><p>Standalone prototype preview — page body is isolated for WordPress handoff.</p></div>' +
      '</footer>';
  }

  document.querySelectorAll('[data-preview-header]').forEach(function (mount) {
    mount.innerHTML = headerMarkup(mount.getAttribute('data-active'));
  });
  document.querySelectorAll('[data-preview-footer]').forEach(function (mount) {
    mount.innerHTML = footerMarkup();
  });

  document.querySelectorAll('.mmc-menu-toggle').forEach(function (button) {
    var nav = document.getElementById(button.getAttribute('aria-controls'));
    function closeMenu() {
      button.setAttribute('aria-expanded', 'false');
      button.querySelector('.mmc-visually-hidden').textContent = 'Open menu';
      nav.hidden = true;
      document.documentElement.classList.remove('mmc-menu-open');
      button.focus();
    }
    button.addEventListener('click', function () {
      var open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      button.querySelector('.mmc-visually-hidden').textContent = open ? 'Open menu' : 'Close menu';
      nav.hidden = open;
      document.documentElement.classList.toggle('mmc-menu-open', !open);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') closeMenu();
    });
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024) {
      document.querySelectorAll('.mmc-menu-toggle[aria-expanded="true"]').forEach(function (button) {
        button.setAttribute('aria-expanded', 'false');
        button.querySelector('.mmc-visually-hidden').textContent = 'Open menu';
        document.getElementById(button.getAttribute('aria-controls')).hidden = true;
      });
      document.documentElement.classList.remove('mmc-menu-open');
    }
  });
})();
