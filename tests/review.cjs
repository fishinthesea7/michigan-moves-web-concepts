const { chromium } = require('playwright');

const baseUrl = 'http://127.0.0.1:4187';
const formUrl = 'https://wkf.ms/4gKvw3b';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => route.request().url().startsWith(baseUrl) ? route.continue() : route.abort());

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ['directory', 'get-involved']) {
      await page.goto(`${baseUrl}/${path}/variation-a/`);
      assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `Horizontal overflow: ${path} at ${width}px`);

      if (path === 'directory') {
        assert(await page.locator('h1').innerText() === 'Coalition Directory', 'Directory title was not restored');
        assert(await page.locator('.mmc-review-bar').count() === 0, 'Directory still shows a review notice');
        assert(await page.getByText('Preview uses sample profiles').count() === 0, 'Directory still shows sample-profile language');
        assert(await page.locator('.mmc-directory-preview').count() === 0, 'Directory hero tile was not removed');
        assert((await page.locator('.mmc-final-hero').evaluate(element => getComputedStyle(element).backgroundImage)).includes('directory-group-hiking.jpg'), 'Approved Directory background image is not active');
        if (width === 1440) {
          const directoryHeroHeight = await page.locator('.mmc-final-hero').evaluate(element => Math.round(element.getBoundingClientRect().height));
          assert(directoryHeroHeight >= 500, `Directory hero is not tall enough to show the map: ${directoryHeroHeight}px`);
          const directoryHeroStyle = await page.locator('.mmc-final-hero').evaluate(element => {
            const style = getComputedStyle(element);
            return { position: style.backgroundPosition, size: style.backgroundSize };
          });
          assert(directoryHeroStyle.size === '100% auto' && directoryHeroStyle.position === '50% 25%', 'Directory hero is not framed to show the full group');
          const directoryHeroBalance = await page.locator('.mmc-final-hero').evaluate(element => {
            const hero = element.getBoundingClientRect();
            const content = element.querySelector('.mmc-hero__content').getBoundingClientRect();
            return { top: content.top - hero.top, bottom: hero.bottom - content.bottom, width: content.width };
          });
          assert(Math.abs(directoryHeroBalance.top - directoryHeroBalance.bottom) <= 12 && directoryHeroBalance.width <= 600, `Directory hero content is not centered with a readable width: ${JSON.stringify(directoryHeroBalance)}`);
        }
        assert(await page.locator('[data-directory-jump]').innerText().then(text => text.trim().startsWith('Explore the coalition')), 'Directory hero action was not renamed');
        assert(await page.locator('.mmc-hero__quiet-link').count() === 0, 'Removed directory hero link remains');
        assert(await page.locator('[data-directory-status-dismiss]').count() === 1, 'Directory notice dismiss control is missing');
        if (width === 1440) {
          await page.locator('[data-directory-status-dismiss]').click();
          await page.waitForTimeout(700);
          assert(await page.locator('.mmc-directory-status-banner').evaluate(element => element.classList.contains('is-dismissed')), 'Directory notice did not dismiss');
          assert(await page.locator('.mmc-directory-status-banner').evaluate(element => Math.round(element.getBoundingClientRect().height) === 0), 'Dismissed directory notice still reserves page space');
        }
        assert(await page.locator('.mmc-org-logo').count() === 23, 'Organization logos or profile rendering failed');
        assert(await page.locator('.mmc-org-logo--initials').count() > 0, 'Organization-initial fallbacks are missing');
        assert(await page.locator('.mmc-org-logo--initials').evaluateAll(elements => new Set(elements.map(element => getComputedStyle(element).backgroundColor)).size === 1), 'Organization-initial fallbacks do not share one blue treatment');
        for (const name of ['Angela Maniaci', 'Kate Steele', 'Elizabeth OMalley']) {
          assert(await page.locator('.mmc-directory-card h3', { hasText: name }).count() === 1, `Missing requested profile: ${name}`);
        }
        assert(await page.locator('.mmc-directory-card').first().locator('h3').innerText() === 'Kate Steele', 'Default organization sorting is incorrect');
        assert(await page.locator('.mmc-person-avatar').count() === 0, 'Headshot circles remain in the directory');
        assert(await page.locator('.mmc-update-profile').count() === 0, 'Update-profile button was not removed');
        assert(await page.locator('[data-profile-toggle]').count() === 0, 'View-profile controls were not removed');
        assert(await page.locator('.mmc-profile-expansion').count() === 0, 'Expanded profile sections were not removed');
        assert(await page.locator('.mmc-card-website').count() === 25, 'Website buttons are missing from cards');
        assert(await page.locator('.mmc-directory-join-action').count() === 0, 'Nested directory call-to-action remains');
        assert(await page.locator('a.mmc-directory-join-callout--final').count() === 1, 'Directory invitation is not one linked tile');
        assert(await page.locator('.mmc-directory-join-arrow').count() === 0, 'Directory invitation arrow circle remains');
        assert(await page.locator('.mmc-directory-join-kicker').count() === 0, 'Directory invitation kicker remains');
        assert(await page.locator('.mmc-directory-join-callout--final').evaluate(element => getComputedStyle(element, '::after').content === 'none'), 'Directory invitation decorative circle remains');
        assert(await page.locator('.mmc-directory-join-callout--final').evaluate(element => getComputedStyle(element).borderTopColor === 'rgb(26, 43, 46)'), 'Directory invitation border color is incorrect');
        assert(await page.locator('[data-directory-role-button]').first().evaluate(element => getComputedStyle(element).backgroundColor === 'rgba(0, 0, 0, 0)'), 'Directory role filter is prefilled before selection');
        const websiteStyle = await page.locator('.mmc-card-website').first().evaluate(element => {
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, width: element.getBoundingClientRect().width, cardWidth: element.closest('.mmc-directory-card').getBoundingClientRect().width };
        });
        assert(websiteStyle.background !== 'rgb(23, 80, 92)' && websiteStyle.width < websiteStyle.cardWidth * .6, 'Website action still dominates the profile card');
        const longestSector = page.locator('.mmc-sector-tags span').filter({ hasText: /^Transportation & Community Design$/ }).first();
        assert(parseFloat(await longestSector.evaluate(element => getComputedStyle(element).fontSize)) >= 12, 'Sector labels are still too small');
        assert(await longestSector.evaluate(element => element.getClientRects().length === 1 && element.scrollWidth <= element.clientWidth), 'Longest sector label wraps or overflows');
        if (width === 1440) {
          const card = page.locator('.mmc-directory-card').first();
          const beforeHover = await card.boundingBox();
          await card.hover();
          await page.waitForTimeout(220);
          const afterHover = await card.boundingBox();
          assert(beforeHover && afterHover && afterHover.y < beforeHover.y, 'Directory card does not lift on hover');
        }
        const searchBox = await page.locator('.mmc-search-coalition').boundingBox();
        assert(searchBox && searchBox.height <= 54 && searchBox.width >= 300, `Search button dimensions are wrong: ${JSON.stringify(searchBox)}`);

        await page.locator('[data-directory-jump]').click();
        await page.waitForTimeout(400);
        assert(await page.locator('#search-a').evaluate(element => element === document.activeElement), 'Search control did not receive focus');
        await page.locator('#search-a').fill('Angela Maniaci');
        assert(await page.locator('.mmc-directory-card').count() === 1, 'Directory search failed');
        await page.locator('[data-clear-filters]').click();
        await page.locator('[data-directory-sector]').selectOption('Education');
        assert(await page.locator('.mmc-directory-card h3', { hasText: 'Kate Steele' }).count() === 1, 'Sector filter failed');
        await page.locator('[data-clear-filters]').click();
        await page.locator('[data-directory-role-button="Coalition Ambassador"]').click();
        assert(await page.locator('.mmc-directory-card').count() === 1, 'Role filter failed');
      } else {
        assert(await page.locator('.mmc-review-bar').count() === 0, 'Get Involved still shows a review notice');
        assert(await page.locator('.mmc-welcome-card').count() === 0, 'Hero role-summary card was not removed');
        assert(await page.locator('.mmc-role-path-mark').count() === 0, 'Welcome-card graphic was not removed');
        assert(await page.locator('.mmc-pathway-lane__kicker').count() === 0, 'Role-card kicker was not removed');
        assert(await page.getByText('Directory visibility is optional').count() === 0, 'Directory-visibility bars were not removed');
        assert(await page.locator('.mmc-form-note').count() === 0, 'Registration form note was not removed');
        assert((await page.locator('.mmc-final-hero').evaluate(element => getComputedStyle(element).backgroundImage)).includes('get-involved-group-activity.jpg'), 'New Get Involved background image is not active');
        if (width === 1440) {
          const heroImageStyle = await page.locator('.mmc-final-hero').evaluate(element => {
            const style = getComputedStyle(element);
            return { position: style.backgroundPosition, size: style.backgroundSize };
          });
          assert(heroImageStyle.size === '135% auto' && heroImageStyle.position === '0% 27%', 'Get Involved hero is not positioned with the woman in red near the right edge');
        }
        assert(await page.locator('.mmc-hero__lead').innerText() === 'Join our network of people and organizations across Michigan and amplify your impact, for free.', 'Joining hero sentence is incorrect');
        assert(await page.locator('.mmc-hero__actions .mmc-btn').first().innerText().then(text => text.trim().startsWith('Get involved')), 'Primary hero action is incorrect');
        assert(await page.locator('.mmc-hero__actions .mmc-btn').last().innerText().then(text => text.trim().startsWith('Meet the community')), 'Community hero action is incorrect');
        assert(await page.locator('#roles-a-heading').innerText() === 'Two meaningful ways to take action', 'Role section heading is incorrect');
        assert(await page.locator('.mmc-chapter-heading p').innerText().then(text => text.includes('the statewide movement')), 'Role section copy was not updated');
        assert(await page.locator('.mmc-proof-strip p').nth(2).locator('span').innerText() === 'Sectors aligned', 'Sector statistic text was not shortened');
        const secondaryHeroFontSize = parseFloat(await page.locator('.mmc-btn--hero-secondary').evaluate(element => getComputedStyle(element).fontSize));
        assert(secondaryHeroFontSize === 19, `Secondary hero action font is ${secondaryHeroFontSize}px instead of 19px`);
        const proofLabelFontSizes = await page.locator('.mmc-proof-strip span').evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).fontSize)));
        const expectedProofLabelMinimum = width === 1440 ? 24 : 19;
        assert(proofLabelFontSizes.every(size => size >= expectedProofLabelMinimum), `Statistic labels are too small: ${proofLabelFontSizes.join(', ')}`);
        assert(await page.locator('.mmc-follow-up-bar__heading p').innerText() === 'The Coalition Directory introduces the people and organizations working together to make Michigan more active.', 'Directory explanation is missing');
        assert(await page.locator('.mmc-follow-up-bar__roles').count() === 0, 'Removed Ambassador and Member follow-up blocks remain');
        const followUpActionStyle = await page.locator('.mmc-follow-up-bar > .mmc-btn').evaluate(element => {
          const style = getComputedStyle(element);
          return { height: Math.round(element.getBoundingClientRect().height), fontSize: parseFloat(style.fontSize), borderRadius: style.borderRadius };
        });
        assert(followUpActionStyle.height >= 70 && followUpActionStyle.fontSize === 20 && followUpActionStyle.borderRadius === '12px', `Directory action styling is incorrect: ${JSON.stringify(followUpActionStyle)}`);
        const followUpActionColors = await page.locator('.mmc-follow-up-bar > .mmc-btn').evaluate(element => {
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, color: style.color };
        });
        assert(followUpActionColors.background === 'rgb(239, 215, 142)' && followUpActionColors.color === 'rgb(15, 56, 64)', `Directory action colors are incorrect: ${JSON.stringify(followUpActionColors)}`);
        assert(await page.locator('.mmc-follow-up-directory-link').getAttribute('style') === 'background:#efd78e!important;color:#0f3840!important;border-radius:12px!important', 'WordPress-safe inline directory action styles are missing');
        assert(await page.locator('.mmc-shared-register').count() === 1, 'Expected one shared registration link');
        assert(await page.locator('.mmc-shared-register').getAttribute('href') === formUrl, 'Registration form URL is wrong');
        assert(await page.locator('.mmc-shared-register__arrow').count() === 0, 'Registration arrow circle remains');
        assert(await page.getByText('Ready to get involved?').count() === 0, 'Registration helper label remains');
        const registerStyle = await page.locator('.mmc-shared-register').evaluate(element => {
          const style = getComputedStyle(element);
          return { border: style.borderTopWidth, shadow: style.boxShadow, fontSize: parseFloat(getComputedStyle(element.querySelector('strong')).fontSize), fontWeight: getComputedStyle(element.querySelector('strong')).fontWeight };
        });
        assert(registerStyle.border === '0px' && registerStyle.shadow !== 'none' && registerStyle.fontSize >= 21 && registerStyle.fontWeight === '800', 'Primary registration action styling is incorrect');
        const heroHeights = await page.locator('.mmc-hero__actions .mmc-btn').evaluateAll(links => links.map(link => Math.round(link.getBoundingClientRect().height)));
        assert(heroHeights.length === 2 && heroHeights[0] === heroHeights[1], `Hero buttons are not equal height: ${heroHeights.join(', ')}`);
        const pathwayDetails = page.locator('.mmc-pathway-details');
        assert(await pathwayDetails.count() === 2, 'Expected two role-card expanders');
        await pathwayDetails.first().locator('summary').click();
        assert(await pathwayDetails.evaluateAll(items => items.every(item => item.open)), 'Role cards did not expand together');
        await page.waitForTimeout(300);
        const expandedBodyHeights = await page.locator('.mmc-pathway-details__body').evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().height)));
        assert(expandedBodyHeights.length === 2 && expandedBodyHeights[0] === expandedBodyHeights[1], `Expanded role content is not top-aligned with whitespace below the shorter card: ${expandedBodyHeights.join(', ')}`);
        await pathwayDetails.nth(1).locator('summary').click();
        assert(await pathwayDetails.evaluateAll(items => items.every(item => !item.open)), 'Role cards did not collapse together');
        if (width === 1440) {
          const pathwayHeights = await page.locator('.mmc-pathway-lane').evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().height)));
          assert(pathwayHeights.length === 2 && pathwayHeights[0] === pathwayHeights[1], `Role-card bottoms are not aligned: ${pathwayHeights.join(', ')}`);
          const detailTops = await page.locator('.mmc-pathway-details').evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().top)));
          assert(detailTops.length === 2 && detailTops[0] === detailTops[1], `Activities and benefits rows are not aligned: ${detailTops.join(', ')}`);
        }
      }

      for (const link of await page.locator('a').all()) {
        const href = await link.getAttribute('href');
        if (!href || /^https?:/.test(href) || href.startsWith('mailto:')) continue;
        const resolved = new URL(href, page.url());
        const response = await page.request.get(resolved.href);
        assert(response.ok(), `Broken internal link: ${resolved.href} (${response.status()})`);
        if (resolved.hash) {
          const targetPage = await browser.newPage();
          await targetPage.goto(resolved.href);
          assert(await targetPage.locator(resolved.hash).count() === 1, `Missing anchor target: ${resolved.href}`);
          await targetPage.close();
        }
      }
      console.log('PASS', path, width);
    }
  }

  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto(`${baseUrl}/get-involved/variation-a/`);
  await page.screenshot({ path: '/tmp/mimoves-get-involved.png', fullPage: true });

  await page.goto(`${baseUrl}/directory/variation-a/`);
  await page.evaluate(() => { window.MMC_DIRECTORY_RECORDS[0].organizationLogoUrl = '/missing-logo.jpg'; });
  await page.addScriptTag({ url: `${baseUrl}/assets/directory.js` });
  await page.waitForTimeout(200);
  const brokenLogoCard = page.locator('.mmc-directory-card').filter({ hasText: 'Kate Steele' });
  assert(await brokenLogoCard.locator('.mmc-org-logo img').count() === 0, 'Broken logo did not fall back to organization initials');
  assert(await brokenLogoCard.locator('.mmc-org-logo--initials').count() === 1, 'Broken logo did not receive the initials fallback treatment');
  await page.screenshot({ path: '/tmp/mimoves-directory.png', fullPage: true });

  console.log('Page errors', errors);
  assert(errors.length === 0, 'Browser reported script errors');
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
