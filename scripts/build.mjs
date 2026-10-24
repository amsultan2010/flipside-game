// Builds the game into one self-contained page: dist/index.html.
// It stitches src/page.html (markup and styles) and src/game.js (the game), and inlines the surface maths,
// the puzzle logic and the level data where game.js has the /*SURF*/, /*LOGIC*/ and /*LEVELS*/ markers.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');

const page = read('src/page.html');
const logic = read('src/logic.js').replace("if (typeof module !== 'undefined') module.exports = LOGIC;", '');
// the game only needs what it draws; the stored solutions are for the checker
const levels = JSON.parse(read('levels/levels.json')).map(({ sol, _g, _t, ...l }) => l);
const game = read('src/game.js')
  .replace('/*SURF*/', () => read('src/surf.js'))
  .replace('/*LOGIC*/', () => logic)
  .replace('/*LEVELS*/', () => JSON.stringify(levels));

// page.html is a fragment: everything up to </style> belongs in <head>, the rest in <body>
const cut = page.indexOf('</style>') + '</style>'.length;
const favicon = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 60"><path d="M27 8L49 20.5 27 33 5 20.5z" fill="#ffe9da"/><path d="M5 20.5L27 33v24L5 44.5z" fill="#f5bccf"/><path d="M49 20.5L27 33v24l22-12.5z" fill="#8ea8ee"/><path d="M27 1L36 13.5 27 18.5 18 13.5z" fill="#5fcfbf"/></svg>');
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="description" content="Flipside: a calm puzzle game about rolling a ball across one-sided worlds like Möbius strips, knots and Klein bottles.">
<meta name="theme-color" content="#eef8e8">
<link rel="icon" href="${favicon}">
${page.slice(0, cut).trim()}
</head>
<body>
${page.slice(cut).trim()}
${game.trim()}
</body>
</html>
`;
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), html);
console.log(`dist/index.html  ${(html.length / 1024).toFixed(0)} KB, ${levels.length} levels`);
