# Project Instructions

## Shareable Web Prototypes

Future Codex-created webpage prototypes in this project must:

1. Be placed at `docs/<page-slug>/<variation-slug>/index.html`.
2. Use relative paths that remain valid under a GitHub Pages project subdirectory.
3. Be added to `docs/index.html` only after the prototype is usable.
4. Include the review notice, a link back to the hub, and `<meta name="robots" content="noindex, nofollow">`.
5. Contain only information suitable for public access.
6. Be served and tested locally before publishing.
7. Preserve the existing stable URL when updating a prototype.
8. Never deploy to `mimoves.org` without separate, explicit authorization.
9. Include the shared review feedback assets, a stable `data-feedback-page` identifier, and a matching feedback disclosure on the hub card.
10. Add each new feedback page identifier to the allowlist constraint in `supabase/feedback-schema.sql` before publishing it.
11. Preserve shared cross-device comments and browser-local draft recovery; do not add notifications, identity prompts, user accounts, or owner-token behavior unless the user separately authorizes that change.

The `docs/` tree is canonical. Do not keep duplicate prototype HTML or shared assets elsewhere in the repository where copies could drift.
