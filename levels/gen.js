// Level generator: random layouts, kept only when the solver says they make good puzzles.
const L = require('../src/logic.js');
function rng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pickN = (r, a) => Array.isArray(a) ? Math.floor(a[0] + r() * (a[1] - a[0] + 1)) : (a || 0);
// how many tiles each shape has
const SIZE = l => l.shape === 'cube' ? 6 * l.k * l.k : l.N * l.M;
function make(cfg, seed) {
  const r = rng(seed), lv = { shape: cfg.shape, topo: cfg.topo, N: cfg.N, M: cfg.M, k: cfg.k, cells: [], balls: [], mask: 0 };
  const n = SIZE(lv), used = new Set();
  const free = () => { for (let t = 0; t < 400; t++) { const id = Math.floor(r() * n); if (!used.has(id)) { used.add(id); return id; } } return -1; };
  const nb = pickN(r, cfg.balls || 1);
  for (let b = 0; b < nb; b++) lv.balls.push(free());
  for (let g = 0, m = pickN(r, cfg.goals || 1); g < m; g++) lv.cells.push({ t: 'g', id: free() });
  const np = Math.round(n * (cfg.pil[0] + r() * (cfg.pil[1] - cfg.pil[0])));
  for (let q = 0; q < np; q++) lv.cells.push({ t: 'p', id: free() });
  for (let q = 0, m = pickN(r, cfg.pad); q < m; q++) lv.cells.push({ t: 's', id: free() });
  for (let q = 0, m = pickN(r, cfg.arrows); q < m; q++) lv.cells.push({ t: 'a', id: free(), d: Math.floor(r() * 4) });
  for (let q = 0, m = pickN(r, cfg.portals); q < m; q++) { lv.cells.push({ t: 'o', id: free(), c: q }); lv.cells.push({ t: 'o', id: free(), c: q }); }
  for (let g = 0, m = pickN(r, cfg.gates); g < m; g++) {
    lv.cells.push({ t: 'b', id: free(), c: g });
    for (let q = 0, ng = 1 + Math.floor(r() * 3); q < ng; q++) lv.cells.push({ t: 'd', id: free(), c: g });
    if (r() < 0.6) lv.mask |= 1 << g;
  }
  lv.cells = lv.cells.filter(c => c.id >= 0); lv.balls = lv.balls.filter(b => b >= 0);
  return lv;
}
function evaluate(cfg, lv) {
  const sol = L.solve(lv, cfg.depth || 14, true); if (!sol) return null;
  if (sol.moves < cfg.moves[0] || sol.moves > cfg.moves[1]) return null;
  // replay the solution to see what it uses
  let s = { b: lv.balls.slice(), mask: lv.mask }, ev = new Set(), seams = 0;
  for (const d of sol.seq) { const res = L.slide(lv, s, d); for (const st of res.steps) for (const q of st) { if (q.ev) ev.add(q.ev); if (q.seam) seams++; } s = res.end; }
  if (cfg.needEv && !cfg.needEv.split('').every(e => ev.has(e))) return null;
  if (cfg.needSeam && !seams) return null;
  if (cfg.vs) {
    // the special shape must matter: on the plain version the same layout should not be as easy
    const plain = { ...lv, topo: cfg.vs, _g: null, _t: null }; const s2 = L.solve(plain, cfg.depth || 14); if (s2 && s2.moves <= sol.moves) return null;
  }
  if (sol.states < (cfg.minStates || 20)) return null;
  const deadFrac = sol.dead / sol.states;
  if (deadFrac < (cfg.minDead ?? 0.1)) return null;
  return { moves: sol.moves, states: sol.states, dead: sol.dead, deadFrac: +deadFrac.toFixed(2), seams, ev: [...ev].join(''), seq: sol.seq };
}
module.exports = { make, evaluate };
