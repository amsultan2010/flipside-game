const _a = new V3(), _b = new V3();
function torusS(R, r) { return (u, v, o) => o.set((R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u)); }
function stripS(R, k) { return (u, v, o) => o.set((R + v * Math.cos(k * u)) * Math.cos(u), v * Math.sin(k * u), (R + v * Math.cos(k * u)) * Math.sin(u)); }
function knotS(k, r) {
  const c = new V3(), d1 = new V3(), d2 = new V3(), T = new V3(), N = new V3(), B = new V3();
  return (u, v, o) => {
    const s = Math.sin, co = Math.cos;
    c.set(s(u) + 2 * s(2 * u), -s(3 * u) * 0.9, co(u) - 2 * co(2 * u)).multiplyScalar(k);
    d1.set(co(u) + 4 * co(2 * u), -3 * co(3 * u) * 0.9, -s(u) + 4 * s(2 * u));
    d2.set(-s(u) - 8 * s(2 * u), 9 * s(3 * u) * 0.9, -co(u) + 8 * co(2 * u));
    T.copy(d1).normalize(); B.crossVectors(d1, d2).normalize(); N.crossVectors(B, T);
    return o.copy(c).addScaledVector(N, r * co(v)).addScaledVector(B, r * s(v));
  };
}
// Klein bottle (the classic "bottle" immersion), with the neck thickened so the ball fits through it
function kleinS(scale) {
  const K = (u, v, o) => {
    const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
    return o.set(
      -2 / 15 * cu * (3 * cv - 30 * su + 90 * cu ** 4 * su - 60 * cu ** 6 * su + 5 * cu * cv * su),
      -1 / 15 * su * (3 * cv - 3 * cu ** 2 * cv - 48 * cu ** 4 * cv + 48 * cu ** 6 * cv - 60 * su + 5 * cu * cv * su - 5 * cu ** 3 * cv * su - 80 * cu ** 5 * cv * su + 80 * cu ** 7 * cv * su),
      2 / 15 * (3 + 5 * cu * su) * sv);
  };
  const N = 1024, Cx = new Float64Array(N + 1), Cy = new Float64Array(N + 1), Cz = new Float64Array(N + 1), Lm = new Float64Array(N + 1), t = new V3();
  for (let i = 0; i <= N; i++) {
    const u = i / N * Math.PI; let x = 0, y = 0, z = 0;
    for (let j = 0; j < 32; j++) { K(u, j / 32 * TAU, t); x += t.x; y += t.y; z += t.z; }
    x /= 32; y /= 32; z /= 32; let r = 0;
    for (let j = 0; j < 32; j++) { K(u, j / 32 * TAU, t); r += Math.hypot(t.x - x, t.y - y, t.z - z); }
    r /= 32; const k = 0.31 / r;
    Cx[i] = x; Cy[i] = y; Cz[i] = z; Lm[i] = Math.sqrt(1 + k * k);
  }
  // tables are periodic in u with period π (the bottle's own symmetry), so the seam stays smooth
  const at = (arr, u) => { const f = mod(u, Math.PI) / Math.PI * N, i = Math.min(N - 1, Math.floor(f)), w = f - i; return arr[i] * (1 - w) + arr[i + 1] * w; };
  const K2 = (u, v, o) => {
    // widen the tight fold at the bottle's base (where the neck opens out into the body) so the ball can roll around it
    const d = Math.min(mod(u, Math.PI), Math.PI - mod(u, Math.PI));
    K(u, v, o); const cx = at(Cx, u), cy = at(Cy, u), cz = at(Cz, u), l = at(Lm, u) * (1 + Math.sin(2 * u) * Math.exp(-((d / 0.35) ** 2)));
    return o.set(cx + (o.x - cx) * l, cy + (o.y - cy) * l, cz + (o.z - cz) * l);
  };
  return (u, v, o) => { K2(u, v, o); return o.set(o.x * scale, (o.y - 2.1) * scale, o.z * scale); };
}

class ParamWorld {
  constructor(d) { Object.assign(this, d); this.kind = 'param'; this.f = { P: new V3(), Su: new V3(), Sv: new V3(), n: new V3() }; }
  frame(u, v, f = this.f) {
    const e = 1e-4; this.S(u, v, f.P);
    this.S(u + e, v, _a); this.S(u - e, v, _b); f.Su.subVectors(_a, _b).multiplyScalar(1 / (2 * e));
    this.S(u, v + e, _a); this.S(u, v - e, _b); f.Sv.subVectors(_a, _b).multiplyScalar(1 / (2 * e));
    f.n.crossVectors(f.Su, f.Sv).normalize(); if (this.flip) f.n.negate(); return f;
  }
  // world position and "up" (the direction gravity pulls away from) for a state
  place(st, P, up) { const f = this.frame(st.u, st.v); P.copy(f.P); up.copy(f.n).multiplyScalar(st.s); return f; }
  wrap(st, upOld) {
    let crossed = 0;
    if (this.uPer) {
      while (st.u >= this.uPer) { st.u -= this.uPer; if (this.uMap) st.v = this.uMap(st.v, 1); crossed++; }
      while (st.u < 0) { st.u += this.uPer; if (this.uMap) st.v = this.uMap(st.v, -1); crossed--; }
    }
    if (this.vPer) st.v = mod(st.v, this.vPer);
    if (crossed && this.uMap) { const f = this.frame(st.u, st.v); st.s = f.n.dot(upOld) >= 0 ? 1 : -1; }
    return crossed;
  }
  // move along the surface with a 3D tangent velocity; rails reflect it. Returns the number of seam crossings.
  // orthonormal frame (along u, along v, normal) at a point
  ortho(u, v, o) {
    const f = this.frame(u, v); o.eu.copy(f.Su).normalize();
    o.ev.copy(f.Sv).addScaledVector(o.eu, -f.Sv.dot(o.eu)).normalize(); o.en.crossVectors(o.eu, o.ev); return o;
  }
  // Move along the surface. Velocity (and any extra vectors, like the camera heading) are carried in the
  // surface's own frame, so "straight ahead" follows the strip or tube like a track. Rails bounce you back.
  move(st, vel, dt, out, extra = []) {
    const speed = vel.length(); let crossed = 0; out.hitRail = 0;
    const n = Math.min(12, Math.max(1, Math.ceil(speed * dt / 0.1))), h = dt / n;
    const A = this._A || (this._A = { eu: new V3(), ev: new V3(), en: new V3() }), B = this._B || (this._B = { eu: new V3(), ev: new V3(), en: new V3() });
    const comps = (x, F) => [x.dot(F.eu), x.dot(F.ev), x.dot(F.en)];
    for (let i = 0; i < n; i++) {
      const f = this.frame(st.u, st.v);
      const E = f.Su.dot(f.Su), Fm = f.Su.dot(f.Sv), Gm = f.Sv.dot(f.Sv), det = E * Gm - Fm * Fm;
      const a = f.Su.dot(vel), b = f.Sv.dot(vel);
      const du = (Gm * a - Fm * b) / det, dv = (E * b - Fm * a) / det;
      const upOld = f.n.clone().multiplyScalar(st.s);
      this.ortho(st.u, st.v, A);
      const cv = comps(vel, A), ce = extra.map(x => comps(x, A));
      st.u += du * h; st.v += dv * h;
      crossed += this.wrap(st, upOld);
      this.ortho(st.u, st.v, B);
      if (B.eu.dot(A.eu) < 0) B.eu.negate();
      if (B.ev.dot(A.ev) < 0) B.ev.negate();
      B.en.crossVectors(B.eu, B.ev);
      if (this.vMin != null) {
        // rails: clamp v and bounce the across-strip part of the velocity
        const lim = this.vMax - this.railPad;
        if (Math.abs(st.v) > lim) {
          const sg = Math.sign(st.v); st.v = sg * lim;
          const evc = this.frame(st.u, st.v).Sv.clone().normalize(), dirOut = sg * Math.sign(evc.dot(B.ev) || 1);
          if (cv[1] * dirOut > 0) { out.hitRail = Math.max(out.hitRail, Math.abs(cv[1])); cv[1] = -cv[1] * 0.42; }
        }
      }
      vel.set(0, 0, 0).addScaledVector(B.eu, cv[0]).addScaledVector(B.ev, cv[1]);
      extra.forEach((x, k) => x.set(0, 0, 0).addScaledVector(B.eu, ce[k][0]).addScaledVector(B.ev, ce[k][1]).addScaledVector(B.en, ce[k][2]));
    }
    return crossed;
  }
}
class SphereWorld {
  constructor(d) { Object.assign(this, d); this.kind = 'sphere'; }
  place(st, P, up) { up.copy(st.q); P.copy(st.q).multiplyScalar(this.R); return null; }
  move(st, vel, dt, out, extra = []) {
    const speed = vel.length(); out.hitRail = 0;
    const q0 = st.q.clone();
    st.q.addScaledVector(vel, dt / this.R).normalize();
    if (extra.length) { const qr = new THREE.Quaternion().setFromUnitVectors(q0, st.q); extra.forEach(x => x.applyQuaternion(qr)); }
    vel.addScaledVector(st.q, -vel.dot(st.q)); if (vel.lengthSq() > 1e-12) vel.setLength(speed);
    return 0;
  }
}


// a square tube (rounded corners) around a circle, turning a quarter turn per lap; v is arc length around the square
function quarterS(Rc, P, rc) {
  const a = (P - TAU * rc) / 8 + rc, s = a - rc, q = PI * rc / 2;
  const sq = w => {
    w = mod(w, P);
    // start at the middle of the right side, go anticlockwise: half side, corner, side, corner, side, corner, side, corner, half side
    const segs = [['l', s, [a, 0], [0, 1]], ['c', q, [s, s], 0], ['l', 2 * s, [s, a], [-1, 0]], ['c', q, [-s, s], PI / 2], ['l', 2 * s, [-a, s], [0, -1]], ['c', q, [-s, -s], PI], ['l', 2 * s, [-s, -a], [1, 0]], ['c', q, [s, -s], 1.5 * PI], ['l', s, [a, -s], [0, 1]]];
    for (const g of segs) { if (w <= g[1] + 1e-9) { if (g[0] === 'l') return [g[2][0] + g[3][0] * w, g[2][1] + g[3][1] * w]; const ang = g[3] + w / rc; return [g[2][0] + rc * Math.cos(ang), g[2][1] + rc * Math.sin(ang)]; } w -= g[1]; }
    return [a, 0];
  };
  return (u, v, o) => { const [x, y] = sq(v), th = u / 4, c = Math.cos(th), sn = Math.sin(th), xr = x * c - y * sn, yr = x * sn + y * c;
    return o.set((Rc + xr) * Math.cos(u), yr, (Rc + xr) * Math.sin(u)); };
}
