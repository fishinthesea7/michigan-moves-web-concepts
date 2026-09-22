import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(root, 'wordpress');
const assetBase = 'https://fishinthesea7.github.io/michigan-moves-web-concepts/assets';
const directoryUrl = 'https://mimoves.org/coalition-directory/';
const joiningUrl = 'https://mimoves.org/join-the-movement/';
const packageVersion = '2026-09-22.5';

const css = (await readFile(resolve(root, 'docs/assets/prototype.css'), 'utf8'))
  .replaceAll('./images/', `${assetBase}/images/`);

function extractPageBody(html) {
  const match = html.match(/<!-- BEGIN WORDPRESS \/ ELEMENTOR PAGE-BODY BLOCK -->\s*([\s\S]*?)\s*<!-- END WORDPRESS \/ ELEMENTOR PAGE-BODY BLOCK -->/);
  if (!match) throw new Error('The WordPress page-body markers are missing.');
  return match[1];
}

function replaceSharedUrls(markup) {
  return markup
    .replaceAll('../../assets/images/', `${assetBase}/images/`)
    .replaceAll('../../directory/variation-a/', directoryUrl)
    .replaceAll('../../get-involved/variation-a/', joiningUrl);
}

function wrap({ title, instructions, markup, scripts }) {
  return `<!--
  ${title}
  MIMOVES WORDPRESS PACKAGE VERSION: ${packageVersion}
  Paste this entire file into the WordPress page Code Editor or one Elementor HTML widget on a full-width page.
  ${instructions}
-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style id="mimoves-coalition-page-styles">
${css}
</style>
<div class="mmc-standalone">
${markup}
</div>
${scripts.map((source, index) => `<script id="mimoves-page-script-${index + 1}">\n${source}\n</script>`).join('\n')}
`;
}

async function buildJoiningPage() {
  const html = await readFile(resolve(root, 'docs/get-involved/variation-a/index.html'), 'utf8');
  const script = await readFile(resolve(root, 'docs/assets/get-involved.js'), 'utf8');
  return wrap({
    title: 'Michigan Moves Coalition — Joining page',
    instructions: `The hero currently uses the published prototype image. After uploading it to WordPress, replace only the URL inside --mmc-hero-image. The directory links assume the WordPress permalink ${directoryUrl}`,
    markup: replaceSharedUrls(extractPageBody(html)),
    scripts: [script]
  });
}

async function buildDirectoryPage() {
  const html = await readFile(resolve(root, 'docs/directory/variation-a/index.html'), 'utf8');
  const data = (await readFile(resolve(root, 'docs/assets/directory-data.js'), 'utf8'))
    .replaceAll('../../assets/images/', `${assetBase}/images/`);
  const script = await readFile(resolve(root, 'docs/assets/directory.js'), 'utf8');
  return wrap({
    title: 'Michigan Moves Coalition — Coalition Directory page',
    instructions: `The hero and approved organization logos currently use published prototype images. Replace each marked URL with its WordPress Media Library URL after upload. Empty organizationLogoUrl values automatically show organization initials. The joining link uses ${joiningUrl}`,
    markup: replaceSharedUrls(extractPageBody(html)),
    scripts: [data, script]
  });
}

await mkdir(outputDirectory, { recursive: true });
const joiningPage = await buildJoiningPage();
const directoryPage = await buildDirectoryPage();
await Promise.all([
  writeFile(resolve(outputDirectory, 'joining-page-elementor.html'), joiningPage),
  writeFile(resolve(outputDirectory, `joining-page-elementor-v${packageVersion.replaceAll('.', '-')}.txt`), joiningPage),
  writeFile(resolve(outputDirectory, 'coalition-directory-elementor.html'), directoryPage)
]);

console.log('Built WordPress Elementor handoff files in wordpress/.');
