// Builds the game into one self-contained page: dist/index.html.
// It stitches src/page.html (markup and styles) and src/game.js (the game), and inlines the surface maths,
// the puzzle logic and the level data where game.js has the /*SURF*/, /*LOGIC*/ and /*LEVELS*/ markers.
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');

const page = read('src/page.html');
const logic = read('src/logic.js').replace("if (typeof module !== 'undefined') module.exports = LOGIC;", '');
// the game only needs what it draws; the stored solutions are for the checker
const levels = JSON.parse(read('levels/levels.json')).map(({ sol, _g, _t, ...l }) => l);
// @vercel/analytics (from npm) is inlined too, so the page stays one file and needs no bundler
const va = read('node_modules/@vercel/analytics/dist/index.mjs')
  .replace(/\/\/# sourceMappingURL=.*$/m, '')
  .replace(/export \{[^}]*\};?/, 'return { inject, track };');
const game = read('src/game.js')
  .replace('/*ANALYTICS*/', () => `const VercelAnalytics = (() => {\n${va}\n})();`)
  .replace('/*SURF*/', () => read('src/surf.js'))
  .replace('/*LOGIC*/', () => logic)
  .replace('/*LEVELS*/', () => JSON.stringify(levels));

// page.html is a fragment: everything up to </style> belongs in <head>, the rest in <body>
const cut = page.indexOf('</style>') + '</style>'.length;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="description" content="Flipside: a calm puzzle game about rolling a ball across one-sided worlds like Möbius strips, knots and Klein bottles.">
<meta name="theme-color" content="#eef8e8">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Flipside">

${page.slice(0, cut).trim()}
</head>
<body>
${page.slice(cut).trim()}
${game.trim()}
</body>
</html>
`;
mkdirSync(join(root, 'dist'), { recursive: true });
// icons, manifest and anything else in public/ are served as they are
cpSync(join(root, 'public'), join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), html);
console.log(`dist/index.html  ${(html.length / 1024).toFixed(0)} KB, ${levels.length} levels`);
