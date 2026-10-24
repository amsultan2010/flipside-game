// Combines the hand-made tutorials with the generated levels, solves each one for its par, and writes levels.json.
// Usage: node levels/build.js
const L = require('../src/logic.js'), fs = require('fs'), path = require('path');
const order = ['loop', 'twist', 'cube', 'twins', 'quarter', 'knot', 'gates', 'portals', 'bottle'];
const P = (i, r, M = 4) => ({ t: 'p', id: i * 4 + r });
const tut = {
  loop: [
    { shape: 'flat', topo: 'ring', N: 24, M: 4, balls: [1], cells: [{ t: 'g', id: 6 * 4 + 1 }, P(3, 3), P(10, 0), P(15, 2), P(19, 3), P(13, 3)] },
    { shape: 'flat', topo: 'ring', N: 24, M: 4, balls: [4 * 4 + 1], cells: [{ t: 'g', id: 2 * 4 + 1 }, P(3, 1), P(4, 0), P(4, 2), P(1, 0), P(2, 2), P(9, 3), P(14, 0), P(18, 3), P(11, 2)] },
  ],
  twist: [{ shape: 'mobius', topo: 'mobius', N: 24, M: 4, balls: [2 * 4 + 0], cells: [{ t: 'g', id: 2 * 4 + 3 }, P(2, 1), P(7, 2), P(14, 2), P(20, 1), P(9, 1), P(17, 2)] }],
};
const out = [];
for (const ch of order) {
  const gen = JSON.parse(fs.readFileSync(path.join(__dirname, 'generated', `lv_${ch}.json`))).sort((a, b) => a.par - b.par);
  for (const l of [...(tut[ch] || []), ...gen]) {
    const lv = { ch, shape: l.shape, topo: l.topo, N: l.N, M: l.M, k: l.k, balls: l.balls, cells: l.cells, mask: l.mask || 0 };
    const s = L.solve({ ...lv }, 16); if (!s) throw new Error('unsolvable ' + ch);
    out.push({ ...lv, par: s.moves, sol: s.seq });
  }
}
out.forEach((l, i) => console.log(i + 1, l.ch, l.shape, 'par', l.par, 'balls', l.balls.length));
fs.writeFileSync(path.join(__dirname, 'levels.json'), JSON.stringify(out));
