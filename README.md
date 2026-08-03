# Michigan Moves Website Concepts

This repository contains a single, no-build GitHub Pages hub for sharing Michigan Moves webpage concepts during internal review. It does not modify or deploy to the live Michigan Moves website.

The hub groups completed variations for two pages:

- Get Involved — Variation A (comparison-first)
- Get Involved — Variation B (guided-choice)
- Coalition Directory — Variation A (map-first cards)
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
│   ├── feedback.css
│   ├── prototype.css
│   ├── feedback.js
│   ├── shared.js
│   ├── get-involved.js
│   ├── directory.js
│   └── directory-data.js
├── get-involved/
│   ├── variation-a/index.html
│   └── variation-b/index.html
└── directory/
    ├── variation-a/index.html
    └── variation-b/index.html
```

There is no build step, static-site generator, paid service, custom domain, or custom GitHub Actions workflow.

## GitHub Pages configuration

The intended repository is public and named `michigan-moves-web-concepts`.

- Branch: `main`
- Source: Deploy from a branch
- Publishing folder: `/docs`
- Custom domain: none

The connected GitHub account is `fishinthesea7`. The available connector cannot create repositories or configure Pages, and the local GitHub CLI is not installed, so the one-time repository and Pages setup below remains required.

### Hub URL

`https://fishinthesea7.github.io/michigan-moves-web-concepts/`

### Stable direct prototype URLs

- `https://fishinthesea7.github.io/michigan-moves-web-concepts/get-involved/variation-a/`
- `https://fishinthesea7.github.io/michigan-moves-web-concepts/get-involved/variation-b/`
- `https://fishinthesea7.github.io/michigan-moves-web-concepts/directory/variation-a/`
- `https://fishinthesea7.github.io/michigan-moves-web-concepts/directory/variation-b/`

The hub URL is the normal link to share for review. Direct links are stable bookmarks for individual concepts.

## Prototype feedback

Each hosted prototype includes a lightweight annotation layer for review:

- Right-click or double-click non-interactive page content to add a numbered comment pin.
- Drag the editor header to reposition a comment before saving.
- Select a numbered pin to reopen, edit, move, or delete its comment.
- Use the right-side feedback bookmark to review all comments on the current page in creation order.
- Use the Feedback disclosure attached to each hub card to review or edit that page’s comments.
- Hub Feedback disclosures open downward in the page flow. They push lower cards down, stop at roughly one card’s depth, and scroll internally when feedback is longer.
- Text entered in a prototype editor or hub edit form is saved continuously and recovered after a reload or browser restart, even before Save is selected.

`docs/assets/feedback.js` owns the shared data model and behavior. Each prototype supplies a stable `data-feedback-page` identifier on `<body>`, and the matching hub disclosure uses the same identifier. Saved comments use the `mmcPrototypeFeedbackV1` local-storage key; unfinished drafts use `mmcPrototypeFeedbackDraftsV1`. Saved edits synchronize between open hub and prototype tabs through browser storage events.

This remains a no-backend review aid. Comments and drafts persist only in the browser and device where they were created; they are not submitted to GitHub, emailed, or shared with reviewers on other devices. Clearing site data removes them. Cross-device comments and notifications require a separately approved database, server-side email workflow, and a secure method for distinguishing the site owner from other reviewers. A webpage cannot silently read a visitor’s Google account or otherwise reliably identify a real person without an authentication or owner-token mechanism.

## One-time GitHub setup

1. On GitHub, create a **public** repository named `michigan-moves-web-concepts`. Do not initialize it with a README, license, or `.gitignore` because this local repository already contains the project history.
2. From the project folder, add the new repository as the only remote:

   ```bash
   git remote add origin https://github.com/fishinthesea7/michigan-moves-web-concepts.git
   ```

3. Push the prepared `main` branch:

   ```bash
   git push -u origin main
   ```

4. In the repository, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select **main** and **/docs**, then choose **Save**.
7. Wait for GitHub Pages to report the published URL, then open the hub and four direct URLs above.

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

- **Variation A — comparison-first:** Equal-weight Ambassador and Coalition Member cards, a complete responsive comparison matrix, separate Partner callout, three-step timeline, live-form fallback panel, and static onboarding cards.
- **Variation B — guided-choice:** Accessible role tabs and a live detail panel, expandable full comparison, selected-role context in a vertical process, live-form fallback panel, and expandable onboarding sections.

Both versions use the same approved role content. Selecting either standard pathway preserves the selection on the page, moves focus to the join section, and clearly states that the external form is not prefilled. The Partner route continues to use `https://mimoves.org/contact-us/`; the live join form continues to use `https://wkf.ms/4gKvw3b`.

### Coalition Directory

- **Variation A — map-first cards:** A prominent prototype coverage component, integrated filter panel, responsive cards, and inline profile expansions.
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

Before publishing an update, serve `docs/` locally and verify the hub, four direct pages, review links, feedback pins and synchronized hub editing, mobile menu, role controls, accordions, form fallbacks, directory filters, A–Z navigation, map controls, consent gate, responsive layouts, relative assets, and browser console. After publishing, repeat the basic link, asset, mobile, and console checks against the deployed URLs.
