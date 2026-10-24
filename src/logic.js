// ---- Puzzle logic: a tiled surface as a graph of cells; shared by the game and the level generator ----
// Each cell has four exits in its own frame: 0 = +u, 1 = -u, 2 = +v, 3 = -v. An exit either leads to a
// neighbour (arriving with some direction in that neighbour's frame) or is a wall.
// Balls slide until something stops them; every ball moves in the same frame direction at once.
// Tile types: p pillar, g goal hole, a arrow (d = exit index), s soft pad (stops), b button (c = colour), d gate (c),
//             o portal (c = pair id; you come out of the other one, still rolling the same way)
const LOGIC = (() => {
  const mod = (a, n) => ((a % n) + n) % n;
  // grids drawn on a parametric surface: N cells along u, M across v
  function paramGraph(spec) {
    const { N, M } = spec, n = N * M, to = new Int32Array(n * 4).fill(-1), nd = new Int8Array(n * 4), seam = new Uint8Array(n * 4);
    const id = (i, r) => i * M + r;
    for (let i = 0; i < N; i++) for (let r = 0; r < M; r++) for (let d = 0; d < 4; d++) {
      const di = d === 0 ? 1 : d === 1 ? -1 : 0, dr = d === 2 ? 1 : d === 3 ? -1 : 0;
      let ni = i + di, nr = r + dr, nd2 = d, cross = 0;
      if (ni >= N || ni < 0) { ni = mod(ni, N); cross = 1; if (spec.wrapR) { nr = spec.wrapR(nr, di); if (spec.flipV && dr) nd2 = d ^ 1; } }
      if (spec.vWrap) nr = mod(nr, M); else if (nr < 0 || nr >= M) continue;
      const k = id(i, r) * 4 + d; to[k] = id(ni, nr); nd[k] = nd2; seam[k] = cross;
    }
    return { n, to, nd, seam, N, M, kind: 'param' };
  }
  const TOPO = {
    ring: (N, M) => paramGraph({ N, M }),
    mobius: (N, M) => paramGraph({ N, M, wrapR: r => M - 1 - r, flipV: true }),
    torus: (N, M) => paramGraph({ N, M, vWrap: true }),
    quarter: (N, M) => paramGraph({ N, M, vWrap: true, wrapR: (r, di) => mod(r + di * M / 4, M) }),
    klein: (N, M) => paramGraph({ N, M, vWrap: true, wrapR: r => mod(M / 2 - 1 - r, M), flipV: true }),
    cube: (k) => cubeGraph(k),
  };
  // a cube of k x k tiles per face; rolling off an edge carries you onto the next face, turning your direction
  const v3 = (x, y, z) => [x, y, z], add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  function cubeFaces() {
    // normal, then axis a; axis b = n x a so that a x b = n (same handedness as the strips)
    const F = [[v3(1, 0, 0), v3(0, 0, -1)], [v3(-1, 0, 0), v3(0, 0, 1)], [v3(0, 1, 0), v3(1, 0, 0)], [v3(0, -1, 0), v3(1, 0, 0)], [v3(0, 0, 1), v3(1, 0, 0)], [v3(0, 0, -1), v3(-1, 0, 0)]];
    return F.map(([n, a]) => ({ n, a, b: cross3(n, a) }));
  }
  function cubeGraph(k) {
    const F = cubeFaces(), cells = [];
    F.forEach((f, fi) => { for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) cells.push({ f: fi, x, y, c: add(add(f.n.map(v => v * k / 2), f.a, x + 0.5 - k / 2), f.b, y + 0.5 - k / 2) }); });
    const n = cells.length, to = new Int32Array(n * 4).fill(-1), nd = new Int8Array(n * 4), seam = new Uint8Array(n * 4);
    const near = p => { let best = -1, bd = 1e9; cells.forEach((c, j) => { const d = (c.c[0] - p[0]) ** 2 + (c.c[1] - p[1]) ** 2 + (c.c[2] - p[2]) ** 2; if (d < bd) { bd = d; best = j; } }); return best; };
    cells.forEach((c, j) => {
      const f = F[c.f], dirs = [f.a, f.a.map(v => -v), f.b, f.b.map(v => -v)];
      dirs.forEach((t, d) => {
        let p = add(c.c, t), go = t, nf = c.f;
        const along = dot(p, t);
        if (along > k / 2) { p = add(add(c.c, t, 0.5), f.n, -0.5); go = f.n.map(v => -v); nf = F.findIndex(g => dot(g.n, t) > 0.5); seam[j * 4 + d] = 1; }
        const tj = near(p), g = F[cells[tj].f], gd = [g.a, g.a.map(v => -v), g.b, g.b.map(v => -v)];
        to[j * 4 + d] = tj; nd[j * 4 + d] = gd.findIndex(q => dot(q, go) > 0.5);
      });
    });
    return { n, to, nd, seam, k, cells, faces: F, kind: 'cube' };
  }
  function graphFor(L) { if (!L._g) L._g = L.shape === 'cube' ? TOPO.cube(L.k) : TOPO[L.topo](L.N, L.M); return L._g; }
  function tiles(L) { if (!L._t) { L._t = new Map(); for (const c of L.cells) L._t.set(c.id, c); } return L._t; }
  const closed = (c, mask) => !!(mask >> c.c & 1);
  // all balls roll in direction d (in their own frames) until each one stops; returns the steps for animation
  function slide(L, st, d) {
    const Gr = graphFor(L), T = tiles(L); let mask = st.mask;
    const balls = st.b.map(c => ({ c, d, moving: c >= 0 }));
    const steps = [], seen = new Set();
    const blockedTile = (c, m) => { const t = T.get(c); return t && (t.t === 'p' || (t.t === 'd' && closed(t, m))); };
    for (let guard = 0; guard < 600; guard++) {
      const key = balls.map(b => b.c + ':' + (b.moving ? b.d : 'x')).join(',') + '|' + mask; if (seen.has(key)) break; seen.add(key);
      // where each moving ball wants to go
      const want = balls.map(b => { if (!b.moving) return null; const k = b.c * 4 + b.d, t = Gr.to[k]; if (t < 0 || blockedTile(t, mask)) return null; return { t, nd: Gr.nd[k], seam: Gr.seam[k], from: b.c, d: b.d }; });
      // a ball cannot move into a ball that is staying put, two balls cannot share a tile, and they cannot pass through each other
      let changed = true;
      while (changed) {
        changed = false;
        balls.forEach((b, i) => {
          const w = want[i]; if (!w) return;
          balls.forEach((o, j) => {
            if (i === j || o.c < 0 || !want[i]) return;
            const ow = want[j];
            if (!ow && o.c === w.t) { want[i] = null; changed = true; }
            else if (ow && ow.t === w.t) { want[i] = null; want[j] = null; changed = true; }
            else if (ow && ow.t === b.c && w.t === o.c) { want[i] = null; want[j] = null; changed = true; }
          });
        });
      }
      const step = [];
      balls.forEach((b, i) => { if (b.moving && !want[i]) b.moving = false; });
      if (!want.some(w => w)) break;
      balls.forEach((b, i) => {
        const w = want[i]; if (!w) return;
        b.c = w.t; b.d = w.nd; const t = T.get(w.t), ev = t ? t.t : '';
        const rec = { ball: i, from: w.from, to: w.t, dir: w.d, seam: w.seam, ev };
        if (t) {
          if (t.t === 'g') { b.c = -1 - w.t; b.moving = false; rec.sink = true; }
          else if (t.t === 'a') b.d = t.d;
          else if (t.t === 's') b.moving = false;
          else if (t.t === 'b') { mask ^= 1 << t.c; rec.mask = mask; }
          else if (t.t === 'o') { const other = L.cells.find(o => o.t === 'o' && o.c === t.c && o.id !== t.id); if (other && !balls.some(q => q !== b && q.c === other.id)) { rec.portal = other.id; b.c = other.id; } }
        }
        step.push(rec);
      });
      steps.push(step);
    }
    const end = { b: balls.map(b => b.c), mask };
    const won = end.b.every(c => c < 0);
    return { steps, end, won, moved: steps.length > 0 };
  }
  const sk = s => s.b.join(',') + '|' + s.mask;
  // breadth-first search for the fewest swipes; also maps every reachable state for the generator
  function solve(L, maxDepth = 16, full = false) {
    const s0 = { b: L.balls.slice(), mask: L.mask || 0 };
    const prev = new Map([[sk(s0), null]]); let frontier = [s0], found = null, depth = 0;
    const edges = full ? new Map() : null;
    for (let dd = 0; dd < maxDepth && frontier.length; dd++) {
      const next = [];
      for (const s of frontier) for (let d = 0; d < 4; d++) {
        const res = slide(L, s, d); if (!res.moved) continue;
        const k = sk(res.end);
        if (full) { const a = edges.get(sk(s)) || []; a.push(res.won ? 'WIN' : k); edges.set(sk(s), a); }
        if (res.won) { if (!found) { found = { from: sk(s), d, depth: dd + 1 }; if (!full) break; } continue; }
        if (prev.has(k)) continue;
        prev.set(k, { from: sk(s), d }); next.push(res.end);
      }
      if (found && !full) break;
      frontier = next; depth = dd + 1;
    }
    if (!found) return null;
    const seq = [found.d]; let k = found.from; while (prev.get(k)) { const p = prev.get(k); seq.unshift(p.d); k = p.from; }
    const out = { moves: found.depth, seq, states: prev.size };
    if (full) {
      // states from which the puzzle can no longer be solved: traps
      const good = new Set(), rev = new Map();
      for (const [a, list] of edges) for (const b of list) { if (b === 'WIN') good.add(a); else { const r = rev.get(b) || []; r.push(a); rev.set(b, r); } }
      const q = [...good]; while (q.length) { const x = q.pop(); for (const y of rev.get(x) || []) if (!good.has(y)) { good.add(y); q.push(y); } }
      out.dead = prev.size - good.size;
    }
    return out;
  }
  return { TOPO, graphFor, slide, solve, cubeFaces, mod };
})();
if (typeof module !== 'undefined') module.exports = LOGIC;
