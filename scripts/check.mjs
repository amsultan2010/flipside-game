// Checks every level: it must be solvable, its par must be the true minimum, and the stored solution must win.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const L = require('../src/logic.js'), levels = require('../levels/levels.json');
let bad = 0;
levels.forEach((lv0, i) => {
  const lv = { ...lv0 }, s = L.solve(lv, 40);
  let st = { b: lv.balls.slice(), mask: lv.mask || 0 }, won = false;
  for (const d of lv0.sol || []) { const r = L.slide(lv, st, d); st = r.end; won = r.won; }
  const ok = s && s.moves === lv0.par && won;
  if (!ok) { bad++; console.log(`level ${i + 1} (${lv0.ch}): ${!s ? 'unsolvable' : s.moves !== lv0.par ? `par ${lv0.par} but best is ${s.moves}` : 'stored solution does not win'}`); }
});
console.log(bad ? `${bad} problem(s)` : `all ${levels.length} levels ok`);
process.exit(bad ? 1 : 0);
