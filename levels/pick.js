// Picks the best generated level for each slot of each chapter.
// Usage: node levels/pick.js <chapter>   (writes levels/generated/lv_<chapter>.json; takes about a minute)
const L = require('../src/logic.js'); const { make, evaluate } = require('./gen.js'); const path = require('path');
const base = { pil: [0.12, 0.2], pad: 0 };
const C = {
  loop:    { shape: 'flat', topo: 'ring', N: 20, M: 4, ...base },
  twist:   { shape: 'mobius', topo: 'mobius', N: 22, M: 4, ...base, pad: [0, 2], needSeam: true, vs: 'ring' },
  cube:    { shape: 'cube', k: 4, pil: [0.1, 0.18], pad: [0, 2] },
  twins:   { shape: 'mobius', topo: 'mobius', N: 20, M: 4, pil: [0.1, 0.17], balls: 2, goals: [1, 2], pad: [0, 1], needSeam: true, depth: 14 },
  quarter: { shape: 'quarter', topo: 'quarter', N: 20, M: 8, pil: [0.1, 0.16], pad: [0, 2], needSeam: true, vs: 'torus' },
  knot:    { shape: 'knot', topo: 'torus', N: 56, M: 6, pil: [0.09, 0.14], arrows: [4, 8], pad: [0, 2], needEv: 'a' },
  gates:   { shape: 'triple', topo: 'mobius', N: 24, M: 5, pil: [0.08, 0.13], pad: [1, 3], gates: [1, 2], needEv: 'b', needSeam: true, vs: 'ring' },
  portals: { shape: 'cube', k: 4, pil: [0.08, 0.14], pad: [0, 2], portals: [1, 2], needEv: 'o' },
  bottle:  { shape: 'klein', topo: 'klein', N: 16, M: 8, pil: [0.1, 0.16], pad: [0, 3], arrows: [0, 2], needSeam: true, vs: 'torus' },
};
// [chapter, [moves range for each level]]
const PLAN = [
  ['loop', [[2, 3], [5, 6], [7, 9]]],
  ['twist', [[2, 3], [5, 7], [7, 9], [8, 11]]],
  ['cube', [[2, 3], [5, 7], [7, 9], [8, 11]]],
  ['twins', [[2, 4], [5, 7], [6, 9], [7, 11]]],
  ['quarter', [[2, 4], [5, 7], [7, 10]]],
  ['knot', [[4, 6], [6, 8], [7, 10]]],
  ['gates', [[4, 6], [6, 8], [8, 11]]],
  ['portals', [[4, 6], [6, 9]]],
  ['bottle', [[5, 7], [7, 10]]],
];
const only = process.argv[2], out = [];
for (const [ch, slots] of PLAN) {
  if (only && ch !== only) continue;
  const cfg = C[ch], t0 = Date.now(), cands = [];
  const lo = Math.min(...slots.map(s => s[0])), hi = Math.max(...slots.map(s => s[1]));
  for (let seed = 1; seed < 60000 && Date.now() - t0 < 70000; seed++) {
    const sd = seed * 7919 + ch.length * 131; const lv = make(cfg, sd);
    const e = evaluate({ ...cfg, moves: [lo, hi], minDead: 0.08 }, lv); if (e) cands.push({ sd, e, lv });
  }
  const used = new Set();
  for (const [a, b] of slots) {
    const easy = a <= 3;
    const pool = cands.filter(c => c.e.moves >= a && c.e.moves <= b && !used.has(c.sd));
    // tutorials want few branches; real puzzles want long solutions, lots of states and plenty of traps
    const score = c => easy ? -c.e.states + c.e.moves * 4 : c.e.moves * 4 + c.e.deadFrac * 20 + Math.min(c.e.states, 400) / 25 + c.e.seams;
    pool.sort((x, y) => score(y) - score(x));
    const c = pool[0]; if (!c) { console.error('no level for', ch, a, b, 'from', cands.length); continue; }
    used.add(c.sd); const { _g, _t, ...lv } = c.lv; out.push({ ch, par: c.e.moves, sol: c.e.seq, ...lv });
    console.error(ch, `[${a},${b}]`, 'moves', c.e.moves, 'states', c.e.states, 'dead', c.e.deadFrac, 'seams', c.e.seams, 'ev', c.e.ev, 'cands', cands.length);
  }
}
if (!only) { console.error('pass a chapter name, e.g. node levels/pick.js twist'); process.exit(1); }
require('fs').writeFileSync(path.join(__dirname, 'generated', `lv_${only}.json`), JSON.stringify(out));
