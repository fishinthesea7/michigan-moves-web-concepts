# Michigan Moves Final Page Design Instructions

This document converts Mason’s pinned prototype comments, the complete `Website development.docx`, the `Tab 1` notes, the `Member vs. Ambassador` content, and the established Michigan Moves project brief into implementation decisions for the two final Variation A pages.

## Source and preservation rules

1. Keep the current Michigan Moves website as the visual authority and use the supplied education as the UI/UX decision framework.
2. Finalize the existing Variation A URLs. Do not create replacement URLs or duplicate pages.
3. Preserve the durable feedback keys `get-involved-variation-a` and `directory-variation-a`; they connect the pages to existing Supabase comments.
4. Keep the standalone review wrapper, header, footer, and feedback tools outside the clearly marked WordPress / Elementor page-body block.
5. Keep all page-body selectors within the `.mmc-page` namespace and avoid dependencies on a build system.
6. Do not add real participant data to the directory. Preserve the consent-first rendering gate and demonstration-only labels.

## Shared experience and visual direction

- Use a dark Michigan Moves teal hero as the primary visual anchor, followed by light, highly readable content sections.
- Use one dominant action in each decision area and style secondary actions as quieter outline or text links.
- Keep body copy near 60–80 characters per line on desktop and 35–45 on small screens.
- Use deliberate macro spacing between topics and tighter spacing within related groups. Avoid turning every sentence into a bordered card.
- Make the scroll path obvious with clear headings, directional buttons, and alternating dense/light sections.
- Preserve Inter, the established teal/gold/cream palette, compact uppercase eyebrow labels, moderate radii, restrained shadows, and the current site’s content width.
- Keep controls at least 44px high where they are touched, provide visible focus, and preserve full keyboard access.
- Use meaningful photography as a human entry point, not decoration. Each final hero gets one licensed, wide landscape image selected from Mason’s supplied Adobe Stock set. Keep the original source filenames documented, preserve informative alt text, and treat the displayed crop as the WordPress implementation reference.
- Do not imply that prototype content, profiles, regions, or statistics are real when they are not.

## Tubik education translated into Michigan Moves decisions

The source articles are not being treated as a list of generic best practices. Each principle maps to a visible interface decision:

1. **Page anatomy is a movement system.** Each page is organized around a deliberate eye path, scroll path, and decision zone. The hero orients; the next section lets the user act; later sections answer progressively narrower questions. No section exists only to decorate the scroll.
2. **Design for scanners.** Headlines state the question a visitor is trying to answer. Numerals become anchors: `0` required meetings, `4` virtual meetings per year, `3` registration steps, `100+` allies, `60+` organizations, and `10` sectors. Paragraphs hold one idea, and discrete information uses lists.
3. **One dominant CTA per decision zone.** A filled button identifies the next action; related but secondary paths use quieter text links. Partner never competes visually with Ambassador or Member registration. Directory filtering never competes with the search field.
4. **Use progressive disclosure like onboarding.** Visitors see fit and commitment before longer activity and benefit lists. Native `details` elements keep all approved information available without presenting a wall of text. Selecting a pathway preserves context and opens its matching onboarding information.
5. **Use dividers as punctuation, not decoration.** Major chapters use background shifts and macro spacing. Repeated items use aligned inset rules. The comparison uses one meaningful middle divider. Avoid card-inside-card layouts, stacked shadows, and borders around every paragraph.
6. **Negative space defines relationships.** Macro space separates chapters; micro space supports readable line height, button padding, and clear list rhythm. Content width is constrained to roughly 60–80 characters where sustained reading occurs.
7. **Search is the Directory’s intent shortcut.** The Directory places a large, labeled search field before explanatory content. Primary roles are immediate quick filters; sector, geography, and CEO Pledge controls sit in a secondary refinement disclosure. The live result count stays adjacent to the search decision zone.
8. **Cards are reserved for scan language.** Organization profiles remain equal-sized cards because they are repeated, comparable records. The Get Involved page uses two comparison lanes rather than two large floating cards because those lanes are one decision, not a catalog.
9. **Dark versus light follows reading needs.** Dark teal is reserved for emotional or decisive moments—the hero and registration runway. Text-heavy comparison, profile, and onboarding content uses light surfaces with stronger secondary-text contrast.
10. **Directional cues save effort.** Downward arrows connect hero actions to the next chapter; the numbered registration rail shows position and completion logic; related-page links appear after meaning-rich content instead of being scattered indiscriminately.
11. **The footer must provide closure.** The review overlay measures only in-flow document content and clamps old comment positions to that boundary. The page ends at the footer even after content or comments are removed.

## Final Get Involved page — Variation A

### Hero

- Use a concise split hero: the decision message on the left and licensed community-activity photography on the right.
- Lead with “Choose Your Level of Involvement” and the approved introduction.
- Make the low-lift difference the first comparison immediately after the hero: Ambassadors have `0` required meetings; Members join `4` virtual sector meetings per year, plus occasional between-meeting contribution.
- Use “Coalition allies” as the umbrella label in the 100+ statistic, not “Coalition members.” Keep the approved 60+ organizations and 10 sectors context.
- Include one primary “Compare the 2 pathways” action and a quieter text link to the Coalition Directory.

### Role comparison

- Use two equal-weight lanes inside one comparison board. A single middle divider communicates one shared decision without creating a cage of cards.
- Both lanes use the same information pattern: visible best fit and commitment, progressively disclosed activities and benefits, digital badge, optional consent-based directory listing, and a persistent role-specific registration CTA.
- Ambassador definition: an organization or individual interested in the work with no Coalition responsibilities; stays informed, shares resources and opportunities, promotes physical activity locally, and connects others. No meetings are required.
- Member definition: primarily an organization that joins a sector committee, shares expertise, identifies priorities, develops strategies, and helps implement the Michigan Physical Activity Plan. State the concrete commitment as four recurring virtual sector meetings per year plus occasional contribution between meetings.
- Use approved benefits only. Mark the digital badges and onboarding toolkits as included role materials without promising anything beyond the supplied content.
- Selecting either role must visibly preserve the selection, focus/scroll to registration, and identify the selected pathway without claiming the external form was prefilled.

### Partner pathway

- Keep Partner visible near the two main choices so the three-tier relationship model is understandable, but give it lower visual weight.
- Describe it only as a formal organizational relationship established by mutual agreement, above and beyond Coalition Member participation.
- Do not present Partner as a selectable registration-form role. Link to the Michigan Moves contact page.

### Joining process and registration

- Use “registration form” or “register,” never “join form.”
- Present the three-step process as one numbered registration runway: choose a level, complete the online registration form, receive role-specific onboarding.
- Say the form **will ask** for organization name, sector(s), region or counties served, primary contact, organization website, and areas of interest.
- Keep the live `https://wkf.ms/4gKvw3b` link on the page. The provider currently does not permit embedding, so use an honest in-page fallback panel rather than a fake form.
- Use “Ambassadors receive” and “Members receive” in onboarding headings; do not use “may receive.”
- Keep role-specific onboarding information exact and separate.
- Add a second, contextually placed Directory link near the end of the page.

## Final Coalition Directory page — Variation A

### Hero and orientation

- Use a concise split hero with licensed community-collaboration photography.
- Lead with “Michigan Moves Coalition Directory” and one direct search action. Place the restrained placeholder/permission notice in a separate, immediately following strip so it remains visible without crowding the hero.
- Explain the three primary roles compactly: Ambassador, Coalition Member, and Partner. Keep CEO Pledge Signer clearly secondary.

### Directory experience

- Remove the map and coverage section completely. No map is planned yet.
- Make search the first task immediately after orientation. Show primary-role quick filters next; disclose sector, geography, and CEO Pledge refinements as secondary controls.
- Keep keyword search, primary role, the 10 approved sectors, placeholder geography, CEO Pledge filter, A–Z navigation, clear filters, and dynamic result count.
- Keep a responsive card grid with expandable profile details. The cards should be compact enough to scan but still show role, sectors, geography, representative, and conditional CEO Pledge status.
- Keep the useful empty-state reset and all combined-filter behavior.
- Keep CEO Pledge Signer as a conditional badge/filter only; never add it to primary roles or create a separate group.
- Keep the visible demonstration-data note and public-directory consent explanation near the filters/results.
- Preserve the hard privacy sequence: first exclude every record where `directoryConsent !== true`, then perform all search, filter, A–Z, count, and rendering logic.

### Closing action

- Link the directory hero and closing CTA to the finalized Get Involved Variation A page.
- Refer to the official online registration form, not a “join form.”

## Licensed photography handoff

Use these two supplied licensed images strategically:

- Get Involved: `AdobeStock_1372081553.jpeg` — a diverse group moving together outdoors. It reinforces movement, welcome, and collective momentum without labeling participants as volunteers.
- Directory: `AdobeStock_840964123.jpeg` — a diverse group actively collaborating over plans. It reinforces shared work and cross-sector strategy without implying a specific real Coalition meeting.

The web copies are resized to approximately 2560 pixels wide and stored in `docs/assets/images/`. The implementation keeps informative alt text easy to change and contains no third-party preview watermark.

## WordPress / Elementor handoff

- Transfer only the HTML between `BEGIN WORDPRESS / ELEMENTOR PAGE-BODY BLOCK` and `END WORDPRESS / ELEMENTOR PAGE-BODY BLOCK`.
- Transfer the relevant `.mmc-page` namespaced CSS from `docs/assets/prototype.css` and the page-specific vanilla JavaScript.
- Do not transfer the review notice, standalone header/footer mounts, hub link, or feedback scripts into production.
- Replace relative prototype links with the final WordPress permalinks during production integration while preserving the live Contact and registration-form URLs.

## Completion checks

- Test both pages at approximately 1440, 1024, 768, and 390px.
- Test all navigation, role selection, filtering, A–Z, resets, profile expansions, mobile menu, and feedback tools with mouse and keyboard.
- Confirm there are no console errors, missing assets, broken relative paths, or horizontal overflow.
- Confirm the live registration form and Contact links are correct.
- Confirm the Directory uses only placeholder records, no consent-false record reaches any result or count, and CEO Pledge is never a primary role.
- Read-only compare active Supabase comments before and after deployment. Do not alter feedback unless Mason explicitly requests it; resolved comments explicitly cleared for this revision remain recoverable through private history.
