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
12. Never change or reuse an existing `data-feedback-page` identifier; it is the durable key for that page’s saved comments.
13. Never hard-delete, truncate, drop, reset, replace, or seed over `prototype_comments`, `prototype_comment_counters`, or `prototype_comment_history` during webpage work. Interface removal must remain a soft deletion through `deleted_at`.
14. Keep `prototype_comment_history` private and preserve its version-archive trigger whenever the feedback schema changes.
15. Before and after every prototype deployment, compare a read-only snapshot of active comment IDs and text. A deployment is not complete if existing comments disappear or change without an explicit reviewer action.
16. Back up or export the Supabase database before any feedback-schema migration. Never commit comment exports to this public repository.
17. Display comment numbers as a consecutive `1` through `N` index of active comments within each individual `data-feedback-page`. Reindex after a removal, and never use the visible number as a durable database identifier.

The `docs/` tree is canonical. Do not keep duplicate prototype HTML or shared assets elsewhere in the repository where copies could drift.
