# Michigan Moves Website Concepts

This repository contains a single, no-build GitHub Pages hub for sharing Michigan Moves webpage concepts during internal review. It does not modify or deploy to the live Michigan Moves website.

The hub groups completed variations for two pages:

- Get Involved — Variation A (final comparison-first direction)
- Get Involved — Variation B (guided-choice)
- Coalition Directory — Variation A (final search-first cards direction)
- Coalition Directory — Variation B (directory-first alphabetical rows)

Every hosted page includes a review notice, a link back to the hub, and `noindex, nofollow` metadata. These measures discourage indexing; they do **not** make GitHub Pages private.

## Publishing structure

`docs/` is the canonical publishing tree. Do not maintain duplicate prototypes outside it.

```text
docs/
├── index.html
├── .nojekyll
├── robots.txt
├── 404.html
├── assets/
│   ├── hub.css
│   ├── feedback-config.js
│   ├── feedback.css
│   ├── prototype.css
│   ├── feedback.js
│   ├── shared.js
│   ├── get-involved.js
│   ├── directory.js
│   ├── directory-data.js
│   └── images/
│       ├── get-involved-hero.jpg
│       └── directory-hero.jpeg
├── get-involved/
│   ├── variation-a/index.html
│   └── variation-b/index.html
└── directory/
    ├── variation-a/index.html
    └── variation-b/index.html

supabase/
└── feedback-schema.sql
```

There is no build step, static-site generator, paid service, custom domain, or custom GitHub Actions workflow.

## GitHub Pages configuration

The intended repository is public and named `michigan-moves-web-concepts`.

- Branch: `main`
- Source: Deploy from a branch
- Publishing folder: `/docs`
- Custom domain: none

The repository is `fishinthesea7/michigan-moves-web-concepts`, and GitHub Pages is configured to publish the canonical `docs/` folder from `main`.

### Hub URL

`https://fishinthesea7.github.io/michigan-moves-web-concepts/`

### Stable direct prototype URLs

- `https://fishinthesea7.github.io/michigan-moves-web-concepts/get-involved/variation-a/`
- `https://fishinthesea7.github.io/michigan-moves-web-concepts/get-involved/variation-b/`
- `https://fishinthesea7.github.io/michigan-moves-web-concepts/directory/variation-a/`
- `https://fishinthesea7.github.io/michigan-moves-web-concepts/directory/variation-b/`

The hub URL is the normal link to share for review. Direct links are stable bookmarks for individual concepts.

The final-page decisions used for Variation A are recorded in [`FINAL-DESIGN-INSTRUCTIONS.md`](FINAL-DESIGN-INSTRUCTIONS.md). That file translates the pinned reviewer comments and the full supplied website-design document into concrete content, hierarchy, interaction, accessibility, photography, and WordPress handoff rules.

## Prototype feedback

Each hosted prototype includes a lightweight annotation layer for review:

- Right-click or double-click non-interactive page content to add a numbered comment pin.
- Drag the editor header to reposition a comment before saving.
- Select a numbered pin to reopen, edit, move, or delete its comment.
- Use the right-side feedback bookmark to review all comments on the current page in creation order.
- Use the Feedback disclosure attached to each hub card to review or edit that page’s comments.
- Hub Feedback disclosures open downward in the page flow. They push lower cards down, stop at roughly one card’s depth, and scroll internally when feedback is longer.
- Text entered in a prototype editor or hub edit form is saved continuously and recovered after a reload or browser restart, even before Save is selected.
- Saved comments are loaded from one shared database, so a comment created or edited on one device appears on another device after refresh, refocus, or the short background refresh interval.
- Publishing or redesigning the static hub and prototype pages does not replace the shared database, so saved comments remain attached to their stable page identifiers.
- Removing a shared comment through the interface is a recoverable soft deletion. Prior versions are archived privately before every edit or removal.
- Visible comment numbers are scoped to one concept and always reflect that concept's current active list. If an earlier comment is removed, the remaining comments are immediately relabeled `1` through `N`; other concepts have independent numbering.

`docs/assets/feedback.js` owns the shared data model and behavior. Each prototype supplies a stable `data-feedback-page` identifier on `<body>`, and the matching hub disclosure uses the same identifier. Shared connection values live in `docs/assets/feedback-config.js`, and the database definition and row-level policies live in `supabase/feedback-schema.sql`.

Unfinished drafts intentionally remain browser-local under `mmcPrototypeFeedbackDraftsV1` until Save is selected. The most recent shared results are cached under `mmcPrototypeSharedFeedbackCacheV1` so the interface can show its last known state during a temporary connection problem. Comments made before shared storage was enabled remain under `mmcPrototypeFeedbackV1`; when found, the interface offers an explicit **Publish to shared review** control rather than uploading them silently.

There are no email notifications, identity prompts, owner tokens, or user accounts. Consequently, this is an open collaborative review surface: anyone who has the public GitHub Pages URL can read, create, edit, or remove visible comments. Without identity, the webpage cannot technically distinguish a comment’s creator from another visitor. Removals are therefore retained as soft-deleted database rows, and previous versions remain in the private `prototype_comment_history` table. Do not place sensitive, personal, or confidential information in comments.

### Comment-retention rules

- Never rename an existing `data-feedback-page` value; it is the durable relationship between a page and its comments.
- Treat visible comment numbers as page-local labels, not permanent record identifiers. Code and integrations must use the immutable comment UUID and stable `data-feedback-page` value instead.
- Ordinary HTML, CSS, JavaScript, and GitHub Pages deployments must not run database deletion or replacement operations.
- Never truncate or drop `prototype_comments`, `prototype_comment_counters`, or `prototype_comment_history` during a prototype update.
- Before deploying, record the current active comment IDs and text through the read-only public endpoint. After deployment, confirm the same records remain unless a reviewer intentionally changed them during the deployment window.
- Before changing the feedback schema, make a Supabase database backup or export.
- Interface removal sets `deleted_at`; it does not hard-delete the row. A Supabase administrator can restore a comment by setting its `deleted_at` value back to `null`.
- `prototype_comment_history` has row-level security enabled and no public policies. Only the Supabase project administrator should inspect or use it for recovery.

### Shared-comment configuration

The current public prototype is connected to its dedicated Supabase project through the public values in `docs/assets/feedback-config.js`. The following steps are required only when rebuilding or replacing that database:

1. Create a Supabase project dedicated to these public prototype comments.
2. In its SQL Editor, run the complete [`supabase/feedback-schema.sql`](supabase/feedback-schema.sql) file.
3. In the project’s Connect dialog or **Settings → API Keys**, copy the Project URL and the `sb_publishable_...` key.
4. Add those two public values to `docs/assets/feedback-config.js`:

   ```js
   window.MMC_FEEDBACK_CONFIG = {
     supabaseUrl: 'https://PROJECT-REF.supabase.co',
     supabasePublishableKey: 'sb_publishable_REPLACE_ME',
     table: 'prototype_comments',
     pollIntervalMs: 15000
   };
   ```

5. Never place a Supabase secret key, legacy `service_role` key, database password, or access token in this repository.
6. Serve `docs/` locally and verify create, refresh, edit, recoverable removal, and retention across two different browser origins or devices before publishing.

If the Project URL or publishable key is removed, the UI clearly reports that shared storage is pending and retains browser-local behavior rather than pretending comments are cross-device.

## GitHub deployment

The existing remote is:

```text
https://github.com/fishinthesea7/michigan-moves-web-concepts.git
```

Publish an approved update without changing any stable URL by committing the existing files and pushing `main`:

```bash
git push origin main
```

GitHub Pages then republishes `main` → `/docs`. If that configuration is ever lost, restore it under **Settings → Pages → Deploy from a branch → main → /docs**.

Do not add GitHub credentials, personal access tokens, or private keys to this repository.

## Run locally

Serve the canonical publishing folder so local paths match GitHub Pages behavior:

```bash
python3 -m http.server 4173 --bind 127.0.0.1 --directory docs
```

Open:

```text
http://127.0.0.1:4173/
http://127.0.0.1:4173/get-involved/variation-a/
http://127.0.0.1:4173/get-involved/variation-b/
http://127.0.0.1:4173/directory/variation-a/
http://127.0.0.1:4173/directory/variation-b/
```

The prototypes load the current public Michigan Moves logo and Inter font over the internet. Page layout and interactions are served locally from `docs/`.

## Add a new prototype

1. Create `docs/<page-slug>/<variation-slug>/index.html`.
2. Reuse the shared assets in `docs/assets/` through relative paths. A page two folders below `docs/` should use paths such as `../../assets/prototype.css`.
3. Add `<meta name="robots" content="noindex, nofollow">`.
4. Add the review notice and a `../../` link back to the hub outside the WordPress-transferable page-body block.
5. Add a completed-prototype card to `docs/index.html` using a relative link.
6. Run the public-content safety audit and local browser checks before committing or publishing.

Follow the durable rules in `AGENTS.md`.

## Update an existing prototype

Edit the existing `index.html` and shared assets in place. Do not rename its page or variation folders, because those paths are the stable review URLs. Verify the existing direct URL after every deployment.

## Variation notes

### Get Involved

- **Variation A — final comparison-first direction:** A lean split-image hero leads to a proof strip and two plain-language comparison lanes. Commitment is reduced to the decisive numbers—zero required meetings for Ambassadors and four virtual meetings per year for Members—while activities and benefits remain available through progressive disclosure. A restrained Partner rail, dark three-step registration runway, honest form fallback, and role-specific onboarding complete one continuous decision path.
- **Variation B — guided-choice:** Accessible role tabs and a live detail panel, expandable full comparison, selected-role context in a vertical process, live-form fallback panel, and expandable onboarding sections.

Both versions use the same approved role content. Selecting either standard pathway preserves the selection on the page, moves focus to the registration section, and clearly states that the external form is not prefilled. The Partner route continues to use `https://mimoves.org/contact-us/`; the live registration form continues to use `https://wkf.ms/4gKvw3b`.

### Coalition Directory

- **Variation A — final search-first cards direction:** A lean split-image hero moves directly into a large labeled search field and live result count. Primary roles are immediate quick filters; sector, geography, and CEO Pledge status are secondary refinements. A compact role legend, prominent A–Z navigation, equal-sized scan-friendly cards, and inline profile expansions keep organization-finding—not interface explanation—as the page’s main task. The map remains removed because Michigan Moves is not introducing it yet.
- **Variation B — alphabetical rows:** Persistent desktop filters, a collapsed mobile filter disclosure, prominent A–Z navigation, compact inline-expandable rows, and a secondary prototype map disclosure.

Both versions use `docs/assets/directory-data.js` and `docs/assets/directory.js`. The source array contains nine unmistakable placeholder records; only the eight records with `directoryConsent: true` may enter search, totals, map calculations, A–Z navigation, or rendering. CEO Pledge Signer is a boolean secondary credential and never a primary role or separate directory section.

Change the temporary visible person label once in `window.MMC_DIRECTORY_CONFIG.representativeLabel` inside `docs/assets/directory-data.js`.

## WordPress / Elementor handoff

Each prototype HTML file marks the transferable block:

```html
<!-- BEGIN WORDPRESS / ELEMENTOR PAGE-BODY BLOCK -->
...
<!-- END WORDPRESS / ELEMENTOR PAGE-BODY BLOCK -->
```

Transfer only the `<main class="mmc-page ...">` block. Do not transfer the review notice, standalone preview header, or standalone footer.

Enqueue `docs/assets/prototype.css` plus the applicable page script. Directory pages also require `directory-data.js` before `directory.js`. `shared.js` builds only the hosted standalone header and footer. The review-only `feedback.css` and `feedback.js` files stay outside the WordPress handoff unless a separate production feedback system is explicitly approved.

Variation A hero photography lives in `docs/assets/images/`. Mason supplied the licensed Adobe Stock originals; the optimized web copies use `AdobeStock_1372081553.jpeg` for Get Involved and `AdobeStock_840964123.jpeg` for the Directory. In WordPress, upload the approved originals or optimized copies to the Media Library, replace the relative image URLs in the transferable blocks, retain the supplied alt text, and use the displayed crops as the implementation reference.

## Public-access warning and safety

GitHub Pages is publicly accessible to anyone with the URL. `robots.txt` and page-level no-index metadata are voluntary crawler directives, not access control. Never publish credentials, private contact information, internal meeting notes, unapproved organization/member records, or real directory data without explicit consent.

## Troubleshooting

### The site returns 404

- Confirm the repository is public.
- Confirm Pages uses **Deploy from a branch → main → /docs**.
- Confirm `docs/index.html` exists on the pushed `main` branch.
- Wait a few minutes after the first Pages configuration or a new push.
- Open the repository's **Settings → Pages** panel for the current deployment URL and status.

### A prototype or asset returns 404

- Confirm the direct URL ends with a trailing slash.
- Confirm the page remains at `docs/<page-slug>/<variation-slug>/index.html`.
- Check that HTML uses relative `../../assets/...` references and does not begin internal paths with `/`.
- Check letter case; GitHub Pages paths are case-sensitive.

### A deployment does not update

- Confirm the latest commit reached `main`.
- Check the repository's Pages deployment status.
- Hard-refresh the page after deployment completes.
- Keep `.nojekyll` in `docs/` so static files are served without Jekyll processing.

## Verification expectations

Before publishing an update, capture a read-only feedback snapshot, serve `docs/` locally, and verify the hub, four direct pages, review links, feedback pins and synchronized hub editing, recoverable removal, mobile menu, role controls, accordions, form fallbacks, directory filters, A–Z navigation, the Variation B map controls, consent gate, responsive layouts, relative assets, true footer closure, and browser console. After publishing, confirm the comment snapshot is intact and repeat the basic link, asset, mobile, footer, and console checks against the deployed URLs.
