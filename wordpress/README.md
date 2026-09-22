# WordPress / Elementor copy-paste package

Use a full-width WordPress page with one Elementor HTML widget. Paste the entire contents of the matching HTML file into that widget:

- `joining-page-elementor.html`
- `coalition-directory-elementor.html`

Each file contains the page body, the required CSS, and its required JavaScript. It excludes the GitHub Pages preview header, footer, comment tools, and review scripts.

The packages use the current GitHub Pages image URLs so they render immediately. After uploading the hero images and approved organization logos to the WordPress Media Library, replace those URLs with the full HTTPS Media Library URLs. Preserve the hero size and position values beside each image URL; they reproduce the reviewed image framing.

For a directory record, set `organizationLogoUrl` to its Media Library URL. Leave it as an empty string to show `organizationInitials` automatically. If a logo needs more or less space inside its circle, set `organizationLogoPadding` to a number from 0 through 20 on that record.

The joining package links to `https://mimoves.org/coalition-directory/`. If the final directory page uses another permalink, replace that URL in the joining file before pasting it.

Rebuild both files after future prototype changes with:

```bash
node scripts/build-wordpress-handoff.mjs
```
