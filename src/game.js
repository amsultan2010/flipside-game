<script type="module">
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
/*ANALYTICS*/

const $ = id => document.getElementById(id);
const V3 = THREE.Vector3, TAU = Math.PI * 2, PI = Math.PI;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const mod = (a, n) => ((a % n) + n) % n;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const coarse = matchMedia('(pointer: coarse)').matches;
// Vercel Web Analytics, from the @vercel/analytics package (the build inlines it as VercelAnalytics).
// inject() counts page views; track() sends custom events, which Vercel records on Pro plans.
const localDev = /^(localhost|127\.0\.0\.1|)$/.test(location.hostname);
try { VercelAnalytics.inject({ mode: localDev ? 'development' : 'production' }); } catch (_) {}
const track = (name, data) => { try { VercelAnalytics.track(name, data); } catch (_) {} };
const Y = new V3(0, 1, 0);
const col = c => c instanceof THREE.Color ? c.clone() : new THREE.Color(c);

/*SURF*/
/*LOGIC*/
const LEVELS = /*LEVELS*/;

// =====================================================================================
// Chapters: each one a shape, a palette and a new idea
// =====================================================================================
const CH = {
  loop:    { num: 'I', name: 'Loop', blurb: 'a ring with no end', bg: ['#fff3e4', '#ffcdbf'], pal: { top: '#fff1e2', left: '#f9c4ae', right: '#de9aa6', low: '#b78cb4' }, pil: '#ff8a63', acc: '#f26b4f', root: 293.66,
    hints: ['@ROLL The ball keeps going until something stops it.', 'The ring has no end. Sometimes the long way round is the only way.', 'Plan a few moves ahead. Every stop matters.'] },
  twist:   { num: 'II', name: 'Twist', blurb: 'one half-twist', bg: ['#eef8e8', '#bfe5d2'], pal: { top: '#f5f0d8', left: '#b4e1c9', right: '#86b9b2', low: '#b49ac0' }, pil: '#c9c24a', acc: '#2fae8c', root: 261.63,
    hints: ['A half-twist joins the far lane to yours. Roll all the way round.', 'Each trip through the twist puts you in the opposite lane.'] },
  cube:    { num: 'III', name: 'Cube', blurb: 'edges turn you', bg: ['#f1f6ff', '#c4d9ff'], pal: { top: '#ffe9da', left: '#f5bccf', right: '#8ea8ee', low: '#6d80dc' }, pil: '#5fcfbf', acc: '#4a78ee', root: 246.94,
    hints: ['Roll off an edge and you carry on down the next face.', 'Your heading turns with the cube. Straight ahead up here is sideways down there.'] },
  twins:   { num: 'IV', name: 'Twins', blurb: 'two balls, one swipe', bg: ['#f6f0ff', '#d9cdff'], pal: { top: '#fff3ea', left: '#dccbff', right: '#a08fe8', low: '#7c6fd2' }, pil: '#ff9fb6', acc: '#7d5cff', root: 220,
    hints: ['One swipe rolls both balls the same way along the strip. Sink them both.', 'After one goes through the twist, the same way becomes the opposite way.'] },
  quarter: { num: 'V', name: 'Quarter Turn', blurb: 'a square tube that turns', bg: ['#fff8e0', '#ffdba6'], pal: { top: '#fff5df', left: '#ffd08e', right: '#e8968c', low: '#c47b9e' }, pil: '#ff7c55', acc: '#ee851b', root: 277.18,
    hints: ['A square tube with a quarter-twist. Every lap moves you round onto the next face.', 'Four laps and you are back where you began.'] },
  knot:    { num: 'VI', name: 'Knot', blurb: 'a tube tied in a trefoil', bg: ['#fff0f6', '#ffcadf'], pal: { top: '#fff3f6', left: '#ffc2d7', right: '#c99ce2', low: '#9c86d8' }, pil: '#5ac8bd', acc: '#ee5f98', root: 311.13,
    hints: ['A tube tied in a knot. Arrows turn the ball.', ''] },
  gates:   { num: 'VII', name: 'Gates', blurb: 'three half-twists', bg: ['#fff2e6', '#f8cfb6'], pal: { top: '#fff2e3', left: '#f4bd9e', right: '#cc8e98', low: '#9b7aa8' }, pil: '#e96b4c', acc: '#e3653f', root: 233.08,
    hints: ['Soft pads stop the ball. Buttons lift and lower the gates of their colour.', ''] },
  portals: { num: 'VIII', name: 'Portals', blurb: 'faces that touch', bg: ['#e9fbf6', '#addfe2'], pal: { top: '#f8f3e5', left: '#a3e0d6', right: '#64b1bf', low: '#5a8bb8' }, pil: '#ff9b7c', acc: '#159d95', root: 207.65,
    hints: ['Roll into a portal and you come out of its twin, still rolling the same way.', ''] },
  bottle:  { num: 'IX', name: 'Bottle', blurb: 'no inside at all', bg: ['#f0ecff', '#c3d6ff'], pal: { top: '#f6f2ff', left: '#cbc0f7', right: '#8c90e2', low: '#6f72c8' }, pil: '#ffc46b', acc: '#6a57f0', root: 196,
    hints: ['A glass Klein bottle. Roll through its neck and you end up inside.', ''] },
};
for (const ch of Object.values(CH)) {
  const p = ch.pal; ch.stone = { top: p.top, left: col(p.left).lerp(col('#ffffff'), 0.18), right: p.right, low: p.low };
  ch.trim = { top: col(p.top).lerp(col(p.left), 0.4), left: col(p.left).lerp(col(p.top), 0.12), right: p.right, low: p.low };
}
const GATEC = ['#ff7a9c', '#4fb3ff'], PORTC = ['#ff9fd0', '#ffd36b'], BALLC = ['#4b4170', '#f07a5a'];
const chIdx = {}; LEVELS.forEach((l, n) => { l.n = n; l.kk = chIdx[l.ch] = (chIdx[l.ch] || 0) + 1; });

// =====================================================================================
// Save
// =====================================================================================
const SAVE = { solved: {}, muted: false, mus: 0.8, sfx: 0.8 };
try { Object.assign(SAVE, JSON.parse(localStorage.getItem('flipside.v3') || '{}')); } catch (e) {}
const writeSave = () => { try { localStorage.setItem('flipside.v3', JSON.stringify(SAVE)); } catch (e) {} };
const unlocked = n => n === 0 || SAVE.solved[n - 1] != null || SAVE.solved[n] != null;

// =====================================================================================
// Audio: a slow pad, and a soft note for every tile the ball rolls over
// =====================================================================================
const PENTA = [0, 2, 4, 7, 9];
const AU = {
  ctx: null, out: null, rev: null, pad: [], root: 261.63,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const ctx = this.ctx = new C(); this.out = ctx.createGain(); this.out.gain.value = SAVE.muted ? 0 : 0.9; this.out.connect(ctx.destination);
    const len = ctx.sampleRate * 3.5, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
    this.rev = ctx.createConvolver(); this.rev.buffer = ir; const rg = ctx.createGain(); rg.gain.value = 0.5; this.rev.connect(rg); rg.connect(this.out);
    // music and effects each get a dry and a reverb-send gain, so both sliders scale the echo too
    const bus = () => { const a = ctx.createGain(), b = ctx.createGain(); a.connect(this.out); b.connect(this.rev); return [a, b]; };
    [this.mus, this.musW] = bus(); [this.sfx, this.sfxW] = bus(); this.setVol(true);
    this.padBus = ctx.createGain(); this.padBus.gain.value = 0; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800;
    this.padBus.connect(lp); lp.connect(this.mus); const pw = ctx.createGain(); pw.gain.value = 0.7; lp.connect(pw); pw.connect(this.musW);
    this.padBus.gain.setTargetAtTime(0.05, ctx.currentTime, 3);
    this.chord(this.root);
  },
  mute(m) { SAVE.muted = m; writeSave(); if (this.out) this.out.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.1); },
  setVol(now) { if (!this.ctx) return; const t = this.ctx.currentTime, g = v => v * v * 1.5625;
    [[this.mus, SAVE.mus], [this.musW, SAVE.mus], [this.sfx, SAVE.sfx], [this.sfxW, SAVE.sfx]].forEach(([n, v]) => now ? (n.gain.value = g(v)) : n.gain.setTargetAtTime(g(v), t, 0.05)); },
  hz(i, oct = 0) { const o = Math.floor(i / 5), d = mod(i, 5); return this.root * Math.pow(2, o + oct + PENTA[d] / 12); },
  chord(root) {
    this.root = root; if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    this.pad.forEach(p => { p.g.gain.setTargetAtTime(0, t, 1.5); setTimeout(() => { try { p.o.stop(); } catch (e) {} }, 6000); });
    this.pad = [0, 2, 4, 6].map((n, k) => { const o = ctx.createOscillator(); o.type = k % 2 ? 'triangle' : 'sine'; o.frequency.value = this.hz(n, -1) * (1 + (k - 1.5) * 0.002);
      const g = ctx.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(k % 2 ? 0.3 : 0.5, t, 2.5); o.connect(g); g.connect(this.padBus); o.start(); return { o, g }; });
  },
  note(f, vel = 0.3, dur = 1.6, wet = 0.6, type = 'sine') {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime, g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * 0.2, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0004, t + dur);
    [[1, 1], [2, 0.25], [3.01, 0.08]].forEach(([m, a]) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * m; const og = ctx.createGain(); og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.05); });
    g.connect(this.sfx); const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(this.sfxW);
  },
  roll(k) { this.note(this.hz(5 + (k % 7)), 0.14, 0.9, 0.5); },
  stop() { this.note(this.hz(0, -1), 0.28, 0.35, 0.2, 'triangle'); },
  flip() { [7, 9, 11].forEach((n, i) => setTimeout(() => this.note(this.hz(n), 0.18, 1.4, 0.8), i * 70)); },
  click() { this.note(this.hz(10), 0.14, 0.5, 0.3, 'triangle'); },
  sink() { [5, 7, 9].forEach((n, i) => setTimeout(() => this.note(this.hz(n + 2), 0.22, 1.8, 0.8), i * 90)); },
  win() { [0, 2, 4, 5, 7, 10].forEach((n, i) => setTimeout(() => this.note(this.hz(n + 5), 0.32, 2.6, 0.8), i * 110)); },
};

// =====================================================================================
// Renderer and light: soft matte clay in a pastel void
// =====================================================================================
const canvas = $('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { $('err').hidden = false; $('err').textContent = 'Flipside needs WebGL, and this browser could not start it.'; throw e; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
// an orthographic camera: no perspective, like an isometric illustration
const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);

// Flat, illustrated shading with no lights at all. A surface takes the top tone when it faces up and a left
// or right tone depending on which way it faces on screen, then sinks into a soft haze lower down.
const SH = { uY: { value: new THREE.Vector2(-5, 5) }, uFog: { value: new THREE.Color('#ffffff') } };
const FACET_V = `
varying vec3 vN; varying vec3 vVN; varying vec3 vW; varying vec2 vUv;
void main() {
  vec4 p = vec4(position, 1.0); vec3 n = normal;
  #ifdef USE_INSTANCING
  p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
  #endif
  vec4 w = modelMatrix * p; vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vVN = normalize(mat3(viewMatrix) * vN); vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FACET_F = `
uniform vec3 uTop, uLeft, uRight, uLow, uFog; uniform vec2 uY, uGrid; uniform float uKind, uOpacity, uSpec, uHaze;
varying vec3 vN; varying vec3 vVN; varying vec3 vW; varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 n = normalize(vN), vn = normalize(vVN);
  if (!gl_FrontFacing) { n = -n; vn = -vn; }
  vec3 c;
  if (uKind > 2.5) c = uTop;
  else {
    vec3 side = mix(uLeft, uRight, smoothstep(-0.6, 0.6, vn.x));
    c = mix(side, uTop, smoothstep(0.2, 0.85, n.y));
    c = mix(c, uLow, smoothstep(-0.2, -0.9, n.y) * 0.5);
  }
  if (uKind > 0.5 && uKind < 1.5) {
    // paving: a groove between tiles and an engraved square inside each one
    vec2 g = vUv * uGrid, f = abs(fract(g) - 0.5); float m = max(f.x, f.y), aa = fwidth(m) * 1.5;
    float groove = smoothstep(0.455 - aa, 0.455 + aa, m), inner = 1.0 - smoothstep(0.0, aa * 1.2, abs(m - 0.31) - 0.01);
    c *= 1.0 - groove * 0.15 - inner * 0.07 + (hash(floor(g)) - 0.5) * 0.035;
  } else if (uKind > 1.5 && uKind < 2.5) {
    // slab edge: a light trim near the top and a carved notch under every tile
    float x = fract(vUv.x * uGrid.x), y = vUv.y, aa = fwidth(y) * 1.5, ax = fwidth(vUv.x * uGrid.x) * 1.5;
    float trim = 1.0 - smoothstep(0.0, aa, abs(y - 0.8) - 0.05);
    float notch = (1.0 - smoothstep(0.0, ax, abs(x - 0.5) - 0.16)) * (1.0 - smoothstep(0.0, aa, abs(y - 0.38) - 0.15));
    c = mix(c, c * 1.1 + 0.04, trim * 0.8); c *= 1.0 - notch * 0.13;
  }
  if (uSpec > 0.0) c += uSpec * pow(max(dot(vn, normalize(vec3(-0.45, 0.65, 0.62))), 0.0), 28.0);
  float h = clamp((vW.y - uY.x) / (uY.y - uY.x), 0.0, 1.0);
  c = mix(mix(c, uLow, 0.26 * uHaze), c, smoothstep(0.0, 0.9, h));
  c = mix(c, uFog, (1.0 - h) * (1.0 - h) * 0.42 * uHaze);
  float a = uOpacity;
  if (uKind < -0.5) a *= smoothstep(-0.32, 0.3, (vW.y - uY.x) / (uY.y - uY.x));
  if (uOpacity < 0.99) { float fr = pow(1.0 - abs(vn.z), 2.0); c += fr * 0.18; a = mix(uOpacity, 0.92, fr); }
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;
function facet(p, o = {}) {
  const U = { uTop: { value: col(p.top) }, uLeft: { value: col(p.left) }, uRight: { value: col(p.right) }, uLow: { value: col(p.low) }, uY: SH.uY, uFog: SH.uFog,
    uGrid: { value: new THREE.Vector2(...(o.grid || [1, 1])) }, uKind: { value: o.kind || 0 }, uOpacity: { value: o.opacity ?? 1 }, uSpec: { value: o.spec || 0 }, uHaze: { value: o.haze ?? 1 } };
  return new THREE.ShaderMaterial({ uniforms: U, vertexShader: FACET_V, fragmentShader: FACET_F, side: o.side ?? THREE.FrontSide, transparent: !!o.transparent || (o.opacity ?? 1) < 1, depthWrite: o.depthWrite ?? true });
}
// four tones from one colour: lit top, plain left, shaded right, deep low
function tones(hex, shade = '#5b4d8c') { const b = col(hex), s = col(shade); return { top: b.clone().lerp(col('#ffffff'), 0.4), left: b.clone(), right: b.clone().lerp(s, 0.3), low: b.clone().lerp(s, 0.55) }; }
const flat = c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });

// =====================================================================================
// Shapes. Every level is a tiled surface; a shape knows where each tile sits and how to draw itself.
// =====================================================================================
const H_STRIP = 0.2, RB = 0.34;
const ribbonMaterial = (ch, grid, o = {}) => facet(ch.pal, { kind: 1, grid, side: o.side ?? THREE.FrontSide, opacity: o.glass ? 0.5 : 1, depthWrite: !o.glass });
function paramShape(lv) {
  const N = lv.N, M = lv.M; let W, H = 0, both = false, glass = false;
  let legs = false;
  switch (lv.shape) {
    case 'flat': case 'mobius': case 'triple': case 'full': {
      const k = { flat: 0, mobius: 0.5, full: 1, triple: 1.5 }[lv.shape];
      W = new ParamWorld({ S: stripS(N / TAU, k), uPer: TAU, uMap: k % 1 ? v => -v : null, vMin: -M / 2, vMax: M / 2 }); H = H_STRIP; both = k > 0; legs = k === 0; break;
    }
    case 'torus': W = new ParamWorld({ S: torusS(N * 1.05 / TAU, M / TAU), uPer: TAU, vPer: TAU, flip: true }); break;
    case 'knot': W = new ParamWorld({ S: knotS(N * 1.25 / 28.246, M / TAU), uPer: TAU, vPer: TAU, flip: true }); break;
    case 'quarter': W = new ParamWorld({ S: quarterS(N / TAU, M, 0.28), uPer: TAU, vPer: M, uMap: (v, sg) => mod(v + sg * M / 4, M) }); break;
    case 'klein': W = new ParamWorld({ S: kleinS(3.9), uPer: PI, uMap: v => mod(PI - v, TAU), vPer: TAU, flip: true }); both = true; glass = true; break;
  }
  const strip = W.vMin != null, du = W.uPer / N, dv = strip ? (W.vMax - W.vMin) / M : W.vPer / M;
  const uc = i => (i + 0.5) * du, vc = r => strip ? W.vMin + (r + 0.5) * dv : (r + 0.5) * dv;
  const DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const sh = {
    W, H, both, glass, grid: [N, M],
    cell(id) { const i = Math.floor(id / M), r = id % M, f = W.frame(uc(i), vc(r)); const a = f.Su.clone().normalize(), n = f.n.clone(), b = new V3().crossVectors(n, a); return { P: f.P.clone(), n, a, b }; },
    edge(id, d) { const i = Math.floor(id / M), r = id % M, [di, dr] = DIR[d], P = new V3(); W.S(uc(i) + di * du / 2, vc(r) + dr * dv / 2, P); return P; },
    meshes(ch) { const out = ribbonMeshes(W, ch, N, M, H, glass); if (legs) out.push(...columns(W, ch, N, H)); return out; },
  };
  // make sure "outside" (side +1) points away from the middle of closed tubes such as the square one
  if (!strip && !W.flip && lv.shape === 'quarter') {
    const c = sh.cell(0), out = new V3(c.P.x, 0, c.P.z).normalize(); const radial = c.P.clone().sub(out.clone().multiplyScalar(N / TAU));
    if (c.n.dot(radial) < 0) W.flip = true;
  }
  return sh;
}
function cubeShape(lv) {
  const k = lv.k, Gr = LOGIC.graphFor(lv), toV = a => new V3(a[0], a[1], a[2]);
  return {
    W: null, H: 0, both: false, glass: false, grid: [k, k], cube: true,
    cell(id) { const c = Gr.cells[id], f = Gr.faces[c.f]; return { P: toV(c.c), n: toV(f.n), a: toV(f.a), b: toV(f.b) }; },
    edge(id, d) { const c = this.cell(id), t = [c.a, c.a.clone().negate(), c.b, c.b.clone().negate()][d]; return c.P.clone().addScaledVector(t, 0.5); },
    meshes(ch) {
      const g = new THREE.BoxGeometry(k, k, k), m = new THREE.Mesh(g, ribbonMaterial(ch, [k, k]));
      // squared stone trims along the cube's edges, with a little block on each corner
      const rims = new THREE.Group(), rm = facet(ch.trim), T = 0.16;
      for (const ax of [0, 1, 2]) for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const sz = [T, T, T]; sz[ax] = k; const bar = new THREE.Mesh(new THREE.BoxGeometry(...sz), rm); const p = [0, 0, 0]; const o = [(ax + 1) % 3, (ax + 2) % 3]; p[o[0]] = sx * k / 2; p[o[1]] = sy * k / 2;
        bar.position.set(...p); rims.add(bar);
      }
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), rm); b.position.set(x * k / 2, y * k / 2, z * k / 2); rims.add(b); }
      return [m, rims];
    },
  };
}
// columns under a flat ring, reaching down until they vanish in the haze
function columns(W, ch, N, H) {
  const out = [], m = facet(ch.stone, { kind: -1, transparent: true }), cm = facet(ch.trim, { kind: -1, transparent: true }), NC = 6, depth = N / TAU * 3;
  for (let q = 0; q < NC; q++) {
    const f = W.frame((q + 0.5) / NC * TAU, 0), top = f.P.y - H;
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.9, depth, 0.9), m); shaft.position.set(f.P.x, top - depth / 2, f.P.z);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 1.3), cm); cap.position.set(f.P.x, top - 0.08, f.P.z);
    const ring = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.1, 1.05), cm); ring.position.set(f.P.x, top - 0.6, f.P.z);
    const ang = Math.atan2(f.P.x, f.P.z); [shaft, cap, ring].forEach(o => { o.rotation.y = ang; o.userData.deco = true; out.push(o); });
  }
  return out;
}
function ribbonMeshes(W, ch, N, M, H, glass) {
  const out = [], strip = W.vMin != null, NU = N * (strip ? 12 : 8), NV = M * (strip ? 3 : 6);
  const v0 = strip ? W.vMin : 0, v1 = strip ? W.vMax : W.vPer;
  const sheet = (off, flipWind) => {
    const pos = [], nor = [], uv = [], idx = [];
    for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
      const u = i / NU * W.uPer, v = lerp(v0, v1, j / NV), f = W.frame(u, v), n = f.n.clone().multiplyScalar(W.flip ? -1 : 1);
      const p = f.P.clone().addScaledVector(f.n, off); pos.push(p.x, p.y, p.z); const nn = n.multiplyScalar(flipWind ? -1 : 1); nor.push(nn.x, nn.y, nn.z); uv.push(i / NU, j / NV);
    }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; if (flipWind) idx.push(a, a + 1, b, b, a + 1, b + 1); else idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
  };
  if (strip) {
    out.push(new THREE.Mesh(sheet(H, false), ribbonMaterial(ch, [N, M])), new THREE.Mesh(sheet(-H, true), ribbonMaterial(ch, [N, M])));
    const edgeM = facet(ch.trim, { kind: 2, grid: [N, 1], side: THREE.DoubleSide });
    for (const sg of [1, -1]) {
      const pos = [], nor = [], uvs = [], idx = [];
      for (let i = 0; i <= NU; i++) { const u = i / NU * W.uPer, f = W.frame(u, sg * W.vMax), s = f.Sv.clone().normalize().multiplyScalar(sg);
        for (const o of [H, -H]) { const p = f.P.clone().addScaledVector(f.n, o); pos.push(p.x, p.y, p.z); nor.push(s.x, s.y, s.z); uvs.push(i / NU, o > 0 ? 1 : 0); } }
      for (let i = 0; i < NU; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx);
      out.push(new THREE.Mesh(g, edgeM));
    }
  } else if (glass) {
    const g = sheet(0, false), b = new THREE.Mesh(g, ribbonMaterial(ch, [N, M], { glass: true, side: THREE.BackSide })), f = new THREE.Mesh(g, ribbonMaterial(ch, [N, M], { glass: true, side: THREE.FrontSide }));
    b.renderOrder = 1; f.renderOrder = 2; return [b, f];
  } else out.push(new THREE.Mesh(sheet(0, false), ribbonMaterial(ch, [N, M], { side: THREE.DoubleSide })));
  return out;
}

// =====================================================================================
// Building a level
// =====================================================================================
const G = { lv: null, ch: null, sh: null, grp: null, st: null, sides: [], moves: 0, undo: [], busy: false, anim: null, won: false,
  gates: [], buttons: [], portals: [], goals: [], center: new V3(), radius: 6, screen: 'title', demo: false, intro: 0, balls: [], sinkT: [] };
const chevronGeo = (() => { const s = new THREE.Shape(); s.moveTo(-0.26, -0.2); s.lineTo(0, 0.12); s.lineTo(0.26, -0.2); s.lineTo(0.26, 0.02); s.lineTo(0, 0.3); s.lineTo(-0.26, 0.02); s.closePath(); return new THREE.ShapeGeometry(s); })();
// where things sit on a tile: one matrix per playable face (y out of the face, x along the tile's +u)
function faceMats(id, lift = 0) {
  const c = G.sh.cell(id), out = [];
  for (const sg of (G.sh.both ? [1, -1] : [1])) {
    const n = c.n.clone().multiplyScalar(sg), m = new THREE.Matrix4().makeBasis(c.a, n, new V3().crossVectors(c.a, n));
    m.setPosition(c.P.clone().addScaledVector(n, G.sh.H + lift)); out.push(m);
  }
  return out;
}
function onFaces(obj, id, lift = 0.006) { return faceMats(id, lift).map((m, k) => { const o = k ? obj.clone() : obj; m.decompose(o.position, o.quaternion, o.scale); G.grp.add(o); return o; }); }
// the direction of exit d in a holder's local frame (x = +u, z = a x n)
const dirAngle = (d, sg) => { const loc = [[1, 0], [-1, 0], [0, -sg], [0, sg]][d]; return Math.atan2(-loc[0], -loc[1]); };
// a small tower for every blocked tile: plinth, shaft and capital in stone, then a pointed roof
const towerGeo = mergeGeometries([[0.78, 0.08, 0.04], [0.5, 0.36, 0.26], [0.66, 0.07, 0.475]].map(([w, h, y]) => new THREE.BoxGeometry(w, h, w).translate(0, y, 0)));
const roofGeo = new THREE.ConeGeometry(0.47, 0.36, 4, 1).rotateY(PI / 4).translate(0, 0.51 + 0.18, 0);
const pennantGeo = (() => { const g = new THREE.PlaneGeometry(0.42, 0.2, 6, 1).translate(0.21, 0, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * (1 - p.getX(i) / 0.46)); return g; })();
const blobTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(40,28,70,.42)'); g.addColorStop(0.6, 'rgba(40,28,70,.16)'); g.addColorStop(1, 'rgba(40,28,70,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
function buildLevel(n) {
  if (G.grp) { G.grp.traverse(o => { if (o.geometry && ![chevronGeo, towerGeo, roofGeo, pennantGeo].includes(o.geometry)) o.geometry.dispose(); if (o.material) o.material.dispose(); }); scene.remove(G.grp); }
  const lv = LEVELS[n], ch = CH[lv.ch]; lv._g = null; lv._t = null; G.lv = lv; G.ch = ch;
  G.sh = lv.shape === 'cube' ? cubeShape(lv) : paramShape(lv);
  const grp = G.grp = new THREE.Group(); scene.add(grp);
  G.sh.meshes(ch).forEach(m => grp.add(m));
  const bb = new THREE.Box3(); grp.children.forEach(o => { if (!o.userData.deco) bb.expandByObject(o); }); bb.getCenter(G.center); G.radius = bb.getSize(new V3()).length() / 2;
  SH.uY.value.set(G.center.y - G.radius * 0.95, G.center.y + G.radius * 0.7);
  G.gates = []; G.buttons = []; G.goals = []; G.portals = []; G.flags = [];
  // towers, drawn as two instanced meshes
  const tm = lv.cells.filter(t => t.t === 'p').flatMap(t => faceMats(t.id, 0));
  if (tm.length) {
    const st = new THREE.InstancedMesh(towerGeo, facet(ch.stone), tm.length), rf = new THREE.InstancedMesh(roofGeo, facet(tones(ch.pil, ch.pal.low)), tm.length);
    tm.forEach((m, i) => { st.setMatrixAt(i, m); rf.setMatrixAt(i, m); }); st.frustumCulled = rf.frustumCulled = false; grp.add(st, rf);
  }
  const accT = tones(ch.acc, ch.pal.low);
  for (const t of lv.cells) {
    if (t.t === 'g') {
      // a raised square plate with a hole, a glowing rim, a ripple and a little flag
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.9).translate(0, 0.025, 0), facet(ch.stone));
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.3, 40).rotateX(-PI / 2), flat(col(ch.acc).lerp(col('#2b2440'), 0.6))); hole.position.y = 0.052;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 8, 40).rotateX(PI / 2), facet(accT, { haze: 0.3 })); rim.position.y = 0.055;
      const pulse = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.41, 40).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false })); pulse.position.y = 0.058;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.92, 6).translate(0, 0.46, 0), facet(ch.stone)); pole.position.set(0.36, 0, -0.36);
      const flag = new THREE.Mesh(pennantGeo, flat(ch.acc)); flag.position.set(0.36, 0.82, -0.36);
      const h = new THREE.Group(); h.add(plate, hole, rim, pulse, pole, flag);
      const objs = onFaces(h, t.id, 0); objs.forEach(o => { G.flags.push(o.children[5]); }); G.goals.push({ objs, pulses: objs.map(o => o.children[3]), t });
    } else if (t.t === 'a') {
      const holder = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.03, 0.84).translate(0, 0.015, 0), facet({ top: col(ch.pal.top).lerp(col(ch.acc), 0.18), left: ch.pal.left, right: ch.pal.right, low: ch.pal.low }));
      const m = new THREE.Mesh(chevronGeo.clone().rotateX(-PI / 2), flat(ch.acc)); m.position.y = 0.034; holder.add(plate, m);
      const objs = onFaces(holder, t.id, 0); objs.forEach((o, k) => o.children[1].quaternion.setFromAxisAngle(Y, dirAngle(t.d, k ? -1 : 1)));
    } else if (t.t === 's') {
      // a soft cushion: square, low, with a stitched border of dots
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.08, 0.78).translate(0, 0.04, 0), facet(tones('#fffaf6', ch.pal.left)));
      const dots = new THREE.Group(), dm = flat(ch.acc); for (let q = 0; q < 8; q++) { const a = q / 8 * TAU, d = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10).rotateX(-PI / 2), dm); d.position.set(Math.sign(Math.cos(a)) * Math.min(1, Math.abs(Math.cos(a)) * 1.42) * 0.27, 0.082, Math.sign(Math.sin(a)) * Math.min(1, Math.abs(Math.sin(a)) * 1.42) * 0.27); dots.add(d); }
      const h = new THREE.Group(); h.add(pad, dots); onFaces(h, t.id, 0);
    } else if (t.t === 'b') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.06, 0.76), facet(ch.stone)); base.position.y = 0.03;
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.12, 28), facet(tones(GATEC[t.c], ch.pal.low), { haze: 0.4 })); top.position.y = 0.1;
      const h = new THREE.Group(); h.add(base, top); const objs = onFaces(h, t.id, 0); G.buttons.push({ t, objs, tops: objs.map(o => o.children[1]) });
    } else if (t.t === 'd') {
      const gm = facet(tones(GATEC[t.c], ch.pal.low), { opacity: 0.95 });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.56, 0.84), gm); wall.position.y = 0.28;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.07, 0.94), gm); cap.position.y = 0.595;
      const h = new THREE.Group(); h.add(wall, cap); const objs = onFaces(h, t.id, 0); G.gates.push({ t, objs, mat: gm, k: 1 });
    } else if (t.t === 'o') {
      const pc = PORTC[t.c % PORTC.length];
      const core = new THREE.Mesh(new THREE.CircleGeometry(0.31, 40).rotateX(-PI / 2), flat(col(pc).lerp(col('#ffffff'), 0.45))); core.position.y = 0.01;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.07, 10, 40).rotateX(PI / 2), facet(tones(pc, ch.pal.low), { haze: 0.4 })); ring.position.y = 0.05;
      const swirl = new THREE.Mesh(chevronGeo.clone().rotateX(-PI / 2).scale(0.6, 1, 0.6), flat(pc)); swirl.position.y = 0.015;
      const h = new THREE.Group(); h.add(core, ring, swirl); G.portals.push({ t, objs: onFaces(h, t.id, 0) });
    }
  }
  // dust drifting up through the scene
  const NP = 34, pp = new Float32Array(NP * 3); for (let i = 0; i < NP; i++) { pp[i * 3] = (Math.random() - 0.5) * 2.6 * G.radius; pp[i * 3 + 1] = (Math.random() - 0.5) * 2 * G.radius; pp[i * 3 + 2] = (Math.random() - 0.5) * 2.6 * G.radius; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  G.dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: '#ffffff', size: 1.8 * Math.min(devicePixelRatio || 1, 2), sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false }));
  G.dust.position.copy(G.center); G.dust.frustumCulled = false; grp.add(G.dust);
  setPalette(ch);
}
let bgFlip = false;
function setPalette(ch) {
  const r = document.documentElement.style; r.setProperty('--bg1', ch.bg[0]); r.setProperty('--bg2', ch.bg[1]); r.setProperty('--acc', ch.acc);
  const next = bgFlip ? $('bgA') : $('bgB'), cur = bgFlip ? $('bgB') : $('bgA');
  next.style.setProperty('--a1', ch.bg[0]); next.style.setProperty('--a2', ch.bg[1]); next.style.opacity = 1; cur.style.opacity = 0; bgFlip = !bgFlip;
  SH.uFog.value.set(ch.bg[1]); AU.chord(ch.root);
}

// =====================================================================================
// Balls, ghosts (seen through the surface), and the direction hints around the lead ball
// =====================================================================================
const ballGeo = new THREE.SphereGeometry(RB, 48, 32);
function makeBall(i) {
  const t = tones(BALLC[i], '#1d1638'); t.top = col(BALLC[i]).lerp(col('#ffffff'), 0.22);
  const m = new THREE.Mesh(ballGeo, facet(t, { spec: 0.5, haze: 0.25 })); scene.add(m);
  const g = new THREE.Mesh(ballGeo, new THREE.MeshBasicMaterial({ color: BALLC[i], transparent: true, opacity: 0.5, depthWrite: false, depthFunc: THREE.GreaterDepth })); g.renderOrder = 10; scene.add(g);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(RB * 2.4, RB * 2.4), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); scene.add(s);
  return { m, g, s, up: new V3(0, 1, 0) };
}
const BALLS = [makeBall(0), makeBall(1)];
const hints = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(chevronGeo.clone().rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide })); m.renderOrder = 11; m.scale.setScalar(0.85); scene.add(m); return m; });
const hintHit = hints.map(() => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })); scene.add(m); return m; });

// moving along the surface from one tile to the next, through the point between them
const flipEdge = (from, d) => { const Gr = LOGIC.graphFor(G.lv), to = Gr.to[from * 4 + d]; return G.sh.cell(from).n.dot(G.sh.cell(to).n) < -0.3; };
function pathPoint(from, d, s, f, out = new V3(), upOut = new V3()) {
  const Gr = LOGIC.graphFor(G.lv), to = Gr.to[from * 4 + d], A = G.sh.cell(from), B = G.sh.cell(to), E = G.sh.edge(from, d);
  const sB = flipEdge(from, d) ? -s : s, upA = A.n.clone().multiplyScalar(s), upB = B.n.clone().multiplyScalar(sB), upE = upA.clone().add(upB).normalize();
  const C = E.clone().multiplyScalar(2).sub(A.P.clone().add(B.P).multiplyScalar(0.5));
  out.copy(A.P).multiplyScalar((1 - f) * (1 - f)).addScaledVector(C, 2 * f * (1 - f)).addScaledVector(B.P, f * f);
  if (f < 0.5) upOut.copy(upA).lerp(upE, f * 2).normalize(); else upOut.copy(upE).lerp(upB, (f - 0.5) * 2).normalize();
  // offsets from the two faces of a thick strip blend the same way
  return out.addScaledVector(upOut, G.sh.H + RB);
}
function restPos(id, s, out = new V3()) { const c = G.sh.cell(id); return out.copy(c.P).addScaledVector(c.n, s * (G.sh.H + RB)); }
const lead = () => G.st.b.findIndex(c => c >= 0);

// =====================================================================================
// Game flow
// =====================================================================================
function startLevel(n, { demo = false } = {}) {
  buildLevel(n); const lv = G.lv;
  G.st = { b: lv.balls.slice(), mask: lv.mask || 0 }; G.sides = lv.balls.map(() => 1);
  G.moves = 0; G.hints = 0; G.hintDir = -1; G.queue = null; G.hintLater = false; G.rewinding = false; G.run = (G.run || 0) + 1; G.undo = []; G.busy = false; G.anim = null; G.won = false; G.demo = demo; G.sinkT = lv.balls.map(() => -1); G.nudge = null;
  BALLS.forEach((b, i) => { b.m.visible = b.g.visible = i < lv.balls.length; b.m.scale.setScalar(1); b.m.quaternion.identity(); });
  placeBalls(); syncGates(true);
  CAM.az = CAM.tAz = ballAz() + 0.5; CAM.el = CAM.tEl = 0.62; CAM.user = 0; CAM.zoom = 1; CAM.look = G.center.clone(); G.intro = demo ? 0 : 1.6;
  if (!demo) {
    $('hT').innerHTML = `${G.ch.num} · <i>${lv.kk}</i>`; $('hS').textContent = G.ch.name; $('hP').textContent = lv.par; syncMoves();
    SAVE.last = n; writeSave(); G.pendingHint = null; track('level_start', { level: n + 1, chapter: G.ch.name });
    if (G.cardCh !== lv.ch) { G.cardCh = lv.ch; showHint(''); G.pendingHint = G.ch.hints[lv.kk - 1] || ''; showCard(); } else showHint(G.ch.hints[lv.kk - 1] || '');
  }
}
// the chapter card: name and idea of a new chapter, drifting in over the scene and away again
let cardT = 0;
function showCard() {
  $('cK').textContent = `chapter ${G.ch.num}`; $('cN').textContent = G.ch.name; $('cB').textContent = G.ch.blurb;
  const c = $('card'); c.classList.remove('on'); void c.offsetWidth; c.classList.add('on'); document.documentElement.classList.add('card-on');
  clearTimeout(cardT); cardT = setTimeout(hideCard, 3200);
}
function hideCard() { clearTimeout(cardT); $('card').classList.remove('on'); document.documentElement.classList.remove('card-on'); if (G.pendingHint) { const h = G.pendingHint; G.pendingHint = null; setTimeout(() => { if (G.screen === 'play' && !G.moves) showHint(h); }, 500); } }
addEventListener('pointerdown', () => { if ($('card').classList.contains('on')) hideCard(); }, true);
function placeBalls() { G.st.b.forEach((c, i) => { if (c >= 0) { restPos(c, G.sides[i], BALLS[i].m.position); BALLS[i].up.copy(G.sh.cell(c).n).multiplyScalar(G.sides[i]); } }); }
function syncMoves() { $('hM').textContent = G.moves; $('bUndo').disabled = !G.undo.length; }
let hintT = 0;
function showHint(t) { const el = $('hint');
  if (t && t.startsWith('@ROLL')) t = (document.documentElement.classList.contains('touch') ? 'Tap the arrows on the pad to roll. Drag the view to look around, pinch to zoom.' : 'Use the arrow keys (or click an arrow on the ball) to roll. Drag to look around.') + t.slice(5); clearTimeout(hintT); if (!t) { el.classList.remove('on'); return; } el.textContent = t; el.classList.add('on'); hintT = setTimeout(() => el.classList.remove('on'), 9000); }
function syncGates(now) { for (const g of G.gates) { g.target = (G.st.mask >> g.t.c & 1) ? 1 : 0.04; if (now) g.k = g.target; } }
function tryMove(d) {
  if (G.busy || G.won || G.screen !== 'play' || G.intro > 0.3) return;
  const res = LOGIC.slide(G.lv, G.st, d);
  if (!res.moved) { AU.stop(); G.nudge = { d, t: 0 }; buzz([6, 40, 6]); return false; }
  buzz(9);
  G.undo.push({ st: { b: G.st.b.slice(), mask: G.st.mask }, sides: G.sides.slice(), q: BALLS.map(b => b.m.quaternion.clone()) }); G.moves++; G.hintDir = -1; syncMoves(); showHint('');
  // work out each ball's journey step by step, and which side of the surface it ends up on
  const nb = G.st.b.length, tl = Array.from({ length: nb }, () => []), side = G.sides.slice();
  res.steps.forEach((step, k) => step.forEach(rec => { const s0 = side[rec.ball]; const s1 = flipEdge(rec.from, rec.dir) ? -s0 : s0; side[rec.ball] = s1; tl[rec.ball][k] = { ...rec, s0, s1 }; }));
  G.busy = true; G.anim = { res, tl, side, t: 0, dur: 0.16 + res.steps.length * 0.075, from: G.st.b.slice(), played: 0 };
  AU.init(); return true;
}
const buzz = p => { if (G.demo) return; try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} };
// which of the four directions actually move something from here (cached, since the pad and chevrons ask every frame)
let mvC = { k: null, v: null };
function movable() { const k = G.lv.n + '|' + G.st.b.join(',') + '|' + G.st.mask; if (mvC.k !== k) mvC = { k, v: [0, 1, 2, 3].map(d => LOGIC.slide(G.lv, G.st, d).moved) }; return mvC.v; }
function undo() { if (G.busy || !G.undo.length || G.won) return; G.hintDir = -1; G.queue = null; const u = G.undo.pop(); G.st = u.st; G.sides = u.sides; BALLS.forEach((b, i) => { b.m.quaternion.copy(u.q[i]); b.m.scale.setScalar(1); }); G.sinkT = G.sinkT.map(() => -1); G.moves = Math.max(0, G.moves - 1); placeBalls(); syncGates(true); syncMoves(); AU.click(); }
// hints: the next move on a shortest route from here, for 5 extra moves. If no route exists any more,
// step back (visibly, one move at a time) to the last position that can still be solved, then hint from there.
// The search is exhaustive (no depth cap), so a long but possible route is never mistaken for a dead end.
const solvableFrom = st => LOGIC.solve({ ...G.lv, balls: st.b.slice(), mask: st.mask, _g: LOGIC.graphFor(G.lv), _t: null }, 999);
function hint() {
  if (G.won || G.screen !== 'play' || G.rewinding) return;
  if (G.busy) { G.hintLater = true; return; }   // pressed mid-roll: give it the moment the ball stops
  AU.init(); G.intro = 0; G.queue = null;
  const sol = solvableFrom(G.st);
  if (sol) { giveHint(sol, 0); return; }
  let k = G.undo.length - 1; while (k >= 0 && !solvableFrom(G.undo[k].st)) k--;
  if (k < 0) { reset(); return; }
  const steps = G.undo.length - k;
  G.moves += 5; G.hints++; syncMoves(); G.rewinding = true; G.busy = true; G.hintDir = -1;
  showHint(`No way out from here. Stepping back ${steps} ${steps === 1 ? 'move' : 'moves'} to where it can still be solved…`);
  const run = G.run, back = () => {
    if (G.run !== run) return;   // the level changed while stepping back
    const u = G.undo.pop(); G.st = u.st; G.sides = u.sides; BALLS.forEach((b, i) => { b.m.quaternion.copy(u.q[i]); b.m.scale.setScalar(1); }); G.sinkT = G.sinkT.map(() => -1);
    placeBalls(); syncGates(true); syncMoves(); AU.click();
    if (G.undo.length > k) setTimeout(back, 280);
    else setTimeout(() => { if (G.run !== run) return; G.rewinding = false; G.busy = false; G.queue = null; giveHint(solvableFrom(G.st), steps); }, 250);
  };
  setTimeout(back, 450);
}
function giveHint(sol, rewound) {
  G.hintDir = sol.seq[0]; if (!rewound) { G.moves += 5; G.hints++; syncMoves(); } AU.flip();
  const more = sol.moves - 1 ? `${sol.moves - 1} more after that.` : 'That one finishes it.';
  showHint(rewound ? `Back on track. Roll the glowing way. ${more}` : `Roll the glowing way. ${more}`);
}
function reset() { if (G.busy) return; startLevel(G.lv.n); G.intro = 0; AU.click(); }
const tmpP = new V3(), tmpU = new V3();
function stepAnim(dt) {
  const a = G.anim; if (!a) return;
  a.t += dt; const n = a.res.steps.length, p = clamp(ease(clamp(a.t / a.dur, 0, 1)) * n, 0, n), k = Math.min(n - 1, Math.floor(p)), f = p - k;
  a.tl.forEach((recs, i) => {
    const b = BALLS[i]; if (G.sinkT[i] >= 0) return;
    let pos;
    if (recs[k]) { const r = recs[k]; pos = pathPoint(r.from, r.dir, r.s0, f, tmpP, tmpU); }
    else {
      // resting: wherever its last move this swipe left it (or where it started)
      let last = null; for (let j = k; j >= 0; j--) if (recs[j]) { last = recs[j]; break; }
      if (!last) return; if (last.sink) return;
      const at = last.portal != null ? last.portal : last.to; pos = restPos(at, last.s1, tmpP); restPos(at, last.s1, tmpP);
      const c = G.sh.cell(at); tmpU.copy(c.n).multiplyScalar(last.s1);
    }
    const mv = pos.clone().sub(b.m.position), dd = mv.length(); if (dd > 1e-5 && dd < 2) b.m.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new V3().crossVectors(tmpU, mv).normalize(), dd / RB));
    b.m.position.copy(pos); b.up.copy(tmpU);
  });
  // events as each step is reached
  while (a.played < Math.min(n, Math.floor(p + 0.5))) {
    const step = a.res.steps[a.played]; a.played++; AU.roll(a.played);
    for (const rec of step) {
      if (flipEdge(rec.from, rec.dir)) AU.flip();
      if (rec.ev === 'b') { G.st.mask = rec.mask; syncGates(false); AU.click(); G.buttons.forEach(b => { if (b.t.id === rec.to) b.press = 1; }); }
      if (rec.ev === 'a' || rec.portal != null) AU.click();
      if (rec.sink) { G.sinkT[rec.ball] = 0; AU.sink(); }
    }
  }
  if (a.t >= a.dur) {
    G.st = { b: a.res.end.b.slice(), mask: a.res.end.mask }; G.sides = a.side.slice(); placeBalls(); syncGates(false);
    G.anim = null; G.busy = false;
    if (a.res.won) win(); else AU.stop();
  }
}
function win() {
  G.won = true;
  if (G.demo) { setTimeout(() => { if (G.demo) startLevel(DEMO, { demo: true }); }, 1800); return; }
  AU.win();
  track('level_complete', { level: G.lv.n + 1, chapter: G.ch.name, moves: G.moves, par: G.lv.par, hints: G.hints || 0, perfect: G.moves <= G.lv.par });
  const n = G.lv.n, best = SAVE.solved[n]; if (best == null || G.moves < best) SAVE.solved[n] = G.moves; writeSave();
  setTimeout(() => {
    if (!G.won || G.screen !== 'play') return;
    const perfect = G.moves <= G.lv.par;
    const last = n === LEVELS.length - 1, nx = LEVELS[n + 1], nch = nx && nx.ch !== G.lv.ch ? CH[nx.ch] : null;
    $('sL').textContent = `${G.ch.name} · ${G.ch.num} · ${G.lv.kk}`;
    $('sN').innerHTML = last ? 'Every world, and only one side.' : nch ? `next chapter · <b>${nch.num} <i>${nch.name}</i></b><br><i>${nch.blurb}</i>` : '';
    $('sT').textContent = last ? 'the end' : perfect ? 'perfect' : 'solved';
    $('sR').innerHTML = `${G.moves} ${G.moves === 1 ? 'move' : 'moves'} · par ${G.lv.par}${G.hints ? ` · ${G.hints} ${G.hints === 1 ? 'hint' : 'hints'}` : ''}${perfect ? '<span class="p">best</span>' : ''}`;
    $('bNext').hidden = n >= LEVELS.length - 1; show('solved');
  }, 1400);
}

// =====================================================================================
// Camera: a slow orbit around the little world that drifts toward the lead ball, and looks from
// underneath when the ball is hanging upside down
// =====================================================================================
const CAM = { az: 0, el: 0.6, tAz: 0, tEl: 0.6, dist: 30, user: 0, zoom: 1 };
function ballUp() { const i = Math.max(0, lead()), c = G.st.b[i]; if (c < 0) return Y; return G.sh.cell(c).n.clone().multiplyScalar(G.sides[i]); }
const ballAz = () => { const p = BALLS[Math.max(0, lead())].m.position; return Math.atan2(p.z - G.center.z, p.x - G.center.x); };
function updateCamera(dt) {
  if (!G.sh) return;
  const t = performance.now() / 1000;
  if (G.demo) { CAM.tAz = t * 0.08; CAM.tEl = 0.55 + Math.sin(t * 0.13) * 0.18; }
  else if (G.screen === 'solved') { CAM.tAz = CAM.az + 0.16; CAM.tEl = 0.5; }
  else if (performance.now() - CAM.user > (document.documentElement.classList.contains('touch') ? 6000 : 3500) && G.st) {
    const d = mod(ballAz() + 0.55 - CAM.az + PI, TAU) - PI; CAM.tAz = CAM.az + d;
    const up = ballUp(); CAM.tEl = up.y < -0.35 ? -0.5 : up.y < 0.35 ? 0.2 : 0.62;
  }
  const k = 1 - Math.exp(-dt * (G.demo ? 1 : 0.9));
  CAM.az += (CAM.tAz - CAM.az) * k; CAM.el += (CAM.tEl - CAM.el) * k;
  const portrait = innerWidth < innerHeight, aspect = innerWidth / innerHeight;
  const mult = (G.screen === 'title' ? (portrait ? 1.2 : 1.6) : (G.screen === 'solved' ? (portrait ? 0.92 : innerHeight > 500 ? 1.32 : 1.0) : portrait ? 0.84 : 0.86)) * (G.sh.cube ? 1.12 : 1) * CAM.zoom * (G.intro > 0 ? 1 + G.intro * 0.25 : 1);
  const hh = G.radius * mult / Math.min(1, aspect);
  camera.left = -hh * aspect; camera.right = hh * aspect; camera.top = hh; camera.bottom = -hh; CAM.dist = G.radius * 4 + 10; camera.far = CAM.dist * 3;
  const li = G.st && !G.demo ? lead() : -1, fz = li >= 0 ? clamp((1 - CAM.zoom) / 0.55, 0, 1) : 0;
  CAM.look = CAM.look || G.center.clone();
  const want = li >= 0 ? G.center.clone().lerp(BALLS[li].m.position, fz * 0.9) : G.center; CAM.look.lerp(want, 1 - Math.exp(-dt * 5));
  const c = CAM.look, e = clamp(CAM.el, -1.3, 1.3);
  camera.position.set(c.x + Math.cos(CAM.az) * Math.cos(e) * CAM.dist, c.y + Math.sin(e) * CAM.dist, c.z + Math.sin(CAM.az) * Math.cos(e) * CAM.dist);
  camera.up.set(0, 1, 0); camera.lookAt(c);
  // while the chapter card is up, the scene sits lower to leave the words room
  CAM.co = (CAM.co || 0) + ((document.documentElement.classList.contains('card-on') && G.screen === 'play' ? 1 : 0) - (CAM.co || 0)) * (1 - Math.exp(-dt * 3));
  const padUp = -innerHeight * (portrait ? 0.14 : 0.1) * CAM.co + (G.screen === 'solved' ? (portrait ? -innerHeight * 0.03 : innerHeight > 500 ? -innerHeight * 0.03 : 0) : portrait && G.screen === 'play' && document.documentElement.classList.contains('touch') ? innerHeight * 0.075 : 0);
  if (G.screen === 'title') camera.setViewOffset(innerWidth, innerHeight, 0, -innerHeight * (portrait ? 0.04 : 0.02), innerWidth, innerHeight);
  else if (padUp) camera.setViewOffset(innerWidth, innerHeight, 0, padUp, innerWidth, innerHeight);
  else if (camera.view && camera.view.enabled) camera.clearViewOffset();
  camera.updateProjectionMatrix();
}

// =====================================================================================
// Input: swipe (or arrow keys) toward where you want the lead ball to go on screen; tap a hint;
// two fingers (or a mouse drag) turn the view
// =====================================================================================
function screenDirs() {
  const i = lead(); if (i < 0) return [];
  const c = G.st.b[i], s = G.sides[i], P0 = BALLS[i].m.position.clone().project(camera), out = [], Gr = LOGIC.graphFor(G.lv);
  for (let d = 0; d < 4; d++) { if (Gr.to[c * 4 + d] < 0) { out.push({ d, x: 0, y: 0 }); continue; } const p = pathPoint(c, d, s, 0.35, new V3(), new V3()).project(camera); out.push({ d, x: (p.x - P0.x) * innerWidth, y: -(p.y - P0.y) * innerHeight }); }
  return out;
}
// Forgiving: if the closest direction is a wall but a direction that moves is within ~50 degrees, take that one.
// A swipe made while the ball is still rolling is kept and played as soon as it stops.
function moveScreen(x, y) {
  if (G.busy) { G.queue = { x, y, t: performance.now() }; return; }
  if (G.won || G.screen !== 'play') return;
  const ds = screenDirs().filter(d => d.x || d.y); if (!ds.length) return; const l = Math.hypot(x, y) || 1, mv = movable();
  let any = null, ba = -2, ok = null, bo = -2;
  for (const d of ds) { const dl = Math.hypot(d.x, d.y) || 1, dot = (d.x * x + d.y * y) / (dl * l); if (dot > ba) { ba = dot; any = d; } if (mv[d.d] && dot > bo) { bo = dot; ok = d; } }
  const pick = ok && bo > 0.62 ? ok : any; if (pick) tryMove(pick.d);
}
addEventListener('keydown', e => {
  const k = e.key;
  if (e.target && e.target.tagName === 'INPUT') return;
  if (G.screen === 'title' && (k === 'Enter' || k === ' ')) { $('bPlay').click(); return; }
  if (k === 'm' || k === 'M') { AU.init(); AU.mute(!SAVE.muted); syncSnd(); return; }
  if (G.screen === 'solved' && k === 'Escape') { openLevels(); return; }
  if (G.screen === 'solved' && (k === 'Enter' || k === ' ')) { ($('bNext').hidden ? $('bReplay') : $('bNext')).click(); return; }
  if (G.screen === 'levels' && k === 'Escape') { $('bLBack').click(); return; }
  if (G.screen !== 'play') return;
  const map = { ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0] };
  if (map[k]) { e.preventDefault(); AU.init(); moveScreen(...map[k]); return; }
  if (k === 'z' || k === 'Z' || k === 'Backspace') { undo(); return; }
  if (k === 'r' || k === 'R') { reset(); return; }
  if (k === 'h' || k === 'H') { hint(); return; }
  if (k === 'Escape') openLevels();
});
const ptrs = new Map(); let gesture = null;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const ZMIN = 0.4, ZMAX = 1.6;
canvas.addEventListener('pointerdown', e => {
  if (G.screen !== 'play') return; AU.init();
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), type: e.pointerType });
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; gesture = { d0: Math.hypot(a.x - b.x, a.y - b.y), z0: CAM.zoom, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; }
});
canvas.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (gesture && ptrs.size === 2) { const [a, b] = [...ptrs.values()], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, d = Math.hypot(a.x - b.x, a.y - b.y); rotateView(mx - gesture.mx, my - gesture.my); gesture.mx = mx; gesture.my = my; CAM.zoom = clamp(gesture.z0 * gesture.d0 / Math.max(d, 1), ZMIN, ZMAX); return; }
  // one finger (or the mouse) turns the view; on touch screens the ball only moves with the pad
  if (ptrs.size === 1 && (p.drag || Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 6)) { p.drag = true; rotateView(dx, dy); }
});
function rotateView(dx, dy) { CAM.user = performance.now(); CAM.tAz = CAM.az = CAM.az + dx * 0.008; CAM.tEl = CAM.el = clamp(CAM.el + dy * 0.006, -1.25, 1.25); }
canvas.addEventListener('pointerup', e => {
  const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if (!p) return;
  if (gesture) { if (!ptrs.size) gesture = null; p.drag = true; return; }
  const dx = e.clientX - p.x0, dy = e.clientY - p.y0, dist = Math.hypot(dx, dy), dt = performance.now() - p.t0;
  if (p.drag) return;
  if (p.type !== 'mouse' && dist < 10 && dt < 300) {
    // double tap: back to the normal view
    const now = performance.now(); if (now - (CAM.lastTap || 0) < 320) { CAM.zoom = 1; CAM.user = 0; CAM.lastTap = 0; } else CAM.lastTap = now; return;
  }
  if (dist < 10 && dt < 400) {
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hintHit.filter(h => h.userData.on), false)[0];
    if (hit) tryMove(hit.object.userData.d);
  }
});
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') document.documentElement.classList.add('touch'); }, true);
if (coarse) document.documentElement.classList.add('touch');
// the thumb pad
const pad = $('pad'), padB = [...pad.querySelectorAll('button')];
padB.forEach(b => b.addEventListener('pointerdown', e => {
  e.preventDefault(); e.stopPropagation(); AU.init(); const d = +b.dataset.d;
  if (G.busy) { if (b._v) G.queue = { ...b._v, t: performance.now() }; } else tryMove(d);
}));
function syncPad() {
  const on = pad.offsetParent !== null && G.screen === 'play' && !G.demo && !G.won && !!G.st && lead() >= 0;
  pad.classList.toggle('off', !on); if (!on || G.busy) return;
  const ds = screenDirs(), mv = movable(), R = pad.clientWidth * 0.31;
  const ang = ds.map(d => (d.x || d.y) ? Math.atan2(d.x, -d.y) : null);
  // keep arrows from piling on top of each other when the view is edge-on
  for (let it = 0; it < 10; it++) for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    if (ang[i] == null || ang[j] == null) continue; const df = mod(ang[j] - ang[i] + PI, TAU) - PI, MIN = 1.0;
    if (Math.abs(df) < MIN) { const push = (MIN - Math.abs(df)) / 2 * (df >= 0 ? 1 : -1); ang[i] -= push; ang[j] += push; }
  }
  ds.forEach((d, i) => {
    const b = padB[d.d]; if (ang[i] == null) { b.style.visibility = 'hidden'; b._v = null; return; }
    b.style.visibility = ''; b.style.transform = `rotate(${ang[i]}rad) translateY(${-R}px)`; b._v = { x: Math.sin(ang[i]), y: -Math.cos(ang[i]) };
    b.classList.toggle('no', !mv[d.d]); b.classList.toggle('hint', d.d === G.hintDir);
  });
}
canvas.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); if (!ptrs.size) gesture = null; });
canvas.addEventListener('wheel', e => { CAM.zoom = clamp(CAM.zoom * (1 + e.deltaY * 0.001), ZMIN, ZMAX); }, { passive: true });
addEventListener('contextmenu', e => e.preventDefault());

// =====================================================================================
// Screens
// =====================================================================================
function show(s) { if (s !== 'play') hideCard(); G.screen = s; ['title', 'levels', 'solved'].forEach(id => $(id).classList.toggle('on', id === s)); $('hud').classList.toggle('on', s === 'play'); }
function fadeTo(fn) { $('fade').classList.remove('off'); setTimeout(() => { fn(); requestAnimationFrame(() => $('fade').classList.add('off')); }, 500); }
function play(n) { AU.init(); fadeTo(() => { startLevel(n); show('play'); }); }
function nextUnsolved() { for (let n = 0; n < LEVELS.length; n++) if (SAVE.solved[n] == null) return n; return SAVE.last ?? 0; }
function openLevels() {
  const groups = []; LEVELS.forEach(l => { let g = groups.find(g => g.ch === l.ch); if (!g) groups.push(g = { ch: l.ch, ls: [] }); g.ls.push(l); });
  const nx = nextUnsolved();
  $('chapList').innerHTML = groups.map(g => { const ch = CH[g.ch];
    const p = ch.pal; return `<div class="chap" style="--c:${ch.acc}"><svg class="n" viewBox="0 0 54 60" aria-hidden="true"><path d="M27 8L49 20.5 27 33 5 20.5z" fill="${p.top}"/><path d="M5 20.5L27 33v24L5 44.5z" fill="${p.left}"/><path d="M49 20.5L27 33v24l22-12.5z" fill="${p.right}"/><path d="M27 1L36 13.5 27 18.5 18 13.5z" fill="${ch.pil}"/></svg><div class="nm"><b><i>${ch.num}</i>${ch.name}</b><span class="caps">${ch.blurb}</span><div class="dots">${g.ls.map(l => {
      const s = SAVE.solved[l.n], un = unlocked(l.n); return `<button class="dot ${s != null ? 'done' : ''} ${s != null && s <= l.par ? 'perfect' : ''} ${l.n === nx ? 'next' : ''}" data-n="${l.n}" ${un ? '' : 'disabled'} aria-label="${ch.name} ${l.kk}">${l.kk}</button>`; }).join('')}</div></div></div>`; }).join('');
  show('levels');
}
$('chapList').addEventListener('click', e => { const b = e.target.closest('.dot'); if (b && !b.disabled) play(+b.dataset.n); });
$('bPlay').onclick = () => play(nextUnsolved());
$('bLevels').onclick = openLevels;
$('bLBack').onclick = () => { if (G.lv && !G.demo) show('play'); else show('title'); };
$('bMenu').onclick = openLevels;
$('bUndo').onclick = undo;
$('bHint').onclick = hint;
$('bReset').onclick = reset;
$('bNext').onclick = () => play(G.lv.n + 1);
$('bReplay').onclick = () => { show('play'); reset(); };
$('bSLevels').onclick = openLevels;
const VOL = $('vol');
function syncSnd() {
  const off = SAVE.muted || (SAVE.mus < 0.01 && SAVE.sfx < 0.01), lvl = Math.max(SAVE.mus, SAVE.sfx);
  $('sndW1').style.opacity = off ? 0 : 1; $('sndW2').style.opacity = off || lvl < 0.45 ? 0 : 1; $('sndX').style.opacity = off ? 1 : 0;
  VOL.classList.toggle('muted', SAVE.muted); $('bMute').textContent = SAVE.muted ? 'unmute' : 'mute';
  [['vMus', 'mus'], ['vSfx', 'sfx']].forEach(([id, k]) => { const el = $(id); el.value = SAVE[k]; el.style.setProperty('--p', SAVE[k] * 100 + '%'); });
}
$('bSound').onclick = () => { AU.init(); const o = !VOL.classList.contains('open'); VOL.classList.toggle('open', o); $('bSound').setAttribute('aria-expanded', o); };
$('bMute').onclick = () => { AU.init(); AU.mute(!SAVE.muted); syncSnd(); };
[['vMus', 'mus'], ['vSfx', 'sfx']].forEach(([id, k]) => {
  const el = $(id); el.addEventListener('input', () => { AU.init(); SAVE[k] = +el.value; if (SAVE.muted && SAVE[k] > 0) AU.mute(false); AU.setVol(); syncSnd(); });
  el.addEventListener('change', () => { writeSave(); if (k === 'sfx') AU.click(); });
});
addEventListener('pointerdown', e => { if (VOL.classList.contains('open') && !VOL.contains(e.target)) { VOL.classList.remove('open'); $('bSound').setAttribute('aria-expanded', false); } }, true);
syncSnd();

// =====================================================================================
// Main loop
// =====================================================================================
function resize() { renderer.setSize(innerWidth, innerHeight, false); }
addEventListener('resize', resize); resize();
const clock = new THREE.Clock();
function frame() { requestAnimationFrame(frame); const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime; tick(dt, time); updateCamera(dt); renderer.render(scene, camera); }
let demoNext = 2; const DEMO = LEVELS.findIndex(l => l.ch === 'twist');
function tick(dt, time) {
  if (!G.sh) return;
  if (G.intro > 0) G.intro = Math.max(0, G.intro - dt);
  stepAnim(dt);
  if (G.demo && !G.busy && !G.won) { demoNext -= dt; if (demoNext <= 0) { demoNext = 1.4; const opts = [0, 1, 2, 3].filter(d => LOGIC.slide(G.lv, G.st, d).moved); const d = opts[Math.floor(Math.random() * opts.length)] ?? 0; const sc = G.screen; G.screen = 'play'; tryMove(d); G.screen = sc; G.moves = 0; G.undo = []; } }
  G.goals.forEach(g => g.pulses.forEach(p => { const k = (time * 0.6) % 1; p.scale.setScalar(1 + k * 0.6); p.material.opacity = 0.7 * (1 - k); }));
  G.flags.forEach((f, i) => { f.rotation.y = Math.sin(time * 1.7 + i) * 0.35; f.scale.y = 1 + Math.sin(time * 3.1 + i) * 0.08; });
  if (G.dust) { const p = G.dust.geometry.attributes.position, R = G.radius; for (let i = 0; i < p.count; i++) { let y = p.getY(i) + dt * 0.25; if (y > R) y -= 2 * R; p.setY(i, y); } p.needsUpdate = true; }
  BALLS.forEach((b, i) => { const on = b.m.visible && G.st && G.st.b[i] >= 0 && G.sinkT[i] < 0; b.s.visible = on; if (!on) return;
    b.s.position.copy(b.m.position).addScaledVector(b.up, -RB + 0.012); b.s.quaternion.setFromUnitVectors(new V3(0, 0, 1), b.up); });
  G.portals.forEach(p => p.objs.forEach(o => { o.children[2].rotation.y = time * 2; }));
  for (const g of G.gates) { g.k += (g.target - g.k) * (1 - Math.exp(-dt * 8)); g.objs.forEach(o => { o.scale.y = Math.max(0.02, g.k); }); g.mat.uniforms.uOpacity.value = 0.35 + 0.6 * g.k; }
  for (const b of G.buttons) { b.press = Math.max(0, (b.press || 0) - dt * 2); b.tops.forEach(t => { t.position.y = 0.1 - 0.06 * Math.sin(b.press * PI); }); }
  // a little nudge when nothing can move that way
  if (G.nudge) { G.nudge.t += dt; const i = Math.max(0, lead()), c = G.st.b[i]; if (c >= 0) { const k = Math.sin(clamp(G.nudge.t / 0.25, 0, 1) * PI) * 0.12, cc = G.sh.cell(c), t = [cc.a, cc.a.clone().negate(), cc.b, cc.b.clone().negate()][G.nudge.d]; restPos(c, G.sides[i], BALLS[i].m.position).addScaledVector(t, k); } if (G.nudge.t > 0.25) { G.nudge = null; placeBalls(); } }
  // sinking into a goal
  G.sinkT.forEach((s, i) => { if (s < 0) return; G.sinkT[i] = Math.min(1, s + dt * 1.6); const b = BALLS[i].m; const up = b.position.clone().sub(G.center); b.scale.setScalar(Math.max(0.001, 1 - G.sinkT[i])); });
  BALLS.forEach(b => { b.g.position.copy(b.m.position); b.g.quaternion.copy(b.m.quaternion); b.g.scale.copy(b.m.scale); });
  if (G.queue && !G.busy) { const q = G.queue; G.queue = null; moveScreen(q.x, q.y); }
  if (G.hintLater && !G.busy) { G.hintLater = false; hint(); }
  syncPad();
  // hints around the lead ball
  const li = G.st ? lead() : -1, showH = G.screen === 'play' && !G.busy && !G.won && G.intro <= 0.2 && !G.demo && li >= 0;
  for (let d = 0; d < 4; d++) {
    const h = hints[d], hit = hintHit[d], can = showH && movable()[d] && (LOGIC.graphFor(G.lv).to[G.st.b[li] * 4 + d] >= 0 || d === G.hintDir);
    const hinted = G.hintDir >= 0, mine = hinted && d === G.hintDir;
    h.material.opacity += ((can ? (hinted ? (mine ? 1 : 0.25) : 0.85) : 0) - h.material.opacity) * (1 - Math.exp(-dt * 8)); hit.userData.on = can; hit.userData.d = d;
    h.material.color.set(mine ? G.ch.acc : '#ffffff'); h.scale.setScalar(mine ? 1.25 + Math.sin(time * 6) * 0.15 : 0.85);
    if (h.material.opacity < 0.01 || li < 0) { h.visible = false; continue; } h.visible = true;
    const c = G.st.b[li], s = G.sides[li], q = 0.32 + Math.sin(time * 4) * 0.03, P = new V3(), up = new V3(), P2 = new V3(), up2 = new V3();
    pathPoint(c, d, s, q, P, up); pathPoint(c, d, s, q + 0.05, P2, up2);
    const dir = P2.sub(P).normalize(); h.position.copy(P).addScaledVector(up, -RB + 0.03); hit.position.copy(h.position);
    h.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new V3().crossVectors(up, dir).negate(), up, dir.clone().negate())); hit.quaternion.copy(h.quaternion);
  }
}

// =====================================================================================
// Boot
// =====================================================================================
function start() { startLevel(DEMO, { demo: true }); show('title'); requestAnimationFrame(() => $('fade').classList.add('off')); frame(); }
window.claude?.hot?.snapshot?.(() => ({}));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
</script>
