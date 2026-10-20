// ---- web/js/10-robot-core.js ----
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPEED = reduceMotion ? 0.35 : 1;

const FONT_DISPLAY = '"Dela Gothic One", "Hiragino Sans", "Yu Gothic", sans-serif';
const FONT_BODY = '"BIZ UDPGothic", "Hiragino Sans", "Yu Gothic", sans-serif';
const FONT_MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';

const ROLES = {
  main: { name: 'メイン', color: '#0ea5e9', pill: '#0369a1' },   // sky blue (2.3.5, requester 10-19: 「スカイブルーにしようか」; it was orange, beside the subagents' orange coveralls)
  // `pill` (2.3.6, ticket 2026-10-20-jui-viz-main-pill-text-contrast): a role's pills (over the robot, in the panels, on the
  // boards) take it in place of `color`, white text on it. Main's is one step darker (#0369a1, white 5.93:1); its body stays #0ea5e9.
  // define / ground / navigation / test / other the same (requester 10-20: 「全部直す」): each the body's hue, darker, white ≥ 4.7:1.
  define: { name: 'define', color: '#7d5cff', pill: '#7552ff' },
  ground: { name: 'ground', color: '#b07a52', pill: '#996946' },
  implement: { name: 'implement', color: '#3b5bdb' },   // indigo (2.3.5): #2f80ed sat ΔE2000 14.6 from the main sky blue, side by side in the panel
  navigation: { name: 'navigation', color: '#10a693', pill: '#0c8172' },
  test: { name: 'test', color: '#3fae4a', pill: '#2f8338' },
  debug: { name: 'debug', color: '#f0b400' },
  other: { name: 'その他', color: '#8a9bb0', pill: '#60748e' },
};
/* Whatever is filled with a role's colour and has text on it (pills, the talk's marks, a phone's header and button) takes
   pillBg, with pillInk (20-core.js) for the text; the robot's own parts keep ROLES[role].color. */
const pillBg = (role) => ROLES[role].pill || ROLES[role].color;
const COL = {
  shell: '#e8ecf3', limb: '#394150', screen: '#0f1830', eye: '#a6fbff',
  band: '#fffdf7', bandInk: '#d62839', wood: '#c99f73', woodDark: '#9e7752',
  laptop: '#c9d0db', phone: '#1f2532',
};
/* A subagent's work clothes (2.3.5, requester 10-19: "サブエージェントは格好を作業着っぽい感じにできる？", "さいずも0.8くらいに
   して", "作業着の服装の感じはアメリカの囚人服っぽいオレンジがいいな"): a bright orange coverall (body, sleeves, legs) with a
   reflective stripe, a patch of its role's colour on the chest (a white rim and a navy edge, readable on the orange),
   a work cap; the whole robot SUB_SIZE of a main one. The orange is kept apart from ROLES.main (ΔE2000 ≥ 10; the e2e
   measures it). */
const WEAR = { overall: '#ff8c1a', stripe: '#e8edf3', brim: '#c25e00', rim: '#ffffff', edge: '#1f2a44' };
const SUB_SIZE = 0.8;
const LAMP = { idle: '#8fa3bf', busy: '#35d07f', think: '#8fe0b4', bg: '#4cc3d9', waiting: '#ffb020', done: '#35d07f', off: '#2a3a30' };
const STATES = {
  idle: { name: '待機', lamp: 'idle', face: 'normal' },
  thinking: { name: '考え中', lamp: 'think', face: 'normal' },
  background: { name: '裏で作業中', lamp: 'bg', face: 'normal' },   // waiting on background work: lit, watching its screen (10-18)
  typing: { name: '入力', lamp: 'busy', face: 'focus' },
  reading: { name: '読む', lamp: 'busy', face: 'normal' },
  command: { name: 'コマンド', lamp: 'busy', face: 'focus' },
  phone: { name: 'スマホ', lamp: 'busy', face: 'focus' },
  waiting: { name: '許可待ち', lamp: 'waiting', face: 'wide' },
  carry: { name: '運ぶ', lamp: 'busy', face: 'normal' },
  stroll: { name: '歩く', lamp: 'idle', face: 'normal' },   // to and from play (10-18): no papers; the lamp is the real state's
  done: { name: '完了', lamp: 'done', face: 'happy' },
};
const LAMP_TEXT = { idle: '青灰（待機）', busy: '緑（作業中）', think: '淡い緑のゆっくり点滅（考え中）', waiting: '黄（許可待ち）', done: '緑の点滅（完了）', bg: '水色（裏で作業中）' };

const HIPS_Y = 0.36;
const HEAD = { w: 1.1, h: 0.9, d: 0.92, r: 0.17 };
const CAP = { w: 0.92, h: 0.18, d: 0.82, y: HEAD.h + 0.06 };   // the work cap's crown, sitting on the head (head space)
const BAND = { y: 0.645, h: 0.17, t: 0.028 };
const LOOK = new THREE.Vector3(0, 1.25, 0.5);
const UP = new THREE.Vector3(0, 1, 0);

/* ---------- canvas helpers ---------- */
let maxAniso = 1;
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function texFrom(canvas) { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t; }
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const gradientMap = (() => {
  const t = new THREE.DataTexture(new Uint8Array([105, 185, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
})();
const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap, ...extra });

/* ---------- headband geometry: a smooth wall around the head, u runs left to right across the front ---------- */
function bandOutline(hw, hd, r, seg = 10) {
  const pts = [];
  const push = (x, z, nx, nz) => pts.push({ x, z, nx, nz });
  const cx = hw - r, cz = hd - r;
  const arc = (ox, oz, a0, a1) => {
    for (let i = 0; i <= seg; i++) { const a = a0 + (a1 - a0) * (i / seg); const c = Math.cos(a), s = Math.sin(a); push(ox + c * r, oz + s * r, c, s); }
  };
  push(0, -hd, 0, -1);
  push(-cx, -hd, 0, -1);
  arc(-cx, -cz, -Math.PI / 2, -Math.PI);
  push(-hw, cz, -1, 0);
  arc(-cx, cz, Math.PI, Math.PI / 2);
  push(cx, hd, 0, 1);
  arc(cx, cz, Math.PI / 2, 0);
  push(hw, -cz, 1, 0);
  arc(cx, -cz, 0, -Math.PI / 2);
  push(0, -hd, 0, -1);
  return pts;
}
function makeBandWall() {
  const hw = HEAD.w / 2 + BAND.t, hd = HEAD.d / 2 + BAND.t, r = HEAD.r + BAND.t, h = BAND.h / 2;
  const pts = bandOutline(hw, hd, r);
  const lens = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); lens.push(total); }
  const pos = [], nor = [], uv = [], idx = [];
  pts.forEach((p, i) => {
    const u = lens[i] / total;
    pos.push(p.x, -h, p.z, p.x, h, p.z);
    nor.push(p.nx, 0, p.nz, p.nx, 0, p.nz);
    uv.push(u, 0, u, 1);
  });
  for (let i = 0; i < pts.length - 1; i++) { const b0 = i * 2, t0 = b0 + 1, b1 = b0 + 2, t1 = b0 + 3; idx.push(b0, b1, t1, b0, t1, t0); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.userData.frontFraction = (2 * (hw - r)) / total;
  g.userData.perimeter = total;
  return g;
}
function roundedRect(PathType, hw, hd, r) {
  const p = new PathType();
  p.moveTo(-hw + r, -hd);
  p.lineTo(hw - r, -hd);
  p.absarc(hw - r, -hd + r, r, -Math.PI / 2, 0, false);
  p.lineTo(hw, hd - r);
  p.absarc(hw - r, hd - r, r, 0, Math.PI / 2, false);
  p.lineTo(-hw + r, hd);
  p.absarc(-hw + r, hd - r, r, Math.PI / 2, Math.PI, false);
  p.lineTo(-hw, -hd + r);
  p.absarc(-hw + r, -hd + r, r, Math.PI, Math.PI * 1.5, false);
  return p;
}
function makeBandCap() {
  const shape = roundedRect(THREE.Shape, HEAD.w / 2 + BAND.t, HEAD.d / 2 + BAND.t, HEAD.r + BAND.t);
  shape.holes.push(roundedRect(THREE.Path, HEAD.w / 2 - 0.01, HEAD.d / 2 - 0.01, HEAD.r - 0.01));
  const g = new THREE.ShapeGeometry(shape, 10);
  g.rotateX(-Math.PI / 2);
  g.translate(0, BAND.h / 2, 0);
  return g;
}

/* ---------- static drawings ---------- */
function drawKeys(c) {
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4a5363'; ctx.fillRect(0, 0, c.width, c.height);
  const cols = 12, rows = 4, pad = 6;
  const kw = (c.width - pad * (cols + 1)) / cols, kh = (c.height - pad * (rows + 1)) / rows;
  ctx.fillStyle = '#e8ecf2';
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) { rr(ctx, pad + k * (kw + pad), pad + r * (kh + pad), kw, kh, 3); ctx.fill(); }
  return c;
}
function drawCode(c) {
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#14203a'; ctx.fillRect(0, 0, c.width, c.height);
  const colors = ['#7ef9ff', '#ffd166', '#ff8fab', '#9ad57a', '#c3cbe0'];
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let y = 14; y < c.height - 8; y += 13) {
    let x = 12 + Math.floor(rnd() * 3) * 14;
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) { const w = 18 + rnd() * 60; ctx.fillStyle = colors[Math.floor(rnd() * colors.length)]; ctx.fillRect(x, y, w, 6); x += w + 8; }
  }
  return c;
}
function drawShadow(c) {
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(15, 25, 45, 0.34)');
  g.addColorStop(0.6, 'rgba(15, 25, 45, 0.16)');
  g.addColorStop(1, 'rgba(15, 25, 45, 0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return c;
}
function drawGear(c) {
  const ctx = c.getContext('2d');
  ctx.translate(64, 64);
  ctx.fillStyle = '#9fb1c9';
  for (let i = 0; i < 9; i++) { ctx.save(); ctx.rotate((i / 9) * Math.PI * 2); rr(ctx, -9, -58, 18, 22, 4); ctx.fill(); ctx.restore(); }
  ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  return c;
}
function drawChest(c) {
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  rr(ctx, 4, 4, c.width - 8, c.height - 8, 20); ctx.fillStyle = '#e3e8f0'; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#c3ccd9'; ctx.stroke();
  ctx.fillStyle = '#394150'; ctx.font = `700 50px ${FONT_MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('{ }', c.width / 2, c.height / 2 + 2);
}
function drawAlert(c) {
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1d2330'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(52, 128); ctx.lineTo(30, 170); ctx.lineTo(88, 136); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(80, 74, 66, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(56, 124); ctx.lineTo(37, 161); ctx.lineTo(83, 133); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f0a000'; ctx.font = `96px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('!', 80, 80);
}
function drawCover(c) {
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#23406b'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'; ctx.lineWidth = 3; ctx.strokeRect(10, 10, c.width - 20, c.height - 20);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd166'; ctx.font = `700 34px ${FONT_MONO}`; ctx.fillText('{ }', c.width / 2, 58);
  ctx.fillStyle = '#ffffff'; ctx.font = `30px ${FONT_DISPLAY}`; ctx.fillText('仕様書', c.width / 2, 112);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.font = `700 18px ${FONT_MONO}`; ctx.fillText('Login', c.width / 2, 150);
}

/* ---------- per-robot drawings ---------- */
function drawFace(ctx, mode, tint = null) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);
  rr(ctx, 3, 3, W - 6, H - 6, 34); ctx.fillStyle = COL.screen; ctx.fill();
  if (tint && tint[3] > 0) { ctx.fillStyle = `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, ${tint[3]})`; ctx.fill(); }   // heavy work: red or blue
  const sheen = ctx.createLinearGradient(0, 0, 0, H);
  sheen.addColorStop(0, 'rgba(120, 230, 255, 0.14)'); sheen.addColorStop(0.55, 'rgba(120, 230, 255, 0)');
  ctx.fillStyle = sheen; ctx.fill();
  const cx = W / 2, ey = 56, dx = 54;
  ctx.save();
  ctx.shadowColor = 'rgba(94, 242, 255, 0.9)'; ctx.shadowBlur = 16;
  ctx.fillStyle = COL.eye; ctx.strokeStyle = COL.eye; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const side of [-1, 1]) {
    const x = cx + side * dx;
    if (mode === 'normal') { rr(ctx, x - 15, ey - 24, 30, 48, 15); ctx.fill(); }
    else if (mode === 'blink') { rr(ctx, x - 18, ey - 3, 36, 7, 3.5); ctx.fill(); }
    else if (mode === 'focus') { rr(ctx, x - 19, ey - 8, 38, 17, 8); ctx.fill(); }
    else if (mode === 'happy') { ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(x, ey + 12, 17, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
    else if (mode === 'wide') { ctx.beginPath(); ctx.arc(x, ey, 22, 0, Math.PI * 2); ctx.fill(); }
    else if (mode === 'tired') { rr(ctx, x - 16, ey - 2, 32, 22, 9); ctx.fill(); ctx.fillStyle = COL.screen; ctx.fillRect(x - 18, ey - 6, 36, 9); ctx.fillStyle = COL.eye; }
    else if (mode === 'fired') {                          // fired up: narrowed eyes under brows slanted to the middle
      rr(ctx, x - 19, ey - 4, 38, 17, 8); ctx.fill();
      ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x - side * 22, ey - 24); ctx.lineTo(x + side * 20, ey - 12); ctx.stroke();
    } else if (mode === 'drained') {                      // drained: small eyes sunk low, looking down
      ctx.beginPath(); ctx.arc(x, ey + 12, 8, 0, Math.PI * 2); ctx.fill();
    } else if (mode === 'whistle') {                      // blowing the whistle: eyes squeezed shut with the effort
      ctx.lineWidth = 9; ctx.beginPath();                 // > <
      ctx.moveTo(x + side * 17, ey - 12); ctx.lineTo(x - side * 5, ey); ctx.lineTo(x + side * 17, ey + 12); ctx.stroke();
    }
  }
  ctx.lineWidth = 6; ctx.beginPath();
  if (mode === 'whistle') { /* the whistle covers the mouth */ }
  else if (mode === 'fired') { ctx.moveTo(cx - 14, 96); ctx.lineTo(cx + 14, 96); }   // a set jaw
  else if (mode === 'drained') { ctx.moveTo(cx - 16, 98); ctx.quadraticCurveTo(cx - 8, 90, cx, 98); ctx.quadraticCurveTo(cx + 8, 106, cx + 16, 98); }   // a wobbly mouth
  else if (mode === 'happy') ctx.arc(cx, 86, 14, Math.PI * 0.1, Math.PI * 0.9);
  else if (mode === 'wide') ctx.arc(cx, 98, 7, 0, Math.PI * 2);
  else if (mode === 'focus') { ctx.moveTo(cx - 9, 97); ctx.lineTo(cx + 9, 97); }
  else ctx.arc(cx, 86, 10, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  ctx.restore();
  if (mode === 'tired') {                                  // bags under the eyes
    ctx.strokeStyle = 'rgba(170, 120, 255, 0.85)'; ctx.lineWidth = 4;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + side * dx, ey + 26, 15, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
  }
  if (mode === 'drained') {                              // gloom lines down the top of the screen (青ざめ), not the bags of 8 hours
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.85)'; ctx.lineWidth = 4;
    for (let i = 0; i < 7; i++) { const x = cx - 78 + i * 26; ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, 12 + (i % 2 ? 22 : 30)); ctx.stroke(); }
  }
  if (mode === 'wide') { ctx.fillStyle = COL.screen; for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + side * dx + 7, ey - 8, 6, 0, Math.PI * 2); ctx.fill(); } }
  ctx.fillStyle = 'rgba(255, 120, 160, 0.42)';
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + side * 96, 88, 15, 8, 0, 0, Math.PI * 2); ctx.fill(); }
}
function drawBand(r) {
  const c = r.bandCanvas, ctx = c.getContext('2d'), W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COL.band; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(40, 50, 70, 0.05)';
  for (let y = 5; y < H - 4; y += 7) ctx.fillRect(0, y, W, 1.5);
  const shade = ctx.createLinearGradient(0, H * 0.6, 0, H);
  shade.addColorStop(0, 'rgba(40, 50, 70, 0)'); shade.addColorStop(1, 'rgba(40, 50, 70, 0.12)');
  ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(40, 50, 70, 0.14)'; ctx.fillRect(0, 3, W, 2); ctx.fillRect(0, H - 5, W, 2);
  const text = (r.label || '').trim() || '··';
  const maxW = W * S.geo.bandWall.userData.frontFraction * 0.88;
  let size = H * 0.8;
  const setFont = () => { ctx.font = `${size.toFixed(1)}px ${FONT_DISPLAY}`; if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(size * 0.05)}px`; };
  setFont();
  const w = ctx.measureText(text).width;
  if (w > maxW) { size *= maxW / w; setFont(); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COL.bandInk; ctx.strokeStyle = COL.bandInk; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, size * 0.05);
  const y = H / 2 + size * 0.04;
  ctx.strokeText(text, W / 2, y); ctx.fillText(text, W / 2, y);
  r.bandTex.needsUpdate = true;
}
function drawLogo(r) {
  const ctx = r.logoCanvas.getContext('2d');
  ctx.clearRect(0, 0, 96, 64);
  ctx.fillStyle = ROLES[r.role].color; ctx.font = `700 40px ${FONT_MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('{ }', 48, 34);
  r.logoTex.needsUpdate = true;
}
function drawPhoneUI(r, t) {
  const c = r.phoneCanvas, ctx = c.getContext('2d'), W = c.width;
  const accent = pillBg(r.role), ink = pillInk(r.role);   // the header and the button carry text
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1d2330'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(44, 360); ctx.lineTo(16, 396); ctx.lineTo(84, 362); ctx.closePath(); ctx.fill(); ctx.stroke();
  rr(ctx, 6, 6, W - 12, 360, 28); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(48, 355); ctx.lineTo(25, 387); ctx.lineTo(79, 358); ctx.closePath(); ctx.fill();
  const sx = 24, sy = 24, sw = 192, sh = 320;
  ctx.save();
  rr(ctx, sx, sy, sw, sh, 18); ctx.clip();
  ctx.fillStyle = '#f1f4f9'; ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = accent; ctx.fillRect(sx, sy, sw, 64);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = ink; ctx.font = `700 11px ${FONT_MONO}`; ctx.fillText('9:41', sx + 12, sy + 17); ctx.fillRect(sx + sw - 32, sy + 8, 18, 9);
  ctx.fillStyle = ink; ctx.font = `700 19px ${FONT_BODY}`; ctx.fillText('ログイン', sx + 14, sy + 50);
  for (let i = 0; i < 2; i++) {
    const y = sy + 84 + i * 52;
    ctx.fillStyle = '#7a879b'; ctx.fillRect(sx + 14, y, 56 + i * 20, 7);
    rr(ctx, sx + 14, y + 12, sw - 28, 30, 8); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#cfd8e6'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#394150';
    if (i === 0) { ctx.font = `500 12px ${FONT_MONO}`; ctx.fillText('test@example.com', sx + 22, y + 32); }
    else for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(sx + 26 + k * 12, y + 27, 3.5, 0, Math.PI * 2); ctx.fill(); }
  }
  const by = sy + 200;
  rr(ctx, sx + 14, by, sw - 28, 40, 10); ctx.fillStyle = accent; ctx.fill();
  ctx.fillStyle = ink; ctx.font = `700 15px ${FONT_BODY}`; ctx.textAlign = 'center'; ctx.fillText('ログイン', sx + sw / 2, by + 26);
  const ph = (t * 0.7) % 1;
  ctx.beginPath(); ctx.arc(sx + sw / 2 + 24, by + 20, 6 + ph * 30, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${(0.9 * (1 - ph)).toFixed(2)})`; ctx.lineWidth = 4; ctx.stroke();
  for (let i = 0; i < 2; i++) { rr(ctx, sx + 14, by + 58 + i * 26, sw - 28, 18, 5); ctx.fillStyle = '#dde4ef'; ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = '#4b5c76'; ctx.font = `700 11px ${FONT_MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`iOS Simulator · ${r.label}`, W / 2, 359);
  r.phoneTex.needsUpdate = true; r.phoneScreenTex.needsUpdate = true;
}
function drawTerminal(r, t) {
  const c = r.termCanvas, ctx = c.getContext('2d'), W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  rr(ctx, 6, 6, W - 12, H - 12, 18); ctx.fillStyle = 'rgba(9, 32, 58, 0.86)'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(126, 249, 255, 0.9)'; ctx.stroke();
  ['#ff6b6b', '#ffd166', '#06d6a0'].forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(28 + i * 20, 28, 6, 0, Math.PI * 2); ctx.fill(); });
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.font = `700 21px ${FONT_MONO}`; ctx.fillStyle = '#c9fbff';
  const cmd = '$ jui build';
  ctx.fillText(cmd, 24, 78);
  if (Math.floor(t * 2) % 2 === 0) ctx.fillRect(24 + ctx.measureText(`${cmd} `).width, 61, 11, 21);
  const prog = (t * 0.2) % 1;
  const doneCount = Math.min(3, Math.floor(prog * 4));
  ctx.font = `500 18px ${FONT_MONO}`;
  ['Login.json', 'Home.json', 'Settings.json'].forEach((f, i) => {
    ctx.fillStyle = i < doneCount ? '#86ffb4' : 'rgba(201, 251, 255, 0.5)';
    ctx.fillText(`${i < doneCount ? '✓' : '·'} ${f}`, 24, 114 + i * 28);
  });
  const bx = 24, by = H - 46, bw = W - 48, bh = 14;
  rr(ctx, bx, by, bw, bh, 7); ctx.fillStyle = 'rgba(126, 249, 255, 0.2)'; ctx.fill();
  rr(ctx, bx, by, Math.max(bh, bw * prog), bh, 7); ctx.fillStyle = '#7ef9ff'; ctx.fill();
  r.termTex.needsUpdate = true;
}

/* ---------- shared assets ---------- */
const S = {};
const fontRedraws = [];
function initShared() {
  S.geo = {
    head: new RoundedBoxGeometry(HEAD.w, HEAD.h, HEAD.d, 5, HEAD.r),
    torso: new RoundedBoxGeometry(0.74, 0.56, 0.54, 5, 0.16),
    pelvis: new RoundedBoxGeometry(0.46, 0.12, 0.36, 3, 0.05),
    arm: new THREE.CapsuleGeometry(0.075, 0.2, 6, 14),
    hand: new THREE.SphereGeometry(0.095, 24, 16),
    shoulder: new THREE.SphereGeometry(0.095, 24, 16),
    leg: new THREE.CapsuleGeometry(0.08, 0.12, 6, 14),
    foot: new RoundedBoxGeometry(0.2, 0.1, 0.3, 3, 0.045),
    neck: new THREE.CylinderGeometry(0.1, 0.11, 0.1, 20),
    ear: new THREE.CylinderGeometry(0.15, 0.15, 0.08, 32),
    earCap: new THREE.CylinderGeometry(0.085, 0.085, 0.1, 24),
    rod: new THREE.CylinderGeometry(0.014, 0.014, 0.2, 8),
    ball: new THREE.SphereGeometry(0.05, 18, 12),
    face: new THREE.PlaneGeometry(0.76, 0.38),
    chest: new THREE.PlaneGeometry(0.32, 0.2),
    lamp: new THREE.SphereGeometry(0.036, 16, 12),
    bandWall: makeBandWall(),
    bandCap: makeBandCap(),
    knot: new RoundedBoxGeometry(0.13, 0.12, 0.07, 2, 0.03),
    tail: new THREE.PlaneGeometry(0.085, 0.34).translate(0, -0.17, 0),
    stage: new THREE.CylinderGeometry(0.98, 1.02, 0.06, 64),
    ring: new THREE.RingGeometry(0.9, 0.925, 72),
    shadow: new THREE.PlaneGeometry(1.25, 1.25),
    deskTop: new RoundedBoxGeometry(1.0, 0.05, 0.55, 2, 0.015),
    deskLeg: new THREE.CylinderGeometry(0.025, 0.025, 0.5, 10),
    laptopBase: new RoundedBoxGeometry(0.62, 0.025, 0.36, 2, 0.008),
    keys: new THREE.PlaneGeometry(0.52, 0.2),
    laptopLid: new RoundedBoxGeometry(0.62, 0.4, 0.022, 2, 0.008),
    lidLogo: new THREE.PlaneGeometry(0.17, 0.11),
    lidScreen: new THREE.PlaneGeometry(0.56, 0.35),
    bookPanel: new THREE.BoxGeometry(0.21, 0.29, 0.016),
    bookPages: new THREE.BoxGeometry(0.195, 0.27, 0.018),
    bookCover: new THREE.PlaneGeometry(0.2, 0.28),
    phoneBody: new RoundedBoxGeometry(0.2, 0.36, 0.03, 2, 0.028),
    phoneScreen: new THREE.PlaneGeometry(0.18, 0.3),
    phoneCam: new RoundedBoxGeometry(0.06, 0.06, 0.012, 2, 0.01),
    phoneLogo: new THREE.PlaneGeometry(0.09, 0.06),
    term: new THREE.PlaneGeometry(0.74, 0.5),
    projector: new THREE.CylinderGeometry(0.1, 0.12, 0.05, 24),
    beam: new THREE.CylinderGeometry(0.3, 0.05, 0.68, 24, 1, true),
    sheet: new RoundedBoxGeometry(0.34, 0.03, 0.24, 1, 0.006),
    confetti: new THREE.PlaneGeometry(0.035, 0.06),
    stripe: new THREE.BoxGeometry(0.77, 0.045, 0.57),
    patch: new THREE.PlaneGeometry(0.13, 0.1),
    patchRim: new THREE.PlaneGeometry(0.16, 0.13),
    patchEdge: new THREE.PlaneGeometry(0.185, 0.155),
    capCrown: new RoundedBoxGeometry(CAP.w, CAP.h, CAP.d, 4, 0.09),
    capBrim: new RoundedBoxGeometry(0.74, 0.035, 0.32, 2, 0.015),
  };
  S.tex = {
    chest: texFrom(makeCanvas(160, 100)),
    keys: texFrom(drawKeys(makeCanvas(256, 100))),
    code: texFrom(drawCode(makeCanvas(256, 160))),
    shadow: texFrom(drawShadow(makeCanvas(128, 128))),
    alert: texFrom(makeCanvas(160, 176)),
    gear: texFrom(drawGear(makeCanvas(128, 128))),
    cover: texFrom(makeCanvas(140, 196)),
  };
  const redrawFontTextures = () => {
    drawChest(S.tex.chest.image); S.tex.chest.needsUpdate = true;
    drawAlert(S.tex.alert.image); S.tex.alert.needsUpdate = true;
    drawCover(S.tex.cover.image); S.tex.cover.needsUpdate = true;
  };
  redrawFontTextures();
  fontRedraws.push(redrawFontTextures);
  S.mat = {
    shell: toon(COL.shell),
    limb: toon(COL.limb),
    band: toon(COL.band),
    tail: toon(COL.band, { side: THREE.DoubleSide }),
    chest: toon('#ffffff', { map: S.tex.chest, transparent: true, alphaTest: 0.5 }),
    wood: toon(COL.wood),
    woodDark: toon(COL.woodDark),
    laptop: toon(COL.laptop),
    phone: toon(COL.phone),
    keys: toon('#ffffff', { map: S.tex.keys }),
    code: new THREE.MeshBasicMaterial({ map: S.tex.code }),
    shadow: new THREE.MeshBasicMaterial({ map: S.tex.shadow, transparent: true, depthWrite: false }),
    pages: toon('#fbf8ef'),
    bookShell: toon('#23406b'),
    cover: toon('#ffffff', { map: S.tex.cover }),
    alert: new THREE.SpriteMaterial({ map: S.tex.alert, transparent: true }),
    gear: new THREE.SpriteMaterial({ map: S.tex.gear, transparent: true }),
    projector: toon('#3a4252'),
    beam: new THREE.MeshBasicMaterial({ color: '#7ef9ff', transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
    sheets: ['#ffffff', '#f4efe3', '#e8f0fb', '#fff6dc'].map((c) => toon(c)),
    overall: toon(WEAR.overall),
    stripe: toon(WEAR.stripe),
    brim: toon(WEAR.brim),
    rim: new THREE.MeshBasicMaterial({ color: WEAR.rim }),
    edge: new THREE.MeshBasicMaterial({ color: WEAR.edge }),
    confetti: ['#d62839', '#ffb020', '#35d07f', '#2f80ed', '#7d5cff', '#ff7a3d'].map((c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })),
  };
}

/* ---------- the robot ---------- */
function faceToward(obj, target) {
  const m = new THREE.Matrix4().lookAt(target, obj.position, UP);
  obj.quaternion.setFromRotationMatrix(m);
}
function createRobot({ label = 'a0', role = 'main', state = 'idle', seed = 0, furnished = false, sub = false }) {
  const g = S.geo, m = S.mat;
  const coat = sub ? m.overall : null;   // a subagent: the coverall over body, sleeves and legs
  const r = { label, role, state, prev: state, blend: 1, seed, props: {}, faceMode: '', nextBlink: 1 + (seed % 2), blinkEnd: 0, termAt: 0, phoneAt: 0,
    tired: false, needDrink: false, drinks: 0, gesture: null, hand: null, heavy: false, sweat: null,
    look: null, tint: null, whistle: null, pipi: null };
  r.furnished = furnished;
  r.sub = sub; r.size = sub ? SUB_SIZE : 1;
  r.accent = toon(ROLES[role].color);
  r.lampMat = new THREE.MeshBasicMaterial({ color: LAMP.idle });
  r.logoCanvas = makeCanvas(96, 64);
  r.logoTex = texFrom(r.logoCanvas);
  r.logoMat = new THREE.MeshBasicMaterial({ map: r.logoTex, transparent: true });
  r.root = new THREE.Group();

  r.hips = new THREE.Group(); r.hips.position.y = HIPS_Y; r.root.add(r.hips);
  const pelvis = new THREE.Mesh(g.pelvis, coat || m.limb); pelvis.position.y = 0.03; r.hips.add(pelvis);
  const leg = (x) => {
    const pivot = new THREE.Group(); pivot.position.set(x, 0, 0); r.hips.add(pivot);
    const shin = new THREE.Mesh(g.leg, coat || m.limb); shin.position.y = -0.15; pivot.add(shin);
    const foot = new THREE.Mesh(g.foot, r.accent); foot.position.set(0, -0.31, 0.04); pivot.add(foot);
    return pivot;
  };
  r.legL = leg(0.17); r.legR = leg(-0.17);

  r.torso = new THREE.Group(); r.hips.add(r.torso);
  const body = new THREE.Mesh(g.torso, coat || m.shell); body.position.y = 0.32; r.torso.add(body);
  if (sub) {
    const stripe = new THREE.Mesh(g.stripe, m.stripe); stripe.position.y = 0.14; r.torso.add(stripe);
    const patch = new THREE.Group(); patch.position.set(-0.24, 0.45, 0.2725); patch.userData.wear = 'patch'; r.torso.add(patch);
    const edge = new THREE.Mesh(g.patchEdge, m.edge); patch.add(edge);
    const rim = new THREE.Mesh(g.patchRim, m.rim); rim.position.z = 0.001; patch.add(rim);
    const fill = new THREE.Mesh(g.patch, r.accent); fill.position.z = 0.002; patch.add(fill);
    r.wear = { body, stripe, patch, fill };
  }
  const chest = new THREE.Mesh(g.chest, m.chest); chest.position.set(0, 0.3, 0.2715); r.torso.add(chest);
  const lamp = new THREE.Mesh(g.lamp, r.lampMat); lamp.position.set(0.2, 0.5, 0.235); r.torso.add(lamp);
  const neck = new THREE.Mesh(g.neck, m.limb); neck.position.y = 0.63; r.torso.add(neck);

  r.head = new THREE.Group(); r.head.position.y = 0.66; r.torso.add(r.head);
  const skull = new THREE.Mesh(g.head, m.shell); skull.position.y = HEAD.h / 2; r.head.add(skull);
  r.faceCanvas = makeCanvas(256, 128);
  r.faceCtx = r.faceCanvas.getContext('2d');
  r.faceTex = texFrom(r.faceCanvas);
  const face = new THREE.Mesh(g.face, new THREE.MeshBasicMaterial({ map: r.faceTex, transparent: true, alphaTest: 0.4 }));
  face.position.set(0, 0.35, HEAD.d / 2 + 0.003); r.head.add(face);
  for (const side of [1, -1]) {
    const ear = new THREE.Mesh(g.ear, r.accent); ear.rotation.z = Math.PI / 2; ear.position.set(side * (HEAD.w / 2 + 0.035), 0.4, 0); r.head.add(ear);
    const cap = new THREE.Mesh(g.earCap, m.limb); cap.rotation.z = Math.PI / 2; cap.position.set(side * (HEAD.w / 2 + 0.06), 0.4, 0); r.head.add(cap);
  }
  r.antenna = new THREE.Group(); r.antenna.position.set(0, HEAD.h, -0.12); r.head.add(r.antenna);   // droops when tired
  const rod = new THREE.Mesh(g.rod, m.limb); rod.position.set(0, 0.09, 0); r.antenna.add(rod);
  const ball = new THREE.Mesh(g.ball, r.accent); ball.position.set(0, 0.2, 0); r.antenna.add(ball);

  r.bandCanvas = makeCanvas(2048, Math.round((2048 * BAND.h) / g.bandWall.userData.perimeter));
  r.bandTex = texFrom(r.bandCanvas);
  const band = new THREE.Group(); band.position.y = BAND.y; r.head.add(band);
  band.add(new THREE.Mesh(g.bandWall, toon('#ffffff', { map: r.bandTex })));
  band.add(new THREE.Mesh(g.bandCap, m.band));
  const knotZ = -(HEAD.d / 2 + BAND.t + 0.025);
  const knot = new THREE.Mesh(g.knot, m.band); knot.position.set(0, 0, knotZ); band.add(knot);
  r.tails = [0.3, -0.3].map((spread) => {
    const tail = new THREE.Mesh(g.tail, m.tail);
    tail.position.set(0, -0.02, knotZ - 0.01);
    tail.userData.spread = spread;
    band.add(tail);
    return tail;
  });

  const arm = (x) => {
    const pivot = new THREE.Group(); pivot.position.set(x, 0.49, 0.05); r.torso.add(pivot);
    pivot.add(new THREE.Mesh(g.shoulder, r.accent));
    const upper = new THREE.Mesh(g.arm, coat || m.limb); upper.position.y = -0.18; pivot.add(upper);
    const hand = new THREE.Mesh(g.hand, m.shell); hand.position.y = -0.38; pivot.add(hand);
    return pivot;
  };
  r.armL = arm(0.42); r.armR = arm(-0.42);
  if (sub) {   // the work cap: its brim to the front, over the band; the antenna stays out through the top
    const cap = new THREE.Group(); cap.userData.wear = 'cap'; r.head.add(cap);
    const crown = new THREE.Mesh(g.capCrown, m.overall); crown.position.y = CAP.y; cap.add(crown);
    const brim = new THREE.Mesh(g.capBrim, m.brim); brim.position.set(0, HEAD.h - 0.01, HEAD.d / 2 + 0.13); brim.rotation.x = 0.1; cap.add(brim);
    r.wear.cap = cap; r.wear.crown = crown;
  }
  r.root.scale.setScalar(r.size);
  if (furnished) {
    const desk = new THREE.Group(); desk.position.set(0, 0.275, 0.6); r.root.add(desk);
    const top = new THREE.Mesh(g.deskTop, m.wood); top.position.y = 0.25; desk.add(top);
    for (const [x, z] of [[-0.44, -0.22], [0.44, -0.22], [-0.44, 0.22], [0.44, 0.22]]) { const leg = new THREE.Mesh(g.deskLeg, m.woodDark); leg.position.set(x, -0.025, z); desk.add(leg); }
    r.desk = desk;   // the live view hides it while the robot walks to another seat
  }

  drawBand(r);
  drawLogo(r);
  r.fontRedraw = () => { drawBand(r); drawLogo(r); };   // kept so the live view can drop it when the robot leaves
  fontRedraws.push(r.fontRedraw);
  ensureProps(r, state);
  return r;
}

/* ---------- gestures: an energy drink once after 8 hours, coffee or a meal now and then (10-18) ----------
   A gesture moves the arms and shows a thing in the hand; the state, its lamp and its label stay as they are.
   Only while idle or at work (typing, reading, a command) — never while waiting for permission, thinking or done:
   a gesture there ends at once. None under reduced motion. */
const GESTURE_OK = new Set(['idle', 'typing', 'reading', 'command']);
const GESTURE_LEN = { drink: 3.6, coffee: 5, meal: 5, cheer: 1.6 };   // cheer: a small fist pump when a permission is granted (demo)
function handThing(kind) {
  const g = new THREE.Group();
  if (kind === 'drink') {                                   // a tall can, bright
    // dark with a lime band: no role colour (the hand is the role's colour) and not the white of the robot
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.26, 12), toon('#1c2440'));
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.08, 12), toon('#b6f03c')); band.position.y = 0.03;
    g.add(can, band);
  } else if (kind === 'coffee') {                           // a mug with a handle
    // a white mug with a navy band, coffee on top and steam: the hand (the role's colour) and the mug stay apart
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.15, 12), toon('#ffffff'));
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.078, 0.04, 12), toon('#24407a')); stripe.position.y = -0.01;
    const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.01, 12), toon('#6b4226')); coffee.position.y = 0.07;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 6, 10), toon('#ffffff')); handle.position.x = 0.1;
    g.add(mug, stripe, coffee, handle);
    const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false });
    for (let i = 0; i < 3; i++) { const puff = new THREE.Mesh(new THREE.SphereGeometry(0.03 + i * 0.008, 6, 4), steamMat); puff.position.set((i - 1) * 0.025, 0.12 + i * 0.06, 0); puff.userData.steam = i; g.add(puff); }
  } else {                                                  // a rice bowl and chopsticks
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon('#e8554e'));
    bowl.rotation.x = Math.PI;
    const rice = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), toon('#fffaf0')); rice.rotation.x = -Math.PI / 2; rice.position.y = 0.0;
    g.add(bowl, rice);
  }
  g.position.set(0, -0.44, 0.2); g.scale.setScalar(1.4);   // in front of the hand: the face is 0.46 in front of the neck
  return g;
}
function startGesture(r, kind, t) {
  if (reduceMotion || !GESTURE_OK.has(r.state) || r.play || r.solo || r.brk || (r.call && CALL_ON_LINE.has(r.call.state))) return false;
  endGesture(r);
  if (kind !== 'cheer') { r.hand = handThing(kind); (kind === 'meal' ? r.armL : r.armR).add(r.hand); }
  r.gesture = { kind, t0: t, t1: t + GESTURE_LEN[kind] };
  if (kind === 'drink') r.drinks += 1;
  return true;
}
function endGesture(r) {
  if (r.hand) { r.hand.parent.remove(r.hand); r.hand.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
  r.hand = null; r.gesture = null;
}
/* Tired after 8 hours of its session (the page decides; the robot only shows it): the first time, a drink. */
/* Heavy work (requester, 10-18: many output tokens, a long tool call, three subagents — the server decides): while
   the robot works it types fast and sweats. The lamp and the label stay 作業中; never while waiting, thinking or done;
   under reduced motion the drops stay where they are. */
const HEAVY_OK = new Set(['typing', 'reading', 'command']);
function sweatDrops(r) {
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: 0x7fd3ff, transparent: true, opacity: 0.9 });
  const geo = new THREE.SphereGeometry(0.05, 8, 6);
  for (let k = 0; k < 4; k++) { const d = new THREE.Mesh(geo, mat); d.scale.set(1, 1.5, 1); d.userData.k = k; g.add(d); }
  r.head.add(g);
  return g;
}
function sweatUpdate(r, s, on) {
  if (on && !r.sweat) r.sweat = sweatDrops(r);
  if (!r.sweat) return;
  r.sweat.visible = on;
  if (!on) return;
  for (const d of r.sweat.children) {
    const k = d.userData.k, side = k % 2 ? 1 : -1;
    const ph = reduceMotion ? 0.35 + k * 0.1 : (s * 1.7 + k / 4) % 1;
    d.position.set(side * (0.62 + ph * 0.45), 0.85 + Math.sin(ph * Math.PI) * 0.35 - ph * 0.2, 0.15);
    d.scale.setScalar(Math.max(0.2, 1 - ph * 0.8)); d.scale.y *= 1.5;
  }
}
/* Heavy work in three looks, one per cause (requester, 10-19; 2.3.6). r.heavy is the server's list of causes
   (ingest.py _heavy: 'tokens', 'tool', 'subagents'); the causes are decided there, only the look is decided here:
     tokens    -> 'fired':   the screen glows red, brows slanted down to the middle, a set jaw; fast typing
     tool      -> 'drained': the screen goes blue, small eyes sunk low, a wobbly mouth, gloom lines down its top;
                             slower typing. Not the 8-hour tiredness: that keeps the dark screen, half-shut eyes with
                             purple bags, a drooping antenna and the energy drink.
     subagents -> 'whistle': a whistle at the mouth, eyes squeezed > <, 「ピッ！」 over the head, one arm waving the
                             team on (main robots only: a subagent has no team)
   Sweat drops stay with all three (heavy work). Two or more causes take turns every LOOK_PERIOD seconds, the colour
   easing over LOOK_EASE seconds. Reduced motion: colour and face only, no waving and no turns: the first of
   LOOK_ORDER that holds (blue > whistle > red), the colour set at once. */
const HEAVY_LOOK = { tokens: 'fired', tool: 'drained', subagents: 'whistle' };
const LOOK_ORDER = ['drained', 'whistle', 'fired'];
const LOOK_PERIOD = 4, LOOK_EASE = 0.6;
const LOOK_TINT = { fired: [255, 64, 64, 0.42], drained: [64, 140, 255, 0.42], whistle: [0, 0, 0, 0] };
function heavyCauses(r) {
  const h = r.heavy === true ? ['tokens'] : Array.isArray(r.heavy) ? r.heavy : [];
  return LOOK_ORDER.filter((look) => h.some((c) => HEAVY_LOOK[c] === look) && (look !== 'whistle' || r.role === 'main'));
}
function heavyLook(r, t) {
  // background work: only the whistle (3+ subagents) shows, over the headset (requester 10-20: 「笛を優先」); red and blue not
  if (r.state === 'background') return heavyCauses(r).includes('whistle') ? 'whistle' : null;
  if (!HEAVY_OK.has(r.state)) return null;
  const looks = heavyCauses(r);
  if (!looks.length) return null;
  if (reduceMotion || looks.length === 1) return looks[0];
  return looks[Math.floor(t / LOOK_PERIOD) % looks.length];
}
function whistleProp() {
  const g = new THREE.Group(), metal = toon('#ffc928');
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 12), metal); body.rotation.z = Math.PI / 2;
  const tube = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.09), metal); tube.position.set(-0.05, 0.01, 0.04);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.009, 6, 10), toon('#1f2532')); ring.position.set(0.06, 0.02, 0);
  g.add(body, tube, ring);
  g.rotation.y = Math.PI / 2;
  g.position.set(0.02, 0.27, HEAD.d / 2 + 0.06);           // at the mouth, in front of the screen
  g.scale.setScalar(1.6);
  g.userData.whistle = true;
  return g;
}
function pipiBubble(text = 'ピッ！') {                        // 「ピッ」 over the head while the whistle blows
  const canvas = makeCanvas(192, 112), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1f2532'; ctx.lineWidth = 6;
  rr(ctx, 6, 6, 180, 78, 30); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(132, 82); ctx.lineTo(148, 106); ctx.lineTo(108, 82); ctx.closePath(); ctx.fill(); ctx.stroke();   // the tail toward the head
  ctx.fillStyle = '#ffffff'; ctx.fillRect(104, 76, 30, 8);
  ctx.fillStyle = '#e8590c'; ctx.font = `46px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${text.length > 3 ? 40 : 46}px ${FONT_DISPLAY}`;
  ctx.fillText(text, 96, 46);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFrom(canvas), transparent: true }));
  s.position.set(-1.0, 2.1, 0.3); s.scale.set(0.72, 0.42, 1); s.userData.pipi = true;   // beside the head, by the waving (right, -x) arm
  return s;
}
/* Calling a subagent (requester 10-20: "サブエージェント呼ぶのは笛鳴らそうか"; ticket 2026-10-20-jui-viz-agent-launch-whistle):
   r.launch is true for a fixed length from the moment an Agent call starts (the server's agent.whistle, robots.py
   LAUNCH_WHISTLE_MS; the page turns it off when vizNow passes its end, and never while the robot is away from its
   desk). The same whistle and the same waving arm as heavy work's 'whistle', the face squeezed > <, and its own
   bubble 「ピーッ！」 (a long blow) where heavy work says 「ピッ！」. Told apart: the launch is short (2.5 s), comes with
   the call (the robot carries its papers, then waits, or works on), with no sweat and with 「ピーッ！」; heavy work's
   directing of 3 or more subagents lasts as long as they run, with sweat and 「ピッ！」. Both at once: 「ピーッ！」 for
   the launch's 2.5 s, then 「ピッ！」 and the sweat go on. Reduced motion: the whistle at the mouth only, no waving. */
function lookUpdate(r, t, dt) {
  const look = heavyLook(r, t);
  r.look = look;
  const want = look ? LOOK_TINT[look] : [0, 0, 0, 0];
  const cur = r.tint || (r.tint = [0, 0, 0, 0]);
  if (!cur[3]) { cur[0] = want[0]; cur[1] = want[1]; cur[2] = want[2]; }   // from nothing: the hue at once, the alpha eases
  const k = reduceMotion ? 1 : Math.min(1, dt / LOOK_EASE * 3);
  for (let i = 0; i < 4; i++) cur[i] += (want[i] - cur[i]) * k;
  const blow = look === 'whistle' || !!r.launch;
  if (blow && !r.whistle) { r.whistle = whistleProp(); r.head.add(r.whistle); }
  if (r.whistle) r.whistle.visible = blow;
  if (look === 'whistle' && !r.launch && !r.pipi) { r.pipi = pipiBubble(); r.root.add(r.pipi); }
  if (r.launch && !r.pipiLong) { r.pipiLong = pipiBubble('ピーッ！'); r.pipiLong.userData.launch = true; r.root.add(r.pipiLong); }
  for (const [bubble, on] of [[r.pipi, look === 'whistle' && !r.launch], [r.pipiLong, !!r.launch]]) {
    if (!bubble) continue;
    bubble.visible = on;
    if (on && !reduceMotion) bubble.position.y = 2.1 + Math.abs(Math.sin(t * 7)) * 0.08;   // in time with the arm
  }
  return look;
}
/* The browser tests' hook (80-dbg.js, force) sets a robot's causes or its tiredness; the page never does. */
const forced = (r, key, value) => (r.force && key in r.force ? r.force[key] : value);
/* Background work and heavy work: the heavy looks (lookUpdate, sweat) hold in HEAVY_OK's states (typing, reading, a
   command); a robot working in the background is in its own state, 'background', where the headset, the notes and the
   loose typing win over the red and the blue face (2.3.5 integration, 10-20). The whistle wins over the headset
   (requester 10-20: 「サブエージェント7対いるけど笛のアクションにならないね」, then 「笛を優先」): with 3 or more
   subagents a main robot in the background whistles, waves and sweats, its headset and notes off; when the cause goes,
   the headset is back. The launch whistle (2.5 s, 「ピーッ！」) shows over the headset as before, with no change. */
/* Background work (requester, 10-19: "バックグラウンドで作業の場合はヘッドセットつけて、音符出してる状態で机の上でパソコンを
   ゆるめにいじってほしい"): a headset on the head (cups in the 裏で作業中 colour, LAMP.bg, as on the tag, the card and the
   legend), NOTE_MAX notes rising over it (still under reduced motion), and the laptop typed on loosely (poseFor
   'background'). Built once a robot first works in the background, one set a robot; shown only in that state. */
const NOTE_MAX = 3;
function noteCanvas(double) {
  const c = makeCanvas(96, 112), ctx = c.getContext('2d');
  const head = (x, y) => { ctx.beginPath(); ctx.ellipse(x, y, 15, 11, -0.45, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const [pass, w, colour] of [[0, 14, '#1f2a44'], [1, 0, LAMP.bg]]) {
    ctx.strokeStyle = pass ? colour : '#1f2a44'; ctx.fillStyle = pass ? colour : '#1f2a44'; ctx.lineWidth = pass ? 6 : w;
    if (double) {
      ctx.beginPath(); ctx.moveTo(38, 84); ctx.lineTo(38, 24); ctx.lineTo(80, 14); ctx.lineTo(80, 74); ctx.stroke();
      ctx.lineWidth = pass ? 10 : 18; ctx.beginPath(); ctx.moveTo(38, 26); ctx.lineTo(80, 16); ctx.stroke();
      ctx.lineWidth = pass ? 2 : w; head(26, 86); head(68, 76);
    } else {
      ctx.beginPath(); ctx.moveTo(56, 86); ctx.lineTo(56, 16); ctx.quadraticCurveTo(66, 40, 84, 46); ctx.stroke();
      ctx.lineWidth = pass ? 2 : w; head(44, 88);
    }
  }
  return c;
}
function bgGear(r) {
  if (!S.tex.notes) S.tex.notes = [texFrom(noteCanvas(false)), texFrom(noteCanvas(true))];
  const band = toon('#273449'), cup = toon(LAMP.bg), pad = toon('#1b2333');
  const headset = new THREE.Group(); headset.userData.headset = true;
  const R = HEAD.w / 2 + 0.15;
  const arc = new THREE.Mesh(new THREE.TorusGeometry(R, 0.04, 10, 40, Math.PI), band);
  const top = r.sub ? CAP.y + CAP.h / 2 + 0.07 : HEAD.h + 0.07;   // over the work cap's crown when it has one
  arc.position.set(0, 0.42, -0.02); arc.scale.y = (top - 0.42) / R; headset.add(arc);
  for (const side of [1, -1]) {
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.13, 28), cup); shell.rotation.z = Math.PI / 2; shell.position.set(side * R, 0.42, -0.02); headset.add(shell);
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24), pad); cushion.rotation.z = Math.PI / 2; cushion.position.set(side * (R - 0.08), 0.42, -0.02); headset.add(cushion);
  }
  // the microphone on its boom, from the right cup to in front of the mouth
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), band);
  boom.position.set(R - 0.12, 0.26, 0.24); boom.rotation.set(Math.PI / 2 - 0.35, 0, 0.55); headset.add(boom);
  const mic = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), pad); mic.position.set(R - 0.27, 0.15, 0.47); headset.add(mic);
  r.head.add(headset);
  const notes = new THREE.Group(); notes.userData.notes = true;
  for (let k = 0; k < NOTE_MAX; k++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: S.tex.notes[k % 2], transparent: true, depthWrite: false }));
    sp.scale.set(0.3, 0.35, 1); sp.userData.k = k; notes.add(sp);
  }
  r.root.add(notes);
  r.headset = headset; r.notes = notes;
}
function bgUpdate(r, t, on) {
  if (on && !r.headset) bgGear(r);
  if (!r.headset) return;
  r.headset.visible = on; r.notes.visible = on;
  if (!on) return;
  for (const sp of r.notes.children) {
    const n = notePose(r, sp.userData.k, t);
    sp.position.set(n.x, n.y, 0.1);
    sp.material.opacity = n.opacity;
  }
}
/* Where note k stands at time t (the e2e reads it at two times: still under reduced motion, rising otherwise). */
function notePose(r, k, t) {
  const ph = reduceMotion ? 0.3 + k * 0.22 : (t * 0.42 + k / NOTE_MAX + r.seed * 0.13) % 1;
  return { x: (k % 2 ? -1 : 1) * (0.42 + ph * 0.18) + Math.sin(ph * 6.3 + k) * 0.06, y: 1.95 + ph * 0.75,
    opacity: reduceMotion ? 1 : Math.min(1, Math.sin(ph * Math.PI) * 1.6) };
}
/* Reading the web (requester 10-20: "WebFetchの時は机で辞書をペラペラめくるアニメーションにして欲しい"; WebSearch too): the
   state stays 'reading' (lamp, tag and card as they were) and r.readKind is 'web' (ingest.py agent.readKind, from
   robots.WEB_READING_TOOLS). In place of the book held up, a thick dictionary lies open on the desk and the right hand
   flips its pages: DICT_PAGES pages one after another (DICT_GAP apart, each over in DICT_FLIP), then a rest, every
   DICT_PERIOD of pose time. A page is drawn only while it turns; the two blocks of pages stay. Only in 'reading', so
   never away from the desk (walking, a break, a game, the box: other states). Reduced motion: the dictionary open,
   no page turning, the hand still. Built once a robot first reads the web, under its root with geometries and
   materials of its own: taking the robot down (disposeTree) disposes them, as the other props. */
const DICT_PAGES = 3, DICT_PERIOD = 2.6, DICT_FLIP = 0.55, DICT_GAP = 0.22;
const DICT = { w: 0.27, d: 0.36, block: 0.1, board: 0.014, x: 0, y: 0.55, z: 0.5 };   // y: the desk's top (0.275 + 0.25 + 0.025)
/* How far page k has turned at pose time s, 0 (on the right block) to 1 (laid on the left one). */
function dictFlip(s, k) {
  if (reduceMotion) return 0;
  const u = Math.min(1, Math.max(0, ((((s % DICT_PERIOD) + DICT_PERIOD) % DICT_PERIOD) - k * DICT_GAP) / DICT_FLIP));
  return u * u * (3 - 2 * u);
}
/* The right hand over the pages: 0 at rest, 1 in the middle of a turn. */
function dictHand(s) {
  let f = 0;
  for (let k = 0; k < DICT_PAGES; k++) f = Math.max(f, Math.sin(Math.PI * dictFlip(s, k)));
  return f;
}
function dictBuild(r) {
  const group = new THREE.Group(); group.userData.dictionary = true;
  group.position.set(DICT.x, DICT.y, DICT.z);
  const coverMat = toon('#7a2432'), pageMat = toon('#f7f1df'), edgeMat = toon('#d9cba3'), tabMat = toon('#c9a227');
  const top = DICT.board + DICT.block;
  for (const side of [-1, 1]) {   // -1: the robot's right (-x), the pages not read yet; 1: its left
    const board = new THREE.Mesh(new THREE.BoxGeometry(DICT.w + 0.02, DICT.board, DICT.d + 0.025), coverMat);
    board.position.set(side * (DICT.w / 2 + 0.008), DICT.board / 2, 0); group.add(board);
    const block = new THREE.Mesh(new THREE.BoxGeometry(DICT.w, DICT.block, DICT.d), [edgeMat, edgeMat, pageMat, edgeMat, edgeMat, edgeMat]);
    block.position.set(side * (DICT.w / 2 + 0.004), DICT.board + DICT.block / 2, 0); block.rotation.z = side * 0.04; group.add(block);
  }
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, DICT.d + 0.025, 16, 1, false, -Math.PI / 2, Math.PI), coverMat);
  spine.rotation.x = Math.PI / 2; spine.position.set(0, 0.03, 0); group.add(spine);   // the round back, under the middle
  for (let k = 0; k < 3; k++) {   // thumb-index tabs on the outer edge of the pages still to read: a dictionary
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.05), tabMat);
    tab.position.set(-(DICT.w + 0.01), DICT.board + 0.022 + k * 0.028, -0.11 + k * 0.11); group.add(tab);
  }
  const leafGeo = new THREE.BoxGeometry(DICT.w - 0.01, 0.003, DICT.d - 0.01).translate(-(DICT.w - 0.01) / 2, 0, 0);
  const pages = [];
  for (let k = 0; k < DICT_PAGES; k++) {   // each page turns about the spine, from the right block over to the left
    const hinge = new THREE.Group(); hinge.position.set(0, top + 0.002 + k * 0.001, 0); group.add(hinge);
    const leaf = new THREE.Mesh(leafGeo, pageMat); hinge.add(leaf);
    pages.push(hinge);
  }
  const holder = new THREE.Group(); holder.add(group);
  if (!r.furnished) {   // a robot without a desk of its own (the demo) gets one, as the laptop does
    const g = S.geo, m = S.mat, desk = new THREE.Group(); desk.position.set(0, 0.275, 0.6); holder.add(desk);
    const deskTop = new THREE.Mesh(g.deskTop, m.wood); deskTop.position.y = 0.25; desk.add(deskTop);
    for (const [x, z] of [[-0.44, -0.22], [0.44, -0.22], [-0.44, 0.22], [0.44, 0.22]]) { const leg = new THREE.Mesh(g.deskLeg, m.woodDark); leg.position.set(x, -0.025, z); desk.add(leg); }
  }
  r.root.add(holder);
  return { group: holder, book: group, pages };
}
function dictUpdate(r, s, k) {
  const on = k > 0.02;
  if (on && !r.dict) r.dict = dictBuild(r);
  if (!r.dict) return;
  r.dict.group.visible = on;
  if (!on) return;
  r.dict.book.scale.setScalar(Math.max(0.001, k));
  r.dict.pages.forEach((hinge, i) => {
    const f = dictFlip(s, i);
    hinge.rotation.z = -Math.PI * f;   // 0: lying on the right block; π: on the left one
    hinge.visible = f > 0.001 && f < 0.999;
  });
}
function setRobotTired(r, on) {
  if (on && !r.tired) r.needDrink = true;
  if (!on) r.needDrink = false;
  r.tired = on;
}
/* Phone calls (requester, 10-18: SendMessage between two sessions — the server's calls slice decides). r.call is
   { role: 'caller' | 'callee', state } or null; like sweat, the state, its lamp and its label stay as they are.
   The caller holds a handset to its ear while it rings and on the line; the callee's phone rings over its head until
   it picks up (it reads the message), then it holds the handset too. A call puts a gesture away. Under reduced
   motion nothing shakes. */
const CALL_ON_LINE = new Set(['dialing', 'ringing', 'answered']);
function handset() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.26, 4, 8), toon('#1f2532'));
  for (const y of [-0.16, 0.16]) { const cup = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), toon('#1f2532')); cup.position.y = y; g.add(cup); }
  g.add(body);
  g.position.set(0, -0.46, 0.14); g.rotation.x = 0.3;
  return g;
}
function ringBubble() {
  const canvas = makeCanvas(160, 160), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1f2532'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(80, 80, 52, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2f9e5b';   // a handset, tilted
  ctx.save(); ctx.translate(80, 84); ctx.rotate(-0.6);
  rr(ctx, -30, -9, 60, 18, 9); ctx.fill();
  rr(ctx, -34, -9, 18, 28, 7); ctx.fill(); rr(ctx, 16, -9, 18, 28, 7); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#2f9e5b'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (const rad of [64, 76]) { ctx.beginPath(); ctx.arc(80, 80, rad, -1.2, -0.4); ctx.stroke(); ctx.beginPath(); ctx.arc(80, 80, rad, Math.PI + 0.4, Math.PI + 1.2); ctx.stroke(); }
  const mat = new THREE.SpriteMaterial({ map: texFrom(canvas), transparent: true });
  const s = new THREE.Sprite(mat); s.position.set(0, 2.3, 0.1); s.scale.set(0.5, 0.5, 1);
  return s;
}
function callUpdate(r, t) {
  const c = r.call;
  const ringing = !!c && c.role === 'callee' && (c.state === 'ringing' || c.state === 'dialing');
  const onLine = !!c && CALL_ON_LINE.has(c.state) && !ringing;
  if (ringing && !r.ring) { r.ring = ringBubble(); r.root.add(r.ring); }
  if (r.ring) {
    r.ring.visible = ringing;
    if (ringing && !reduceMotion) { r.ring.material.rotation = Math.sin(t * 38) * 0.22; r.ring.position.y = 2.3 + Math.abs(Math.sin(t * 9)) * 0.06; }
  }
  if (onLine && !r.handset) { if (r.gesture) endGesture(r); r.handset = handset(); r.armR.add(r.handset); }
  if (!onLine && r.handset) { r.handset.parent.remove(r.handset); r.handset.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); r.handset = null; }
  return onLine;
}
function callPose(p, t) {   // the right hand at the ear, the head toward it
  p.aRx = -2.25; p.aRz = -1.2; p.headZ = 0.16; p.headX = -0.04;
  if (!reduceMotion) p.headY = Math.sin(t * 1.3) * 0.12;
}
/* Play (requester, 10-18: robots idle for long in one room play together; the scene decides who, where and how
   long). r.play is { kind: 'ball' | 'highfive' | 'rps', t0, side: 0 | 1, seed } while at the spot; the state stays idle.
   2.3.3 (requester, 10-19: "ずっと二人で向き合ってるだけで何やってるかわからない"): every game moves big enough to read
   from the usual view. ball: the thrower winds up over its shoulder and swings through, the catcher holds both hands
   out (the ball itself is the scene's); highfive: the two walk toward each other, turn a little to the front and slap
   the inner hands (the walk and the パチン mark are the scene's); rps (じゃんけん): three pumps, then the hand drawn in a
   bubble that stays up until the next pump, the winner raises both arms, the loser hangs its head, あいこ plays again
   at once. The timing helpers are shared with the scene (40-scene.js), so the arms, the ball and the walk agree. */
const RPS_HANDS = ['グー', 'チョキ', 'パー'];
const playEase = (v) => { const k = Math.max(0, Math.min(1, v)); return k * k * (3 - 2 * k); };
const playMix = (a, b, k) => a + (b - a) * k;
// ball: one throw per half; the thrower winds up until windup, the ball leaves the hand at release
const BALL_T = { half: 1.5, windup: 0.3, release: 0.42 };
function ballPhase(u) { const n = Math.floor(u / BALL_T.half); return { n, thrower: n % 2, w: u / BALL_T.half - n }; }
// highfive: walk in until inEnd, the hands up and the slap at touch, walk back from outStart until back
const HIGHFIVE_T = { period: 2.8, inEnd: 0.34, touch: 0.46, outStart: 0.6, back: 0.92, turn: 1.15 };
function highfivePhase(u) {
  const T = HIGHFIVE_T, w = (u / T.period) % 1;
  const near = w < T.inEnd ? playEase(w / T.inEnd) : w < T.outStart ? 1 : w < T.back ? 1 - playEase((w - T.outStart) / (T.back - T.outStart)) : 0;
  const up = w < T.touch ? playEase((w - (T.inEnd - 0.1)) / (T.touch - T.inEnd + 0.06)) : 1 - playEase((w - T.touch - 0.06) / (T.outStart - T.touch));
  const walking = (w < T.inEnd) || (w >= T.outStart && w < T.back);
  return { w, near, up, walking, slap: Math.abs(w - T.touch) < 0.09 };
}
// rps: the pumps until shake; a decided round lasts len, a tie (あいこ) only tie: it plays again at once
const RPS_T = { shake: 1.5, result: 2.1, len: 4.4, tie: 3.2 };
function rpsHand(seed, k, side) {
  let h = Math.imul((seed | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(k + 1, 0xc2b2ae35) ^ Math.imul(side + 7, 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h ^= h >>> 13;
  return (h >>> 0) % 3;
}
// a beats b when (b - a + 3) % 3 === 1 (グー > チョキ > パー > グー)
function rpsRound(seed, u) {
  let start = 0;
  for (let k = 0; k < 500; k++) {
    const hands = [rpsHand(seed, k, 0), rpsHand(seed, k, 1)], tie = hands[0] === hands[1];
    const len = tie ? RPS_T.tie : RPS_T.len;
    if (u < start + len) {
      const res = tie ? ['tie', 'tie'] : (hands[1] - hands[0] + 3) % 3 === 1 ? ['win', 'lose'] : ['lose', 'win'];
      return { k, w: u - start, len, hands, res };
    }
    start += len;
  }
  return { k: 0, w: 0, len: RPS_T.len, hands: [0, 0], res: ['tie', 'tie'] };
}
function playPose(r, p, t) {
  const P = r.play, u = Math.max(0, t - P.t0);
  if (P.kind === 'ball') {
    const { thrower, w } = ballPhase(u);
    if (P.side === thrower) {
      p.aLx = -1.1; p.aLz = 0.25; p.headX = -0.12;
      if (w < BALL_T.windup) {                               // wind up: the arm up and back over the shoulder, the body turned away
        const k = playEase(w / BALL_T.windup);
        p.aRx = playMix(-0.6, 0.75, k); p.aRz = playMix(-0.3, -2.35, k); p.torsoY = -0.4 * k; p.torsoX = -0.12 * k;
      } else if (w < BALL_T.release) {                       // the throw: a big swing forward and down, the body leaning in
        const k = playEase((w - BALL_T.windup) / (BALL_T.release - BALL_T.windup));
        p.aRx = playMix(0.75, -2.0, k); p.aRz = playMix(-2.35, -0.5, k); p.torsoY = playMix(-0.4, 0.3, k); p.torsoX = playMix(-0.12, 0.2, k);
      } else {                                               // follow through, then rest while the ball flies
        const k = playEase((w - BALL_T.release) / 0.35);
        p.aRx = playMix(-2.0, -0.5, k); p.aRz = playMix(-0.5, -0.2, k); p.torsoY = playMix(0.3, 0, k); p.torsoX = playMix(0.2, 0, k);
      }
    } else {                                                 // the catcher: both hands out in front, together
      const k = playEase((w - 0.08) / 0.25);
      p.aRx = -1.45 * k; p.aLx = -1.45 * k; p.aRz = playMix(-0.12, 0.38, k); p.aLz = playMix(0.12, -0.38, k);
      p.headX = -0.1; p.torsoX = w > 0.94 ? -0.08 : 0.04 * k;
    }
  } else if (P.kind === 'highfive') {
    const H = highfivePhase(u), inner = P.side === 0 ? 'L' : 'R', sgn = P.side === 0 ? 1 : -1;   // the hand toward the partner
    if (H.walking) { const sw = Math.sin(u * 11) * 0.55; p.lLx = sw; p.lRx = -sw; p.aLx = -sw * 0.5; p.aRx = sw * 0.5; }
    p[`a${inner}z`] = sgn * playMix(0.12, 2.0, H.up); p[`a${inner}x`] = playMix(p[`a${inner}x`] || 0, 0, H.up);
    p.rootY = H.slap ? 0.08 * (1 - Math.abs(H.w - HIGHFIVE_T.touch) / 0.09) : 0; p.headX = -0.12 * H.up;
  } else {
    const R = rpsRound(P.seed | 0, u), w = R.w;
    if (w < RPS_T.shake) {                                   // じゃん・けん・ぽん: three big pumps
      const pump = Math.abs(Math.sin((w / RPS_T.shake) * Math.PI * 3));
      p.aRx = -0.6 - pump * 1.5; p.aRz = -0.3; p.aLx = -0.4; p.aLz = 0.3; p.headX = 0.05; p.torsoX = pump * 0.06;
    } else if (w < RPS_T.result) {                           // the hand out in front
      p.aRx = -1.45; p.aRz = -0.15; p.aLx = -0.3; p.headX = 0.08;
    } else if (R.res[P.side] === 'win') {                    // both arms up, a hop
      const hop = Math.abs(Math.sin((w - RPS_T.result) * 6));
      p.aRx = 0; p.aRz = -2.35; p.aLx = 0; p.aLz = 2.35; p.rootY = hop * 0.12; p.headX = -0.2;
    } else if (R.res[P.side] === 'lose') {                   // head down, arms hanging
      p.aRx = 0.15; p.aRz = -0.05; p.aLx = 0.15; p.aLz = 0.05; p.headX = 0.4; p.torsoX = 0.14; p.hipsY = -0.02;
    } else {                                                 // あいこ: the hand still out, the head tilted
      p.aRx = -1.3; p.aRz = -0.15; p.headZ = 0.22; p.headX = -0.05;
    }
  }
}
// the hand as a picture (a fist, two fingers, an open hand) and its name; the result under it once it is known
function rpsDraw(ctx, W, H, hand, res) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1f2532'; ctx.lineWidth = 7;
  rr(ctx, 6, 6, W - 12, H - 12, 34); ctx.fill(); ctx.stroke();
  const cx = 82, cy = 104, skin = '#ffcf9e';
  ctx.fillStyle = skin; ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const finger = (ang, len) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    rr(ctx, -10, -len - 18, 20, len + 10, 10); ctx.fill(); ctx.stroke(); ctx.restore();
  };
  if (hand === 1) { finger(-0.32, 58); finger(0.18, 62); }
  if (hand === 2) { finger(-0.95, 34); finger(-0.42, 54); finger(-0.08, 60); finger(0.26, 56); finger(0.6, 46); }
  rr(ctx, cx - 36, cy - 32, 72, 70, 24); ctx.fill(); ctx.stroke();
  if (hand === 0) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx - 34, cy - 12 + i * 16); ctx.lineTo(cx + 6, cy - 12 + i * 16); ctx.stroke(); }
  ctx.fillStyle = '#1f2532'; ctx.font = `700 50px ${FONT_BODY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(RPS_HANDS[hand], 200, res ? 74 : 104);
  if (res) {
    const [text, color] = { win: ['かち！', '#d0352b'], lose: ['まけ…', '#5b6577'], tie: ['あいこ', '#d88a00'] }[res];
    ctx.fillStyle = color; ctx.font = `700 46px ${FONT_DISPLAY}`; ctx.fillText(text, 200, 150);
  }
}
function playBubble(r, P, t) {
  const R = P && P.kind === 'rps' ? rpsRound(P.seed | 0, Math.max(0, t - P.t0)) : null;
  const show = !!R && R.w >= RPS_T.shake;                    // from the reveal until the next pump
  r.rpsState = R ? { k: R.k, hand: show ? RPS_HANDS[R.hands[P.side]] : null, res: show && R.w >= RPS_T.result ? R.res[P.side] : null, shaking: !show } : null;
  if (show && !r.rps) {
    r.rpsCanvas = makeCanvas(300, 210);
    r.rps = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFrom(r.rpsCanvas), transparent: true, depthTest: false }));
    r.rps.renderOrder = 5; r.rps.position.set(0, 2.3, 0.1); r.rps.scale.set(0.86, 0.6, 1); r.root.add(r.rps); r.rpsShown = '';
  }
  if (!r.rps) return;
  r.rps.visible = show;
  if (!show) return;
  const key = `${R.hands[P.side]}:${r.rpsState.res || ''}`;
  if (key === r.rpsShown) return;
  r.rpsShown = key;
  rpsDraw(r.rpsCanvas.getContext('2d'), 300, 210, R.hands[P.side], r.rpsState.res);
  r.rps.material.map.needsUpdate = true;
}
/* Alone in its room (requester, 10-18): r.solo is { kind: 'nap' | 'bento', t0 } while the scene says so. nap: the head
   sinks and nods, the arms rest, a zzz drifts up; bento: a box on the desk, chopsticks to the mouth. */
function soloPose(r, p, t) {
  const u = t - r.solo.t0;
  if (r.solo.kind === 'nap') {
    const nod = reduceMotion ? 0 : Math.sin(u * 1.1);
    p.headX = 0.42 + nod * 0.06; p.headZ = 0.12; p.torsoX = 0.1; p.hipsY = -0.01;
    p.aLx = -0.9; p.aLz = -0.3; p.aRx = -0.9; p.aRz = 0.3;
  } else {
    const bite = 0.5 + 0.5 * Math.sin(u * 4.2);
    p.aLx = -1.1; p.aLz = -0.35; p.aRx = -1.35 - bite * 0.45; p.aRz = 0.3; p.headX = 0.22 - bite * 0.06;
  }
}
/* White letters with a dark rim: readable on the light floor and on the dark one (jsonuidocument-96, 10-18: the blue zzz
   all but vanished on the dark floor and walls). */
function zzzCanvas() {
  const c = makeCanvas(200, 150), ctx = c.getContext('2d');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  [[50, 112, 38], [104, 74, 50], [156, 34, 62]].forEach(([x, y, size]) => {
    ctx.font = `700 ${size}px ${FONT_DISPLAY}`;
    ctx.lineWidth = 9; ctx.strokeStyle = '#1f2a44'; ctx.strokeText('z', x, y);
    ctx.fillStyle = '#ffffff'; ctx.fillText('z', x, y);
  });
  return c;
}
function bentoBox() {
  const g = new THREE.Group();
  // big enough to read from the usual view (96, 10-18: a few pixels even up close): a red box, rice, a side dish, a lid
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.44), toon('#c0392b'));
  const rice = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.38), toon('#fffaf0')); rice.position.set(-0.14, 0.07, 0);
  const plum = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), toon('#d63a5a')); plum.position.set(-0.14, 0.1, 0);
  const side = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.38), toon('#e6a23c')); side.position.set(0.15, 0.07, 0);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.44), toon('#2b2f36')); lid.position.set(0.5, 0.0, 0.05); lid.rotation.z = 0.35;
  g.add(box, rice, plum, side, lid);
  g.position.set(0, 0.62, 0.48);
  return g;
}
function soloProps(r, S, t) {
  const nap = !!S && S.kind === 'nap', bento = !!S && S.kind === 'bento';
  if (nap && !r.zzz) { r.zzz = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFrom(zzzCanvas()), transparent: true, depthTest: false })); r.zzz.renderOrder = 5; r.zzz.scale.set(1.1, 0.82, 1); r.root.add(r.zzz); }
  if (r.zzz) {
    r.zzz.visible = nap;
    if (nap) { const k = reduceMotion ? 0.4 : ((t - S.t0) * 0.4) % 1; r.zzz.position.set(0.55, 2.0 + k * 0.5, 0.1); r.zzz.material.opacity = 1 - k * 0.5; }
  }
  if (bento && !r.bento) { r.bento = bentoBox(); r.root.add(r.bento); }
  if (r.bento) r.bento.visible = bento;
}
/* A break (requester, 10-19: a cigarette in the smoking booth, a drink from the vending machine). r.brk is
   { kind: 'smoke' | 'vend', t0, buySec } while the robot is at the booth or the machine; the scene walks it there and back.
   smoke: the hand with the cigarette goes to the mouth every BRK_PUFF_SEC, then down (the scene lets the smoke out);
   vend: a button pressed, a bend to the slot, then a can sipped now and then. */
const BRK_PUFF_SEC = 5;
function brkPuff(u) {   // 0: the hand down, 1: at the mouth (a smooth lift, a hold, a smooth drop)
  const c = u % BRK_PUFF_SEC, e = (x) => x * x * (3 - 2 * x);
  return c < 0.5 ? e(c / 0.5) : c < 1.8 ? 1 : c < 2.3 ? 1 - e((c - 1.8) / 0.5) : 0;
}
function brkPose(r, p, t) {
  const B = r.brk, u = t - B.t0;
  if (B.kind === 'smoke') {
    const k = reduceMotion ? 0 : brkPuff(u);
    p.aRx = -0.55 - k * 1.0; p.aRz = 0.15 + k * 0.35; p.aLx = -0.15; p.aLz = 0.12; p.headX = 0.02 - k * 0.08;
  } else if (u < B.buySec * 0.5) {                          // a finger on a button
    p.aRx = -1.45; p.aRz = 0.08; p.torsoX = 0.05; p.headX = 0.05;
  } else if (u < B.buySec) {                                // a bend to the slot below
    p.aRx = -0.9; p.aRz = 0.1; p.torsoX = 0.35; p.headX = 0.25;
  } else {                                                  // the can to the mouth, head back, now and then
    const c = (u - B.buySec) % 4, sip = c < 1.6 ? Math.sin((c / 1.6) * Math.PI) : 0;
    p.aRx = -1.0 - sip * 0.8; p.aRz = 0.3 + sip * 0.15; p.headX = -sip * 0.3;
  }
}
function cigarette() {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8), toon('#f4f1ea'));
  const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.05, 8), toon('#d9913a')); filter.position.y = -0.08;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6a2a })); tip.position.y = 0.085;
  g.add(stick, filter, tip); g.userData.tip = tip;
  g.rotation.x = Math.PI / 2; g.position.set(0, -0.43, 0.1); g.scale.setScalar(1.5);
  return g;
}
function brkProps(r, B, t) {
  const want = !B ? null : B.kind === 'smoke' ? 'smoke' : t - B.t0 >= B.buySec ? 'vend' : null;   // the can once it is taken out
  if (want === (r.brkHandKind || null)) return;
  if (r.brkHand) { r.brkHand.parent.remove(r.brkHand); r.brkHand.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
  r.brkHand = want === 'smoke' ? cigarette() : want === 'vend' ? handThing('drink') : null;
  r.brkHandKind = want;
  if (r.brkHand) r.armR.add(r.brkHand);
}
function gesturePose(r, p, t) {
  const G = r.gesture, k = Math.min(1, (t - G.t0) / 0.35, (G.t1 - t) / 0.35);   // ease in and out
  const sip = 0.5 + 0.5 * Math.sin((t - G.t0) * (G.kind === 'meal' ? 5 : 2.6));
  const mix = (key, v) => { p[key] += (v - p[key]) * k; };
  if (r.hand) for (const o of r.hand.children) if (o.userData.steam !== undefined) o.position.y = 0.12 + ((t * 0.6 + o.userData.steam / 3) % 1) * 0.2;
  if (G.kind === 'cheer') { const pump = Math.abs(Math.sin((t - G.t0) * 9)); mix('aRx', -0.3); mix('aRz', -2.5 + pump * 0.35); mix('headX', -0.15); return; }
  // Arms forward (not up: a raised hand ends inside the head), the thing lifted toward the face and back.
  if (G.kind === 'meal') {                                  // the bowl in the left hand, chopsticks to the mouth
    mix('aLx', -1.35); mix('aLz', -0.4); mix('aRx', -1.45 - sip * 0.35); mix('aRz', 0.3); mix('headX', 0.18);
  } else {                                                  // a can or a mug to the mouth, head back for the drink
    mix('aRx', -1.5 - sip * 0.3); mix('aRz', 0.45); mix('headX', G.kind === 'drink' ? -0.3 : -0.08 - sip * 0.08);
  }
}

/* ---------- props, built the first time a robot needs them ---------- */
const BUILDERS = {
  typing(r) {
    const g = S.geo, m = S.mat, group = new THREE.Group();
    if (!r.furnished) {
      const desk = new THREE.Group(); desk.position.set(0, 0.275, 0.6); group.add(desk);
      const top = new THREE.Mesh(g.deskTop, m.wood); top.position.y = 0.25; desk.add(top);
      for (const [x, z] of [[-0.44, -0.22], [0.44, -0.22], [-0.44, 0.22], [0.44, 0.22]]) { const leg = new THREE.Mesh(g.deskLeg, m.woodDark); leg.position.set(x, -0.025, z); desk.add(leg); }
    }
    const laptop = new THREE.Group(); laptop.position.set(0, 0.55, 0.52); group.add(laptop);
    const base = new THREE.Mesh(g.laptopBase, m.laptop); base.position.y = 0.0125; laptop.add(base);
    const keys = new THREE.Mesh(g.keys, m.keys); keys.rotation.x = -Math.PI / 2; keys.position.set(0, 0.0262, -0.03); laptop.add(keys);
    const lid = new THREE.Group(); lid.position.set(0, 0.025, 0.18); lid.rotation.x = 0.28; laptop.add(lid);
    const shell = new THREE.Mesh(g.laptopLid, m.laptop); shell.position.y = 0.2; lid.add(shell);
    const logo = new THREE.Mesh(g.lidLogo, r.logoMat); logo.position.set(0, 0.2, 0.0115); lid.add(logo);
    const screen = new THREE.Mesh(g.lidScreen, m.code); screen.position.set(0, 0.2, -0.0115); screen.rotation.y = Math.PI; lid.add(screen);
    return { group };
  },
  background(r) { return BUILDERS.typing(r); },   // the same laptop (and desk where the room has none) as typing
  reading(r) {
    const g = S.geo, m = S.mat, group = new THREE.Group();
    const book = new THREE.Group(); book.position.set(0, 0.93, 0.47); book.rotation.x = -0.35; book.scale.setScalar(1.2); group.add(book);
    for (const side of [-1, 1]) {
      const hinge = new THREE.Group(); hinge.rotation.y = side * 0.42; book.add(hinge);
      const panel = new THREE.Mesh(g.bookPanel, m.bookShell); panel.position.set(side * 0.105, 0, 0); hinge.add(panel);
      const pages = new THREE.Mesh(g.bookPages, m.pages); pages.position.set(side * 0.1, 0, -0.016); hinge.add(pages);
      if (side === 1) { const cover = new THREE.Mesh(g.bookCover, m.cover); cover.position.set(0.105, 0, 0.0085); hinge.add(cover); }
    }
    return { group, update(s) { book.position.y = 0.93 + Math.sin(s * 0.8) * 0.008; } };
  },
  command(r) {
    const g = S.geo, m = S.mat, group = new THREE.Group();
    r.termCanvas = makeCanvas(384, 256);
    r.termTex = texFrom(r.termCanvas);
    const holo = new THREE.Group(); holo.position.set(-0.88, 0.92, 0.3); holo.rotation.y = 0.75; holo.scale.setScalar(0.84); group.add(holo);
    holo.add(new THREE.Mesh(g.term, new THREE.MeshBasicMaterial({ map: r.termTex, transparent: true, side: THREE.DoubleSide, depthWrite: false })));
    const projector = new THREE.Group(); projector.position.set(-0.88, 0.025, 0.3); group.add(projector);
    projector.add(new THREE.Mesh(g.projector, m.projector));
    const beam = new THREE.Mesh(g.beam, m.beam); beam.position.y = 0.34; projector.add(beam);
    r.gearMat = m.gear.clone();
    const gear = new THREE.Sprite(r.gearMat); gear.position.set(-0.32, 2.02, 0.05); gear.scale.set(0.3, 0.3, 1); group.add(gear);
    drawTerminal(r, 0);
    return {
      group,
      update(s) {
        holo.position.y = 0.92 + Math.sin(s * 1.6) * 0.02;
        r.gearMat.rotation = -s * 1.8;
        if (s > r.termAt) { drawTerminal(r, s); r.termAt = s + 0.12; }
      },
    };
  },
  phone(r) {
    const g = S.geo, m = S.mat, group = new THREE.Group();
    r.phoneCanvas = makeCanvas(240, 400);
    r.phoneTex = texFrom(r.phoneCanvas);
    r.phoneScreenTex = r.phoneTex.clone();
    r.phoneScreenTex.repeat.set(0.8, 0.8);
    r.phoneScreenTex.offset.set(0.1, 0.14);
    const phone = new THREE.Group(); phone.position.set(0, 0.84, 0.47); faceToward(phone, LOOK); group.add(phone);
    phone.add(new THREE.Mesh(g.phoneBody, m.phone));
    const screen = new THREE.Mesh(g.phoneScreen, new THREE.MeshBasicMaterial({ map: r.phoneScreenTex })); screen.position.z = 0.0155; phone.add(screen);
    const cam = new THREE.Mesh(g.phoneCam, m.limb); cam.position.set(0.05, 0.12, -0.019); phone.add(cam);
    const logo = new THREE.Mesh(g.phoneLogo, r.logoMat); logo.position.set(0, -0.03, -0.0155); logo.rotation.y = Math.PI; phone.add(logo);
    const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: r.phoneTex, transparent: true }));
    bubble.position.set(0.95, 1.72, 0.15); bubble.scale.set(0.42, 0.7, 1); group.add(bubble);
    (r.drawPhone || drawPhoneUI)(r, 0);
    return {
      group,
      update(s) {
        bubble.position.y = 1.72 + Math.sin(s * 2) * 0.025;
        if (s > r.phoneAt) { (r.drawPhone || drawPhoneUI)(r, s); r.phoneAt = s + 0.1; }
      },
    };
  },
  thinking(r) {
    const group = new THREE.Group();
    const canvas = makeCanvas(160, 112), tex = texFrom(canvas);
    const draw = (lit) => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 160, 112);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#8a9bb0'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(86, 46, 66, 38, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (const [x, y, rr] of [[30, 92, 9], [14, 106, 5]]) { ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      for (let i = 0; i < 3; i++) { ctx.fillStyle = lit < 0 || i <= lit ? '#2f6fd8' : '#c8d3e3'; ctx.beginPath(); ctx.arc(58 + i * 28, 47, 9, 0, Math.PI * 2); ctx.fill(); }
      tex.needsUpdate = true;
    };
    draw(reduceMotion ? -1 : 0);
    const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    bubble.position.set(0.62, 1.95, 0.1); bubble.scale.set(0.62, 0.43, 1); group.add(bubble);
    let shown = 0;
    return {
      group,
      update(s) {
        if (reduceMotion) return;
        bubble.position.y = 1.95 + Math.sin(s * 1.3) * 0.02;
        const lit = Math.floor(s * 2.2) % 3;
        if (lit !== shown) { shown = lit; draw(lit); }
      },
    };
  },
  waiting() {
    const group = new THREE.Group();
    const bubble = new THREE.Sprite(S.mat.alert); bubble.position.set(0.6, 1.95, 0.1); bubble.scale.set(0.42, 0.462, 1); group.add(bubble);
    return { group, update(s) { bubble.position.y = 1.95 + Math.sin(s * 4) * 0.035; } };
  },
  carry(r) {
    // up to CARRY_MAX sheets; r.carrySheets (the box, 2.3.4: the amount of a push or a pull) shows that many, 4 otherwise
    const g = S.geo, m = S.mat, group = new THREE.Group();
    const stack = new THREE.Group(); stack.position.set(0, 0.64, 0.4); group.add(stack);
    const sheets = [];
    for (let i = 0; i < CARRY_MAX; i++) { const sheet = new THREE.Mesh(g.sheet, m.sheets[i % 4]); sheet.position.y = i * 0.034; sheet.rotation.y = (i % 2 ? 1 : -1) * 0.05 * (i % 5); stack.add(sheet); sheets.push(sheet); }
    return { group, update(s) {
      const n = Math.max(1, Math.min(CARRY_MAX, r && Number.isFinite(r.carrySheets) ? r.carrySheets : 4));
      sheets.forEach((sh, i) => { sh.visible = i < n; });
      stack.position.y = 0.64 + Math.abs(Math.cos(s * 7)) * 0.03;
    } };
  },
  done() {
    const group = new THREE.Group();
    const pieces = [];
    for (let i = 0; i < 26; i++) {
      const piece = new THREE.Mesh(S.geo.confetti, S.mat.confetti[i % S.mat.confetti.length]);
      Object.assign(piece.userData, { x: (Math.random() - 0.5) * 1.8, z: (Math.random() - 0.5) * 1.2, speed: 0.25 + Math.random() * 0.25, phase: Math.random(), spin: 2 + Math.random() * 4 });
      group.add(piece); pieces.push(piece);
    }
    return {
      group,
      update(s) {
        for (const p of pieces) {
          const d = p.userData, k = (s * d.speed + d.phase) % 1;
          p.position.set(d.x + Math.sin(s * 2 + d.phase * 6) * 0.08, 2.35 - k * 2.2, d.z);
          p.rotation.set(s * d.spin, s * d.spin * 0.7, 0);
        }
      },
    };
  },
};
const CARRY_MAX = 12;
function ensureProps(r, state) {
  if (r.props[state] || !BUILDERS[state]) return;
  const pr = BUILDERS[state](r);
  pr.group.visible = false;
  r.root.add(pr.group);
  r.props[state] = pr;
}

/* ---------- poses ---------- */
function poseFor(state, s) {
  const p = { rootY: 0, hipsY: 0, torsoX: 0, torsoY: 0, headX: 0, headY: 0, headZ: 0, aLx: 0, aLz: 0.12, aRx: 0, aRz: -0.12, lLx: 0, lRx: 0 };
  switch (state) {
    case 'idle': {
      const b = Math.sin(s * 2.1);
      p.hipsY = b * 0.012;
      p.headY = Math.sin(s * 0.55) * 0.38; p.headX = Math.sin(s * 0.8) * 0.05 - 0.02; p.headZ = Math.sin(s * 0.65) * 0.05;
      p.aLx = b * 0.06; p.aRx = -b * 0.06;
      break;
    }
    case 'thinking': {
      const sway = reduceMotion ? 0 : Math.sin(s * 0.9);
      p.headZ = 0.24 + sway * 0.08; p.headX = -0.14; p.headY = 0.18 + sway * 0.06;
      p.aRx = -2.05; p.aRz = -0.95;           // a hand to the chin
      p.aLx = -1.0; p.aLz = -0.55;            // the other arm folded
      p.torsoY = sway * 0.04; p.hipsY = reduceMotion ? 0 : Math.sin(s * 1.8) * 0.006;
      break;
    }
    case 'background': {   // at its desk with the headset on, typing now and then while the work runs in the background
      const nod = reduceMotion ? 0 : Math.sin(s * 2.2);   // nodding along to the music
      p.torsoX = 0.04; p.headX = 0.2 + nod * 0.035; p.headY = Math.sin(s * 0.35) * 0.06; p.headZ = nod * 0.03;
      p.hipsY = reduceMotion ? 0 : Math.sin(s * 1.4) * 0.006;
      // the keys, loosely: slower (6 against 15) and smaller (0.05 against 0.13) than 'typing'
      p.aLx = -1.0 + Math.max(0, Math.sin(s * 6)) * 0.05; p.aLz = -0.3;
      p.aRx = -1.0 + Math.max(0, Math.sin(s * 6 + 2.6)) * 0.05; p.aRz = 0.3;
      break;
    }
    case 'typing':
      p.torsoX = 0.06; p.headX = 0.2 + Math.sin(s * 1.2) * 0.03; p.headY = Math.sin(s * 0.45) * 0.08;
      p.aLx = -1.05 + Math.max(0, Math.sin(s * 15)) * 0.13; p.aLz = -0.32;
      p.aRx = -1.05 + Math.max(0, Math.sin(s * 15 + 1.9)) * 0.13; p.aRz = 0.32;
      break;
    case 'reading':
      p.headX = 0.3 + Math.sin(s * 0.7) * 0.03; p.headY = Math.sin(s * 0.3) * 0.12;
      p.aLx = -1.25; p.aLz = -0.55; p.aRx = -1.25; p.aRz = 0.55;
      break;
    case 'readingWeb': {   // over the dictionary on the desk: the left hand holds its pages, the right one turns them
      const f = dictHand(s);
      p.torsoX = 0.06; p.headX = 0.42 + Math.sin(s * 0.7) * 0.02; p.headY = -0.1 + f * 0.16;
      p.aLx = -0.95; p.aLz = -0.3;
      p.aRx = -0.95 - f * 0.25; p.aRz = 0.2 + f * 0.45;
      break;
    }
    case 'command': {
      const tap = Math.max(0, Math.sin(s * 5));
      p.headY = -0.55; p.headX = -0.02; p.torsoY = -0.15;
      p.aRx = -1.5 + tap * 0.12; p.aRz = -0.7; p.aLx = 0.05; p.aLz = 0.18;
      break;
    }
    case 'phone':
      p.headX = 0.34 + Math.sin(s * 0.9) * 0.02; p.headZ = Math.sin(s * 0.7) * 0.05;
      p.aLx = -1.35 + Math.max(0, Math.sin(s * 8)) * 0.07; p.aLz = -0.72;
      p.aRx = -1.35 + Math.max(0, Math.sin(s * 8 + 2.2)) * 0.07; p.aRz = 0.72;
      break;
    case 'waiting':
      p.aRz = -2.7 + Math.sin(s * 7) * 0.2; p.aRx = -0.1; p.aLz = 0.2;
      p.headX = -0.12; p.headZ = Math.sin(s * 1.6) * 0.06; p.hipsY = Math.abs(Math.sin(s * 3.5)) * 0.02;
      break;
    case 'stroll': {
      const w = s * 7;
      p.lLx = Math.sin(w) * 0.5; p.lRx = -Math.sin(w) * 0.5; p.hipsY = Math.abs(Math.cos(w)) * 0.03;
      p.aLx = -Math.sin(w) * 0.4; p.aRx = Math.sin(w) * 0.4; p.headX = -0.02;
      break;
    }
    case 'carry': {
      const w = s * 7;
      p.lLx = Math.sin(w) * 0.5; p.lRx = -Math.sin(w) * 0.5; p.hipsY = Math.abs(Math.cos(w)) * 0.03; p.torsoY = Math.sin(w) * 0.05;
      p.aLx = -0.95; p.aLz = -0.5; p.aRx = -0.95; p.aRz = 0.5; p.headX = 0.04;
      break;
    }
    case 'done': {
      const j = Math.max(0, Math.sin(s * 4.2));
      p.rootY = j * 0.15;
      p.aLz = 2.55 + Math.sin(s * 8.4) * 0.12; p.aRz = -2.55 - Math.sin(s * 8.4) * 0.12;
      p.lLx = -j * 0.25; p.lRx = -j * 0.25; p.headX = -0.15;
      break;
    }
    default: break;
  }
  return p;
}
function updateRobot(r, t, dt) {
  const s = t * SPEED * (r.tired ? 0.7 : 1) + r.seed;    // tired: a little slower
  r.blend = Math.min(1, r.blend + dt / 0.4);
  const e = r.blend * r.blend * (3 - 2 * r.blend);
  const look = lookUpdate(r, t, dt), heavy = !!look;
  // heavy: fast typing (drained: slower than fired)
  const posed = (state) => (state === 'reading' && r.readKind === 'web' ? 'readingWeb' : state);   // the dictionary (10-20)
  const a = poseFor(posed(r.prev), s), b = heavy ? poseFor('typing', s * (look === 'drained' ? 1.5 : 2.4)) : poseFor(posed(r.state), s);
  sweatUpdate(r, s, heavy);
  const p = {};
  for (const k in b) p[k] = a[k] + (b[k] - a[k]) * e;
  if (look === 'drained') { p.headX += 0.12; }             // head a little down over the long wait
  if ((look === 'whistle' || r.launch) && !reduceMotion) { // one arm up waving the team on, the other pointing
    // the right arm up beside the head (as the done cheer, so the head does not hide it), waving; the left pointing
    p.aRx = Math.sin(t * 7) * 0.25; p.aRz = -2.85 + Math.sin(t * 7) * 0.3; p.aLx = -1.35; p.aLz = 0.15; p.headY = Math.sin(t * 3.5) * 0.15;
  }
  if (r.tired) { p.headX += 0.2; p.torsoX += 0.08; p.hipsY -= 0.012; p.aLz *= 0.5; p.aRz *= 0.5; }   // head and shoulders down
  if (r.gesture && (!GESTURE_OK.has(r.state) || t >= r.gesture.t1)) endGesture(r);
  const onCall = callUpdate(r, t);
  if (!onCall && !r.gesture && r.needDrink && GESTURE_OK.has(r.state) && startGesture(r, 'drink', t)) r.needDrink = false;
  if (onCall) callPose(p, t);
  else if (r.play) playPose(r, p, t);
  else if (r.solo) soloPose(r, p, t);
  else if (r.brk) brkPose(r, p, t);
  else if (r.gesture) gesturePose(r, p, t);
  soloProps(r, onCall ? null : r.solo, t);
  brkProps(r, onCall ? null : r.brk, t);
  playBubble(r, onCall ? null : r.play, t);
  bgUpdate(r, t, r.state === 'background' && look !== 'whistle' && !onCall && !r.play && !r.solo && !r.brk);   // the whistle takes the headset off
  r.antenna.rotation.x += ((r.tired ? 1.0 : 0) - r.antenna.rotation.x) * Math.min(1, dt * 3);
  r.root.position.y = p.rootY;
  r.hips.position.y = HIPS_Y + p.hipsY;
  r.torso.rotation.set(p.torsoX, p.torsoY, 0);
  r.head.rotation.set(p.headX, p.headY, p.headZ);
  r.armL.rotation.set(p.aLx, 0, p.aLz);
  r.armR.rotation.set(p.aRx, 0, p.aRz);
  r.legL.rotation.x = p.lLx;
  r.legR.rotation.x = p.lRx;
  r.tails.forEach((tail, i) => tail.rotation.set(0.5 + Math.sin(s * 6.5 + i * 1.3) * 0.12, 0, tail.userData.spread));

  const lampKey = STATES[r.lampState && STATES[r.lampState] ? r.lampState : r.state].lamp;   // play: the real state's lamp
  const lampOn = lampKey === 'think' ? (reduceMotion || Math.sin(s * 1.6) > -0.4)   // thinking: a slow blink
    : lampKey !== 'done' || Math.floor(s * 3) % 2 === 0;
  r.lampMat.color.set(lampOn ? LAMP[lampKey] : LAMP.off);

  let mode = STATES[r.blend < 0.5 ? r.prev : r.state].face;
  if (r.tired && mode === 'normal') mode = 'tired';
  if (look) mode = look;                                     // heavy work's face over the state's and the tired one
  if (r.launch) mode = 'whistle';                            // calling a subagent: the whistle's face for its moment
  if (mode === 'normal' || mode === 'focus' || mode === 'tired' || mode === 'fired') {
    if (s > r.nextBlink) { r.blinkEnd = s + 0.12; r.nextBlink = s + 2.4 + Math.random() * 3.2; }
    if (s < r.blinkEnd) mode = 'blink';
  }
  const tint = r.tint && r.tint[3] > 0.01 ? r.tint.map((v, i) => (i < 3 ? Math.round(v / 8) * 8 : Math.round(v * 40) / 40)) : null;
  const faceKey = `${mode}|${tint ? tint.join(',') : ''}`;   // the colour in steps: redrawn a few times while it eases
  if (faceKey !== r.faceMode) { drawFace(r.faceCtx, mode, tint); r.faceTex.needsUpdate = true; r.faceMode = faceKey; }

  let dictK = 0;
  for (const key in r.props) {
    const pr = r.props[key];
    let k = key === r.state ? e : (key === r.prev && r.prev !== r.state ? 1 - e : 0);
    if (key === 'reading' && r.readKind === 'web') { dictK = k; k = 0; }   // the dictionary on the desk, not the book
    pr.group.visible = k > 0.02;
    if (!pr.group.visible) continue;
    for (const child of pr.group.children) {
      const base = child.userData.base || (child.userData.base = child.scale.clone());
      child.scale.copy(base).multiplyScalar(Math.max(0.001, k));
    }
    if (pr.update) pr.update(s);
  }
  dictUpdate(r, s, dictK);
}
function setRobotState(r, state) {
  if (state === r.state) return;
  ensureProps(r, state);
  r.prev = r.state; r.state = state; r.blend = 0;
}

// ---- web/js/20-core.js ----
/* ---------- shared by the demo and the live view (from the prototype's main-1-data.js) ---------- */
const sceneEl = document.getElementById('scene');
const canvas = document.getElementById('scene-canvas');
const tagsEl = document.getElementById('tags');
const readToken = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const frac = (t, a, b) => clamp01((t - a) / (b - a));
const pct = (v) => Math.round(v * 100);
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const ROLE_INK = { debug: '#2a2000' };   // dark ink where white would not read on the pill (debug's yellow)
/* A role's pill: its background (ROLES[role].pill, else its colour) and its text (ROLE_INK, else white). One source for
   the HTML pills (pill()), the canvas ones (drawRolePill, the boards), the talk's marks and the phones' headers.
   pillBg sits next to ROLES (10-robot-core.js), which the phones' drawers there read. */
const pillInk = (role) => ROLE_INK[role] || '#ffffff';
/* A session's name (/rename, `claude -n`; 10-19): the server's title, one line, at most NAME_MAX characters. Panels and
   cards show all of it next to the two-letter mark; the tag over the robot shows it alone, cut at its end with "…". */
const NAME_MAX = 80;
const sessionName = (t) => (typeof t === 'string' ? t.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX) : '');
const NAMES = { rev: 0 };   // bumped when a robot's name changes: the panels' keys carry it
const pill = (label, role) => `<span class="pill" style="--c:${ROLES[role].pill || ROLES[role].color};--t:${ROLE_INK[role] || '#ffffff'}">${esc(label)}</span>`;   // = pillBg / pillInk (the escape gate reads the tables)
/* The time the view shows (the sky, the 8-hour tiredness): the machine's clock, unless a test or the demo sets one. */
const VIZ_CLOCK = { at: null };
const vizNow = () => (VIZ_CLOCK.at !== null ? VIZ_CLOCK.at : Date.now());
/* Six rooms to a floor (the live office's floors and the building's bays, in both views). */
const ROOM_MAX = 6;
/* Rooms that exist only in the building view (the demo's other teams): id -> name. Empty in the live view. */
const TOWER_NAMES = {};
/* Eight hours into its session a main robot gets tired (requester, 10-18); never without the session's own start. */
const TIRED_MS = 8 * 3600 * 1000;
const isTired = (since, now) => Number.isFinite(since) && since > 0 && now - since >= TIRED_MS;
const isDark = () => { const th = document.documentElement.dataset.theme; return th === 'dark' || (th !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches); };
const readPref = (key, fallback) => { try { return localStorage.getItem(`agent-view:${key}`) || fallback; } catch (err) { return fallback; } };
const writePref = (key, value) => { try { localStorage.setItem(`agent-view:${key}`, value); } catch (err) { /* storage blocked: the choice lasts until reload */ } };
/* Mermaid (2.3.5): vendored (vendor/VENDOR.md), read only when a diagram is first drawn, never at page load (3.6 MB).
   export-demo leaves it out: the demo's hand-written sheets draw no diagram. securityLevel 'strict': the
   text is a spec's, so labels are sanitized and no click / script in a diagram runs. htmlLabels off: a label is SVG
   text, never HTML (with HTML labels, strict still lets an <img src> through and the page fetched it — measured
   10-19). The theme follows the page's. */
const MERMAID = { src: 'vendor/mermaid-11.17.2/mermaid.min.js', loading: null, theme: '', n: 0, drawn: new Map() };
function loadMermaid() {
  if (!MERMAID.loading) {
    MERMAID.loading = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = MERMAID.src;
      el.onload = () => (window.mermaid ? resolve(window.mermaid) : reject(new Error('mermaid did not load')));
      el.onerror = () => { MERMAID.loading = null; reject(new Error('mermaid did not load')); };
      document.head.appendChild(el);
    });
  }
  return MERMAID.loading;
}
/* What a diagram may not set for itself (dd's review, 10-19): Mermaid reads an init / config directive (%%{…}%%) and a
   front-matter config (--- config: … ---) from the text and lets them change everything but its six `secure` keys —
   htmlLabels back on (an <img> in a label, fetched), themeCSS with url() (fetched). The text is the spec's: both are
   taken out before it is drawn, with Mermaid's own patterns (11.17.2), and anything left of a directive is broken
   up; the keys below are made secure as well, in case one gets through. */
const MERMAID_FRONT = /^([^\S\n\r]*)-{3}\s*[\n\r](.*?)[\n\r]\1-{3}\s*[\n\r]+/s;
const MERMAID_DIRECTIVE = /%{2}{\s*(?:(\w+)\s*:|(\w+))\s*(?:(\w+)|((?:(?!}%{2}).|\r?\n)*))?\s*(?:}%{2})?/gi;
const MERMAID_SECURE = ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize', 'suppressErrorRendering', 'maxEdges', 'htmlLabels', 'flowchart', 'er',
  'theme', 'themeCSS', 'themeVariables', 'darkMode', 'fontFamily', 'altFontFamily', 'look', 'layout', 'markdownAutoWrap', 'dompurifyConfig', 'deterministicIds'];
function mermaidSafeText(text) {
  // until nothing more comes off: a directive taken out can leave a front matter at the start, and the other way
  // round (dd's review 2, 10-19: "%%{x}%%---\nconfig: …" passed one round of each)
  let t = String(text), prev = null;
  for (let k = 0; k < 50 && t !== prev; k++) { prev = t; t = t.replace(MERMAID_FRONT, '').replace(MERMAID_DIRECTIVE, ''); }
  if (t !== prev) return '';                                  // still changing after 50 rounds: no diagram
  if (/^[^\S\n\r]*-{3}\s*[\n\r]/.test(t)) return '';   // an unclosed front matter: no diagram
  return mermaidNoUrl(t.split('%%{').join('%% {'));   // never a directive; no url() out of the diagram
}
/* A url() that is not a reference inside the diagram (#…) becomes one to nothing, and @import goes: in the text before
   it is drawn — Mermaid puts the SVG in the page to measure it, and a style or classDef of a class or state diagram
   (fill:url(/x)) was fetched then (dd's review 2) — and in the SVG it gave back. Every kind of diagram goes through. */
function mermaidNoUrl(t) {
  return String(t).replace(/url\(\s*(?!['"]?\s*#)/gi, 'url(#blocked-').replace(/@import/gi, '@blocked');
}
function mermaidSafeSvg(svg) { return mermaidNoUrl(svg); }
async function renderMermaid(el, text) { return mermaidDraw(el, text, true); }
/* cleanText false only for the arm that checks the `secure` lock on its own (the test hook, never the page). */
async function mermaidDraw(el, text, cleanText) {
  const mm = await loadMermaid();
  const theme = isDark() ? 'dark' : 'default';
  if (MERMAID.theme !== theme) {
    // every key of Mermaid's own config is secure (no diagram changes any: class.htmlLabels got through a list of names)
    const secure = [...new Set([...MERMAID_SECURE, ...Object.keys(mm.mermaidAPI.getConfig())])];
    mm.initialize({ startOnLoad: false, securityLevel: 'strict', theme, fontFamily: 'var(--font-body)', htmlLabels: false, flowchart: { htmlLabels: false },
      class: { htmlLabels: false }, er: { useMaxWidth: false }, secure });
    MERMAID.theme = theme;
  }
  MERMAID.n += 1;
  const svg = mermaidSafeSvg((await mm.render(`mmd-${MERMAID.n}`, cleanText ? mermaidSafeText(text) : String(text))).svg);
  el.innerHTML = svg;   // Mermaid's own SVG, its labels sanitized (securityLevel 'strict')
  el.dataset.theme = theme;
  if (MERMAID.drawn.size >= 40) MERMAID.drawn.clear();
  MERMAID.drawn.set(`${theme}\n${text}`, svg);
  return el.querySelector('svg');
}
/* A diagram in a box the panels rebuild: the same text in the same theme is drawn once and put back as it was. */
function drawMermaid(el, text) {
  const theme = isDark() ? 'dark' : 'default', key = `${theme}\n${text}`;
  if (el.dataset.drawn === key) return Promise.resolve(el.querySelector('svg'));
  el.dataset.drawn = key;
  const svg = MERMAID.drawn.get(key);
  if (svg) { el.innerHTML = svg; el.dataset.theme = theme; return Promise.resolve(el.querySelector('svg')); }   // drawn before (strict)
  return renderMermaid(el, text).catch(() => { delete el.dataset.drawn; el.classList.add('mmd-failed'); return null; });
}
const ROLE_JA = { main: 'メインセッション', define: 'spec を書く担当', ground: '初期設定の担当', implement: '実装の担当', navigation: '画面遷移の担当', test: 'テストの担当', debug: '調査の担当', other: 'その他' };
const SECTIONS = ['概要', '構造', '状態', 'データ', '操作', '遷移', '分岐'];
const sumImpl = (arr) => arr.slice(1, 6).reduce((a, b) => a + b, 0);
const BUCKETS = [['live', '作業中'], ['partial', '途中'], ['todo', '未着手'], ['done', '完了']];
const bucketCounts = (specs) => Object.fromEntries(BUCKETS.map(([b]) => [b, specs.filter((s) => s.bucket === b).length]));
const activeSec = (s) => (s.writingIdx >= 0 ? s.writingIdx : s.implIdx >= 0 ? s.implIdx : s.testIdx);
/* One section of one spec: what its bar and its chip show. */
function secState(s, k) {
  const w = s.written[k], n = s.totals[k];
  if (w <= 0) return { kind: 'empty', f: 0, text: '未記入' };
  if (w < 1) return { kind: 'writing', f: w, text: `${s.by ? '書き込み中' : '記入'} ${pct(w)}%` };
  if (k === 6 && s.implPhase) { const c = s.implN[6]; return { kind: c >= n ? 'tested' : 'test', f: n ? c / n : 1, text: `テスト ${c}/${n}` }; }
  if (k === 0 || k === 6 || !s.implPhase || (s.unmeasured && s.unmeasured[k])) return { kind: 'written', f: 1, text: '記入済み' };
  if (k === 1 && s.measure && !s.measure.components) {
    return s.measure.layout ? { kind: 'done', f: 1, text: '実装済み（layout あり）' } : { kind: 'impl', f: 0, text: s.measure.layout === false ? 'layout がまだ無い' : 'layout の指定なし' };
  }
  const c = s.implN[k];
  return { kind: c >= n ? 'done' : 'impl', f: n ? c / n : 1, text: c >= n ? '実装済み' : `実装 ${c}/${n}` };
}
const KCOLS = [['todo', '未着手'], ['wait', '待ち'], ['doing', '作業中'], ['done', '完了']];
/* Where a card came from (requester, 10-18): a turn — a prompt the session received, done at Stop — or the task tools
   (TodoWrite, the task hooks, ~/.claude/tasks/). A turn reads 指示 n where a task reads #n. */
const isTurn = (x) => !!x && x.source === 'turn';
const taskRef = (x) => (isTurn(x) ? `指示 ${x.turn}` : `#${x.id}`);
const waitLabel = (x) => (isTurn(x) ? (x.waitingFor === 'question' ? '質問に回答待ち' : '許可待ち') : x.blockedBy ? `#${x.blockedBy} 待ち` : '待ち');
const permSummary = (p) => p.input.command || p.input.file_path || '';
const ruleCovers = (p, abs) => alwaysRules.has(p.rule) && alwaysRules.get(p.rule) < abs;
// ---- web/js/30-source-demo.js ----

/* =====================================================================
   JsonUI Agent View: demo script, 3D office and live side panel
   ===================================================================== */

/* ---------- demo script: one 84-second loop of a JsonUI project ---------- */
const LOOP = 84;
const START_AT = 24;
const BASE_CLOCK = 14 * 3600 + 20 * 60;

const ROOMS = [
  { id: 'shop', name: 'shop-app/', path: '~/work/shop-app', x0: -9.6, x1: 2.6, z0: -5.0, z1: 4.2, floor: '--floor-a', back: 3.9, left: 3.9, infraDocs: { files: 2, dir: 'docs/infra' } },
  { id: 'cli', name: 'jsonui-cli/', path: '~/resource/jsonui-cli', x0: 3.1, x1: 10.2, z0: -5.0, z1: -0.25, floor: '--floor-b', back: 3.9, left: 0.55 },
  { id: 'doc', name: 'JsonUIDocument/', path: '~/resource/JsonUIDocument', x0: 3.1, x1: 10.2, z0: 0.25, z1: 4.2, floor: '--floor-c', back: 0.55, left: 0.55 },
];
/* One room per project folder; a project can hold any number of sessions. */
const PROJECT = Object.fromEntries(ROOMS.map((r) => [r.id, r]));
const SESSIONS = [
  { id: 'a0', project: 'shop', robots: ['a0', 'a3', 'a5', 'a2', 'a7'] },
  { id: 'b4', project: 'shop', robots: ['b4', 'e6', 'f2'] },
  { id: 'd8', project: 'shop', robots: ['d8'] },
  { id: '4f', project: 'cli', robots: ['4f'] },
  { id: '7c', project: 'cli', robots: ['7c'] },
  { id: 'c9', project: 'doc', robots: ['c9'] },
  { id: 'e1', project: 'doc', robots: ['e1'] },
].map((s) => ({ ...s, room: PROJECT[s.project].name }));
const ROBOT_DEFS = [
  { id: 'a0', role: 'main', agent: 'セッション a07c…', pos: [0.7, -2.5], ry: 0.3, furnished: true,
    plan: [[0, 'reading', 'Read docs/screens/json/cart.spec.json'], [12, 'typing', 'TaskCreate #7・#8'], [20, 'idle', 'サブエージェントの報告待ち'], [62, 'reading', 'a3 の報告を確認'], [70, 'typing', 'TaskList で残りを確認'], [76, 'idle', 'サブエージェントの報告待ち']] },
  { id: 'a3', role: 'define', agent: 'jsonui-define', pos: [-6.3, -3.1], ry: 0.55, furnished: true,
    plan: [[0, 'reading', 'Read home.spec.json（参考）'], [5, 'typing', 'Write docs/screens/json/login.spec.json'], [62, 'done', 'Login の spec を書き終えた'], [66, 'idle', '待機'], [70, 'reading', 'doc_validate_spec login'], [76, 'idle', '待機']] },
  { id: 'a5', role: 'implement', agent: 'jsonui-implement', pos: [-2.7, -2.7], ry: 0.5, furnished: true,
    plan: [[0, 'reading', 'Read docs/screens/json/home.spec.json'], [6, 'typing', 'Edit docs/screens/layouts/home.json'], [40, 'command', 'Bash jui build'], [48, 'typing', 'Edit HomeViewModel.swift'], [70, 'command', 'jui_verify home.spec.json'], [76, 'done', 'Home の実装が終わった'], [80, 'idle', '待機']] },
  { id: 'a2', role: 'test', agent: 'jsonui-test', pos: [-7.3, 1.2], ry: 0.75,
    plan: [[0, 'idle', '待機'], [10, 'command', 'test_validate cart.test.json'], [18, 'phone', 'xcodebuild test（iPhone 16）'], [60, 'done', 'Cart のテスト 8/8 通過'], [66, 'idle', '待機']] },
  { id: 'a7', role: 'navigation', agent: 'jsonui-navigation-ios', walk: true },
  { id: 'b4', role: 'main', agent: 'セッション b47e…', pos: [-0.4, 3.5], ry: 0.15, furnished: true,
    plan: [[0, 'typing', 'TaskCreate #5'], [6, 'idle', 'サブエージェントの報告待ち'], [70, 'reading', 'e6 の報告を確認'], [74, 'idle', 'サブエージェントの報告待ち']] },
  { id: 'e6', role: 'define', agent: 'jsonui-define', pos: [-2.9, 3.4], ry: 0.25, furnished: true,
    plan: [[0, 'reading', 'Read login.spec.json（参考）'], [8, 'typing', 'Write docs/screens/json/signup.spec.json'], [70, 'done', 'Signup の spec を書き終えた'], [74, 'idle', '待機']] },
  { id: 'f2', role: 'implement', agent: 'jsonui-implement', pos: [-5.3, 3.3], ry: 0.4, furnished: true,
    plan: [[0, 'typing', 'Edit docs/screens/layouts/product-detail.json'], [30, 'command', 'Bash jui build'], [36, 'typing', 'Edit ProductDetailViewModel.swift'], [74, 'command', 'jui_verify product-detail.spec.json'], [78, 'done', 'ProductDetail の実装が終わった'], [82, 'idle', '待機']] },
  { id: 'd8', role: 'main', agent: 'セッション d8a5…', pos: [-8.5, -3.5], ry: 0.6, furnished: true,
    plan: [[0, 'idle', '待機（次の指示待ち）'], [34, 'thinking', '考え中'], [50, 'idle', '待機（次の指示待ち）']] },
  { id: '4f', role: 'main', agent: 'セッション 4f2b…', pos: [6.0, -2.9], ry: 0.05, furnished: true,
    plan: [[0, 'command', 'Bash jui build --ios-only'], [22, 'done', 'ビルド完了'], [26, 'idle', '待機'], [38, 'reading', 'Read jui_cli/commands/hotload_cmd.py'], [44, 'command', 'Bash pip install aiohttp watchdog'], [47, 'typing', 'Edit jui_cli/commands/viz_cmd.py'], [78, 'reading', '差分を確認']] },
  { id: '7c', role: 'main', agent: 'セッション 7c3f…', pos: [8.9, -2.6], ry: -0.15, furnished: true,
    plan: [[0, 'typing', 'Edit src/reporter/progress.ts'], [30, 'command', 'Bash npm test -- --progress'], [36, 'typing', 'Edit src/cli/run.ts'], [60, 'command', 'Bash npm test'], [66, 'reading', 'テスト結果を確認']] },
  { id: 'c9', role: 'main', agent: 'セッション c91e…', pos: [6.4, 2.0], ry: 0.1, furnished: true,
    plan: [[0, 'reading', 'Read docs/screens/json/spec-anatomy.spec.json'], [38, 'command', 'Bash jsonui-doc generate html'], [52, 'done', 'HTML を生成した'], [56, 'idle', '待機']] },
  { id: 'e1', role: 'main', agent: 'セッション e1d4…', pos: [8.7, 2.6], ry: -0.1, furnished: true,
    plan: [[0, 'reading', 'Read component-detail.spec.json（参考）'], [20, 'typing', 'Write docs/screens/json/attribute-reference.spec.json'], [78, 'done', '属性リファレンスの spec を書き終えた'], [82, 'idle', '待機']] },
];
const DEF = Object.fromEntries(ROBOT_DEFS.map((d) => [d.id, d]));
const SESSION_OF = Object.fromEntries(SESSIONS.flatMap((s) => s.robots.map((id) => [id, s.id])));
const PROJECT_OF = Object.fromEntries(SESSIONS.map((s) => [s.id, s.project]));
const projectOfRobot = (id) => PROJECT_OF[SESSION_OF[id]];
const SESSION_UUID = { a0: 'a07c09fe-2f17-530c-add4-737ff77c3934', b4: 'b47e2d19-6c3a-4f80-9e25-1d8b7c4a0f62', d8: 'd8a51e07-2c4b-4e19-8f3a-6b0d9c2e7a14', '4f': '4f2b91c0-8d3e-4a51-9b7e-0c6d2a5e8f13', '7c': '7c3f5a92-1e8d-4b06-a7c4-9d2e0f6b3a81', c9: 'c91e7a44-5b20-4f6d-8e19-3a7b2c0d9e55', e1: 'e1d4b8f3-7a29-4c51-b0e6-2f9a8c3d1e70' };
const AGENT_ID = { a3: 'a3f19c2e8b7d4a601', a5: 'a5c08e1b9f2d7a3e4', a2: 'a2b7d40c6e9f1a835', a7: 'a7e2c91d0b8f6a4c3', e6: 'e6d93a0f4c2b7e815', f2: 'f2a61c8e0d9b3f574' };
const CWD = Object.fromEntries(SESSIONS.map((s) => [s.id, PROJECT[s.project].path.replace('~', '/Users/you')]));
const WALK = { points: [[1.0, 1.5], [-2.7, -1.2], [-6.1, -1.5], [-4.0, 1.6]], speed: 1.05, pause: 2.2 };

/* Every screen of the demo project in board order: [key, screen name, 表示名, file stem]. */
const SCREENS = [
  ['onboarding', 'Onboarding', 'はじめに', 'onboarding'],
  ['login', 'Login', 'ログイン', 'login'],
  ['signup', 'Signup', '新規登録', 'signup'],
  ['reset', 'PasswordReset', 'パスワード再設定', 'password-reset'],
  ['home', 'Home', 'ホーム', 'home'],
  ['search', 'Search', '検索', 'search'],
  ['filter', 'FilterSheet', '絞り込み', 'filter-sheet'],
  ['list', 'ProductList', '商品一覧', 'product-list'],
  ['detail', 'ProductDetail', '商品詳細', 'product-detail'],
  ['reviews', 'Reviews', 'レビュー', 'reviews'],
  ['favorites', 'Favorites', 'お気に入り', 'favorites'],
  ['cart', 'Cart', 'カート', 'cart'],
  ['coupons', 'Coupons', 'クーポン', 'coupons'],
  ['checkout', 'Checkout', '購入手続き', 'checkout'],
  ['complete', 'OrderComplete', '注文完了', 'order-complete'],
  ['orders', 'OrderHistory', '注文履歴', 'order-history'],
  ['order', 'OrderDetail', '注文詳細', 'order-detail'],
  ['mypage', 'MyPage', 'マイページ', 'my-page'],
  ['address', 'AddressList', 'お届け先', 'address-list'],
  ['addressEdit', 'AddressEdit', 'お届け先の編集', 'address-edit'],
  ['payment', 'PaymentMethods', '支払い方法', 'payment-methods'],
  ['notices', 'Notifications', 'お知らせ', 'notifications'],
  ['settings', 'Settings', '設定', 'settings'],
  ['help', 'Help', 'ヘルプ', 'help'],
  ['top', 'Top', 'トップ', 'top', 'doc'],
  ['start', 'GettingStarted', 'はじめかた', 'getting-started', 'doc'],
  ['components', 'ComponentList', 'コンポーネント一覧', 'component-list', 'doc'],
  ['component', 'ComponentDetail', 'コンポーネント詳細', 'component-detail', 'doc'],
  ['attrs', 'AttributeReference', '属性リファレンス', 'attribute-reference', 'doc'],
  ['anatomy', 'SpecAnatomy', 'spec の構造', 'spec-anatomy', 'doc'],
];
/* The spec files shown on the whiteboard (demo content in the screen_spec format). Counted items per section:
   structure.components, stateManagement.uiVariables, dataFlow.viewModel.methods, userActions, transitions
   and branchContracts branches. */
const SPEC_DOCS = {
  login: {
    metadata: { name: 'Login', displayName: 'ログイン', description: 'メールアドレスとパスワードでログインする', platforms: ['ios', 'android', 'web'], layoutFile: 'login', createdAt: '2026-10-17' },
    components: [['View', 'login_root', '画面全体のコンテナ'], ['Label', 'title_label', '画面タイトル「ログイン」'], ['TextField', 'email_input', 'メールアドレス入力'], ['TextField', 'password_input', 'パスワード入力（伏せ字）'], ['Label', 'error_label', '入力エラーと認証エラー'], ['Button', 'login_button', 'ログインを実行'], ['Indicator', 'loading_indicator', '通信中の表示'], ['Button', 'forgot_button', 'パスワード再設定へ'], ['Button', 'signup_button', '新規登録へ']],
    layoutChildren: ['title_label', 'email_input', 'password_input', 'error_label', 'login_button', 'loading_indicator', 'forgot_button', 'signup_button'],
    uiVariables: [['email', 'String', '""'], ['password', 'String', '""'], ['isLoading', 'Bool', 'false'], ['errorMessage', 'String?', 'null']],
    eventHandlers: [['onLoginTap', '入力を検証して login() を呼ぶ'], ['onSignupTap', 'Signup 画面へ遷移']],
    vmMethods: ['login()', 'validateEmail(_:)', 'validatePassword(_:)', 'clearError()', 'openSignup()'],
    vmVars: ['email', 'password', 'isLoading', 'errorMessage'],
    repositories: ['AuthRepository'],
    apis: [['postLogin', 'POST', '/auth/login']],
    userActions: [['ログインボタンをタップ', 'onLoginTap → login()'], ['パスワードを忘れたをタップ', '再設定画面へ遷移'], ['新規登録をタップ', 'onSignupTap']],
    transitions: [['login() 成功', 'Home'], ['signup_button をタップ', 'Signup']],
    branches: [['login', 'email が空', 'error_label に「メールアドレスを入力」'], ['login', 'password が 8 文字未満', 'error_label に「8 文字以上」'], ['login', 'API が 401', 'error_label に認証エラー'], ['login', 'API が 200', 'Home へ遷移']],
  },
  home: {
    metadata: { name: 'Home', displayName: 'ホーム', description: 'おすすめとカテゴリを並べ、カートと検索の入口になる', platforms: ['ios', 'android', 'web'], layoutFile: 'home', createdAt: '2026-10-12' },
    components: [['SafeAreaView', 'home_root', '画面全体'], ['View', 'header_view', 'ヘッダー'], ['Label', 'greeting_label', 'あいさつ文'], ['Button', 'cart_button', 'カートへ'], ['Label', 'cart_badge', 'カート内の件数'], ['TextField', 'search_input', '商品検索'], ['Collection', 'banner_collection', 'キャンペーンバナー'], ['Label', 'category_title', 'カテゴリ見出し'], ['Collection', 'category_collection', 'カテゴリ一覧'], ['Label', 'recommend_title', 'おすすめ見出し'], ['Collection', 'recommend_collection', 'おすすめ商品'], ['Indicator', 'loading_indicator', '読み込み中']],
    layoutChildren: ['header_view', 'search_input', 'banner_collection', 'category_title', 'category_collection', 'recommend_title', 'recommend_collection', 'loading_indicator'],
    uiVariables: [['userName', 'String', '""'], ['cartCount', 'Int', '0'], ['searchText', 'String', '""'], ['isLoading', 'Bool', 'true'], ['banners', '[Banner]', '[]']],
    eventHandlers: [['onCartTap', 'Cart 画面へ'], ['onSearchSubmit', '検索結果へ'], ['onProductTap', '商品詳細へ']],
    vmMethods: ['onAppear()', 'loadHome()', 'refresh()', 'openCart()', 'search(_:)', 'openProduct(_:)'],
    vmVars: ['userName', 'cartCount', 'banners', 'categories', 'recommends', 'isLoading'],
    repositories: ['HomeRepository', 'CartRepository'],
    apis: [['getHome', 'GET', '/home'], ['getCartSummary', 'GET', '/cart/summary']],
    userActions: [['カートボタンをタップ', 'onCartTap → openCart()'], ['検索を確定', 'onSearchSubmit → search(_:)'], ['おすすめ商品をタップ', 'onProductTap → openProduct(_:)'], ['引っ張って更新', 'refresh()']],
    transitions: [['openCart()', 'Cart'], ['openProduct(_:)', 'ProductDetail']],
    branches: [['loadHome', 'API 成功', 'banners と recommends を表示'], ['loadHome', 'API 失敗', 'エラーと再試行ボタンを表示'], ['openCart', 'cartCount == 0', '空のカートとして開く']],
  },
  cart: {
    metadata: { name: 'Cart', displayName: 'カート', description: 'カートの中身を確認して、クーポンを当てて購入へ進む', platforms: ['ios', 'android', 'web'], layoutFile: 'cart', createdAt: '2026-10-08' },
    components: [['SafeAreaView', 'cart_root', '画面全体'], ['Label', 'title_label', '画面タイトル「カート」'], ['Collection', 'cart_list', 'カート内の商品（cart_item）'], ['Label', 'empty_label', 'カートが空のときの案内'], ['Label', 'stock_warning', '在庫切れの警告'], ['TextField', 'coupon_input', 'クーポンコード'], ['Button', 'coupon_apply', 'クーポンを適用'], ['Label', 'coupon_error', 'クーポンのエラー'], ['Label', 'total_label', '合計金額'], ['Button', 'checkout_button', '購入する']],
    layoutChildren: ['title_label', 'cart_list', 'empty_label', 'stock_warning', 'coupon_input', 'coupon_apply', 'coupon_error', 'total_label', 'checkout_button'],
    uiVariables: [['items', '[CartItem]', '[]'], ['isEmpty', 'Bool', 'true'], ['couponCode', 'String', '""'], ['couponError', 'String?', 'null'], ['total', 'Int', '0'], ['canCheckout', 'Bool', 'false']],
    eventHandlers: [['onQuantityChange', '数量を変更'], ['onApplyCoupon', 'クーポンを適用'], ['onCheckoutTap', '購入へ進む']],
    vmMethods: ['loadCart()', 'changeQuantity(_:qty:)', 'applyCoupon(_:)', 'removeItem(_:)', 'recalcTotal()', 'checkout()', 'placeOrder()'],
    vmVars: ['items', 'isEmpty', 'couponCode', 'couponError', 'total', 'canCheckout'],
    repositories: ['CartRepository', 'OrderRepository'],
    apis: [['getCart', 'GET', '/cart'], ['postCoupon', 'POST', '/cart/coupon'], ['postOrder', 'POST', '/orders']],
    userActions: [['数量を変更', 'onQuantityChange → changeQuantity'], ['クーポンを適用', 'onApplyCoupon → applyCoupon'], ['商品を削除', 'removeItem'], ['購入するをタップ', 'onCheckoutTap → checkout()'], ['購入を確定', 'placeOrder()']],
    transitions: [['checkout()（未ログイン）', 'Login'], ['placeOrder() 成功', 'OrderComplete'], ['商品をタップ', 'ProductDetail']],
    branches: [['loadCart', 'items.count > 0', 'cart_list を表示'], ['changeQuantity', 'qty == 0', 'その行を消す'], ['loadCart', 'isEmpty == true', 'checkout_button を無効にする'], ['applyCoupon', 'valid', 'discount_label を表示'], ['applyCoupon', 'expired', 'coupon_error を表示'], ['loadCart', 'item.stock == 0', 'stock_warning を表示'], ['checkout', '未ログイン', 'Login へ遷移'], ['placeOrder', 'success', 'OrderComplete へ遷移']],
  },
  list: {
    metadata: { name: 'ProductList', displayName: '商品一覧', description: '商品を一覧で見せ、並び替えと絞り込みができる', platforms: ['ios', 'android', 'web'], layoutFile: 'product-list', createdAt: '2026-10-02' },
    components: [['SafeAreaView', 'list_root', '画面全体'], ['TextField', 'search_input', '絞り込み'], ['Segment', 'sort_segment', '並び替え'], ['Collection', 'product_collection', '商品一覧（product_cell）'], ['Label', 'result_count', '件数'], ['Indicator', 'loading_indicator', '読み込み中'], ['Label', 'empty_label', '該当なし'], ['Button', 'filter_button', '絞り込み条件']],
    layoutChildren: ['search_input', 'sort_segment', 'filter_button', 'result_count', 'product_collection', 'loading_indicator', 'empty_label'],
    uiVariables: [['products', '[Product]', '[]'], ['query', 'String', '""'], ['sort', 'SortOrder', '.popular'], ['isLoading', 'Bool', 'true']],
    eventHandlers: [['onSortChange', '並び替えを変更'], ['onProductTap', '商品詳細へ']],
    vmMethods: ['load()', 'loadMore()', 'changeSort(_:)', 'search(_:)', 'openProduct(_:)'],
    vmVars: ['products', 'query', 'sort', 'isLoading'],
    repositories: ['ProductRepository'],
    apis: [['listProducts', 'GET', '/products']],
    userActions: [['並び替えを変更', 'onSortChange → changeSort'], ['最後までスクロール', 'loadMore()'], ['商品をタップ', 'onProductTap → openProduct']],
    transitions: [['openProduct(_:)', 'ProductDetail'], ['filter_button をタップ', 'FilterSheet']],
    branches: [['load', '結果が 0 件', 'empty_label を表示'], ['load', 'API 失敗', 'エラーを表示'], ['loadMore', '最終ページ', '読み込みを止める'], ['changeSort', 'price', '価格順に並べる'], ['search', 'query が空', '全件を表示']],
  },
};
/* The other screens, written more compactly: components are 'Type id 説明' separated by '|'. */
function doc(key, description, createdAt, comps, r) {
  const [, name, displayName, stem, project] = SCREENS.find((x) => x[0] === key);
  const components = comps.split('|').map((x) => { const [type, id, ...rest] = x.trim().split(' '); return [type, id, rest.join(' ')]; });
  return {
    metadata: { name, displayName, description, platforms: project === 'doc' ? ['web'] : ['ios', 'android', 'web'], layoutFile: stem, createdAt },
    components, layoutChildren: components.slice(1).map((c) => c[1]),
    uiVariables: r.vars, eventHandlers: r.handlers, vmMethods: r.methods, vmVars: r.vars.map((v) => v[0]),
    repositories: r.repos, apis: r.apis, userActions: r.actions, transitions: r.transitions, branches: r.branches,
  };
}
Object.assign(SPEC_DOCS, {
  onboarding: doc('onboarding', 'アプリの使い方を 3 枚のスライドで紹介し、通知の許可を求める', '2026-09-20',
    'SafeAreaView onboarding_root 画面全体|Collection slide_pager 紹介スライド（3 枚）|View page_dots 今のページ|Button next_button 次へ|Button skip_button スキップ|Button start_button はじめる',
    { vars: [['page', 'Int', '0'], ['isLastPage', 'Bool', 'false']], handlers: [['onNextTap', '次のスライドへ'], ['onStartTap', '通知の許可を求めてホームへ']],
      methods: ['next()', 'skip()', 'start()', 'requestNotification()'], repos: ['SettingsRepository'], apis: [],
      actions: [['次へをタップ', 'onNextTap → next()'], ['スキップをタップ', 'skip()'], ['はじめるをタップ', 'onStartTap → start()']],
      transitions: [['start()', 'Home'], ['skip()', 'Home']],
      branches: [['next', '最後のスライド', 'start_button を表示'], ['start', '通知を拒否', 'そのまま Home へ']] }),
  signup: doc('signup', 'メールアドレスとパスワードでアカウントを作る', '2026-10-17',
    'SafeAreaView signup_root 画面全体|Label title_label 画面タイトル「新規登録」|TextField name_input お名前|TextField email_input メールアドレス|TextField password_input パスワード（8 文字以上）|CheckBox terms_check 利用規約に同意|Label error_label 入力エラー|Button signup_button 登録する|Button login_link ログインへ戻る|Indicator loading_indicator 通信中の表示',
    { vars: [['name', 'String', '""'], ['email', 'String', '""'], ['password', 'String', '""'], ['agreed', 'Bool', 'false'], ['errorMessage', 'String?', 'null'], ['isLoading', 'Bool', 'false']],
      handlers: [['onSignupTap', '入力を検証して signup() を呼ぶ'], ['onTermsToggle', '同意を切り替える']],
      methods: ['signup()', 'validate()', 'toggleTerms()', 'openLogin()'], repos: ['AuthRepository'], apis: [['postSignup', 'POST', '/auth/signup']],
      actions: [['登録するをタップ', 'onSignupTap → signup()'], ['利用規約に同意', 'onTermsToggle → toggleTerms()'], ['ログインへ戻るをタップ', 'openLogin()']],
      transitions: [['signup() 成功', 'Home'], ['login_link をタップ', 'Login']],
      branches: [['signup', '規約に未同意', 'signup_button を無効にする'], ['signup', 'email が登録済み', 'error_label に「登録済み」'], ['signup', 'password が 8 文字未満', 'error_label に「8 文字以上」'], ['signup', 'API が 201', 'Home へ遷移']] }),
  search: doc('search', 'キーワードで商品を探し、履歴と候補を出す', '2026-09-28',
    'SafeAreaView search_root 画面全体|TextField search_input キーワード|Button cancel_button キャンセル|Collection history_list 検索履歴|Collection suggest_list 候補|Button clear_history 履歴を消す',
    { vars: [['query', 'String', '""'], ['history', '[String]', '[]'], ['suggestions', '[String]', '[]']], handlers: [['onSubmit', '検索を確定'], ['onClearHistory', '履歴を消す']],
      methods: ['loadHistory()', 'suggest(_:)', 'submit()', 'clearHistory()'], repos: ['SearchRepository'], apis: [['getSuggestions', 'GET', '/search/suggest']],
      actions: [['キーワードを入力', 'suggest(_:)'], ['検索を確定', 'onSubmit → submit()'], ['履歴を消すをタップ', 'onClearHistory → clearHistory()']],
      transitions: [['submit()', 'ProductList'], ['cancel_button をタップ', 'Home']],
      branches: [['suggest', 'query が空', '履歴を表示'], ['suggest', '候補 0 件', '「候補なし」を表示'], ['submit', 'query が空', '何もしない']] }),
  filter: doc('filter', '価格・カテゴリ・在庫で一覧を絞り込むシート', '2026-09-30',
    'View filter_root シート全体|Label title_label 見出し「絞り込み」|SelectBox category_select カテゴリ|View price_range 価格の範囲|Switch stock_switch 在庫ありのみ|Button reset_button リセット|Button apply_button 適用する',
    { vars: [['category', 'String?', 'null'], ['minPrice', 'Int', '0'], ['maxPrice', 'Int', '50000'], ['inStockOnly', 'Bool', 'false']], handlers: [['onApplyTap', '条件を返して閉じる'], ['onResetTap', '条件を初期値に戻す']],
      methods: ['apply()', 'reset()', 'setPrice(min:max:)'], repos: ['CategoryRepository'], apis: [['listCategories', 'GET', '/categories']],
      actions: [['適用するをタップ', 'onApplyTap → apply()'], ['リセットをタップ', 'onResetTap → reset()']],
      transitions: [['apply()', 'ProductList']],
      branches: [['apply', 'minPrice > maxPrice', '価格を入れ替える'], ['reset', '—', '全条件を初期値に戻す']] }),
  detail: doc('detail', '商品の写真・価格・在庫を見せて、カートに入れる', '2026-10-14',
    'SafeAreaView detail_root 画面全体|Image product_image 商品写真|Label name_label 商品名|Label price_label 価格|Label stock_label 在庫の表示|Segment size_segment サイズの選択|Button add_cart_button カートに入れる|Button favorite_button お気に入り|Label review_summary 評価の平均と件数|Button reviews_button レビューを見る|Indicator loading_indicator 読み込み中',
    { vars: [['product', 'Product?', 'null'], ['size', 'Int', '-1'], ['isFavorite', 'Bool', 'false'], ['canAddToCart', 'Bool', 'false'], ['isLoading', 'Bool', 'true']],
      handlers: [['onAddCartTap', 'カートに追加'], ['onFavoriteTap', 'お気に入りを切り替える'], ['onSizeChange', 'サイズを選ぶ']],
      methods: ['onAppear()', 'loadProduct()', 'selectSize(_:)', 'addToCart()', 'toggleFavorite()', 'openReviews()'], repos: ['ProductRepository', 'CartRepository', 'FavoriteRepository'],
      apis: [['getProduct', 'GET', '/products/{id}'], ['postCartItem', 'POST', '/cart/items'], ['putFavorite', 'PUT', '/favorites/{id}']],
      actions: [['サイズを選ぶ', 'onSizeChange → selectSize(_:)'], ['カートに入れるをタップ', 'onAddCartTap → addToCart()'], ['お気に入りをタップ', 'onFavoriteTap → toggleFavorite()'], ['レビューを見るをタップ', 'openReviews()']],
      transitions: [['addToCart() 成功', 'Cart'], ['openReviews()', 'Reviews']],
      branches: [['loadProduct', 'stock == 0', 'add_cart_button を無効にして在庫切れを表示'], ['addToCart', 'サイズ未選択', 'size_segment を強調'], ['addToCart', 'API 成功', 'Cart へ遷移'], ['toggleFavorite', '未ログイン', 'Login へ遷移']] }),
  reviews: doc('reviews', '商品のレビューを新しい順に見せ、評価で絞り込む', '2026-10-06',
    'SafeAreaView reviews_root 画面全体|Label average_label 平均評価|Segment star_filter 評価で絞り込み|Collection review_list レビュー一覧|Indicator loading_indicator 読み込み中|Label empty_label レビューなし',
    { vars: [['reviews', '[Review]', '[]'], ['stars', 'Int?', 'null'], ['isLoading', 'Bool', 'true']], handlers: [['onStarFilter', '評価で絞り込む']],
      methods: ['load()', 'loadMore()', 'filter(stars:)'], repos: ['ReviewRepository'], apis: [['listReviews', 'GET', '/products/{id}/reviews']],
      actions: [['評価で絞り込む', 'onStarFilter → filter(stars:)'], ['最後までスクロール', 'loadMore()']],
      transitions: [['戻る', 'ProductDetail']],
      branches: [['load', '0 件', 'empty_label を表示'], ['loadMore', '最終ページ', '読み込みを止める'], ['filter', 'stars == nil', '全件を表示']] }),
  favorites: doc('favorites', 'お気に入りに入れた商品を並べ、カートへ移せる', '2026-09-26',
    'SafeAreaView favorites_root 画面全体|Collection favorite_list お気に入り一覧|Label empty_label お気に入りなし|Button edit_button 編集',
    { vars: [['items', '[Product]', '[]'], ['isEditing', 'Bool', 'false']], handlers: [['onRemove', 'お気に入りから外す'], ['onEditTap', '編集モードを切り替える']],
      methods: ['load()', 'remove(_:)', 'moveToCart(_:)'], repos: ['FavoriteRepository'], apis: [['listFavorites', 'GET', '/favorites'], ['deleteFavorite', 'DELETE', '/favorites/{id}']],
      actions: [['商品をタップ', '商品詳細を開く'], ['外すをタップ', 'onRemove → remove(_:)'], ['カートへをタップ', 'moveToCart(_:)']],
      transitions: [['商品をタップ', 'ProductDetail']],
      branches: [['load', '0 件', 'empty_label を表示'], ['remove', '最後の 1 件', 'empty_label に切り替える']] }),
  checkout: doc('checkout', 'お届け先と支払い方法を確かめて注文を確定する', '2026-10-09',
    'SafeAreaView checkout_root 画面全体|Label address_label お届け先|Button address_change お届け先を変更|Label payment_label 支払い方法|Button payment_change 支払い方法を変更|Label subtotal_label 小計|Label shipping_label 送料|Label total_label 合計|Button confirm_button 注文を確定する|Indicator loading_indicator 送信中',
    { vars: [['address', 'Address?', 'null'], ['payment', 'Payment?', 'null'], ['total', 'Int', '0'], ['canConfirm', 'Bool', 'false'], ['isSubmitting', 'Bool', 'false']],
      handlers: [['onConfirmTap', '注文を送る'], ['onChangeAddress', 'お届け先の選択へ']],
      methods: ['load()', 'changeAddress()', 'changePayment()', 'confirm()', 'recalc()'], repos: ['OrderRepository', 'AddressRepository'], apis: [['getCheckout', 'GET', '/checkout'], ['postOrder', 'POST', '/orders']],
      actions: [['注文を確定するをタップ', 'onConfirmTap → confirm()'], ['お届け先を変更', 'onChangeAddress → changeAddress()'], ['支払い方法を変更', 'changePayment()']],
      transitions: [['confirm() 成功', 'OrderComplete'], ['changeAddress()', 'AddressList'], ['changePayment()', 'PaymentMethods']],
      branches: [['load', 'address == nil', 'confirm_button を無効にする'], ['confirm', '在庫切れ', 'エラーを出して Cart へ'], ['confirm', '決済エラー', 'payment_label を強調'], ['confirm', 'success', 'OrderComplete へ遷移']] }),
  complete: doc('complete', '注文番号とお届け予定日を見せる', '2026-10-10',
    'SafeAreaView complete_root 画面全体|Image done_image 完了のイラスト|Label order_number 注文番号|Label delivery_label お届け予定日|Button orders_button 注文履歴を見る|Button home_button 買い物を続ける',
    { vars: [['orderNumber', 'String', '""'], ['deliveryDate', 'String', '""']], handlers: [['onHomeTap', 'ホームへ戻る']],
      methods: ['onAppear()', 'openOrders()', 'backToHome()'], repos: ['OrderRepository'], apis: [['getOrder', 'GET', '/orders/{id}']],
      actions: [['注文履歴を見るをタップ', 'openOrders()'], ['買い物を続けるをタップ', 'onHomeTap → backToHome()']],
      transitions: [['openOrders()', 'OrderHistory'], ['backToHome()', 'Home']],
      branches: [['onAppear', '注文の取得に失敗', '注文番号だけを表示'], ['onAppear', 'success', 'お届け予定日を表示']] }),
  orders: doc('orders', '過去の注文を新しい順に並べる', '2026-10-13',
    'SafeAreaView orders_root 画面全体|Segment period_segment 期間（3 か月 / 1 年 / すべて）|Collection order_list 注文一覧|Label empty_label 注文なし|Indicator loading_indicator 読み込み中',
    { vars: [['orders', '[Order]', '[]'], ['period', 'Int', '0'], ['isLoading', 'Bool', 'true']], handlers: [['onPeriodChange', '期間を変える'], ['onOrderTap', '注文詳細へ']],
      methods: ['load()', 'loadMore()', 'changePeriod(_:)', 'openOrder(_:)'], repos: ['OrderRepository'], apis: [['listOrders', 'GET', '/orders']],
      actions: [['期間を変える', 'onPeriodChange → changePeriod(_:)'], ['注文をタップ', 'onOrderTap → openOrder(_:)'], ['最後までスクロール', 'loadMore()']],
      transitions: [['openOrder(_:)', 'OrderDetail']],
      branches: [['load', '0 件', 'empty_label を表示'], ['loadMore', '最終ページ', '読み込みを止める']] }),
  order: doc('order', '1 件の注文の中身・配送状況・領収書を見せる', '2026-10-16',
    'SafeAreaView order_root 画面全体|Label status_label 配送状況|Collection item_list 注文した商品|Label total_label 合計|Label address_label お届け先|Button receipt_button 領収書|Button cancel_button 注文をキャンセル',
    { vars: [['order', 'Order?', 'null'], ['canCancel', 'Bool', 'false'], ['isLoading', 'Bool', 'true']], handlers: [['onCancelTap', 'キャンセルを確認'], ['onReceiptTap', '領収書を開く']],
      methods: ['load()', 'cancel()', 'openReceipt()'], repos: ['OrderRepository'], apis: [['getOrder', 'GET', '/orders/{id}'], ['postCancel', 'POST', '/orders/{id}/cancel']],
      actions: [['注文をキャンセルをタップ', 'onCancelTap → cancel()'], ['領収書をタップ', 'onReceiptTap → openReceipt()']],
      transitions: [['商品をタップ', 'ProductDetail']],
      branches: [['load', '発送済み', 'cancel_button を隠す'], ['cancel', 'success', 'status_label を「キャンセル済み」に']] }),
  mypage: doc('mypage', '会員情報と各種設定の入口をまとめる', '2026-09-24',
    'SafeAreaView mypage_root 画面全体|Image avatar_image アイコン|Label name_label お名前|Button orders_button 注文履歴|Button favorites_button お気に入り|Button address_button お届け先|Button payment_button 支払い方法|Button settings_button 設定|Button logout_button ログアウト',
    { vars: [['userName', 'String', '""'], ['avatarUrl', 'String?', 'null']], handlers: [['onLogoutTap', 'ログアウトを確認']],
      methods: ['load()', 'logout()', 'open(_:)'], repos: ['UserRepository', 'AuthRepository'], apis: [['getMe', 'GET', '/me'], ['postLogout', 'POST', '/auth/logout']],
      actions: [['各メニューをタップ', 'open(_:)'], ['ログアウトをタップ', 'onLogoutTap → logout()']],
      transitions: [['orders_button をタップ', 'OrderHistory'], ['favorites_button をタップ', 'Favorites'], ['settings_button をタップ', 'Settings'], ['logout() 成功', 'Login']],
      branches: [['logout', '確認でキャンセル', '何もしない'], ['load', '未ログイン', 'Login へ遷移']] }),
  address: doc('address', '登録したお届け先を並べ、既定の 1 件を選ぶ', '2026-10-15',
    'SafeAreaView address_root 画面全体|Collection address_list お届け先一覧|Button add_button お届け先を追加|Label empty_label 登録なし',
    { vars: [['addresses', '[Address]', '[]'], ['selectedId', 'String?', 'null']], handlers: [['onSelect', '既定にする'], ['onAddTap', '追加へ']],
      methods: ['load()', 'select(_:)', 'add()', 'edit(_:)'], repos: ['AddressRepository'], apis: [['listAddresses', 'GET', '/addresses'], ['putDefault', 'PUT', '/addresses/{id}/default']],
      actions: [['お届け先をタップ', 'onSelect → select(_:)'], ['追加をタップ', 'onAddTap → add()'], ['編集をタップ', 'edit(_:)']],
      transitions: [['add()', 'AddressEdit'], ['edit(_:)', 'AddressEdit']],
      branches: [['load', '0 件', 'empty_label と追加ボタンを表示'], ['select', 'Checkout から来た', '選んで Checkout へ戻る']] }),
  settings: doc('settings', '通知・表示・アカウントの設定', '2026-09-22',
    'SafeAreaView settings_root 画面全体|Switch push_switch プッシュ通知|Switch mail_switch メールマガジン|SelectBox theme_select 表示モード|Button help_button ヘルプ|Button delete_button アカウントを削除',
    { vars: [['pushEnabled', 'Bool', 'true'], ['mailEnabled', 'Bool', 'false'], ['theme', 'String', '"system"']], handlers: [['onPushToggle', '通知を切り替える'], ['onDeleteTap', '削除を確認']],
      methods: ['load()', 'togglePush()', 'toggleMail()', 'setTheme(_:)', 'deleteAccount()'], repos: ['SettingsRepository'], apis: [['getSettings', 'GET', '/settings'], ['putSettings', 'PUT', '/settings']],
      actions: [['プッシュ通知を切り替える', 'onPushToggle → togglePush()'], ['表示モードを選ぶ', 'setTheme(_:)'], ['アカウントを削除をタップ', 'onDeleteTap → deleteAccount()']],
      transitions: [['help_button をタップ', 'Help']],
      branches: [['togglePush', 'OS で通知が拒否', '設定アプリへの案内を表示'], ['deleteAccount', 'success', 'Login へ遷移']] }),
});
/* The documentation site (JsonUIDocument) is a JsonUI project of its own. */
Object.assign(SPEC_DOCS, {
  top: doc('top', 'JsonUI の紹介と、各プラットフォームの始め方への入口', '2026-09-10',
    'SafeAreaView top_root 画面全体|Label hero_title 見出し|Label hero_lead 紹介文|Button start_button はじめる|Collection platform_cards iOS・Android・Web の案内|Collection news_list 更新情報',
    { vars: [['news', '[News]', '[]'], ['isLoading', 'Bool', 'true']], handlers: [['onStartTap', 'はじめかたへ']],
      methods: ['load()', 'openStart()', 'openPlatform(_:)'], repos: ['DocsRepository'], apis: [['getNews', 'GET', '/news.json']],
      actions: [['はじめるをタップ', 'onStartTap → openStart()'], ['プラットフォームを選ぶ', 'openPlatform(_:)']],
      transitions: [['openStart()', 'GettingStarted'], ['openPlatform(_:)', 'GettingStarted']],
      branches: [['load', '更新情報が 0 件', 'news_list を隠す'], ['openPlatform', 'web', 'Web の手順を開く']] }),
  start: doc('start', 'インストールから最初の画面を出すまでの手順', '2026-09-12',
    'SafeAreaView start_root 画面全体|Segment platform_tabs iOS・Android・Web の切り替え|Collection step_list 手順|Label code_sample コード例|Button copy_button コピー|Button next_button 次へ',
    { vars: [['platform', 'String', '"ios"'], ['copied', 'Bool', 'false']], handlers: [['onPlatformChange', 'プラットフォームを切り替える'], ['onCopyTap', 'コードをコピー']],
      methods: ['selectPlatform(_:)', 'copyCode()', 'openNext()'], repos: [], apis: [],
      actions: [['プラットフォームを切り替える', 'onPlatformChange → selectPlatform(_:)'], ['コピーをタップ', 'onCopyTap → copyCode()']],
      transitions: [['openNext()', 'ComponentList']],
      branches: [['copyCode', 'success', '「コピーしました」を表示']] }),
  components: doc('components', 'コンポーネントを分類ごとに並べ、詳細ページへつなぐ', '2026-09-18',
    'SafeAreaView list_root 画面全体|TextField filter_input 絞り込み|Segment category_tabs 分類|Collection component_grid コンポーネント一覧|Label empty_label 該当なし',
    { vars: [['query', 'String', '""'], ['category', 'String', '"all"'], ['components', '[Component]', '[]']], handlers: [['onComponentTap', '詳細へ']],
      methods: ['load()', 'filter(_:)', 'selectCategory(_:)', 'openComponent(_:)'], repos: ['DocsRepository'], apis: [['listComponents', 'GET', '/components.json']],
      actions: [['絞り込む', 'filter(_:)'], ['分類を選ぶ', 'selectCategory(_:)'], ['コンポーネントをタップ', 'onComponentTap → openComponent(_:)']],
      transitions: [['openComponent(_:)', 'ComponentDetail']],
      branches: [['filter', '0 件', 'empty_label を表示'], ['selectCategory', 'all', '全件を表示']] }),
  component: doc('component', '1 つのコンポーネントの属性・例・対応プラットフォームを見せる', '2026-10-01',
    'SafeAreaView detail_root 画面全体|Label name_label コンポーネント名|Label summary_label 概要|Collection attr_table 属性の表|Label sample_code JSON の例|Segment preview_tabs プレビューの切り替え',
    { vars: [['component', 'Component?', 'null'], ['preview', 'String', '"ios"']], handlers: [['onAttrTap', '属性リファレンスへ']],
      methods: ['load()', 'selectPreview(_:)', 'openAttribute(_:)'], repos: ['DocsRepository'], apis: [['getComponent', 'GET', '/components/{name}.json']],
      actions: [['属性をタップ', 'onAttrTap → openAttribute(_:)'], ['プレビューを切り替える', 'selectPreview(_:)']],
      transitions: [['openAttribute(_:)', 'AttributeReference']],
      branches: [['load', '存在しない名前', '一覧へ戻す'], ['selectPreview', 'web', 'Web のプレビューを表示']] }),
  attrs: doc('attrs', 'すべての属性を、型・既定値・対応コンポーネントつきで引ける', '2026-10-17',
    'SafeAreaView attr_root 画面全体|TextField search_input 属性名で探す|Segment group_tabs レイアウト・見た目・動き|Collection attr_list 属性一覧|Label type_label 型と既定値|Label platforms_label 対応プラットフォーム|Label empty_label 該当なし',
    { vars: [['query', 'String', '""'], ['group', 'String', '"layout"'], ['attributes', '[Attribute]', '[]'], ['isLoading', 'Bool', 'true']], handlers: [['onSearch', '絞り込む'], ['onAttrTap', '使える部品を表示']],
      methods: ['load()', 'search(_:)', 'selectGroup(_:)', 'openComponent(_:)'], repos: ['DocsRepository'], apis: [['listAttributes', 'GET', '/attributes.json']],
      actions: [['属性名で探す', 'onSearch → search(_:)'], ['分類を選ぶ', 'selectGroup(_:)'], ['対応コンポーネントをタップ', 'openComponent(_:)']],
      transitions: [['openComponent(_:)', 'ComponentDetail']],
      branches: [['search', '0 件', 'empty_label を表示'], ['load', 'SSoT の読み込みに失敗', 'エラーを表示'], ['selectGroup', 'layout', 'レイアウト属性だけ表示']] }),
  anatomy: doc('anatomy', 'screen spec の各セクションを図つきで説明する', '2026-09-28',
    'SafeAreaView anatomy_root 画面全体|Label title_label 見出し|Collection section_list セクションごとの説明|Image diagram_image 構造の図|Label sample_json spec の例',
    { vars: [['sections', '[Section]', '[]']], handlers: [['onSectionTap', 'そのセクションへ移動']],
      methods: ['load()', 'scrollTo(_:)'], repos: ['DocsRepository'], apis: [['getAnatomy', 'GET', '/spec/anatomy.json']],
      actions: [['セクションをタップ', 'onSectionTap → scrollTo(_:)']],
      transitions: [['関連リンクをタップ', 'AttributeReference']],
      branches: [['load', 'success', '図と例を表示']] }),
});
/* Screens nobody works on during the demo keep one state: [phase, share]. Live ones are computed below. */
const STILL = {
  onboarding: ['done'], reset: ['todo'], search: ['done'], filter: ['done'], list: ['done'], reviews: ['impl', 0.3], favorites: ['done'],
  coupons: ['todo'], checkout: ['impl-done'], complete: ['impl', 0.5], orders: ['written'], order: ['writing', 0.55], mypage: ['done'],
  address: ['written'], addressEdit: ['todo'], payment: ['todo'], notices: ['todo'], settings: ['done'], help: ['todo'],
  top: ['done'], start: ['done'], components: ['impl', 0.6], component: ['written'], anatomy: ['done'],
};
const SPECS = SCREENS.map(([id, screen, name, stem, project = 'shop']) => {
  const d = SPEC_DOCS[id] || null;
  return {
    id, screen, name, project, file: `${stem}.spec.json`, doc: d,
    totals: d ? [0, d.components.length, d.uiVariables.length, d.vmMethods.length, d.userActions.length, d.transitions.length, d.branches.length] : [0, 0, 0, 0, 0, 0, 0],
    related: [['Layout', `docs/screens/layouts/${stem}.json`], ['ViewModel', project === 'doc' ? `src/viewmodels/${screen}ViewModel.ts` : `${screen}ViewModel.swift`], ['Test', `tests/screens/${stem}.test.json`]],
  };
});
const SPEC_INDEX = Object.fromEntries(SPECS.map((s, i) => [s.id, i]));
const SCREEN_JA = Object.fromEntries(SCREENS.map((x) => [x[1], x[2]]));

const CASES = [
  { name: '初期表示（商品 3 点）', branch: 'items.count > 0', s: 18, e: 23, steps: ['assert visible cart_list', 'assert count cart_item = 3', 'assert text total_label'] },
  { name: '数量を 0 にすると行が消える', branch: 'changeQuantity: qty == 0', s: 23, e: 28, steps: ['input qty_input_1 "0"', 'tap qty_apply_1', 'assert count cart_item = 2'] },
  { name: '空のカートで購入ボタンが無効', branch: 'isEmpty == true', s: 28, e: 32, steps: ['setMocks cart: empty', 'assert visible empty_label', 'assert disabled checkout_button'] },
  { name: 'クーポン WELCOME10 を適用', branch: 'applyCoupon → valid', s: 32, e: 37, steps: ['input coupon_input "WELCOME10"', 'tap coupon_apply', 'assert text discount_label'] },
  { name: '期限切れクーポンでエラー表示', branch: 'applyCoupon → expired', s: 37, e: 45, failAt: 41, steps: ['input coupon_input "OLD2025"', 'tap coupon_apply', 'assert visible coupon_error'] },
  { name: '在庫切れ商品の警告', branch: 'item.stock == 0', s: 45, e: 50, steps: ['setMocks stock: soldOut', 'assert visible stock_warning', 'assert disabled checkout_button'] },
  { name: '未ログインで購入 → ログイン画面へ', branch: 'checkout → Login', s: 50, e: 55, steps: ['setMocks auth: guest', 'tap checkout_button', 'assert screen Login'] },
  { name: '購入確定で注文完了へ', branch: 'placeOrder → success', s: 55, e: 60, steps: ['tap checkout_button', 'tap confirm_button', 'assert screen OrderComplete'] },
];
/* Task lists are per session (~/.claude/tasks/<list>/), so ids repeat across lists. */
const TASKS = [
  { list: 'a0', id: 1, subject: 'ProductList の画面を実装', activeForm: 'ProductList の画面を実装中', owner: 'a5', spec: 'list', created: -1, start: -1, end: -0.5 },
  { list: 'a0', id: 2, subject: 'Login 画面の spec を書く', activeForm: 'Login の spec を書いています', owner: 'a3', spec: 'login', created: -1, start: 5, end: 62 },
  { list: 'a0', id: 3, subject: 'Home のレイアウトを実装', activeForm: 'Home のレイアウトを実装中', owner: 'a5', spec: 'home', created: -1, start: 6, end: 40.5 },
  { list: 'a0', id: 4, subject: 'Home の ViewModel を実装', activeForm: 'Home の ViewModel を実装中', owner: 'a5', spec: 'home', created: -1, start: 44, end: 76, blockedBy: 3 },
  { list: 'a0', id: 5, subject: 'Cart のテストをシミュレータで流す', activeForm: 'Cart のテストを実行中', owner: 'a2', spec: 'cart', created: -1, start: 13, end: 60 },
  { list: 'a0', id: 6, subject: '文言を strings.json に登録', owner: null, spec: null, created: -1, start: null, end: null },
  { list: 'a0', id: 7, subject: 'Home → Cart の遷移をつなぐ', activeForm: 'Home → Cart の遷移をつないでいます', owner: 'a7', spec: 'home', created: 12, start: 40.5, end: null, blockedBy: 3 },
  { list: 'a0', id: 8, subject: 'jui verify で spec とのズレを確認', activeForm: 'jui verify を実行中', owner: 'a5', spec: 'home', created: 12.4, start: 70, end: 74 },
  { list: 'b4', id: 1, subject: 'Signup 画面の spec を書く', activeForm: 'Signup の spec を書いています', owner: 'e6', spec: 'signup', created: -1, start: 5, end: 70 },
  { list: 'b4', id: 2, subject: 'ProductDetail のレイアウトを実装', activeForm: 'ProductDetail のレイアウトを実装中', owner: 'f2', spec: 'detail', created: -1, start: -1, end: 30.2 },
  { list: 'b4', id: 3, subject: 'ProductDetail の ViewModel を実装', activeForm: 'ProductDetail の ViewModel を実装中', owner: 'f2', spec: 'detail', created: -1, start: 36, end: 78, blockedBy: 2 },
  { list: 'b4', id: 4, subject: 'Signup 画面を実装', owner: null, spec: 'signup', created: -1, start: null, end: null, blockedBy: 1 },
  { list: 'b4', id: 5, subject: 'ProductDetail → Cart の遷移をつなぐ', owner: null, spec: 'detail', created: 2, start: null, end: null, blockedBy: 3 },
  { list: 'd8', id: 1, subject: 'Coupons 画面の spec を書く', owner: null, spec: 'coupons', created: -1, start: null, end: null },
  { list: '4f', id: 1, subject: 'jui build の iOS 出力を直す', activeForm: 'jui build の iOS 出力を直しています', owner: '4f', spec: null, created: -1, start: -1, end: 22 },
  { list: '4f', id: 2, subject: 'jui viz コマンドの雛形を作る', activeForm: 'jui viz の雛形を作っています', owner: '4f', spec: null, created: -1, start: 44, end: null },
  { list: '4f', id: 3, subject: 'フック受信サーバーのテストを書く', owner: null, spec: null, created: -1, start: null, end: null, blockedBy: 2 },
  { list: '7c', id: 1, subject: 'jsonui-test にケースごとの進捗出力を足す', activeForm: '進捗出力を実装中', owner: '7c', spec: null, created: -1, start: -1, end: null },
  { list: '7c', id: 2, subject: 'README に --progress の説明を書く', owner: null, spec: null, created: -1, start: null, end: null, blockedBy: 1 },
  { list: 'c9', id: 1, subject: 'spec の構造ページの HTML を生成', activeForm: 'HTML を生成中', owner: 'c9', spec: 'anatomy', created: -1, start: 0, end: 52 },
  { list: 'c9', id: 2, subject: 'コンポーネント一覧に新しい属性を反映', owner: null, spec: 'components', created: -1, start: null, end: null },
  { list: 'c9', id: 3, subject: '検索ページの文言を直す', owner: 'c9', spec: null, created: -1, start: -1, end: -0.5 },
  { list: 'e1', id: 1, subject: '属性リファレンスの spec を書く', activeForm: '属性リファレンスの spec を書いています', owner: 'e1', spec: 'attrs', created: -1, start: 18, end: 78 },
  { list: 'e1', id: 2, subject: '属性リファレンスを実装', owner: null, spec: 'attrs', created: -1, start: null, end: null, blockedBy: 1 },
];
/* The turns (requester, 10-18): one card per prompt a session received, done at Stop; 4f waits for its pip install
   (p6) while its second turn works. */
TASKS.push(
  { list: 'a0', id: 'turn-1', source: 'turn', turn: 1, subject: 'ホームからカートまでの画面を仕上げて', owner: 'a0', spec: null, created: -1, start: -1, end: null },
  { list: 'b4', id: 'turn-1', source: 'turn', turn: 1, subject: '会員登録と商品詳細を進めて', owner: 'b4', spec: null, created: -1, start: -1, end: null },
  { list: '4f', id: 'turn-1', source: 'turn', turn: 1, subject: 'jui build の iOS 出力を直して', owner: '4f', spec: null, created: -1, start: -1, end: 24 },
  { list: '4f', id: 'turn-2', source: 'turn', turn: 2, subject: 'jui viz の雛形を作って', owner: '4f', spec: null, created: 40, start: 40, end: null, waitFrom: 42, waitTo: 44 },
  { list: 'c9', id: 'turn-1', source: 'turn', turn: 1, subject: 'spec の構造ページを生成して', owner: 'c9', spec: null, created: -1, start: -1, end: 60 },
);
const TASK_BY_KEY = Object.fromEntries(TASKS.map((x) => [`${x.list}#${x.id}`, x]));
/* Questions (AskUserQuestion) come from live sessions only: the demo script asks none. */
const QUESTIONS = [];
const EVENTS = [
  [0.2, 'a5', 'Read', 'docs/screens/json/home.spec.json'],
  [0.4, 'f2', 'Edit', 'docs/screens/layouts/product-detail.json'],
  [0.6, 'c9', 'Read', 'docs/screens/json/spec-anatomy.spec.json'],
  [1.4, '7c', 'Edit', 'src/reporter/progress.ts'],
  [1.0, '4f', 'Bash', 'jui build --ios-only'],
  [2.0, 'b4', 'TaskCreated', '#5 ProductDetail → Cart の遷移をつなぐ'],
  [5.0, 'a3', 'Write', 'docs/screens/json/login.spec.json'],
  [6.0, 'e6', 'PermissionRequest', 'Write docs/screens/json/signup.spec.json', 'p1'],
  [6.0, 'a5', 'Edit', 'docs/screens/layouts/home.json'],
  [8.0, 'e6', 'Write', 'docs/screens/json/signup.spec.json'],
  [9.0, 'a3', 'spec 更新', 'login.spec.json › structure'],
  [10.0, 'a2', 'MCP', 'jui-tools test_validate cart.test.json'],
  [12.0, 'a0', 'TaskCreated', '#7 Home → Cart の遷移をつなぐ'],
  [12.2, 'e6', 'spec 更新', 'signup.spec.json › structure'],
  [12.4, 'a0', 'TaskCreated', '#8 jui verify で spec とのズレを確認'],
  [14.0, 'a2', 'PermissionRequest', "Bash xcodebuild test -destination 'iPhone 16'", 'p2'],
  [16.0, 'c9', 'PermissionRequest', 'Bash jsonui-doc generate html', 'p3'],
  [18.0, 'a2', 'Bash', "xcodebuild test -destination 'iPhone 16'"],
  [20.0, 'e1', 'Write', 'docs/screens/json/attribute-reference.spec.json'],
  [22.0, '4f', 'Stop', 'ビルド完了'],
  [23.0, 'a2', 'case ✓', '初期表示（商品 3 点）'],
  [25.0, 'a3', 'spec 更新', 'login.spec.json › stateManagement'],
  [26.0, 'f2', 'PermissionRequest', 'Bash jui build', 'p4'],
  [28.0, 'a2', 'case ✓', '数量を 0 にすると行が消える'],
  [30.0, 'f2', 'Bash', 'jui build'],
  [30.2, 'f2', 'TaskCompleted', '#2 ProductDetail のレイアウトを実装'],
  [30.4, 'e6', 'spec 更新', 'signup.spec.json › stateManagement'],
  [30.6, '7c', 'PermissionRequest', 'Bash npm test -- --progress', 'p7'],
  [26.2, 'e1', 'spec 更新', 'attribute-reference.spec.json › structure'],
  [32.0, 'a2', 'case ✓', '空のカートで購入ボタンが無効'],
  [33.0, 'a3', 'spec 更新', 'login.spec.json › dataFlow'],
  [36.0, 'f2', 'Edit', 'ProductDetailViewModel.swift'],
  [37.0, 'a2', 'case ✓', 'クーポン WELCOME10 を適用'],
  [38.0, 'c9', 'PostToolUse', 'jsonui-doc generate html（許可済み）'],
  [40.0, 'a5', 'Bash', 'jui build'],
  [40.2, 'e6', 'spec 更新', 'signup.spec.json › dataFlow'],
  [40.4, 'e1', 'spec 更新', 'attribute-reference.spec.json › stateManagement'],
  [42.0, '4f', 'PermissionRequest', 'Bash pip install aiohttp watchdog', 'p6'],
  [40.5, 'a5', 'TaskCompleted', '#3 Home のレイアウトを実装'],
  [41.0, 'a2', 'case ✗', '期限切れクーポンでエラー表示（1 回目）'],
  [41.2, 'a2', 'retry', '期限切れクーポンでエラー表示を再実行'],
  [43.0, 'a3', 'spec 更新', 'login.spec.json › userActions'],
  [45.0, 'a2', 'case ✓', '期限切れクーポンでエラー表示（2 回目で通過）'],
  [45.2, 'a5', 'PermissionRequest', 'Edit HomeViewModel.swift', 'p5'],
  [48.0, 'a5', 'Edit', 'HomeViewModel.swift'],
  [50.0, '4f', 'Edit', 'jui_cli/commands/viz_cmd.py'],
  [50.2, 'a2', 'case ✓', '在庫切れ商品の警告'],
  [50.4, 'e6', 'spec 更新', 'signup.spec.json › userActions'],
  [48.2, 'e1', 'spec 更新', 'attribute-reference.spec.json › dataFlow'],
  [58.4, 'e1', 'spec 更新', 'attribute-reference.spec.json › userActions'],
  [60.6, '7c', 'Bash', 'npm test'],
  [64.4, 'e1', 'spec 更新', 'attribute-reference.spec.json › transitions'],
  [70.6, 'e1', 'spec 更新', 'attribute-reference.spec.json › branchContracts'],
  [78.0, 'e1', 'Stop', '属性リファレンスの spec を書き終えた'],
  [78.4, 'e1', 'TaskCompleted', '#1 属性リファレンスの spec を書く'],
  [52.0, 'c9', 'Stop', 'HTML を生成した'],
  [55.0, 'a3', 'spec 更新', 'login.spec.json › branchContracts'],
  [55.2, 'a2', 'case ✓', '未ログインで購入 → ログイン画面へ'],
  [58.2, 'e6', 'spec 更新', 'signup.spec.json › transitions'],
  [60.0, 'a2', 'case ✓', '購入確定で注文完了へ'],
  [60.2, 'a2', 'TaskCompleted', '#5 Cart のテスト 8/8 通過（1 件は再実行）'],
  [62.0, 'a3', 'SubagentStop', 'Login の spec を書き終えた'],
  [62.2, 'a3', 'TaskCompleted', '#2 Login 画面の spec を書く'],
  [64.2, 'e6', 'spec 更新', 'signup.spec.json › branchContracts'],
  [70.0, 'a5', 'MCP', 'jui-tools jui_verify home.spec.json'],
  [70.2, 'e6', 'SubagentStop', 'Signup の spec を書き終えた'],
  [70.4, 'e6', 'TaskCompleted', '#1 Signup 画面の spec を書く'],
  [72.0, 'a5', 'PostToolUse', 'jui_verify: ズレ 0'],
  [74.0, 'a5', 'TaskCompleted', '#8 jui verify で spec とのズレを確認'],
  [74.2, 'f2', 'MCP', 'jui-tools jui_verify product-detail.spec.json'],
  [76.0, 'a5', 'TaskCompleted', '#4 Home の ViewModel を実装'],
  [76.2, 'a5', 'SubagentStop', 'Home の実装が終わった'],
  [76.4, 'f2', 'PostToolUse', 'jui_verify: ズレ 0'],
  [78.0, 'f2', 'TaskCompleted', '#3 ProductDetail の ViewModel を実装'],
  [78.2, 'f2', 'SubagentStop', 'ProductDetail の実装が終わった'],
];

EVENTS.sort((a, b) => a[0] - b[0]);

/* ---------- model: what every panel shows at script time t ---------- */
function planAt(plan, t) { let cur = plan[0]; for (const p of plan) if (t >= p[0]) cur = p; return { state: cur[1], act: cur[2] }; }
const WALK_SEGS = (() => {
  const segs = [];
  let t = 0;
  WALK.points.forEach((a, i) => {
    const b = WALK.points[(i + 1) % WALK.points.length];
    const dur = Math.hypot(b[0] - a[0], b[1] - a[1]) / WALK.speed;
    segs.push({ a, b, t0: t, t1: t + dur });
    t += dur + WALK.pause;
  });
  return { segs, cycle: t };
})();
function walkAt(simT) {
  const tau = ((simT % WALK_SEGS.cycle) + WALK_SEGS.cycle) % WALK_SEGS.cycle;
  for (const s of WALK_SEGS.segs) {
    const ry = Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]);
    if (tau >= s.t0 && tau < s.t1) { const k = (tau - s.t0) / (s.t1 - s.t0); return { x: s.a[0] + (s.b[0] - s.a[0]) * k, z: s.a[1] + (s.b[1] - s.a[1]) * k, ry, moving: true }; }
    if (tau >= s.t1 && tau < s.t1 + WALK.pause) return { x: s.b[0], z: s.b[1], ry, moving: false };
  }
  return { x: WALK.points[0][0], z: WALK.points[0][1], ry: 0, moving: false };
}

function computeTests(t) {
  const rows = CASES.map((c) => {
    if (t < c.s) return { ...c, status: 'pending' };
    if (t < c.e) {
      const retry = c.failAt && t >= c.failAt;
      const k = retry ? frac(t, c.failAt, c.e) : frac(t, c.s, c.failAt || c.e);
      return { ...c, status: 'running', attempt: retry ? 2 : 1, step: c.steps[Math.min(c.steps.length - 1, Math.floor(k * c.steps.length))] };
    }
    return { ...c, status: c.failAt ? 'flaky' : 'passed' };
  });
  const passed = rows.filter((r) => r.status === 'passed' || r.status === 'flaky').length;
  const runningIdx = rows.findIndex((r) => r.status === 'running');
  const retrying = runningIdx >= 0 && rows[runningIdx].attempt === 2;
  let statusText;
  if (t < 10) statusText = '待機中（前回は 5/8 通過）';
  else if (t < 18) statusText = 'test_validate でテスト JSON を検証中';
  else if (t < 60) statusText = `実行中 ${passed}/8 通過 · ケース ${runningIdx + 1} を実行中`;
  else statusText = '完了 8/8 通過（1 件は再実行で通過）';
  return { rows, passed, runningIdx, retrying, active: t >= 18 && t < 60, statusText, file: 'tests/screens/cart.test.json', device: 'iPhone 16 シミュレータ' };
}

const BLANK = [0, 0, 0, 0, 0, 0, 0];
const FULL = [1, 1, 1, 1, 1, 1, 1];
/* Sections are written in order, so a share of the whole spec fills them one after another. */
const spread = (share) => SECTIONS.map((_, k) => clamp01(share * SECTIONS.length - k));
function spreadImpl(totals, share) {
  let left = Math.round(sumImpl(totals) * share);
  return totals.map((n, k) => { if (k < 1 || k > 5) return 0; const v = Math.min(n, left); left -= v; return v; });
}
function stillState(s) {
  const [phase, share = 0] = STILL[s.id] || ['todo'];
  const T = s.totals;
  const base = { written: FULL, implN: BLANK, implPhase: false, writingIdx: -1, implIdx: -1, testIdx: -1, by: null, relatedNow: -1 };
  switch (phase) {
    case 'todo': return { ...base, written: BLANK, status: { kind: 'idle', text: '未着手' }, note: 'spec ファイルはまだない' };
    case 'writing': return { ...base, written: spread(share), status: { kind: 'paused', text: `記述 ${pct(share)}%・中断中` }, note: '書きかけのまま止まっている（担当なし）' };
    case 'written': return { ...base, status: { kind: 'written', text: '記述完了・実装待ち' }, note: '実装はまだ始まっていない' };
    case 'impl': return { ...base, implN: spreadImpl(T, share), implPhase: true, status: { kind: 'paused', text: `実装 ${pct(share)}%・停止中` }, note: '実装の途中で止まっている（担当なし）' };
    case 'impl-done': return { ...base, implN: T.map((n, k) => (k === 6 ? 0 : n)), implPhase: true, status: { kind: 'impl-done', text: '実装完了・テスト待ち' }, note: 'jui verify: ズレ 0 · テストはまだ' };
    default: return { ...base, implN: [...T], implPhase: true, status: { kind: 'done', text: '実装・テスト完了' }, note: `jui verify: ズレ 0 · branchContracts ${T[6]}/${T[6]}` };
  }
}
/* A define robot writing a spec section by section, watched through file changes. */
function writingSpec(t, W, who, chars) {
  const t0 = W[0][0], t1 = W[W.length - 1][1];
  const idx = W.findIndex(([a, b]) => t >= a && t < b);
  const writing = t >= t0 && t < t1;
  return {
    written: W.map(([a, b]) => frac(t, a, b)), implN: BLANK, implPhase: false, writingIdx: writing ? idx : -1, implIdx: -1, testIdx: -1, by: writing ? who : null, relatedNow: -1,
    status: t < t0 ? { kind: 'idle', text: '未着手' } : writing ? { kind: 'write', text: `書き込み中 ${pct(frac(t, t0, t1))}%` } : { kind: 'written', text: '記述完了・実装待ち' },
    note: writing ? `${Math.round(chars * frac(t, t0, t1)).toLocaleString('ja-JP')} 文字 · ファイル監視で ${SECTIONS[idx]} の書き込みを検知` : t < t0 ? 'spec ファイルはまだない' : `${chars.toLocaleString('ja-JP')} 文字 · 全セクション記述済み`,
  };
}
const LOGIN_W = [[5, 9], [9, 25], [25, 33], [33, 43], [43, 49], [49, 55], [55, 62]];
const SIGNUP_W = [[8, 12], [12, 30], [30, 40], [40, 50], [50, 58], [58, 64], [64, 70]];
const ATTRS_W = [[20, 26], [26, 40], [40, 48], [48, 58], [58, 64], [64, 70], [70, 78]];
function computeSpecs(t, tests) {
  const out = SPECS.map((s) => ({ ...s, ...stillState(s) }));
  const put = (id, o) => { const i = SPEC_INDEX[id]; out[i] = { ...out[i], ...o }; };

  // a3 writes Login, then runs doc_validate_spec on it; e6 (session b4) writes Signup.
  const login = writingSpec(t, LOGIN_W, 'a3', 5200);
  if (t >= 70 && t < 76) Object.assign(login, { by: 'a3', status: { kind: 'verify', text: 'doc_validate_spec 実行中' } });
  put('login', login);
  put('signup', writingSpec(t, SIGNUP_W, 'e6', 5600));
  put('attrs', writingSpec(t, ATTRS_W, 'e1', 4800));

  // a5 implements Home: Layout first, then the ViewModel, then jui verify.
  const H = SPECS[SPEC_INDEX.home].totals;
  const hd = [0, t < 6 ? 3 : 3 + Math.floor(9 * frac(t, 6, 40)), Math.floor(5 * frac(t, 48, 66)), Math.floor(6 * frac(t, 48, 70)), Math.floor(4 * frac(t, 56, 72)), Math.floor(2 * frac(t, 60, 72)), 0];
  let hIdx = -1;
  if (t >= 6 && t < 48) hIdx = 1; else if (t >= 48 && t < 58) hIdx = 2; else if (t >= 58 && t < 66) hIdx = 3; else if (t >= 66 && t < 70) hIdx = 4;
  put('home', {
    written: FULL, implN: hd, implPhase: true, writingIdx: -1, implIdx: hIdx, testIdx: -1,
    status: t < 6 ? { kind: 'impl', text: 'spec を読み込み中' } : t < 70 ? { kind: 'impl', text: `実装中 ${pct(sumImpl(hd) / sumImpl(H))}%` } : t < 76 ? { kind: 'verify', text: 'jui verify 実行中' } : { kind: 'impl-done', text: '実装完了・テスト待ち' },
    by: t < 76 ? 'a5' : null, relatedNow: hIdx === 1 ? 0 : hIdx >= 2 ? 1 : -1,
    note: `jui verify: ${t < 70 ? '未実行（構造は Layout の部品 id で照合中）' : t < 72 ? '確認中…' : 'ズレ 0'}`,
  });

  // f2 (session b4) implements ProductDetail the same way.
  const D = SPECS[SPEC_INDEX.detail].totals;
  const dd = [0, Math.min(D[1], 4 + Math.floor((D[1] - 4) * frac(t, 0, 30))), Math.floor(D[2] * frac(t, 36, 56)), Math.floor(D[3] * frac(t, 36, 70)), Math.floor(D[4] * frac(t, 48, 72)), Math.floor(D[5] * frac(t, 60, 74)), 0];
  let dIdx = -1;
  if (t < 30) dIdx = 1; else if (t >= 36 && t < 50) dIdx = 2; else if (t >= 50 && t < 62) dIdx = 3; else if (t >= 62 && t < 70) dIdx = 4; else if (t >= 70 && t < 74) dIdx = 5;
  const dPct = `実装中 ${pct(sumImpl(dd) / sumImpl(D))}%`;
  put('detail', {
    written: FULL, implN: dd, implPhase: true, writingIdx: -1, implIdx: dIdx, testIdx: -1,
    status: t < 30 ? { kind: 'impl', text: dPct } : t < 36 ? { kind: 'impl', text: 'jui build 実行中' } : t < 74 ? { kind: 'impl', text: dPct } : t < 78 ? { kind: 'verify', text: 'jui verify 実行中' } : { kind: 'impl-done', text: '実装完了・テスト待ち' },
    by: t < 78 ? 'f2' : null, relatedNow: dIdx === 1 || (t >= 30 && t < 36) ? 0 : dIdx >= 2 ? 1 : -1,
    note: `jui verify: ${t < 74 ? '未実行' : t < 76 ? '確認中…' : 'ズレ 0'}`,
  });

  // a2 runs the Cart tests on the simulator; each passing case covers one branchContract.
  const C = SPECS[SPEC_INDEX.cart].totals;
  const cov = t < 18 ? 5 : tests.passed;
  put('cart', {
    written: FULL, implN: [...C.slice(0, 6), cov], implPhase: true, writingIdx: -1, implIdx: -1, testIdx: tests.active ? 6 : -1,
    status: t < 10 ? { kind: 'impl-done', text: '実装完了・テスト待ち' } : t < 18 ? { kind: 'test', text: 'テスト JSON を検証中' } : t < 60 ? { kind: 'test', text: `テスト中 ${tests.passed}/8` } : { kind: 'done', text: '実装・テスト完了' },
    by: t >= 10 && t < 60 ? 'a2' : null, relatedNow: t >= 10 && t < 60 ? 2 : -1,
    note: `branchContracts: ${cov}/8 をテストで確認${t < 18 ? '（前回の実行）' : ''}`,
  });
  for (const s of out) s.bucket = s.by ? 'live' : s.status.kind === 'idle' ? 'todo' : s.status.kind === 'done' ? 'done' : 'partial';
  return out;
}


/* Permission prompts in the demo: who asks for what, for which task, and when the script answers them in the
   terminal if nobody answers in the view first. `rule` is what "always allow" would add. */
const PERMS = [
  { id: 'p1', who: 'e6', task: 'b4#1', tool: 'Write', input: { file_path: 'docs/screens/json/signup.spec.json' }, rule: 'Write(docs/screens/json/**)', at: 6, end: 8 },
  { id: 'p2', who: 'a2', task: 'a0#5', tool: 'Bash', input: { command: "xcodebuild test -scheme ShopApp -destination 'platform=iOS Simulator,name=iPhone 16'" }, rule: 'Bash(xcodebuild test:*)', at: 14, end: 18 },
  { id: 'p3', who: 'c9', task: 'c9#1', tool: 'Bash', input: { command: 'jsonui-doc generate html --spec docs/screens/json/spec-anatomy.spec.json' }, rule: 'Bash(jsonui-doc generate:*)', at: 16, end: 38 },
  { id: 'p6', who: '4f', task: null, tool: 'Bash', input: { command: 'pip install aiohttp watchdog' }, rule: 'Bash(pip install:*)', at: 42, end: 44 },
  { id: 'p7', who: '7c', task: '7c#1', tool: 'Bash', input: { command: 'npm test -- --progress' }, rule: 'Bash(npm test:*)', at: 30.6, end: 36 },
  { id: 'p4', who: 'f2', task: 'b4#2', tool: 'Bash', input: { command: 'jui build' }, rule: 'Bash(jui build:*)', at: 26, end: 30 },
  { id: 'p5', who: 'a5', task: 'a0#4', tool: 'Edit', input: { file_path: 'ios/ShopApp/ViewModels/HomeViewModel.swift' }, rule: 'Edit(ios/ShopApp/**)', at: 45.2, end: 48 },
];
const PERM_BY_ID = Object.fromEntries(PERMS.map((p) => [p.id, p]));
const permDecisions = new Map();   // `${loop}:${id}` → { behavior: 'allow' | 'always' | 'deny', at, reason }
const alwaysRules = new Map();     // rule → sim time it was added in the view
/* What Claude Code sends with a permission prompt (PermissionRequest hook input) and what the view answers. */
const ruleParts = (rule) => { const m = rule.match(/^(\w+)\((.*)\)$/); return m ? { toolName: m[1], ruleContent: m[2] } : { toolName: rule }; };
function permRequestPayload(p) {
  const sess = SESSION_OF[p.who];
  const o = { hook_event_name: 'PermissionRequest', session_id: SESSION_UUID[sess], cwd: CWD[sess], permission_mode: 'default' };
  if (AGENT_ID[p.who]) { o.agent_id = AGENT_ID[p.who]; o.agent_type = DEF[p.who].agent; }
  o.tool_name = p.tool;
  o.tool_input = p.input.command ? { command: p.input.command } : { file_path: `${CWD[sess]}/${p.input.file_path}` };
  o.permission_suggestions = [{ type: 'addRules', rules: [ruleParts(p.rule)], behavior: 'allow', destination: 'localSettings' }];
  return o;
}
function permResponse(p, behavior, reason) {
  const decision = behavior === 'deny' ? { behavior: 'deny', message: reason || 'エージェントビューで拒否された' } : { behavior: 'allow' };
  if (behavior === 'always') decision.updatedPermissions = [{ type: 'addRules', rules: [ruleParts(p.rule)], behavior: 'allow', destination: 'localSettings' }];
  return { hookSpecificOutput: { hookEventName: 'PermissionRequest', decision } };
}
function computePerms(t, loop) {
  return PERMS.filter((p) => t >= p.at).map((p) => {
    const d = permDecisions.get(`${loop}:${p.id}`) || null;
    const status = d ? d.behavior : ruleCovers(p, loop * LOOP + p.at) ? 'rule' : t < p.end ? 'pending' : 'terminal';
    return { ...p, status, decided: d, since: t - p.at };
  });
}
function computeTasks(t) {
  const statusOf = (task) => {
    if (task.created > t) return null;
    if (task.end !== null && task.end !== undefined && t >= task.end) return 'completed';
    if (task.start !== null && task.start !== undefined && t >= task.start) return 'in_progress';
    return 'pending';
  };
  const byKey = Object.fromEntries(TASKS.map((x) => [`${x.list}#${x.id}`, x]));
  return TASKS.map((task) => {
    const status = statusOf(task);
    const dep = task.blockedBy ? byKey[`${task.list}#${task.blockedBy}`] : null;
    const blocked = status === 'pending' && !!dep && statusOf(dep) !== 'completed';
    const waiting = status === 'in_progress' && task.waitFrom !== undefined && t >= task.waitFrom && t < task.waitTo;
    const col = status === 'completed' ? 'done' : status === 'in_progress' ? (waiting ? 'wait' : 'doing') : blocked ? 'wait' : 'todo';
    return { ...task, key: `${task.list}#${task.id}`, status, blocked, dep, col, waiting, fresh: task.created >= 0 && t - task.created < 1.5 };
  }).filter((task) => task.status);
}

function computeModel(t, loop = 0) {
  const tests = computeTests(t), perms = computePerms(t, loop), tasks = computeTasks(t);
  for (const x of tasks) x.perm = perms.find((p) => p.task === x.key && p.status === 'pending') || null;
  return { t, loop, tests, specs: computeSpecs(t, tests), tasks, perms, pending: perms.filter((p) => p.status === 'pending') };
}

/* ---------- the demo's show (10-18): everything the live view can do, once a loop ----------
   The demo clock runs 5:00 → 23:00 over the 84 s (the sky; b4's session began at 9:00, so it tires at 17:00). The
   beats stay out of 26–33 s, where the e2e suites freeze the script to compare it with the prototype. The camera
   beats only play while nobody has touched the 3D view for a while (demoDirector, 40-scene.js). */
const DEMO_DAY = { from: 5, to: 23 };
const demoHour = (t) => DEMO_DAY.from + ((DEMO_DAY.to - DEMO_DAY.from) * ((((t % LOOP) + LOOP) % LOOP))) / LOOP;
const demoDayMs = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const demoClockMs = (t) => demoDayMs() + Math.round(demoHour(t) * 3600000);
const DEMO_BEATS = {
  towerOut: 36, look2F: 40, look1F: 44, towerIn: 47,   // by day: out to the building, up to 2F, back to 1F, down
  nightOut: 70, nightIn: 78,                            // at night: the rooms working late lit, the sign aglow
  thinking: [34, 50, 'd8'],                             // a quiet busy session (d8's plan)
  heavy: [38, 58, '7c'],                                // heavy work: fast typing and sweat
  // a subagent called (10-20): the whistle for launchSec (robots.py LAUNCH_WHISTLE_MS) from each [t, robot, how]:
  // a0 calls one in the foreground at 20 (then waits for its report), b4 at 6, a0 one in the background at 76
  launch: [[6, 'b4', 'fg'], [20, 'a0', 'fg'], [76, 'a0', 'bg']], launchSec: 2.5,
  tired: { session: 'b4', since: 9 },                   // the session began at 9:00 of the demo clock
  snacks: [[34, '4f', 'coffee'], [42, 'e1', 'coffee'], [64, 'c9', 'meal']],
};
// The building's data, as the live source keeps it (40-scene.js reads it): 1F the demo's three rooms and three
// other teams', 2F four more. The other teams work by the demo clock: [from hour, to hour, rank 0 waiting | 1 working].
const LIVE = { floors: [['shop', 'cli', 'doc', 'x1', 'x2', 'x3'], ['y1', 'y2', 'y3', 'y4']], floor: 0, rank: {}, leaving: {} };
const PERMS_LIVE = [];
Object.assign(TOWER_NAMES, { x1: 'design-system/', x2: 'payments/', x3: 'infra/', y1: 'ec-site/', y2: 'admin-web/', y3: 'blog-cms/', y4: 'mobile-api/' });
const DEMO_OTHERS = { x1: [[8, 18, 1]], x2: [[9, 12, 1], [12, 14, 0], [14, 19, 1]], x3: [[10, 16, 1]], y1: [[9, 19, 1]], y2: [[8, 24, 1]], y3: [], y4: [[11, 17, 1]] };
function liveGoToFloor() { return false; }   // one office: the other floors are only in the building view
function liveFloorOf() { return 0; }
function demoBuilding(t) {
  const h = demoHour(t), rank = {};
  for (const r of ROOMS) rank[r.id] = 3;
  for (const d of ROBOT_DEFS) {
    const room = projectOfRobot(d.id), st = (robotState[d.id] || {}).state;
    if (room) rank[room] = Math.min(rank[room], st === 'waiting' ? 0 : st && st !== 'idle' && st !== 'done' ? 1 : 2);
  }
  for (const [id, spans] of Object.entries(DEMO_OTHERS)) { const span = spans.find(([a, b]) => h >= a && h < b); rank[id] = span ? span[2] : 2; }
  LIVE.rank = rank;
}
const demoTired = (id) => id === DEMO_BEATS.tired.session && isTired(demoDayMs() + DEMO_BEATS.tired.since * 3600000, vizNow());
const demoLaunch = (id, t) => DEMO_BEATS.launch.some(([at, who]) => who === id && t >= at && t < at + DEMO_BEATS.launchSec);
const demoHeavy = (id, t) => (id === DEMO_BEATS.heavy[2] && t >= DEMO_BEATS.heavy[0] && t < DEMO_BEATS.heavy[1] ? ['tokens'] : []);
function robotCondition(id) {
  const t = latestModel ? latestModel.t : 0;
  return { tired: demoTired(id), hours: (vizNow() - demoDayMs()) / 3600000 - DEMO_BEATS.tired.since,
    heavy: demoHeavy(id, t).length ? { reasons: ['tokens'], tokensPerMin: 3200 } : null };
}

/* ---------- the source's face to the rest of the view (plan 07 §2) ---------- */
// The demo answers a permission prompt on the spot: it records the answer for this loop of the script (and the
// rule for "always"), logs it and says what a real answer would do. The live source sends perm.decide instead.
const SOURCE = {
  mode: 'demo', layoutRev: 0, connected: true,
  decide(id, behavior, { perm: p, reason = '' }) {
    const loop = latestModel.loop;
    permDecisions.set(`${loop}:${id}`, { behavior, at: simT, reason });
    for (const k of permDecisions.keys()) if (Number(k.split(':')[0]) < loop) permDecisions.delete(k);
    if (behavior === 'always') alwaysRules.set(p.rule, simT);
    const item = { abs: simT, who: p.who, kind: behavior === 'deny' ? '拒否した' : '許可した', what: `${p.tool} ${permSummary(p)}${behavior === 'always' ? `（今後も許可: ${p.rule}）` : ''}${reason ? `（理由: ${reason}）` : ''}`, seq: ++logSeq, perm: id, decision: behavior, reason };
    tickerItems.unshift(item); logItems.unshift(item);
    showToast(`${p.who} の ${p.tool} を${behavior === 'deny' ? '拒否' : behavior === 'always' ? '許可し、ルールを追加' : '許可'}した（デモ。実際は Claude Code へ答えを返す）`);
  },
  history() { return Promise.resolve({ ok: false, error: 'demo' }); },   // the demo has no transcripts
  historyImage() { return Promise.resolve({ ok: false, status: 0, error: 'demo' }); },
  attachImage() { return Promise.resolve({ ok: false, status: 0, error: 'demo' }); },
  attachFile() { return Promise.resolve({ ok: false, status: 0, error: 'demo' }); },
  attachRemove() {},
  denial() { return Promise.resolve({ ok: false, status: 0, error: 'demo' }); },
  notifyPresence() { return Promise.resolve(); },
  callCommand() { return Promise.resolve({ ok: false, why: 'デモでは使えません（プロジェクトのフォルダがありません）' }); },
  setWeather() { return Promise.resolve({ ok: false, error: 'demo' }); },   // the demo asks nobody about the weather
  // the server room (ticket 2026-10-20-jui-viz-server-room): shop-app/'s door reads a made-up, generic layout (no real
  // service's values, requester 10-20), after a moment so the keypad's * are seen
  infraDocs(project, seq) { return new Promise((r) => setTimeout(() => r(project === 'shop' ? { ...demoInfra(), seq } : { ok: false, seq, reason: 'no_infra', message: 'デモのこの部屋には構成が無い', short: 'docs/infra がありません' }), 1200)); },
  infraIcon() { return Promise.resolve(null); },
};
/* The demo's server room: a made-up web shop on one cloud, a CDN in front, a card payment service outside, two
   environments; the IAM role and the alarm are folded until asked for. */
function demoInfra() {
  const both = ['production', 'staging'], prod = ['production'];
  const g = (id, label, kind, extra = {}) => ({ id, label, kind, environments: both, providerResolved: extra.provider || '', ...extra });
  const n = (id, label, category, group, provider, extra = {}) => ({ id, label, category, group, count: 1, providerResolved: provider, managed_by: 'iac', fold: false, environments: both, ...extra });
  const e = (from, to, protocol, crossProvider = false, environments = both) => ({ from, to, protocol, direction: 'out', environments, crossProvider });
  return {
    ok: true, version: 0, dir: 'docs/infra', files: ['shop.json', 'shop-staging.json'], readMs: 3, icons: {}, problems: [],
    environments: [{ id: 'production', label: 'production', kind: 'production' }, { id: 'staging', label: 'staging', kind: 'staging' }],
    groups: [
      g('shop', 'ショップ（全体）', 'logical'),
      g('cloud', 'クラウドのアカウント', 'account', { provider: 'aws', parent: 'shop' }),
      g('vpc', 'VPC', 'network', { provider: 'aws', parent: 'cloud' }),
      g('pub', '公開サブネット', 'subnet', { provider: 'aws', parent: 'vpc', visibility: 'public' }),
      g('app', 'アプリのサブネット', 'subnet', { provider: 'aws', parent: 'vpc', visibility: 'private' }),
      g('data', 'データのサブネット', 'subnet', { provider: 'aws', parent: 'vpc', visibility: 'private' }),
      g('edge', 'CDN のアカウント', 'account', { provider: 'cloudflare', parent: 'shop' }),
    ],
    nodes: [
      n('browser', 'ブラウザ', 'client', undefined, '', { group: undefined }),
      n('cdn', 'CDN', 'edge.cdn', 'edge', 'cloudflare'),
      n('dns', 'DNS', 'edge.dns', 'edge', 'cloudflare'),
      n('lb', 'ロードバランサー', 'load_balancer', 'pub', 'aws'),
      n('web', 'Web アプリ', 'compute.container', 'app', 'aws', { count: 3 }),
      n('worker', '注文の処理', 'compute.container', 'app', 'aws'),
      n('queue', '注文のキュー', 'queue', 'app', 'aws'),
      n('db', '注文の DB', 'database.relational', 'data', 'aws'),
      n('replica', '読み取りの写し', 'database.relational', 'data', 'aws', { environments: prod }),
      n('cache', 'セッションのキャッシュ', 'cache', 'data', 'aws'),
      n('images', '商品画像', 'storage.object', 'cloud', 'aws'),
      n('role', 'アプリの IAM ロール', 'security.iam', 'cloud', 'aws', { fold: true }),
      n('alarm', '5xx のアラーム', 'monitoring.alarm', 'cloud', 'aws', { fold: true }),
      n('pay', 'カード決済（外部）', 'external.saas', undefined, '', { external: true, group: undefined }),
    ],
    edges: [
      e('browser', 'dns', 'dns'), e('browser', 'cdn', 'https'), e('cdn', 'lb', 'https', true), e('cdn', 'images', 'https', true),
      e('lb', 'web', 'http'), e('web', 'cache', 'redis'), e('web', 'db', 'postgres'), e('web', 'queue', 'sqs'),
      e('worker', 'queue', 'sqs'), e('worker', 'db', 'postgres'), e('db', 'replica', 'postgres', false, prod),
      e('worker', 'pay', 'https'), e('worker', 'cache', 'redis', false, ['staging']), e('alarm', 'lb', 'metrics'), e('role', 'web', 'iam'),
    ],
  };
}
const robotRuns = () => [];   // the demo's one test run is shown by the card's own a2 row

/* ---------- robot states (kept even without WebGL so the panels still run) ---------- */
const robotState = Object.fromEntries(ROBOT_DEFS.map((d) => [d.id, { state: 'idle', act: '' }]));
function updateRobotStates(simT, t, perms) {
  for (const d of ROBOT_DEFS) {
    if (d.walk) {
      const w = walkAt(simT);
      const started = t >= TASK_BY_KEY['a0#7'].start;
      robotState[d.id] = { state: w.moving ? 'carry' : 'idle', act: w.moving ? (started ? '書類を運搬中（#7 Home → Cart の遷移）' : '下調べの資料を運搬中（#7 は #3 の完了待ち）') : '書類を渡す', walk: w };
      continue;
    }
    let st = planAt(d.plan, t);
    // While a permission prompt is open the robot waits; an answer from the view lets it go on before the script would.
    const p = perms.find((x) => x.who === d.id && t < x.end && x.status !== 'terminal');
    if (p && p.status === 'pending') st = { state: 'waiting', act: `許可待ち: ${p.tool} ${permSummary(p)}` };
    else if (p && p.status === 'deny') st = { state: 'reading', act: '拒否されたので別の手を考え中' };
    else if (p) { const next = planAt(d.plan, p.end); st = { state: next.state, act: `${next.act}（${p.status === 'rule' ? 'ルールで自動許可' : 'ビューで許可'}）` }; }
    robotState[d.id] = st;
  }
}

/* ---------- トーク (2.3.6): the demo's stand-in for the server's talk frames (TALK_CONTRACT.md) ----------
   The talks themselves are 31-talk-demo-data.js (TALK_DEMO: generated frames, data only; it comes after this file, so it
   is read only when the first request comes). talkStandIn answers the page's talk.* requests from them the way the
   server does: talk.open → the robot's list, talk.get → a page of messages (before / limit), talk.seen → the unread
   recounted (a conv op, and talk.badges when a total changed). The data's script (a new message at 20 s, a read at 30 s,
   a removal at 45 s) plays on the page's clock; ?talkhold=1 holds it for the e2e, which plays it with talkDemo.play(t).
   Times move by (now − base). tests/test_viz_talk_ui_frames.py runs this block under node and validates every frame. */
/* talk-demo:begin */
function talkStandIn(data, now) {
  const shift = now - data.base;
  const TIMES = ['at', 'deliveredAt', 'readAt', 'lastAt', 'goneAt', 'removeAt'];
  const moved = (v) => {   // a deep copy with every time moved to the page's clock
    if (Array.isArray(v)) return v.map(moved);
    if (!v || typeof v !== 'object') return v;
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k] = TIMES.includes(k) && Number.isFinite(x) ? x + shift : moved(x);
    return o;
  };
  const lists = {}, msgs = {}, seen = {};
  for (const [owner, f] of Object.entries(data.lists)) lists[owner] = moved(f.items);
  for (const [key, f] of Object.entries(data.messages)) msgs[key] = moved(f.items);
  const ins = (owner, convId) => (msgs[`${owner} ${convId}`] || []).filter((m) => m.dir === 'in');
  // "seen" up to where the data's unread count says: the newest `unread` messages in are not seen yet
  for (const [owner, items] of Object.entries(lists)) for (const c of items) {
    const list = ins(owner, c.id).sort((a, b) => a.at - b.at);
    const k = list.length - c.unread - 1;
    seen[`${owner} ${c.id}`] = k >= 0 ? list[k].at : 0;
  }
  const unread = (owner, convId) => ins(owner, convId).filter((m) => m.at > (seen[`${owner} ${convId}`] || 0)).length;
  const row = (owner, convId) => (lists[owner] || []).find((c) => c.id === convId);
  const recount = (owner, convId) => { const c = row(owner, convId); if (c) c.unread = unread(owner, convId); return c; };
  function badges() {
    const counts = {};
    for (const [owner, items] of Object.entries(lists)) { const n = items.reduce((a, c) => a + c.unread, 0); if (n) counts[owner] = n; }
    return { type: 'talk.badges', counts };
  }
  const ack = (reqId, error) => ({ type: 'ack', reqId, ok: false, error });
  function handle(f) {
    if (f.type === 'talk.open') {
      const items = (lists[f.agentId] || []).slice().sort((a, b) => b.lastAt - a.lastAt);
      return [{ type: 'talk.list', reqId: f.reqId, agentId: f.agentId, items: items.slice(0, 200), more: items.length > 200 }];
    }
    if (f.type === 'talk.close') return [];
    const all = msgs[`${f.agentId} ${f.convId}`];
    if (!all || !row(f.agentId, f.convId)) return [ack(f.reqId, 'no such conversation')];
    if (f.type === 'talk.get') {
      let end = all.length;
      if (f.before !== undefined) { end = all.findIndex((m) => m.id === f.before); if (end < 0) return [ack(f.reqId, 'no such message')]; }
      const start = Math.max(0, end - (f.limit || 100));
      return [{ type: 'talk.messages', reqId: f.reqId, agentId: f.agentId, convId: f.convId, items: all.slice(start, end), more: start > 0 }];
    }
    if (f.type === 'talk.seen') {
      const before = JSON.stringify(badges()), k = `${f.agentId} ${f.convId}`;
      seen[k] = Math.max(seen[k] || 0, f.upTo);
      const out = [{ type: 'talk.update', agentId: f.agentId, ops: [{ op: 'conv', conv: recount(f.agentId, f.convId) }] }];
      const after = badges();
      if (JSON.stringify(after) !== before) out.push(after);
      return out;
    }
    return [ack(f.reqId, 'unknown request')];
  }
  /* One frame of the data's script, applied to the state; what goes out is recounted from the state (a seen before it
     counts), so the badge and the rows never disagree with what the page told the stand-in. */
  function apply(frame) {
    const f = moved(frame);
    if (f.type === 'talk.badges') return [badges()];
    if (f.type !== 'talk.update') return [];
    const owner = f.agentId, ops = [];
    for (const op of f.ops) {
      if (op.op === 'message') {
        const key = `${owner} ${op.convId}`, list = msgs[key] || (msgs[key] = []);
        const k = list.findIndex((m) => m.id === op.message.id);
        if (k >= 0) list[k] = op.message; else { list.push(op.message); list.sort((a, b) => a.at - b.at); }
        ops.push(op);
      } else if (op.op === 'conv') {
        const items = lists[owner] || (lists[owner] = []), k = items.findIndex((c) => c.id === op.conv.id);
        if (k >= 0) items[k] = op.conv; else items.push(op.conv);
        ops.push({ op: 'conv', conv: recount(owner, op.conv.id) });
      } else if (op.op === 'remove') {
        lists[owner] = (lists[owner] || []).filter((c) => c.id !== op.convId);
        delete msgs[`${owner} ${op.convId}`];
        ops.push(op);
      }
    }
    return ops.length ? [{ type: 'talk.update', agentId: owner, ops }] : [];
  }
  return { handle, badges, apply, script: data.script };
}
/* talk-demo:end */
const TALK_SOCK = { open: null, stand: null, played: new Set() };
const talkStand = () => TALK_SOCK.stand || (TALK_SOCK.stand = talkStandIn(TALK_DEMO, Date.now()));
/* Frames reach the page a moment later, as from the socket; an update only for the robot this "socket" has open. */
function talkDemoDeliver(frames) {
  for (const f of frames) {
    if (f.type === 'ack') continue;
    if (f.type === 'talk.update' && f.agentId !== TALK_SOCK.open) continue;
    setTimeout(() => talkReceive(f), 30);
  }
}
/* The script's frames due by t seconds (each once). */
function talkDemoPlay(t) {
  const S = talkStand();
  S.script.forEach((x, k) => { if (x.t <= t && !TALK_SOCK.played.has(k)) { TALK_SOCK.played.add(k); talkDemoDeliver(S.apply(x.frame)); } });
}
Object.assign(SOURCE, {
  talkAgentId: (label) => (DEF[label] ? label : null),   // the demo's talks name the robots by their labels
  talkLabel: (agentId) => (agentId && DEF[agentId] ? agentId : null),
  /* One request, already checked against the contract (58-talk.js talkFrame). Resolves { ok, data } / { ok: false, error }. */
  talkSend(frame) {
    if (frame.type === 'talk.open') TALK_SOCK.open = frame.agentId;
    if (frame.type === 'talk.close') TALK_SOCK.open = null;
    const out = talkStand().handle(frame);
    const fail = out.find((f) => f.type === 'ack' && f.reqId === frame.reqId);
    const answer = out.find((f) => f.type === 'talk.messages' && f.reqId === frame.reqId);
    talkDemoDeliver(out.filter((f) => f !== answer));
    return new Promise((resolve) => setTimeout(() => resolve(fail ? { ok: false, error: fail.error } : { ok: true, data: answer || null }), 30));
  },
  /* The e2e's hand on the script: play what is due by t seconds. */
  talkDemo: { play: (t) => talkDemoPlay(t) },
});
setTimeout(() => {
  talkDemoDeliver([talkStand().badges()]);   // as the server sends it right after auth
  if (new URLSearchParams(location.search).get('talkhold') !== '1') {
    for (const t of [...new Set(talkStand().script.map((x) => x.t))]) setTimeout(() => talkDemoPlay(t), t * 1000);
  }
}, 0);
// ---- web/js/31-talk-demo-data.js ----
// The talk view's demo data: frames as jui_cli/viz/talk_contract.json says (data only, no code). Read by the demo
// source in place of the server's talk.* frames. Checked by tests/test_viz_talk_demo_data.py.
// eslint-disable-next-line no-unused-vars
const TALK_DEMO = {
 "about": "The talk view's demo data (frames as talk_contract.json says), for the demo page only. Times are ms around base; the page moves them by its own clock (now - base). script: frames that arrive t seconds into the demo.",
 "contractVersion": 2,
 "base": 1792300000000,
 "badges": {
  "type": "talk.badges",
  "counts": {
   "a0": 2
  }
 },
 "lists": {
  "a0": {
   "type": "talk.list",
   "agentId": "a0",
   "items": [
    {
     "id": "t-e7be89fd2788347b",
     "owner": "a0",
     "peer": {
      "key": "4f",
      "agentId": "4f",
      "sessionId": "4f2b0000-0000-4000-8000-00000000004f",
      "name": "jsonui-agents-for-claude-4f-library-orchestrator-for-the-2.3.7-train",
      "kind": "session",
      "alive": true,
      "goneAt": null,
      "removeAt": null
     },
     "lastAt": 1792299520000,
     "preview": "2.3.7 の列車の範囲を決めました。トークの画面が入ります。",
     "lastDir": "in",
     "unread": 1,
     "count": 1
    },
    {
     "id": "t-70adb9b17963bc5a",
     "owner": "a0",
     "peer": {
      "key": "b4",
      "agentId": "b4",
      "sessionId": "b47e0000-0000-4000-8000-0000000000b4",
      "name": "shop-app-signup",
      "kind": "session",
      "alive": true,
      "goneAt": null,
      "removeAt": null
     },
     "lastAt": 1792299400000,
     "preview": "ありがとう。住所の自動入力は次の列車で大丈夫です。",
     "lastDir": "out",
     "unread": 1,
     "count": 4
    },
    {
     "id": "t-56ee3add5d59df3a",
     "owner": "a0",
     "peer": {
      "key": "x:cloud-reviewer",
      "agentId": null,
      "sessionId": null,
      "name": "cloud-reviewer",
      "kind": "external",
      "alive": false,
      "goneAt": 1792298800000,
      "removeAt": 1792302400000
     },
     "lastAt": 1792298800000,
     "preview": "レビューをお願いします（クラウドの相手へ）",
     "lastDir": "out",
     "unread": 0,
     "count": 1
    },
    {
     "id": "t-68f5487e3df0ef59",
     "owner": "a0",
     "peer": {
      "key": "a3",
      "agentId": "a3",
      "sessionId": "a07c0000-0000-4000-8000-0000000000a0",
      "name": "サブエージェント a3（jsonui-define）",
      "kind": "subagent",
      "alive": true,
      "goneAt": null,
      "removeAt": null
     },
     "lastAt": 1792298500000,
     "preview": "足しました。doc_validate_spec は緑です。",
     "lastDir": "in",
     "unread": 0,
     "count": 2
    },
    {
     "id": "t-d74ea5e94db195e1",
     "owner": "a0",
     "peer": {
      "key": "d8",
      "agentId": "d8",
      "sessionId": "d8a50000-0000-4000-8000-0000000000d8",
      "name": "shop-app-payment",
      "kind": "session",
      "alive": false,
      "goneAt": 1792299700000,
      "removeAt": 1792303300000
     },
     "lastAt": 1792297120000,
     "preview": "シミュレーターを待っています。空いたら流します。",
     "lastDir": "in",
     "unread": 0,
     "count": 2
    }
   ],
   "more": false
  },
  "b4": {
   "type": "talk.list",
   "agentId": "b4",
   "items": [
    {
     "id": "t-70adb9b17963bc5a",
     "owner": "b4",
     "peer": {
      "key": "a0",
      "agentId": "a0",
      "sessionId": "a07c0000-0000-4000-8000-0000000000a0",
      "name": "shop-app-main",
      "kind": "session",
      "alive": true,
      "goneAt": null,
      "removeAt": null
     },
     "lastAt": 1792299400000,
     "preview": "ありがとう。住所の自動入力は次の列車で大丈夫です。",
     "lastDir": "in",
     "unread": 0,
     "count": 4
    }
   ],
   "more": false
  },
  "a3": {
   "type": "talk.list",
   "agentId": "a3",
   "items": [
    {
     "id": "t-68f5487e3df0ef59",
     "owner": "a3",
     "peer": {
      "key": "a0",
      "agentId": "a0",
      "sessionId": "a07c0000-0000-4000-8000-0000000000a0",
      "name": "shop-app-main",
      "kind": "session",
      "alive": true,
      "goneAt": null,
      "removeAt": null
     },
     "lastAt": 1792298500000,
     "preview": "足しました。doc_validate_spec は緑です。",
     "lastDir": "out",
     "unread": 0,
     "count": 2
    }
   ],
   "more": false
  },
  "4f": {
   "type": "talk.list",
   "agentId": "4f",
   "items": [
    {
     "id": "t-e7be89fd2788347b",
     "owner": "4f",
     "peer": {
      "key": "a0",
      "agentId": "a0",
      "sessionId": "a07c0000-0000-4000-8000-0000000000a0",
      "name": "shop-app-main",
      "kind": "session",
      "alive": true,
      "goneAt": null,
      "removeAt": null
     },
     "lastAt": 1792299520000,
     "preview": "2.3.7 の列車の範囲を決めました。トークの画面が入ります。",
     "lastDir": "out",
     "unread": 0,
     "count": 1
    }
   ],
   "more": false
  },
  "d8": {
   "type": "talk.list",
   "agentId": "d8",
   "items": [
    {
     "id": "t-d74ea5e94db195e1",
     "owner": "d8",
     "peer": {
      "key": "a0",
      "agentId": "a0",
      "sessionId": "a07c0000-0000-4000-8000-0000000000a0",
      "name": "shop-app-main",
      "kind": "session",
      "alive": true,
      "goneAt": null,
      "removeAt": null
     },
     "lastAt": 1792297120000,
     "preview": "シミュレーターを待っています。空いたら流します。",
     "lastDir": "out",
     "unread": 0,
     "count": 2
    }
   ],
   "more": false
  }
 },
 "messages": {
  "a0 t-70adb9b17963bc5a": {
   "type": "talk.messages",
   "reqId": 0,
   "agentId": "a0",
   "convId": "t-70adb9b17963bc5a",
   "items": [
    {
     "id": "m-demo-0001-0000-4000-8000-000000000000",
     "msgId": "demo-0001-0000-4000-8000-000000000000",
     "convId": "t-70adb9b17963bc5a",
     "dir": "out",
     "fromName": "shop-app-main",
     "toName": "shop-app-signup",
     "at": 1792297480000,
     "deliveredAt": 1792297480800,
     "readAt": 1792297481600,
     "state": "read",
     "text": "会員登録の画面、進み具合はどう？",
     "cut": false,
     "summary": "会員登録の進み具合",
     "seen": "both",
     "via": "session",
     "merged": false
    },
    {
     "id": "m-demo-0002-0000-4000-8000-000000000000",
     "msgId": "demo-0002-0000-4000-8000-000000000000",
     "convId": "t-70adb9b17963bc5a",
     "dir": "in",
     "fromName": "shop-app-signup",
     "toName": "shop-app-main",
     "at": 1792297600000,
     "deliveredAt": 1792297600800,
     "readAt": 1792297601600,
     "state": "read",
     "text": "いま入力の検証を書いています。30 分ほどで出せます。",
     "cut": false,
     "summary": null,
     "seen": "both",
     "via": "session",
     "merged": false
    },
    {
     "id": "m-demo-0003-0000-4000-8000-000000000000",
     "msgId": "demo-0003-0000-4000-8000-000000000000",
     "convId": "t-70adb9b17963bc5a",
     "dir": "in",
     "fromName": "shop-app-signup",
     "toName": "shop-app-main",
     "at": 1792299280000,
     "deliveredAt": 1792299280800,
     "readAt": 1792299281600,
     "state": "read",
     "text": "会員登録の画面を仕上げました。確認してほしい点は次のとおりです。\n\n1. **メールアドレス**の入力欄は、確認用の欄と一致しないとき `送信` を押せないようにしました。\n2. パスワードは 8 文字以上、英字と数字を含むこと。弱いときは赤い文で理由を出します。\n3. 利用規約のリンクは別画面で開きます（戻ると入力は残ります）。\n\nテスト: `jsonui-test run tests/screens/signup` で 14 件すべて通りました。\niOS と Android のスクリーンショットは docs/screens/signup/ に置いてあります。\n<script>alert(1)</script> のような文字列も、そのまま文字として出ること（escape の見本）。\n残り: 住所の自動入力は次の列車で。",
     "cut": false,
     "summary": "会員登録の画面を仕上げた",
     "seen": "both",
     "via": "session",
     "merged": false
    },
    {
     "id": "m-demo-0004-0000-4000-8000-000000000000",
     "msgId": "demo-0004-0000-4000-8000-000000000000",
     "convId": "t-70adb9b17963bc5a",
     "dir": "out",
     "fromName": "shop-app-main",
     "toName": "shop-app-signup",
     "at": 1792299400000,
     "deliveredAt": 1792299400800,
     "readAt": null,
     "state": "delivered",
     "text": "ありがとう。住所の自動入力は次の列車で大丈夫です。",
     "cut": false,
     "summary": null,
     "seen": "both",
     "via": "session",
     "merged": false
    }
   ],
   "more": false
  },
  "a0 t-68f5487e3df0ef59": {
   "type": "talk.messages",
   "reqId": 0,
   "agentId": "a0",
   "convId": "t-68f5487e3df0ef59",
   "items": [
    {
     "id": "u-toolu_demo_0005",
     "msgId": null,
     "convId": "t-68f5487e3df0ef59",
     "dir": "out",
     "fromName": "shop-app-main",
     "toName": "サブエージェント a3（jsonui-define）",
     "at": 1792298200000,
     "deliveredAt": 1792298200800,
     "readAt": 1792298201600,
     "state": "read",
     "text": "signup.spec.json の項目を 3 つ足して、検証を通してください。",
     "cut": false,
     "summary": null,
     "seen": "both",
     "via": "subagent",
     "merged": false
    },
    {
     "id": "u-toolu_demo_0006",
     "msgId": null,
     "convId": "t-68f5487e3df0ef59",
     "dir": "in",
     "fromName": "サブエージェント a3（jsonui-define）",
     "toName": "shop-app-main",
     "at": 1792298500000,
     "deliveredAt": 1792298500800,
     "readAt": 1792298501600,
     "state": "read",
     "text": "足しました。doc_validate_spec は緑です。",
     "cut": false,
     "summary": null,
     "seen": "both",
     "via": "parent",
     "merged": false
    }
   ],
   "more": false
  },
  "a0 t-56ee3add5d59df3a": {
   "type": "talk.messages",
   "reqId": 0,
   "agentId": "a0",
   "convId": "t-56ee3add5d59df3a",
   "items": [
    {
     "id": "u-toolu_demo_0007",
     "msgId": null,
     "convId": "t-56ee3add5d59df3a",
     "dir": "out",
     "fromName": "shop-app-main",
     "toName": "cloud-reviewer",
     "at": 1792298800000,
     "deliveredAt": null,
     "readAt": null,
     "state": "undelivered",
     "text": "レビューをお願いします（クラウドの相手へ）",
     "cut": false,
     "summary": null,
     "seen": "sender",
     "via": "external",
     "merged": false
    }
   ],
   "more": false
  },
  "a0 t-e7be89fd2788347b": {
   "type": "talk.messages",
   "reqId": 0,
   "agentId": "a0",
   "convId": "t-e7be89fd2788347b",
   "items": [
    {
     "id": "m-demo-0008-0000-4000-8000-000000000000",
     "msgId": "demo-0008-0000-4000-8000-000000000000",
     "convId": "t-e7be89fd2788347b",
     "dir": "in",
     "fromName": "jsonui-agents-for-claude-4f-library-orchestrator-for-the-2.3.7-train",
     "toName": "shop-app-main",
     "at": 1792299520000,
     "deliveredAt": 1792299520800,
     "readAt": 1792299521600,
     "state": "read",
     "text": "2.3.7 の列車の範囲を決めました。トークの画面が入ります。",
     "cut": false,
     "summary": "2.3.7 の範囲",
     "seen": "both",
     "via": "session",
     "merged": false
    }
   ],
   "more": false
  },
  "a0 t-d74ea5e94db195e1": {
   "type": "talk.messages",
   "reqId": 0,
   "agentId": "a0",
   "convId": "t-d74ea5e94db195e1",
   "items": [
    {
     "id": "m-demo-0009-0000-4000-8000-000000000000",
     "msgId": "demo-0009-0000-4000-8000-000000000000",
     "convId": "t-d74ea5e94db195e1",
     "dir": "out",
     "fromName": "shop-app-main",
     "toName": "shop-app-payment",
     "at": 1792297000000,
     "deliveredAt": 1792297000800,
     "readAt": 1792297001600,
     "state": "read",
     "text": "決済の画面のテスト、止まっていますか？",
     "cut": false,
     "summary": null,
     "seen": "both",
     "via": "session",
     "merged": false
    },
    {
     "id": "m-demo-0010-0000-4000-8000-000000000000",
     "msgId": "demo-0010-0000-4000-8000-000000000000",
     "convId": "t-d74ea5e94db195e1",
     "dir": "in",
     "fromName": "shop-app-payment",
     "toName": "shop-app-main",
     "at": 1792297120000,
     "deliveredAt": 1792297120800,
     "readAt": 1792297121600,
     "state": "read",
     "text": "シミュレーターを待っています。空いたら流します。",
     "cut": false,
     "summary": null,
     "seen": "both",
     "via": "session",
     "merged": false
    }
   ],
   "more": false
  },
  "b4 t-70adb9b17963bc5a": {
   "type": "talk.messages",
   "reqId": 0,
   "agentId": "b4",
   "convId": "t-70adb9b17963bc5a",
   "items": [
    {
     "id": "m-demo-0001-0000-4000-8000-000000000000",
     "msgId": "demo-0001-0000-4000-8000-000000000000",
     "convId": "t-70adb9b17963bc5a",
     "dir": "in",
     "fromName": "shop-app-main",
     "toName": "shop-app-signup",
     "at": 1792297480000,
     "deliveredAt": 1792297480800,
     "readAt": 1792297481600,
     "state": "read",
     "text": "会員登録の画面、進み具合はどう？",
     "cut": false,
     "summary": "会員登録の進み具合",
     "seen": "both",
     "via": "session",
     "merged": false
    },
    {
     "id": "m-demo-0002-0000-4000-8000-000000000000",
     "msgId": "demo-0002-0000-4000-8000-000000000000",
     "convId": "t-70adb9b17963bc5a",
     "dir": "out",
     "fromName": "shop-app-signup",
     "toName": "shop-app-main",
     "at": 1792297600000,
     "deliveredAt": 1792297600800,
     "readAt": 1792297601600,
     "state": "read",
     "text": "いま入力の検証を書いています。30 分ほどで出せます。",
     "cut": false,
     "summary": null,
     "seen": "both",
     "via": "session",
     "merged": false
    },
    {
     "id": "m-demo-0003-0000-4000-8000-000000000000",
     "msgId": "demo-0003-0000-4000-8000-000000000000",
     "convId": "t-70adb9b17963bc5a",
     "dir": "out",
     "fromName": "shop-app-signup",
     "toName": "shop-app-main",
     "at": 1792299280000,
     "deliveredAt": 1792299280800,
     "readAt": 1792299281600,
     "state": "read",
     "text": "会員登録の画面を仕上げました。確認してほしい点は次のとおりです。\n\n1. **メールアドレス**の入力欄は、確認用の欄と一致しないとき `送信` を押せないようにしました。\n2. パスワードは 8 文字以上、英字と数字を含むこと。弱いときは赤い文で理由を出します。\n3. 利用規約のリンクは別画面で開きます（戻ると入力は残ります）。\n\nテスト: `jsonui-test run tests/screens/signup` で 14 件すべて通りました。\niOS と Android のスクリーンショットは docs/screens/signup/ に置いてあります。\n<script>alert(1)</script> のような文字列も、そのまま文字として出ること（escape の見本）。\n残り: 住所の自動入力は次の列車で。",
     "cut": false,
     "summary": "会員登録の画面を仕上げた",
     "seen": "both",
     "via": "session",
     "merged": false
    },
    {
     "id": "m-demo-0004-0000-4000-8000-000000000000",
     "msgId": "demo-0004-0000-4000-8000-000000000000",
     "convId": "t-70adb9b17963bc5a",
     "dir": "in",
     "fromName": "shop-app-main",
     "toName": "shop-app-signup",
     "at": 1792299400000,
     "deliveredAt": 1792299400800,
     "readAt": null,
     "state": "delivered",
     "text": "ありがとう。住所の自動入力は次の列車で大丈夫です。",
     "cut": false,
     "summary": null,
     "seen": "both",
     "via": "session",
     "merged": false
    }
   ],
   "more": false
  },
  "a3 t-68f5487e3df0ef59": {
   "type": "talk.messages",
   "reqId": 0,
   "agentId": "a3",
   "convId": "t-68f5487e3df0ef59",
   "items": [
    {
     "id": "u-toolu_demo_0005",
     "msgId": null,
     "convId": "t-68f5487e3df0ef59",
     "dir": "in",
     "fromName": "shop-app-main",
     "toName": "サブエージェント a3（jsonui-define）",
     "at": 1792298200000,
     "deliveredAt": 1792298200800,
     "readAt": 1792298201600,
     "state": "read",
     "text": "signup.spec.json の項目を 3 つ足して、検証を通してください。",
     "cut": false,
     "summary": null,
     "seen": "both",
     "via": "subagent",
     "merged": false
    },
    {
     "id": "u-toolu_demo_0006",
     "msgId": null,
     "convId": "t-68f5487e3df0ef59",
     "dir": "out",
     "fromName": "サブエージェント a3（jsonui-define）",
     "toName": "shop-app-main",
     "at": 1792298500000,
     "deliveredAt": 1792298500800,
     "readAt": 1792298501600,
     "state": "read",
     "text": "足しました。doc_validate_spec は緑です。",
     "cut": false,
     "summary": null,
     "seen": "both",
     "via": "parent",
     "merged": false
    }
   ],
   "more": false
  },
  "4f t-e7be89fd2788347b": {
   "type": "talk.messages",
   "reqId": 0,
   "agentId": "4f",
   "convId": "t-e7be89fd2788347b",
   "items": [
    {
     "id": "m-demo-0008-0000-4000-8000-000000000000",
     "msgId": "demo-0008-0000-4000-8000-000000000000",
     "convId": "t-e7be89fd2788347b",
     "dir": "out",
     "fromName": "jsonui-agents-for-claude-4f-library-orchestrator-for-the-2.3.7-train",
     "toName": "shop-app-main",
     "at": 1792299520000,
     "deliveredAt": 1792299520800,
     "readAt": 1792299521600,
     "state": "read",
     "text": "2.3.7 の列車の範囲を決めました。トークの画面が入ります。",
     "cut": false,
     "summary": "2.3.7 の範囲",
     "seen": "both",
     "via": "session",
     "merged": false
    }
   ],
   "more": false
  },
  "d8 t-d74ea5e94db195e1": {
   "type": "talk.messages",
   "reqId": 0,
   "agentId": "d8",
   "convId": "t-d74ea5e94db195e1",
   "items": [
    {
     "id": "m-demo-0009-0000-4000-8000-000000000000",
     "msgId": "demo-0009-0000-4000-8000-000000000000",
     "convId": "t-d74ea5e94db195e1",
     "dir": "in",
     "fromName": "shop-app-main",
     "toName": "shop-app-payment",
     "at": 1792297000000,
     "deliveredAt": 1792297000800,
     "readAt": 1792297001600,
     "state": "read",
     "text": "決済の画面のテスト、止まっていますか？",
     "cut": false,
     "summary": null,
     "seen": "both",
     "via": "session",
     "merged": false
    },
    {
     "id": "m-demo-0010-0000-4000-8000-000000000000",
     "msgId": "demo-0010-0000-4000-8000-000000000000",
     "convId": "t-d74ea5e94db195e1",
     "dir": "out",
     "fromName": "shop-app-payment",
     "toName": "shop-app-main",
     "at": 1792297120000,
     "deliveredAt": 1792297120800,
     "readAt": 1792297121600,
     "state": "read",
     "text": "シミュレーターを待っています。空いたら流します。",
     "cut": false,
     "summary": null,
     "seen": "both",
     "via": "session",
     "merged": false
    }
   ],
   "more": false
  }
 },
 "script": [
  {
   "t": 20,
   "frame": {
    "type": "talk.update",
    "agentId": "a0",
    "ops": [
     {
      "op": "message",
      "convId": "t-70adb9b17963bc5a",
      "message": {
       "id": "m-demo-0011-0000-4000-8000-000000000000",
       "msgId": "demo-0011-0000-4000-8000-000000000000",
       "convId": "t-70adb9b17963bc5a",
       "dir": "in",
       "fromName": "shop-app-signup",
       "toName": "shop-app-main",
       "at": 1792300020000,
       "deliveredAt": 1792300020700,
       "readAt": null,
       "state": "delivered",
       "text": "スクリーンショットを差し替えました。もう一度見てください。",
       "cut": false,
       "summary": "差し替え",
       "seen": "both",
       "via": "session",
       "merged": false
      }
     },
     {
      "op": "conv",
      "conv": {
       "id": "t-70adb9b17963bc5a",
       "owner": "a0",
       "peer": {
        "key": "b4",
        "agentId": "b4",
        "sessionId": "b47e0000-0000-4000-8000-0000000000b4",
        "name": "shop-app-signup",
        "kind": "session",
        "alive": true,
        "goneAt": null,
        "removeAt": null
       },
       "lastAt": 1792300020000,
       "preview": "スクリーンショットを差し替えました。もう一度見てください。",
       "lastDir": "in",
       "unread": 2,
       "count": 5
      }
     }
    ]
   }
  },
  {
   "t": 20,
   "frame": {
    "type": "talk.badges",
    "counts": {
     "a0": 3
    }
   }
  },
  {
   "t": 30,
   "frame": {
    "type": "talk.update",
    "agentId": "a0",
    "ops": [
     {
      "op": "message",
      "convId": "t-70adb9b17963bc5a",
      "message": {
       "id": "m-demo-0004-0000-4000-8000-000000000000",
       "msgId": "demo-0004-0000-4000-8000-000000000000",
       "convId": "t-70adb9b17963bc5a",
       "dir": "out",
       "fromName": "shop-app-main",
       "toName": "shop-app-signup",
       "at": 1792299400000,
       "deliveredAt": 1792299400800,
       "readAt": 1792300030000,
       "state": "read",
       "text": "ありがとう。住所の自動入力は次の列車で大丈夫です。",
       "cut": false,
       "summary": null,
       "seen": "both",
       "via": "session",
       "merged": false
      }
     }
    ]
   }
  },
  {
   "t": 45,
   "frame": {
    "type": "talk.update",
    "agentId": "a0",
    "ops": [
     {
      "op": "remove",
      "convId": "t-d74ea5e94db195e1",
      "reason": "peer-ended"
     }
    ]
   }
  }
 ]
};
// ---- web/js/40-scene.js ----

/* ---------- 3D office ---------- */
let has3D = true;
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (err) {
  has3D = false;
  sceneEl.insertAdjacentHTML('beforeend', '<p class="nogl">この環境では WebGL を使えないため 3D 表示を出せません。右のパネルとイベント欄はそのまま動きます。</p>');
}
let latestModel = computeModel(START_AT);
let scene, camera, controls;
const robots = [];
const roomMats = [];
const roomTags = [];
const links = {};
let sbCanvas, sbTex, tbCanvas, tbTex, kbCanvas, kbTex, standMat, standOffTex, boardMesh, kbMesh, trayGroup, selRing, trayPending = [], trayDone = [], trayTag;

/* The shop-app spec board: one tile per screen spec of that project, seven section bars per tile. */
const SHOP_IDX = SPECS.map((s, i) => [s, i]).filter(([s]) => s.project === 'shop').map(([, i]) => i);
const SHOP_POS = Object.fromEntries(SHOP_IDX.map((i, pos) => [i, pos]));
const SB = { cx: -4.0, cy: 2.55, z: -4.98, w: 6.8, h: 2.3, W: 2048, H: 693, pad: 22, gap: 14, top: 76, cols: 6, segGap: 6 };
SB.rows = Math.ceil(SHOP_IDX.length / SB.cols);
SB.tw = (SB.W - SB.pad * 2 - SB.gap * (SB.cols - 1)) / SB.cols;
SB.th = (SB.H - SB.top - SB.pad - SB.gap * (SB.rows - 1)) / SB.rows;
SB.segW = (SB.tw - 36 - SB.segGap * 6) / 7;
const sbTile = (i) => ({ x: SB.pad + (i % SB.cols) * (SB.tw + SB.gap), y: SB.top + Math.floor(i / SB.cols) * (SB.th + SB.gap) });
/* Tile layouts: the big tiles of the shop-app board and the smaller ones on the other rooms' boards. */
const SBG = { pad: 18, name: 30, nameY: 46, status: 19, statusY: 80, segH: 20, segBottom: 18, segGap: 6, pillW: 66, pillH: 36, pillFont: 24 };
const PBG = { pad: 14, name: 24, nameY: 36, status: 16, statusY: 62, segH: 16, segBottom: 13, segGap: 5, pillW: 54, pillH: 28, pillFont: 19 };
const segW = (w, g) => (w - g.pad * 2 - g.segGap * 6) / 7;
function tileFocus(x, y, w, h, g, k) {
  const sw = segW(w, g);
  return k >= 0 ? [x + g.pad + k * (sw + g.segGap) + sw / 2, y + h - g.segBottom - g.segH / 2] : [x + w / 2, y + g.nameY - 10];
}
function sbFocus(pos, k) { const p = sbTile(pos); return tileFocus(p.x, p.y, SB.tw, SB.th, SBG, k); }
/* The other project rooms: a wall board in jsonui-cli/, an easel in JsonUIDocument/. */
const PBOARDS = [
  { project: 'cli', W: 1024, H: 560, w: 3.4, h: 1.86, wall: { cx: 6.6, cy: 2.35, z: -4.98 } },
  { project: 'doc', W: 1024, H: 720, w: 2.15, h: 1.51, easel: { x: 4.35, z: 1.2, ry: 0.42, bottom: 0.95 } },
].map((pb) => ({ ...pb, specs: SPECS.map((s, i) => [s, i]).filter(([s]) => s.project === pb.project).map(([, i]) => i), tiles: [], splitY: 0 }));
const PBOARD = Object.fromEntries(PBOARDS.map((pb) => [pb.project, pb]));
const pbPoint = (pb, px, py) => pb.mesh.localToWorld(new THREE.Vector3((px / pb.W - 0.5) * pb.w, (0.5 - py / pb.H) * pb.h, 0.03));
const TB = { x: -9.57, cy: 2.05, cz: 1.5, w: 2.6, h: 2.08, W: 1024, H: 820 };
const tbRowTop = (i) => 186 + i * 78;
const TB_DEMO = TB;
/* The task board: a cork board beside the spec board, one column per task state. */
const KB = { cx: 1.12, cy: 2.55, z: -4.98, w: 2.8, h: 2.3, W: 1024, H: 842 };

function sbPoint(px, py) { return new THREE.Vector3(SB.cx + (px / SB.W - 0.5) * SB.w, SB.cy + (0.5 - py / SB.H) * SB.h, SB.z + 0.03); }
function tbPoint(px, py) { return new THREE.Vector3(TB.x + 0.03, TB.cy + (0.5 - py / TB.H) * TB.h, TB.cz - (px / TB.W - 0.5) * TB.w); }

/* Status chip colours on the boards, for the light and the dark theme. */
const ST_STYLE = {
  light: { idle: ['#e3eaf4', '#4b5c76'], write: ['#ebe5fd', '#5a3fd0'], written: ['#e3eaf4', '#33445e'], impl: ['#dde8fb', '#2a62c9'], verify: ['#fff0d1', '#8a5800'], 'impl-done': ['#e1f1ef', '#22706a'], paused: ['#f3ede2', '#7a5a14'], test: ['#dcf3e5', '#1d8f4e'], done: ['#dcf3e5', '#1d8f4e'] },
  dark: { idle: ['#1b2c45', '#9fb1cb'], write: ['#2a2154', '#c5b8ff'], written: ['#1b2c45', '#c9d6e8'], impl: ['#15305a', '#9cc4ff'], verify: ['#3a2b0c', '#ffc65c'], 'impl-done': ['#123733', '#6fd6c8'], paused: ['#33291a', '#e8c98a'], test: ['#123a2a', '#5ad893'], done: ['#123a2a', '#5ad893'] },
};
const BOARD = {
  light: { bg: '#16304f', grid: 'rgba(160, 200, 255, 0.07)', title: '#ffffff', sub: '#9fc3ff', tile: '#f7f9fc', done: '#eaf6ef', todo: 'rgba(255, 255, 255, 0.06)', todoLine: 'rgba(190, 210, 240, 0.5)', todoInk: '#a9bdd6', ink: '#13233a', base: '#a9b8cc', empty: '#b4c0d0', violet: '#6b4ce6', violetBg: '#e2d9fd', blue: '#2f74e0', green: '#22a35a' },
  dark: { bg: '#0b1828', grid: 'rgba(160, 200, 255, 0.045)', title: '#e4ecf8', sub: '#86b8ff', tile: '#17273e', done: '#132d22', todo: 'rgba(255, 255, 255, 0.03)', todoLine: 'rgba(120, 150, 190, 0.45)', todoInk: '#6c809c', ink: '#e4ecf8', base: '#40536f', empty: '#4a5d79', violet: '#b3a1ff', violetBg: '#2e2560', blue: '#6aa5ff', green: '#5ad893' },
};
const KB_PAL = {
  light: { cork: '#c99a62', speck: 'rgba(90, 55, 20, 0.16)', title: '#3b2410', sub: '#5c3d1e', col: 'rgba(255, 248, 236, 0.32)', ink: '#1f2a37', soft: '#55606f', pin: '#d62839', warn: '#e08a00', warnInk: '#2a1a00', note: { todo: '#fff3bf', wait: '#ffd8b5', doing: '#d5e5ff', done: '#d6f0df' }, head: { todo: '#8a6d1f', wait: '#b4561b', doing: '#2a62c9', done: '#1d8f4e' } },
  dark: { cork: '#47331f', speck: 'rgba(0, 0, 0, 0.22)', title: '#f3e6d4', sub: '#d8c3a6', col: 'rgba(0, 0, 0, 0.2)', ink: '#eef2f8', soft: '#b9c6d8', pin: '#ff6b78', warn: '#ffb020', warnInk: '#2a1a00', note: { todo: '#4a4222', wait: '#4e3322', doing: '#1f375c', done: '#1b3f2e' }, head: { todo: '#e6c766', wait: '#ffab73', doing: '#86b8ff', done: '#5ad893' } },
};

function fitText(ctx, text, x, y, maxW) {
  let s = String(text);
  if (ctx.measureText(s).width <= maxW) { ctx.fillText(s, x, y); return; }
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxW) s = s.slice(0, -1);
  ctx.fillText(`${s}…`, x, y);
}
function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
  const chars = [...String(text)];
  let line = '', n = 0;
  for (let i = 0; i < chars.length; i++) {
    if (line && ctx.measureText(line + chars[i]).width > maxW) {
      if (n === maxLines - 1) { fitText(ctx, line + chars.slice(i).join(''), x, y + n * lineH, maxW); return; }
      ctx.fillText(line, x, y + n * lineH); n++; line = chars[i];
    } else line += chars[i];
  }
  if (line) ctx.fillText(line, x, y + n * lineH);
}

function drawSpecBoard(model, now) {
  const dark = isDark(), P = BOARD[dark ? 'dark' : 'light'], ST = ST_STYLE[dark ? 'dark' : 'light'];
  const ctx = sbCanvas.getContext('2d');
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, SB.W, SB.H);
  ctx.fillStyle = P.grid;
  for (let x = 0; x < SB.W; x += 32) ctx.fillRect(x, 0, 1, SB.H);
  for (let y = 0; y < SB.H; y += 32) ctx.fillRect(0, y, SB.W, 1);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = P.title; ctx.font = `36px ${FONT_DISPLAY}`; ctx.fillText('spec ボード', SB.pad + 4, 52);
  const shop = SHOP_IDX.map((i) => model.specs[i]), c = bucketCounts(shop);
  ctx.fillStyle = P.sub; ctx.font = `700 24px ${FONT_BODY}`;
  ctx.fillText(`shop-app/ · 全 ${shop.length} 画面 · 作業中 ${c.live} · 途中 ${c.partial} · 未着手 ${c.todo} · 完了 ${c.done}`, SB.pad + 250, 50);
  ctx.font = `700 20px ${FONT_BODY}`;
  let lx = SB.W - SB.pad;
  for (const [label, color] of [['テスト済み', P.green], ['実装済み', P.blue], ['記入済み', P.base], ['書き込み中', P.violet]]) {
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = P.sub; ctx.fillText(label, lx - tw, 49);
    lx -= tw + 26; rr(ctx, lx, 33, 18, 18, 4); ctx.fillStyle = color; ctx.fill(); lx -= 28;
  }
  SHOP_IDX.forEach((i, pos) => { const t = sbTile(pos); drawSpecTile(ctx, P, ST, model.specs[i], t.x, t.y, SB.tw, SB.th, now, SBG); });
  sbTex.needsUpdate = true;
}
/* A role's pill on a canvas (the spec board's tiles, the task board's notes): pillBg / pillInk, as the HTML pills. */
function drawRolePill(ctx, role, label, x, y, w, h, font, baseline) {
  rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = pillBg(role); ctx.fill();
  ctx.fillStyle = pillInk(role); ctx.font = `700 ${font}px ${FONT_MONO}`; ctx.textAlign = 'center'; ctx.fillText(label, x + w / 2, y + baseline); ctx.textAlign = 'left';
}
function drawSpecTile(ctx, P, ST, s, x, y, w, h, now, g) {
  const todo = s.bucket === 'todo', role = s.by ? DEF[s.by].role : null, sw = segW(w, g);
  rr(ctx, x, y, w, h, 14);
  ctx.fillStyle = todo ? P.todo : s.bucket === 'done' ? P.done : P.tile; ctx.fill();
  if (todo) { ctx.setLineDash([10, 8]); ctx.lineWidth = 2.5; ctx.strokeStyle = P.todoLine; ctx.stroke(); ctx.setLineDash([]); }
  if (role) { rr(ctx, x + 3, y + 3, w - 6, h - 6, 12); ctx.lineWidth = 6; ctx.strokeStyle = ROLES[role].color; ctx.stroke(); }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = todo ? P.todoInk : P.ink; ctx.font = `${g.name}px ${FONT_DISPLAY}`;
  fitText(ctx, s.name, x + g.pad, y + g.nameY, w - g.pad * 2 - (role ? g.pillW + 8 : 0));
  if (role) {
    const px = x + w - g.pad - g.pillW, py = y + g.nameY - g.pillH + 6;
    drawRolePill(ctx, role, s.by, px, py, g.pillW, g.pillH, g.pillFont, g.pillH * 0.72);
  }
  ctx.font = `700 ${g.status}px ${FONT_BODY}`; ctx.fillStyle = todo ? P.todoInk : ST[s.status.kind][1];
  fitText(ctx, s.status.text, x + g.pad, y + g.statusY, w - g.pad * 2);
  const act = role ? activeSec(s) : -1, sy = y + h - g.segBottom - g.segH;
  for (let k = 0; k < 7; k++) {
    const st = secState(s, k), sx = x + g.pad + k * (sw + g.segGap);
    rr(ctx, sx, sy, sw, g.segH, 5);
    if (st.kind === 'empty') { ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.strokeStyle = todo ? P.todoLine : P.empty; ctx.stroke(); ctx.setLineDash([]); }
    else {
      ctx.fillStyle = st.kind === 'writing' ? P.violetBg : P.base; ctx.fill();
      const fill = { writing: P.violet, impl: P.blue, done: P.blue, test: P.green, tested: P.green }[st.kind];
      if (fill && st.f > 0) { ctx.save(); ctx.clip(); ctx.fillStyle = fill; ctx.fillRect(sx, sy, sw * st.f, g.segH); ctx.restore(); }
    }
    if (k === act) {
      rr(ctx, sx - 4, sy - 4, sw + 8, g.segH + 8, 8); ctx.lineWidth = 3.5; ctx.strokeStyle = ROLES[role].color; ctx.stroke();
      if (st.kind === 'writing' && Math.floor(now * 2.5) % 2 === 0) { ctx.fillStyle = P.violet; ctx.fillRect(sx + sw * st.f + 1, sy - 6, 3, g.segH + 12); }
    }
  }
}
/* A project room's own board: its specs (when it has screens) above, its task counts below. */
function drawProjectBoard(pb, model, now) {
  const dark = isDark(), P = BOARD[dark ? 'dark' : 'light'], ST = ST_STYLE[dark ? 'dark' : 'light'], K = KB_PAL[dark ? 'dark' : 'light'];
  const ctx = pb.canvas.getContext('2d'), { W, H } = pb, proj = PROJECT[pb.project];
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = P.grid;
  for (let x = 0; x < W; x += 32) ctx.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += 32) ctx.fillRect(0, y, W, 1);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = P.title; ctx.font = `38px ${FONT_DISPLAY}`; fitText(ctx, proj.name, 28, 58, W - 260);
  ctx.fillStyle = P.sub; ctx.font = `600 19px ${FONT_MONO}`; ctx.fillText(proj.path, 30, 88);
  const pend = model.pending.filter((p) => projectOfRobot(p.who) === pb.project).length;
  if (pend) {
    const label = `許可待ち ${pend}`;
    ctx.font = `700 24px ${FONT_BODY}`;
    const w = ctx.measureText(label).width + 36;
    rr(ctx, W - 24 - w, 28, w, 42, 21); ctx.fillStyle = K.warn; ctx.fill();
    ctx.fillStyle = K.warnInk; ctx.fillText(label, W - 24 - w + 18, 57);
  }
  let y = 104;
  pb.tiles = [];
  if (pb.specs.length) {
    const specs = pb.specs.map((i) => model.specs[i]), c = bucketCounts(specs);
    ctx.fillStyle = P.sub; ctx.font = `700 20px ${FONT_BODY}`;
    ctx.fillText(`spec ${specs.length} 画面 · 作業中 ${c.live} · 途中 ${c.partial} · 未着手 ${c.todo} · 完了 ${c.done}`, 30, y + 20);
    const cols = 3, gap = 12, tw = (W - 56 - gap * (cols - 1)) / cols, th = 104;
    pb.specs.forEach((i, k) => {
      const x = 28 + (k % cols) * (tw + gap), ty = y + 34 + Math.floor(k / cols) * (th + gap);
      drawSpecTile(ctx, P, ST, model.specs[i], x, ty, tw, th, now, PBG);
      pb.tiles.push({ i, x, y: ty, w: tw, h: th });
    });
    y += 34 + Math.ceil(pb.specs.length / cols) * (th + gap);
  }
  pb.splitY = y;
  const tasks = model.tasks.filter((x) => PROJECT_OF[x.list] === pb.project);
  ctx.fillStyle = P.title; ctx.font = `700 23px ${FONT_BODY}`; ctx.fillText(`タスク ${tasks.length} 件`, 30, y + 34);
  const bw = (W - 56 - 3 * 12) / 4, by = y + 48, bh = 78;
  KCOLS.forEach(([col, label], c) => {
    const x = 28 + c * (bw + 12), n = tasks.filter((t) => t.col === col).length;
    rr(ctx, x, by, bw, bh, 10); ctx.fillStyle = K.note[col]; ctx.fill();
    ctx.fillStyle = K.ink; ctx.font = `700 20px ${FONT_BODY}`; ctx.fillText(label, x + 14, by + 32);
    ctx.fillStyle = K.head[col]; ctx.font = `700 34px ${FONT_MONO}`; ctx.textAlign = 'right'; ctx.fillText(String(n), x + bw - 14, by + 62); ctx.textAlign = 'left';
  });
  if (!pb.specs.length) {
    const open = tasks.filter((t) => t.col !== 'done').sort((a, b) => ['doing', 'wait', 'todo'].indexOf(a.col) - ['doing', 'wait', 'todo'].indexOf(b.col));
    open.slice(0, 3).forEach((t, k) => {
      const ly = by + bh + 26 + k * 40;
      ctx.fillStyle = K.head[t.col]; ctx.beginPath(); ctx.arc(40, ly - 7, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.title; ctx.font = `700 20px ${FONT_BODY}`; fitText(ctx, `${t.list} ${taskRef(t)} ${t.subject}${t.perm ? '（許可待ち）' : ''}`, 58, ly, W - 90);
    });
    const note = SOURCE.mode === 'demo' ? '画面の spec はない（CLI ツール）' : proj.jsonui ? 'spec はまだ無い' : 'JsonUI のプロジェクトではない（spec なし）';
    ctx.fillStyle = P.sub; ctx.font = `600 18px ${FONT_BODY}`; ctx.fillText(note, 30, H - 22);
  }
  pb.tex.needsUpdate = true;
}

function drawTaskBoard(full, project = 'shop', board = null) {
  const tasks = full.tasks.filter((x) => PROJECT_OF[x.list] === project);
  const model = { tasks, pending: full.pending.filter((p) => projectOfRobot(p.who) === project) };
  const B = board || KB, cv = board ? board.canvas : kbCanvas, tx = board ? board.tex : kbTex;
  const P = KB_PAL[isDark() ? 'dark' : 'light'], ctx = cv.getContext('2d');
  ctx.fillStyle = P.cork; ctx.fillRect(0, 0, B.W, B.H);
  ctx.fillStyle = P.speck;
  for (let i = 0; i < 520; i++) ctx.fillRect((i * 97.31) % B.W, (i * 61.7 + (i % 7) * 13) % B.H, 3, 2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = P.title; ctx.font = `40px ${FONT_DISPLAY}`; ctx.fillText('タスクボード', 26, 58);
  ctx.fillStyle = P.sub; ctx.font = `700 21px ${FONT_BODY}`;
  ctx.fillText(`${PROJECT[project].name} · ${model.tasks.length} 件 · ${new Set(model.tasks.map((x) => x.list)).size} セッションの一覧`, 30, 92);
  if (model.pending.length) {
    const label = `許可待ち ${model.pending.length}`;
    ctx.font = `700 24px ${FONT_BODY}`;
    const w = ctx.measureText(label).width + 36;
    rr(ctx, B.W - 24 - w, 30, w, 42, 21); ctx.fillStyle = P.warn; ctx.fill();
    ctx.fillStyle = P.warnInk; ctx.fillText(label, B.W - 24 - w + 18, 59);
  }
  const colW = (B.W - 24 * 2 - 12 * 3) / 4, top = 112, noteH = 76, gap = 8, maxN = Math.floor((B.H - top - 92) / (noteH + gap));
  KCOLS.forEach(([col, label], c) => {
    const x = 24 + c * (colW + 12), items = model.tasks.filter((t) => t.col === col);
    rr(ctx, x, top, colW, B.H - top - 18, 10); ctx.fillStyle = P.col; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = P.head[col]; ctx.fillRect(x, top, colW, 7); ctx.restore();
    ctx.fillStyle = P.title; ctx.font = `700 24px ${FONT_BODY}`; ctx.fillText(label, x + 12, top + 40);
    ctx.fillStyle = P.head[col]; ctx.font = `700 26px ${FONT_MONO}`; ctx.textAlign = 'right'; ctx.fillText(String(items.length), x + colW - 12, top + 41); ctx.textAlign = 'left';
    items.slice(0, maxN).forEach((task, j) => {
      const nx = x + 8, nw = colW - 16, ny = top + 58 + j * (noteH + gap);
      ctx.save();
      ctx.translate(nx + nw / 2, ny + noteH / 2); ctx.rotate((((task.id * 37 + c * 11) % 5) - 2) * 0.007); ctx.translate(-(nx + nw / 2), -(ny + noteH / 2));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)'; ctx.fillRect(nx + 2, ny + 3, nw, noteH);
      ctx.fillStyle = P.note[col]; ctx.fillRect(nx, ny, nw, noteH);
      if (isTurn(task)) { ctx.fillStyle = task.failed ? P.warn : P.head[col]; ctx.fillRect(nx, ny, 7, noteH); }   // a turn: a stripe down its left edge
      if (task.perm) { ctx.lineWidth = 6; ctx.strokeStyle = P.warn; ctx.strokeRect(nx - 2, ny - 2, nw + 4, noteH + 4); }
      ctx.fillStyle = P.pin; ctx.beginPath(); ctx.arc(nx + nw / 2, ny + 7, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.soft; ctx.font = `700 15px ${FONT_MONO}`; ctx.fillText(`${task.list} ${taskRef(task)}`, nx + (isTurn(task) ? 14 : 10), ny + 25);
      if (task.perm) {
        rr(ctx, nx + nw - 76, ny + 9, 66, 24, 12); ctx.fillStyle = P.warn; ctx.fill();
        ctx.fillStyle = P.warnInk; ctx.font = `700 14px ${FONT_BODY}`; ctx.textAlign = 'center'; ctx.fillText('許可待ち', nx + nw - 43, ny + 26); ctx.textAlign = 'left';
      } else if (task.owner) {
        const role = DEF[task.owner].role;
        drawRolePill(ctx, role, task.owner, nx + nw - 50, ny + 11, 40, 20, 13, 15);
      }
      ctx.fillStyle = P.ink; ctx.font = `700 16px ${FONT_BODY}`;
      wrapText(ctx, task.subject, nx + 10, ny + 49, nw - 20, 20, 2);
      ctx.restore();
    });
    if (items.length > maxN) { ctx.fillStyle = P.title; ctx.font = `700 17px ${FONT_BODY}`; ctx.fillText(`ほか ${items.length - maxN} 件`, x + 12, B.H - 34); }
  });
  tx.needsUpdate = true;
}

function drawTestBoard(model, board = null, run = null) {
  const T = run || model.tests, TB = board || TB_DEMO, ctx = (board ? board.canvas : tbCanvas).getContext('2d');
  const nCases = Math.max(1, T.rows.length), maxRows = Math.floor((TB.H - 186) / 78);
  ctx.fillStyle = '#102640'; ctx.fillRect(0, 0, TB.W, TB.H);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff'; ctx.font = `40px ${FONT_DISPLAY}`; ctx.fillText('テスト実行', 36, 62);
  ctx.fillStyle = '#9fc3ff'; ctx.font = `600 21px ${FONT_MONO}`; ctx.fillText(`${T.file} · ${T.device}`, 36, 98);
  ctx.fillStyle = '#d6e4f7'; ctx.font = `700 23px ${FONT_BODY}`; ctx.fillText(T.statusText, 36, 134);
  const bx = 36, bw = TB.W - 72, by = 150;
  rr(ctx, bx, by, bw, 14, 7); ctx.fillStyle = '#23405f'; ctx.fill();
  const pw = (bw * T.passed) / nCases;
  if (pw > 0) { rr(ctx, bx, by, Math.max(14, pw), 14, 7); ctx.fillStyle = '#4fd48a'; ctx.fill(); }
  if (T.runningIdx >= 0) { ctx.fillStyle = T.retrying ? '#ffc14d' : '#7ab4ff'; ctx.fillRect(bx + pw, by, bw / nCases, 14); }
  // a long run: the window of rows around the one running
  const first = T.rows.length > maxRows ? Math.max(0, Math.min(T.rows.length - maxRows, (T.runningIdx >= 0 ? T.runningIdx : T.rows.length) - Math.floor(maxRows / 2))) : 0;
  T.rows.slice(first, first + maxRows).forEach((c, j) => {
    const i = first + j;
    const y = tbRowTop(j);
    if (c.status === 'running') { rr(ctx, 20, y, TB.W - 40, 72, 12); ctx.fillStyle = T.retrying ? '#4a3a12' : '#1f4f8a'; ctx.fill(); }
    const icon = { pending: '○', running: '▶', passed: '✓', flaky: '⚠', failed: '✗', skipped: '–' }[c.status];
    ctx.fillStyle = { pending: '#6f87a6', running: '#ffffff', passed: '#4fd48a', flaky: '#ffc14d', failed: '#ff7a85', skipped: '#8aa0bd' }[c.status];
    ctx.font = `700 28px ${FONT_MONO}`; ctx.fillText(icon, 36, y + 36);
    ctx.fillStyle = c.status === 'pending' ? '#8aa0bd' : '#ffffff'; ctx.font = `700 25px ${FONT_BODY}`; ctx.fillText(`${i + 1}. ${c.name}`, 80, y + 34);
    ctx.font = `500 18px ${FONT_MONO}`;
    if (c.status === 'running') { ctx.fillStyle = '#7ef9ff'; ctx.fillText(`${c.attempt > 1 ? '再実行 2 回目 · ' : ''}${c.step}`, 80, y + 62); }
    else if (c.branch) { ctx.fillStyle = '#8fa6c4'; ctx.fillText(`分岐: ${c.branch}${c.status === 'flaky' ? ' · 再実行で通過' : ''}`, 80, y + 62); }
  });
  if (!T.rows.length && T.command) { ctx.fillStyle = '#8fa6c4'; ctx.font = `500 20px ${FONT_MONO}`; wrapText(ctx, T.command, 36, 220, TB.W - 72, 28, 6); }
  (board ? board.tex : tbTex).needsUpdate = true;
}

function drawCartUI(r, t) {
  const c = r.phoneCanvas, ctx = c.getContext('2d'), W = c.width;
  const accent = pillBg(r.role), ink = pillInk(r.role);   // the header and the button carry text
  const T = latestModel.tests, idx = T.runningIdx, step = idx >= 0 ? T.rows[idx].step : '';
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1d2330'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(44, 360); ctx.lineTo(16, 396); ctx.lineTo(84, 362); ctx.closePath(); ctx.fill(); ctx.stroke();
  rr(ctx, 6, 6, W - 12, 360, 28); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(48, 355); ctx.lineTo(25, 387); ctx.lineTo(79, 358); ctx.closePath(); ctx.fill();
  const sx = 24, sy = 24, sw = 192, sh = 320;
  ctx.save();
  rr(ctx, sx, sy, sw, sh, 18); ctx.clip();
  ctx.fillStyle = '#f1f4f9'; ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = accent; ctx.fillRect(sx, sy, sw, 58);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = ink; ctx.font = `700 11px ${FONT_MONO}`; ctx.fillText('9:41', sx + 12, sy + 16);
  ctx.font = `700 18px ${FONT_BODY}`; ctx.fillText(idx === 6 && step.includes('screen') ? 'ログイン' : 'カート', sx + 14, sy + 46);
  const empty = idx === 2;
  const items = empty ? 0 : idx === 1 && step.includes('count') ? 2 : 3;
  if (empty) {
    ctx.fillStyle = '#7a879b'; ctx.font = `700 14px ${FONT_BODY}`; ctx.textAlign = 'center'; ctx.fillText('カートは空です', sx + sw / 2, sy + 130); ctx.textAlign = 'left';
  }
  for (let i = 0; i < items; i++) {
    const y = sy + 70 + i * 50;
    rr(ctx, sx + 10, y, sw - 20, 42, 8); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.fillStyle = ['#ffd6a5', '#cde7ff', '#d8f5c9'][i]; rr(ctx, sx + 16, y + 6, 30, 30, 6); ctx.fill();
    ctx.fillStyle = '#394150'; ctx.fillRect(sx + 54, y + 10, 70 - i * 10, 7);
    ctx.fillStyle = '#7a879b'; ctx.fillRect(sx + 54, y + 24, 40, 6);
    ctx.fillStyle = '#394150'; ctx.font = `700 12px ${FONT_MONO}`; ctx.fillText(`×${i === 0 && idx === 1 && !step.includes('count') ? 0 : 1}`, sx + sw - 42, y + 27);
    if (idx === 5 && i === 1) { ctx.fillStyle = '#c62f3c'; ctx.font = `700 10px ${FONT_BODY}`; ctx.fillText('在庫切れ', sx + 54, y + 38); }
  }
  const cy = sy + 226;
  rr(ctx, sx + 10, cy, sw - 20, 26, 6); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#cfd8e6'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#394150'; ctx.font = `500 11px ${FONT_MONO}`; ctx.fillText(idx === 3 ? 'WELCOME10' : idx === 4 ? 'OLD2025' : 'クーポン', sx + 18, cy + 17);
  if (idx === 4 && T.retrying) { ctx.fillStyle = '#c62f3c'; ctx.font = `700 10px ${FONT_BODY}`; ctx.fillText('期限切れのクーポンです', sx + 14, cy + 40); }
  const disabled = empty || idx === 5;
  const byBtn = sy + 274;
  rr(ctx, sx + 10, byBtn, sw - 20, 34, 10); ctx.fillStyle = disabled ? '#b9c3d1' : accent; ctx.fill();
  ctx.fillStyle = disabled ? '#ffffff' : ink; ctx.font = `700 14px ${FONT_BODY}`; ctx.textAlign = 'center'; ctx.fillText('購入する', sx + sw / 2, byBtn + 23);
  if (idx >= 0) {
    let tx = sx + sw / 2, ty = byBtn + 17;
    if (step.includes('coupon')) { tx = sx + 60; ty = cy + 13; } else if (step.includes('qty')) { tx = sx + sw - 34; ty = sy + 92; } else if (step.includes('cart_list') || step.includes('count')) { tx = sx + 90; ty = sy + 120; }
    const ph = (t * 0.9) % 1;
    ctx.beginPath(); ctx.arc(tx, ty, 6 + ph * 22, 0, Math.PI * 2); ctx.strokeStyle = `rgba(214, 40, 57, ${(0.9 * (1 - ph)).toFixed(2)})`; ctx.lineWidth = 4; ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#4b5c76'; ctx.font = `700 11px ${FONT_MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(idx >= 0 ? `case ${idx + 1}/8 · iPhone 16` : 'iPhone 16 シミュレータ', W / 2, 359);
  r.phoneTex.needsUpdate = true; r.phoneScreenTex.needsUpdate = true;
}

/* Board textures are uploaded again only when what they show has changed (or the theme flipped). */
const boardSig = { spec: '', test: '', task: '' };
function redrawBoards(model, now, force) {
  if (SOURCE.mode === 'live') { liveRedrawBoards(model, now, force); return; }
  const theme = isDark() ? 'd' : 'l';
  const blink = model.specs.some((s) => s.writingIdx >= 0 && s.by) ? Math.floor(now * 2.5) % 2 : 0;
  const spec = theme + blink + model.specs.map((s) => [s.bucket, s.status.text, s.by, s.written.map((w) => Math.round(w * 50)).join(), s.implN.join(), activeSec(s)].join('|')).join(';');
  const test = model.tests.statusText + model.tests.rows.map((r) => r.status + (r.step || '')).join();
  const task = theme + model.pending.map((p) => p.id).join() + model.tasks.map((x) => x.key + x.col + (x.perm ? '!' : '')).join();
  if (force || spec !== boardSig.spec) { drawSpecBoard(model, now); boardSig.spec = spec; }
  if (force || test !== boardSig.test) { drawTestBoard(model); boardSig.test = test; }
  if (force || task !== boardSig.task) { drawTaskBoard(model); boardSig.task = task; }
  for (const pb of PBOARDS) {
    const sig = theme + blink + pb.specs.map((i) => { const s = model.specs[i]; return [s.status.text, s.by, s.written.map((w) => Math.round(w * 50)).join(), s.implN.join(), activeSec(s)].join('|'); }).join(';')
      + model.tasks.filter((x) => PROJECT_OF[x.list] === pb.project).map((x) => x.key + x.col + (x.perm ? '!' : '')).join() + model.pending.map((p) => p.id).join();
    if (force || sig !== pb.sig) { drawProjectBoard(pb, model, now); pb.sig = sig; }
  }
}

function makeLink(color) {
  const N = 48, pos = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, depthTest: false }));
  line.renderOrder = 5; line.frustumCulled = false; scene.add(line);
  const dotMat = new THREE.MeshBasicMaterial({ color, depthTest: false });
  const dots = [0, 1, 2].map(() => { const d = new THREE.Mesh(S.geo.lamp, dotMat); d.scale.setScalar(1.8); d.renderOrder = 6; scene.add(d); return d; });
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
  const tmp = new THREE.Vector3();
  return {
    set(a, b, on, time) {
      line.visible = on; dots.forEach((d) => { d.visible = on; });
      if (!on) return;
      curve.v0.copy(a); curve.v2.copy(b); curve.v1.copy(a).add(b).multiplyScalar(0.5); curve.v1.y += 1.1;
      for (let i = 0; i < N; i++) { curve.getPoint(i / (N - 1), tmp); pos[i * 3] = tmp.x; pos[i * 3 + 1] = tmp.y; pos[i * 3 + 2] = tmp.z; }
      geo.attributes.position.needsUpdate = true;
      dots.forEach((d, i) => curve.getPoint((time * 0.45 + i / 3) % 1, d.position));
    },
  };
}
const linkFor = (id) => links[id] || (links[id] = makeLink(ROLES[DEF[id].role].color));

function addTag(cls, html) { const el = document.createElement('div'); el.className = `tag ${cls}`; el.innerHTML = html; tagsEl.append(el); return el; }

function addFrame(cx, cy, z, w, h, mat) {
  for (const [bw, bh, x, y] of [[w + 0.16, 0.08, 0, h / 2 + 0.04], [w + 0.16, 0.08, 0, -h / 2 - 0.04], [0.08, h, -w / 2 - 0.04, 0], [0.08, h, w / 2 + 0.04, 0]]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.05), mat); bar.position.set(cx + x, cy + y, z + 0.01); scene.add(bar);
  }
}

/* The demo office: three fixed rooms with their boards, the test stand, the document tray and the robots of
   the script (the prototype as it was). The live view builds its rooms from the slices instead (liveSync). */
// The walls' colour is the --wall token (app.css, light and dark); this is only what a page without the stylesheet gets.
const WALL_FALLBACK = '#ebe4d9';
function buildDemoOffice() {
  const wallMat = toon(readToken('--wall', WALL_FALLBACK));
  roomMats.push([wallMat, '--wall', WALL_FALLBACK]);
  for (const room of ROOMS) {
    const w = room.x1 - room.x0, d = room.z1 - room.z0, cx = (room.x0 + room.x1) / 2, cz = (room.z0 + room.z1) / 2;
    const floorMat = toon(readToken(room.floor, '#e9eef6'));
    roomMats.push([floorMat, room.floor, '#e9eef6']);
    const floor = new THREE.Mesh(new RoundedBoxGeometry(w, 0.16, d, 2, 0.05), floorMat); floor.position.set(cx, -0.08, cz); scene.add(floor);
    const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, room.back, 0.16), wallMat); back.position.set(cx - 0.08, room.back / 2, room.z0 - 0.08); scene.add(back);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.16, room.left, d), wallMat); left.position.set(room.x0 - 0.08, room.left / 2, cz); scene.add(left);
    const tag = document.createElement('button');
    tag.type = 'button'; tag.className = 'tag room'; tag.dataset.setProject = room.id; tag.title = `${room.name} だけを表示する`; tag.textContent = room.name;
    tagsEl.append(tag);
    roomTags.push({ el: tag, id: room.id, p: new THREE.Vector3(room.x0 + 0.2, 0.02, room.z1 - 0.1) });
  }

  const frameMat = toon('#7a5a3c');
  sbCanvas = makeCanvas(SB.W, SB.H); sbTex = texFrom(sbCanvas);
  boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(SB.w, SB.h), new THREE.MeshBasicMaterial({ map: sbTex, toneMapped: false }));
  boardMesh.position.set(SB.cx, SB.cy, SB.z); scene.add(boardMesh);
  addFrame(SB.cx, SB.cy, SB.z, SB.w, SB.h, frameMat);
  kbCanvas = makeCanvas(KB.W, KB.H); kbTex = texFrom(kbCanvas);
  kbMesh = new THREE.Mesh(new THREE.PlaneGeometry(KB.w, KB.h), new THREE.MeshBasicMaterial({ map: kbTex, toneMapped: false }));
  kbMesh.position.set(KB.cx, KB.cy, KB.z); scene.add(kbMesh);
  addFrame(KB.cx, KB.cy, KB.z, KB.w, KB.h, frameMat);
  for (const pb of PBOARDS) {
    pb.canvas = makeCanvas(pb.W, pb.H); pb.tex = texFrom(pb.canvas);
    pb.mesh = new THREE.Mesh(new THREE.PlaneGeometry(pb.w, pb.h), new THREE.MeshBasicMaterial({ map: pb.tex, toneMapped: false }));
    if (pb.wall) {
      pb.mesh.position.set(pb.wall.cx, pb.wall.cy, pb.wall.z); scene.add(pb.mesh);
      addFrame(pb.wall.cx, pb.wall.cy, pb.wall.z, pb.w, pb.h, frameMat);
    } else {
      const e = pb.easel, g = new THREE.Group();
      g.position.set(e.x, 0, e.z); g.rotation.y = e.ry; scene.add(g);
      pb.mesh.position.set(0, e.bottom + pb.h / 2, 0.06); g.add(pb.mesh);
      const back = new THREE.Mesh(new THREE.BoxGeometry(pb.w + 0.12, pb.h + 0.12, 0.06), frameMat); back.position.set(0, e.bottom + pb.h / 2, 0.02); g.add(back);
      for (const sx of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, e.bottom + pb.h + 0.2, 8), frameMat);
        leg.position.set(sx * (pb.w / 2 - 0.15), (e.bottom + pb.h + 0.2) / 2, -0.06); leg.rotation.x = 0.06; g.add(leg);
      }
      const ledge = new THREE.Mesh(new THREE.BoxGeometry(pb.w + 0.2, 0.05, 0.16), frameMat); ledge.position.set(0, e.bottom - 0.04, 0.1); g.add(ledge);
    }
  }
  tbCanvas = makeCanvas(TB.W, TB.H); tbTex = texFrom(tbCanvas);
  const tboard = new THREE.Mesh(new THREE.PlaneGeometry(TB.w, TB.h), new THREE.MeshBasicMaterial({ map: tbTex, toneMapped: false }));
  tboard.rotation.y = Math.PI / 2; tboard.position.set(TB.x, TB.cy, TB.cz); scene.add(tboard);
  if (serverDoorWanted('shop')) DEMO_SRDOOR = { D: serverDoorBuild(SRDOOR_DEMO, scene), room: 'shop', place: SRDOOR_DEMO };   // the server room's door (2026-10-20)

  const stand = new THREE.Group(); stand.position.set(-8.7, 0, -0.5); stand.rotation.y = 0.85; scene.add(stand);
  const legMat = toon('#394150');
  for (let i = 0; i < 3; i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8), legMat);
    const a = (i / 3) * Math.PI * 2;
    leg.position.set(Math.sin(a) * 0.18, 0.45, Math.cos(a) * 0.18); leg.rotation.set(Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35); stand.add(leg);
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), legMat); pole.position.y = 1.15; stand.add(pole);
  const big = new THREE.Mesh(new RoundedBoxGeometry(0.94, 1.58, 0.08, 3, 0.08), toon(COL.phone)); big.position.y = 2.15; stand.add(big);
  const offCanvas = makeCanvas(192, 320), octx = offCanvas.getContext('2d');
  octx.fillStyle = '#0d1828'; octx.fillRect(0, 0, 192, 320);
  octx.fillStyle = '#6f87a6'; octx.font = `700 16px ${FONT_BODY}`; octx.textAlign = 'center'; octx.fillText('シミュレータ', 96, 150); octx.fillText('待機中', 96, 176);
  standOffTex = texFrom(offCanvas);
  standMat = new THREE.MeshBasicMaterial({ map: standOffTex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.37), standMat); screen.position.set(0, 2.15, 0.042); stand.add(screen);

  trayGroup = new THREE.Group(); trayGroup.position.set(1.4, 0, 2.75); scene.add(trayGroup);
  const tabMat = toon(COL.wood);
  const top = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.08, 1.0, 2, 0.02), tabMat); top.position.y = 0.74; trayGroup.add(top);
  for (const [x, z] of [[-0.9, -0.42], [0.9, -0.42], [-0.9, 0.42], [0.9, 0.42]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 8), toon(COL.woodDark)); leg.position.set(x, 0.36, z); trayGroup.add(leg); }
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.07, 0.44, 2, 0.02), toon('#c9d0db')); box.position.set(0.5, 0.815, 0); trayGroup.add(box);
  for (let i = 0; i < 12; i++) {
    const p = new THREE.Mesh(S.geo.sheet, S.mat.sheets[i % 4]); p.position.set(-0.45, 0.8 + i * 0.034, 0); p.rotation.y = ((i * 37) % 9 - 4) * 0.02; trayGroup.add(p); trayPending.push(p);
    const q = new THREE.Mesh(S.geo.sheet, S.mat.sheets[(i + 1) % 4]); q.position.set(0.5, 0.86 + i * 0.022, 0); q.rotation.y = ((i * 53) % 7 - 3) * 0.02; q.scale.set(0.95, 0.7, 0.95); trayGroup.add(q); trayDone.push(q);
  }
  trayTag = { el: addTag('tray', ''), p: new THREE.Vector3(1.4, 1.45, 2.75) };

  for (const [i, d] of ROBOT_DEFS.entries()) {
    const robot = createRobot({ label: d.id, role: d.role, state: 'idle', seed: i * 1.7, furnished: !!d.furnished });
    if (d.pos) { robot.root.position.set(d.pos[0], 0, d.pos[1]); robot.root.rotation.y = d.ry; }
    if (d.id === 'a2') { robot.drawPhone = drawCartUI; ensureProps(robot, 'phone'); }
    robot.root.userData.robotId = d.id;
    scene.add(robot.root);
    const tag = addTag('bot', `${pill(d.id, d.role)}<span class="nm"></span><span></span>`);
    tag.dataset.robot = d.id;   // a click on the tag selects the robot (tagPress in build3D)
    robots.push({ def: d, robot, tag, text: tag.lastElementChild, act: '' });
  }
}

function build3D() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  maxAniso = renderer.capabilities.getMaxAnisotropy();
  initShared();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.5, 200);
  camera.position.set(6.8, 15.9, 22.1);
  controls = new OrbitControls(camera, canvas);
  controls.target.set(0.3, 0.4, -0.4);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 8; controls.maxDistance = SOURCE.mode === 'live' ? 80 : 44;   // live: a floor of 3×2 big rooms
  controls.minPolarAngle = 0.3; controls.maxPolarAngle = 1.25;
  controls.screenSpacePanning = false;
  controls.update();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb0c8, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.0); sun.position.set(6, 14, 9); scene.add(sun);

  // Live: the rooms come with the first snapshot; the first frame after it builds them (liveSync).
  if (SOURCE.mode === 'demo') buildDemoOffice(); else LIVE3D.rev = -1;

  selRing = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.96, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false }));
  selRing.rotation.x = -Math.PI / 2; selRing.visible = false; scene.add(selRing);

  // A click (not a drag) zooms in: a robot opens its card, a spec tile opens that spec, the rest of the spec
  // board opens the overview, and the cork board or the document tray opens the task board.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let downAt = null;
  const hitAt = (ev) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (TOWER.on) return towerHit(ray);
    if (SOURCE.mode === 'live') return liveHit(ray);
    const hits = ray.intersectObjects([boardMesh, kbMesh, trayGroup, ...PBOARDS.map((pb) => pb.mesh), ...robots.map((R) => R.robot.root),
      ...(DEMO_SRDOOR ? [DEMO_SRDOOR.D.root, DEMO_SRDOOR.D.pad] : [])], true);
    // the server room's door behind a robot still takes the press, as in the live office (liveFirstHit; dd's re-verification)
    const hit = hits.length && robotOf(hits[0].object) !== undefined ? hits.find((h) => h.object.userData.serverDoor) || hits[0] : hits[0];
    if (!hit) return null;
    if (hit.object.userData.serverDoor) return { kind: 'serverroom', project: DEMO_SRDOOR.room, title: 'サーバールームに入る（構成を読み込む）' };
    let o = hit.object;
    while (o && o.userData.robotId === undefined && o.parent) o = o.parent;
    if (o && o.userData.robotId !== undefined) return { kind: 'robot', id: o.userData.robotId };
    const pb = PBOARDS.find((b) => b.mesh === hit.object);
    if (pb) {
      const px = hit.uv.x * pb.W, py = (1 - hit.uv.y) * pb.H;
      if (py >= pb.splitY) return { kind: 'tasks', project: pb.project };
      const t = pb.tiles.find((q) => px >= q.x && px <= q.x + q.w && py >= q.y && py <= q.y + q.h);
      return t ? { kind: 'spec', i: t.i } : { kind: 'board', project: pb.project };
    }
    if (hit.object !== boardMesh) return { kind: 'tasks', project: 'shop' };
    const px = hit.uv.x * SB.W, py = (1 - hit.uv.y) * SB.H;
    for (let pos = 0; pos < SHOP_IDX.length; pos++) { const p = sbTile(pos); if (px >= p.x && px <= p.x + SB.tw && py >= p.y && py <= p.y + SB.th) return { kind: 'spec', i: SHOP_IDX[pos] }; }
    return { kind: 'board', project: 'shop' };
  };
  canvas.addEventListener('pointerdown', (ev) => { downAt = [ev.clientX, ev.clientY]; });
  canvas.addEventListener('pointerup', (ev) => {
    if (!downAt || (zoom.zoomed && !rbState.id)) return;
    const moved = Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]);
    downAt = null;
    if (moved > 6) return;
    const h = hitAt(ev);
    if (!h) return;
    // A board belongs to one project room, so opening it narrows the view to that project (unless it already shows everything).
    const fit = (proj) => { if (proj && UI.project !== 'all' && UI.project !== proj) setProject(proj, { camera: false }); };
    if (h.kind === 'floor') { if (SOURCE.mode === 'live') towerLeave(h.k, h.project); else towerLeave(0); }   // the demo has one office
    else if (h.kind === 'room') setProject(h.project);
    else if (h.kind === 'robot') openRobot(h.id, canvas);
    else if (h.kind === 'call') openCall(h.project, canvas);
    else if (h.kind === 'tasks') { fit(h.project); openTaskBoard(canvas, undefined, h.project); }
    else if (h.kind === 'spec') { fit(SPECS[h.i].project); openWhiteboard(h.i, canvas); }
    else if (h.kind === 'data') openDataDocs(h.project, canvas);
    else if (h.kind === 'serverroom') srEnter(h.project, canvas);
    else { fit(h.project); openWhiteboard(-1, canvas, h.project); }
  });
  /* A robot's tag and its bill select the robot (ticket 2026-10-20-jui-viz-robot-name-tag-click-selects): a press on
     one is handed to the canvas as it is (the camera's controls take the pointer from there, so a drag that starts on
     a tag turns the camera as a drag anywhere else does), and a release within 6 px of the press opens that robot's
     card as a click on its body does. The tag's press, not what lies under it, decides the robot. The wheel over any
     tag goes to the canvas too (a tag must not stop the zoom). */
  let tagPress = null;
  const handOn = (ev) => ({ bubbles: false, cancelable: true, composed: true, pointerId: ev.pointerId, pointerType: ev.pointerType,
    isPrimary: ev.isPrimary, width: ev.width, height: ev.height, pressure: ev.pressure, button: ev.button, buttons: ev.buttons,
    clientX: ev.clientX, clientY: ev.clientY, screenX: ev.screenX, screenY: ev.screenY,
    ctrlKey: ev.ctrlKey, shiftKey: ev.shiftKey, altKey: ev.altKey, metaKey: ev.metaKey });
  tagsEl.addEventListener('pointerdown', (ev) => {
    const el = ev.target.closest('[data-robot]');
    if (!el) return;
    tagPress = { id: el.dataset.robot, x: ev.clientX, y: ev.clientY, pointerId: ev.pointerId };
    canvas.dispatchEvent(new PointerEvent('pointerdown', handOn(ev)));
  });
  tagsEl.addEventListener('contextmenu', (ev) => { if (ev.target.closest('[data-robot]')) ev.preventDefault(); });   // a right drag pans
  tagsEl.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    canvas.dispatchEvent(new WheelEvent('wheel', { ...handOn(ev), deltaX: ev.deltaX, deltaY: ev.deltaY, deltaZ: ev.deltaZ, deltaMode: ev.deltaMode }));
  }, { passive: false });
  // before the canvas's own pointerup (capture, on window): a press that began on a tag is the tag's, not the 3D's
  window.addEventListener('pointerup', (ev) => {
    if (!tagPress || ev.pointerId !== tagPress.pointerId) return;
    const { id, x, y } = tagPress;
    tagPress = null; downAt = null;
    if (Math.hypot(ev.clientX - x, ev.clientY - y) > 6 || (zoom.zoomed && !rbState.id)) return;
    if (robots.some((R) => R.def.id === id)) openRobot(id, canvas);
  }, true);
  window.addEventListener('pointercancel', (ev) => { if (tagPress && ev.pointerId === tagPress.pointerId) tagPress = null; }, true);
  canvas.addEventListener('pointermove', (ev) => {
    if (ev.buttons || (zoom.zoomed && !rbState.id)) return;
    const h = hitAt(ev);
    canvas.style.cursor = h ? 'pointer' : '';
    canvas.title = h && (h.kind === 'floor' || h.kind === 'room' || h.kind === 'call' || h.kind === 'data' || h.kind === 'serverroom') ? h.title : '';
  });

  sceneEl.addEventListener('pointerdown', () => { DIRECTOR.userAt = performance.now(); });
  sceneEl.addEventListener('wheel', () => { DIRECTOR.userAt = performance.now(); }, { passive: true });
  {
    // The wheel past the farthest distance shows the building; past the nearest in the building, the floor.
    // On the whole scene, not the canvas: a room's or a robot's tag can be under the pointer.
    sceneEl.addEventListener('wheel', (ev) => {
      const d = camera.position.distanceTo(controls.target);
      if (!TOWER.on && ev.deltaY > 0 && d >= controls.maxDistance - 0.5) towerEnter();
      else if (TOWER.on && ev.deltaY < 0 && d <= controls.minDistance + 0.5) towerLeave(LIVE.floor);
    }, { passive: true });
    const step = (d) => (SOURCE.mode === 'demo' ? towerLookAt(TOWER.look + d) : liveFloorStep(d));
    document.getElementById('floor-up').addEventListener('click', () => step(1));
    document.getElementById('floor-down').addEventListener('click', () => step(-1));
    document.getElementById('floor-building').addEventListener('click', () => (TOWER.on ? towerLeave(LIVE.floor) : towerEnter()));
    document.getElementById('weather-switch').addEventListener('click', () => { weatherSwitch(); });
    document.getElementById('room-back').addEventListener('click', () => setProject('all'));
  }
  const applyTheme = () => { for (const [mat, token, fallback] of roomMats) mat.color.set(readToken(token, fallback)); };
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
/* =====================================================================
   The live office (plan 07 §4): one room per project from the slices, built and removed as SOURCE.layoutRev
   moves. Each room: floor, back and left walls, its project board on the back wall and its task cork board on
   the left wall. Robots get seats from 30-source-live.js and walk there: in through the room's door, out
   through it when they leave, and door to door when their session moves to another project.
   ===================================================================== */
const LIVE3D = { rev: -1, rooms: {}, sharedGeo: null, sharedMat: null, roomsSig: '', userMoved: false };
const WALK_SPEED = 1.7;
function liveShared() {
  if (LIVE3D.sharedGeo) return;
  const flat = (o) => Object.values(o).flatMap((v) => (Array.isArray(v) ? v : [v]));
  LIVE3D.sharedGeo = new Set(flat(S.geo));
  LIVE3D.sharedMat = new Set(flat(S.mat));
}
function disposeTree(root) {
  liveShared();
  root.traverse((o) => {
    if (o.geometry && !LIVE3D.sharedGeo.has(o.geometry)) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      if (LIVE3D.sharedMat.has(m)) continue;
      if (m.map && !Object.values(S.tex || {}).includes(m.map)) m.map.dispose();
      m.dispose();
    }
  });
}
function liveBuildRoom(room) {
  const g = new THREE.Group();
  const w = room.x1 - room.x0, d = room.z1 - room.z0, cx = (room.x0 + room.x1) / 2, cz = (room.z0 + room.z1) / 2;
  const wallMat = toon(readToken('--wall', WALL_FALLBACK)), floorMat = toon(readToken(room.floor, '#e9eef6'));
  const mats = [[wallMat, '--wall', WALL_FALLBACK], [floorMat, room.floor, '#e9eef6']];
  roomMats.push(...mats);
  const floor = new THREE.Mesh(new RoundedBoxGeometry(w, 0.16, d, 2, 0.05), floorMat); floor.position.set(cx, -0.08, cz); g.add(floor);
  const frameMat = toon('#7a5a3c');
  // the back and left walls, with a door where a room is behind or to the left (requester, 10-18)
  const doors = room.doors || {}, da = doorAt(room), half = DOOR_W / 2;
  for (const wall of liveWalls().filter((q) => q.room === room.id)) {
    const ww = wall.x1 - wall.x0, wd = wall.z1 - wall.z0, hgt = wall.side === 'back' ? room.back : room.left;
    const m = new THREE.Mesh(new THREE.BoxGeometry(ww, hgt, wd), wallMat); m.position.set((wall.x0 + wall.x1) / 2, hgt / 2, (wall.z0 + wall.z1) / 2); g.add(m);
  }
  const doorway = (x, z, along) => {   // a lintel over the gap, a frame round it, a sill across the gap between the rooms
    const hgt = along === 'x' ? room.back : room.left, top = hgt - DOOR_H;
    const lin = new THREE.Mesh(along === 'x' ? new THREE.BoxGeometry(DOOR_W, top, WALL_T) : new THREE.BoxGeometry(WALL_T, top, DOOR_W), wallMat);
    lin.position.set(x, DOOR_H + top / 2, z); g.add(lin);
    for (const [bw, bh, bd, ox, oy, oz] of along === 'x'
      ? [[0.08, DOOR_H, WALL_T + 0.04, -half, DOOR_H / 2, 0], [0.08, DOOR_H, WALL_T + 0.04, half, DOOR_H / 2, 0], [DOOR_W + 0.08, 0.08, WALL_T + 0.04, 0, DOOR_H, 0]]
      : [[WALL_T + 0.04, DOOR_H, 0.08, 0, DOOR_H / 2, -half], [WALL_T + 0.04, DOOR_H, 0.08, 0, DOOR_H / 2, half], [WALL_T + 0.04, 0.08, DOOR_W + 0.08, 0, DOOR_H, 0]]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), frameMat); bar.position.set(x + ox, oy, z + oz); g.add(bar);
    }
    const gap = ROOM_GAP + WALL_T;
    const sill = new THREE.Mesh(along === 'x' ? new THREE.BoxGeometry(DOOR_W, 0.16, gap) : new THREE.BoxGeometry(gap, 0.16, DOOR_W), floorMat);
    sill.position.set(along === 'x' ? x : x - gap / 2 + WALL_T / 2, -0.08, along === 'x' ? z - gap / 2 + WALL_T / 2 : z); g.add(sill);
  };
  if (doors.back) doorway(da.backX, room.z0 - WALL_T / 2, 'x');
  if (doors.left) doorway(room.x0 - WALL_T / 2, da.leftZ, 'z');
  // the entrance from the corridor: a mat at the front, where robots come in and go out
  if (doors.front) { const mat = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, 0.02, 0.6), toon('#c9d0db')); mat.position.set(da.frontX, 0.01, room.z1 - 0.3); g.add(mat); }
  // project board on the back wall; a room with many specs gets the big spec board instead (plan 09 §7), kept
  // clear of the back door
  const pbW = room.big ? w - (doors.back ? 3.2 : 1.2) : Math.min(w - 2.2, 4.2);
  const pb = room.big ? { project: room.id, big: true, W: 2048, H: 1024, w: pbW, h: Math.min(room.back - 0.9, pbW * 1024 / 2048), specs: [], tiles: [], splitY: 1e9, sig: '' }
    : { project: room.id, W: 1024, H: 560, w: pbW, h: pbW * 560 / 1024, specs: [], tiles: [], splitY: 0, sig: '' };
  if (room.big) pb.W = Math.round(pb.H * pb.w / pb.h);
  pb.canvas = makeCanvas(pb.W, pb.H); pb.tex = texFrom(pb.canvas);
  pb.mesh = new THREE.Mesh(new THREE.PlaneGeometry(pb.w, pb.h), new THREE.MeshBasicMaterial({ map: pb.tex, toneMapped: false }));
  const pbX = room.big ? cx - (doors.back ? 1.0 : 0) : cx + 0.4, pbY = room.big ? Math.max(2.35, pb.h / 2 + 0.75) : 2.35;
  pb.mesh.position.set(pbX, pbY, room.z0 + 0.02); g.add(pb.mesh);
  for (const [bw, bh, x, y] of [[pb.w + 0.16, 0.08, 0, pb.h / 2 + 0.04], [pb.w + 0.16, 0.08, 0, -pb.h / 2 - 0.04], [0.08, pb.h, -pb.w / 2 - 0.04, 0], [0.08, pb.h, pb.w / 2 + 0.04, 0]]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.05), frameMat); bar.position.set(pbX + x, pbY + y, room.z0 + 0.03); g.add(bar);
  }
  // the test board, on an easel at the front left, only while the project has test runs
  let tb = null;
  if (room.tests) {
    tb = { project: room.id, W: 1024, H: 820, w: 1.7, h: 1.7 * 820 / 1024, sig: '' };
    tb.canvas = makeCanvas(tb.W, tb.H); tb.tex = texFrom(tb.canvas);
    const eg = new THREE.Group(); eg.position.set(room.x0 + 1.15, 0, room.z1 - 0.9); eg.rotation.y = 0.55; g.add(eg);
    tb.mesh = new THREE.Mesh(new THREE.PlaneGeometry(tb.w, tb.h), new THREE.MeshBasicMaterial({ map: tb.tex, toneMapped: false }));
    tb.mesh.position.set(0, 0.95 + tb.h / 2, 0.06); eg.add(tb.mesh);
    const back = new THREE.Mesh(new THREE.BoxGeometry(tb.w + 0.12, tb.h + 0.12, 0.06), frameMat); back.position.set(0, 0.95 + tb.h / 2, 0.02); eg.add(back);
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15 + tb.h, 8), frameMat);
      leg.position.set(sx * (tb.w / 2 - 0.15), (1.15 + tb.h) / 2, -0.06); leg.rotation.x = 0.06; eg.add(leg);
    }
  }
  // task cork board on the left wall
  const kw = Math.min(d - 1.4, 2.6), kb = { project: room.id, W: 1024, H: 842, w: kw, h: kw * 842 / 1024, sig: '' };
  kb.canvas = makeCanvas(kb.W, kb.H); kb.tex = texFrom(kb.canvas);
  kb.mesh = new THREE.Mesh(new THREE.PlaneGeometry(kb.w, kb.h), new THREE.MeshBasicMaterial({ map: kb.tex, toneMapped: false }));
  kb.mesh.rotation.y = Math.PI / 2; kb.mesh.position.set(room.x0 + 0.02, 2.1, doors.left ? Math.min(cz, da.leftZ - half - 0.25 - kw / 2) : cz); g.add(kb.mesh);
  scene.add(g);
  const tag = document.createElement('button');
  tag.type = 'button'; tag.className = 'tag room'; tag.dataset.setProject = room.id; tag.title = `${room.name} だけを表示する`; tag.textContent = room.name;
  tagsEl.append(tag);
  // over its own back wall's left end: at the front corner it sat on the back edge of the room in front (3×2 floors)
  const rt = { el: tag, id: room.id, p: new THREE.Vector3(room.x0 + 0.6, room.back + 0.35, room.z0 - 0.05) };
  roomTags.push(rt);
  return { geo: room.geo, group: g, floor, pb, kb, tb, rt, mats };
}
function liveDropRoom(id) {
  const R = LIVE3D.rooms[id];
  if (!R) return;
  if (PROPS.room === id) propsClear();   // the floor's own material goes back before the room is disposed
  scene.remove(R.group); focusRelease(R.group); disposeTree(R.group);   // focusRelease: 50-panel.js, the faint walls (10-18)
  R.rt.el.remove();
  roomTags.splice(roomTags.indexOf(R.rt), 1);
  for (const m of R.mats) roomMats.splice(roomMats.indexOf(m), 1);
  delete LIVE3D.rooms[id];
}
function liveAddRobot(d, i) {
  const robot = createRobot({ label: d.id, role: d.role, state: 'idle', seed: i * 1.7, furnished: true, sub: d.kind === 'sub' });   // a subagent: work clothes, 0.8 (2.3.5)
  robot.drawPhone = drawLivePhone;
  // a robot that comes in walks from the corridor through the doors (requester, 10-18)
  const route = d.enter ? liveRoute(null, d.room) : [];
  const start = route.length ? route[0] : d.pos || [0, 0];
  robot.root.position.set(start[0], 0, start[1]); robot.root.rotation.y = d.ry || 0;
  robot.root.userData.robotId = d.id;
  scene.add(robot.root);
  const tag = addTag('bot', `${pill(d.id, d.role)}<span class="nm"></span><span></span>`);
  tag.dataset.robot = d.id;   // a click on the tag selects the robot (tagPress in build3D)
  const R = { def: d, robot, tag, text: tag.lastElementChild, act: '', path: [], room: d.room, seatKey: '', exitAt: 0 };
  if (route.length) R.path = route.slice(1);
  d.enter = false;
  robots.push(R);
  return R;
}
function liveDropRobot(R) {
  scene.remove(R.robot.root); focusRelease(R.robot.root); disposeTree(R.robot.root);   // focusRelease: 50-panel.js (10-18)
  const k = fontRedraws.indexOf(R.robot.fontRedraw); if (k >= 0) fontRedraws.splice(k, 1);
  R.tag.remove();
  if (R.bill) R.bill.remove();
  if (links[R.def.id]) links[R.def.id].set(null, null, false, 0);
  robots.splice(robots.indexOf(R), 1);
}
/* Rooms and robots follow the source; seats are targets the robots walk to. */
function liveSync() {
  LIVE3D.rev = SOURCE.layoutRev;
  const shown = ROOMS.filter((r) => r.shown);
  for (const id of Object.keys(LIVE3D.rooms)) {
    const r = PROJECT[id];
    if (!r || !r.shown || r.geo !== LIVE3D.rooms[id].geo) liveDropRoom(id);
  }
  for (const r of shown) if (!LIVE3D.rooms[r.id]) LIVE3D.rooms[r.id] = liveBuildRoom(r);
  const want = new Set(ROBOT_DEFS.filter((d) => d.pos || LIVE.leaving[d.id]).map((d) => d.id));
  for (const R of [...robots]) if (!want.has(R.def.id)) liveDropRobot(R);
  const have = new Set(robots.map((R) => R.def.id));
  ROBOT_DEFS.forEach((d, i) => { if (want.has(d.id) && !have.has(d.id)) liveAddRobot(d, i); });
  for (const R of robots) livePlan(R);
  const sig = shown.map((r) => r.geo).join(';');
  if (sig !== LIVE3D.roomsSig) {
    LIVE3D.roomsSig = sig;
    if (LIVE3D.floorMove) LIVE3D.floorMove = false;   // the floor change flies the camera itself
    else if (TOWER.on) { /* looking at the building: a regrouped floor does not move the camera */ }
    else if (!zoom.zoomed && (UI.project === 'all' || !PROJECT[UI.project] || !PROJECT[UI.project].shown)) focusProject('all', LIVE3D.rev <= 1);
    else if (!zoom.zoomed) focusProject(UI.project, false);
  }
  redrawBoards(latestModel, performance.now() / 1000, true);
  const empty = $('live-empty');
  if (empty) empty.hidden = !!SESSIONS.length || !SOURCE.connected;
}
/* Where a robot walks next: its seat (through the doors when it changed rooms), or out of the door. */
function livePlan(R) {
  const d = R.def, leaving = LIVE.leaving[d.id];
  if (leaving) return;   // liveWalk walks it out
  if (!d.pos) return;
  const key = `${d.room}:${d.pos.join()}`;
  if (key === R.seatKey) return;
  const root = R.robot.root, here = [root.position.x, root.position.z];
  const rm = PROJECT[d.room], rect = rm ? `${rm.x0},${rm.z0},${rm.x1},${rm.z1}` : '';
  const moved = R.seatKey && R.room === d.room && R.rect && R.rect !== rect;   // its room was laid out again (another slot, the one-room view)
  R.rect = rect;
  if (R.shred || R.play || R.brk) {   // the shredder's errand and a break (10-19) keep their path as play does: shredStop / brkStop walk it to this seat (a git trip need not: gitLaid)
    // At play (2.3.1): the path is the game's. Taking it sent a player to its new desk, and there liveWalk read the
    // empty path as "at the spot" and it played from its desk (e2e, 1 run in 3). The game ends on its own reasons;
    // playStop then walks it to this seat (through the doors when the room changed).
    R.room = d.room; R.seatKey = key;
    return;
  }
  if (moved) { root.position.x = d.pos[0]; root.position.z = d.pos[1]; R.path = []; R.jumps = (R.jumps || 0) + 1; }
  else if (R.seatKey && R.room !== d.room) {
    // to another room: finish the step it is on, then through the doors (never a straight line through a wall)
    const next = R.path.length ? R.path[0] : here;
    R.path = [...(R.path.length ? [next] : []), ...liveRoute(roomAtPoint(next), d.room), d.pos];
  } else if (R.seatKey && R.path.length > 1) R.path[R.path.length - 1] = d.pos;   // still on its way: a new seat at the end
  else if (R.seatKey && roomAtPoint(here) !== d.room) { root.position.x = d.pos[0]; root.position.z = d.pos[1]; R.path = []; R.jumps = (R.jumps || 0) + 1; }   // its room moved under it (counted: the e2e wall check skips a jump)
  else if (R.seatKey) R.path = [d.pos];   // another seat in the same room
  else R.path.push(d.pos);                // first seat: after the doors when it just came in
  R.room = d.room; R.seatKey = key;
}
function liveWalk(R, dt, nowMs, nowSec) {
  const root = R.robot.root, d = R.def;
  // Leaving is a state, not a layout change: start the "done, then out of the door" here. The 2.5 s count from when
  // the page learned it left (LIVE.leaving's since), not from the first frame after: with frames seconds apart, that
  // frame was a whole gap later (ticket 2026-10-20-jui-viz-arrivals-and-rolls-wait-for-frames).
  const lv = LIVE.leaving[d.id];
  if (lv) { if (!R.exitAt && !R.out) R.exitAt = nowMs + 2500 - Math.min(2500, Math.max(0, Date.now() - (lv.since || Date.now()))); }
  else if (R.exitAt && !R.out) R.exitAt = 0;   // it came back before walking out
  if (R.exitAt && nowMs >= R.exitAt && !R.path.length && !R.out) {
    R.path = liveRoute(roomAtPoint([root.position.x, root.position.z]), null);   // out to the corridor
    R.out = true;
  }
  if (R.out && !R.path.length) { SOURCE.robotGone(d.id); return 'gone'; }
  if (R.path.length) {
    // The frame's whole step, carried along the path through as many points as it reaches (a slow frame rate must
    // not slow the walk: one point a frame, and the rest of the step dropped, made a walk out of a room take ~10
    // frames however far apart they were - 30 s at 3 s a frame; ticket 2026-10-19-jui-viz-walk-stretches-with-frame-gaps).
    // Always along the path, point by point, so never through a wall; never past its end.
    let step = WALK_SPEED * (SOURCE.replaySpeed > 1 ? Math.min(4, SOURCE.replaySpeed) : 1) * dt;
    if (R.robot.desk) R.robot.desk.visible = false;
    // The points passed in this frame, in order (a new array each walking frame): what a watcher joins between two
    // frames' positions, since the walk turns at them (ticket 2026-10-20-jui-viz-e2e-wall-watch-joins-frames-not-the-path)
    const trail = R.walkTrail = [];
    while (R.path.length) {
      const q = R.path[0], dx = q[0] - root.position.x, dz = q[1] - root.position.z, dist = Math.hypot(dx, dz);
      if (dist > 1e-3) root.rotation.y = Math.atan2(dx, dz);
      if (dist <= step || dist < 1e-3) { root.position.x = q[0]; root.position.z = q[1]; R.path.shift(); trail.push([q[0], q[1]]); step -= dist; continue; }
      root.position.x += (dx / dist) * step; root.position.z += (dz / dist) * step;
      break;
    }
    // out of the door within this frame's step: gone now, not a frame later (with frames seconds apart, every hand-off
    // from one frame to the next is seconds)
    if (R.out && !R.path.length) { SOURCE.robotGone(d.id); return 'gone'; }
    if (R.path.length) return 'walking';
    // arrived in this frame: what it came for starts in this frame too, below (it used to wait a frame or two:
    // ticket 2026-10-20-jui-viz-arrivals-and-rolls-wait-for-frames)
  }
  if (R.play) {                                          // at the play spot: no desk, facing the partner
    if (R.robot.desk) R.robot.desk.visible = false;
    R.play.phase = 'playing';
    const q = R.play.partner.robot.root.position, ry = Math.atan2(q.x - root.position.x, q.z - root.position.z) + (R.play.turn || 0);
    root.rotation.y += (ry - root.rotation.y) * Math.min(1, dt * (R.play.turn !== undefined ? 12 : 6));   // highfive: turns to slap
    return 'playing';
  }
  if (R.brk) return brkAt(R, dt, nowSec);                        // at the smoking booth or the vending machine (10-19)
  if (R.shred) {                                         // at the shredder: no desk, facing it
    if (R.robot.desk) R.robot.desk.visible = false;
    const P = PROPS.shredder, ry = P ? Math.atan2(P.x - root.position.x, P.z - root.position.z) : Math.PI;
    root.rotation.y += (ry - root.rotation.y) * Math.min(1, dt * 6);
    return 'shredding';
  }
  if (R.git) gitArrive(R, nowSec);
  if (R.git && R.git.phase === 'at') {                  // at the box (2.3.4): no desk of its own, facing the box
    if (R.robot.desk) R.robot.desk.visible = false;
    const q = R.git.desk, ry = Math.atan2(q[0] - root.position.x, q[1] - root.position.z);
    root.rotation.y += (ry - root.rotation.y) * Math.min(1, dt * 6);
    return 'gitbox';
  }
  if (R.playBack) R.playBack = false;                             // back at its desk
  if (R.robot.desk) R.robot.desk.visible = !d.standing;
  if (Math.abs(root.rotation.y - (d.ry || 0)) > 1e-3) root.rotation.y += ((d.ry || 0) - root.rotation.y) * Math.min(1, dt * 6);
  return 'still';
}
/* Coffee and meals, now and then (requester, 10-18): once a second each robot that is idle or at work may start
   one (probability SNACK.p, a seeded generator so a test can repeat it), while at most SNACK.share of the robots
   (at least one) are at it. Never while waiting, thinking or done (startGesture refuses), none under reduced motion. */
const SNACK = { seed: 20261018, p: 1 / 90, share: 0.15, next: 0, rng: null };
function snackRandom(seed = SNACK.seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/* "Once a second" (snacks, games, naps, breaks): the rolls due since the last one - a frame seconds late owes several -
   as one roll with the chance of all of them (it rolled once a frame: with frames 3 s apart, a third as often; ticket
   2026-10-20-jui-viz-arrivals-and-rolls-wait-for-frames). At most ROLL_CATCHUP_SEC: a hidden tab's minutes are not
   time anyone watched, and its return must not start everything at once. n = 1 (frames under a second apart) is the
   old roll exactly: the same chance, the same seeded sequence. */
const ROLL_CATCHUP_SEC = 10;
function rollsDue(T, nowSec) {
  const n = T.next ? Math.max(1, Math.min(ROLL_CATCHUP_SEC, 1 + Math.floor(nowSec - T.next))) : 1;
  T.next = nowSec + 1;
  return n;
}
const chanceIn = (p, n) => (n <= 1 ? p : 1 - Math.pow(1 - p, n));
function snackTick(t) {
  if (reduceMotion || t < SNACK.next) return;
  const n = rollsDue(SNACK, t);
  if (!SNACK.rng) SNACK.rng = snackRandom();
  const here = robots.filter((R) => !LIVE.leaving[R.def.id]);
  const cap = Math.max(1, Math.floor(here.length * SNACK.share));
  let busy = here.filter((R) => R.robot.gesture && R.robot.gesture.kind !== 'drink').length;
  for (const R of here) {
    if (busy >= cap) break;
    if (R.robot.gesture || !GESTURE_OK.has(R.robot.state)) continue;
    if (SNACK.rng() < chanceIn(SNACK.p, n) && startGesture(R.robot, SNACK.rng() < 0.5 ? 'coffee' : 'meal', t)) busy += 1;
  }
}
/* A call on the robot and on its name tag: a phone mark and the other robot's number, never the message. */
const CALL_TAG_TEXT = { dialing: '発信中', ringing: '呼び出し中', answered: '通話中' };
/* Alone at its desk (2.3.1): the name tag says so too — the robot is small in any view, so the zzz and the bento alone
   were hard to see (jsonuidocument-96, 10-18). The call mark wins; a call stops a nap anyway. */
const SOLO_TAG_TEXT = { nap: 'zzz 居眠り', bento: '弁当' };
/* The tag's name (10-19): a session with a name (/rename, `claude -n`) shows it in place of the two-letter mark, cut at
   its end by the CSS; none (and a subagent) keeps the mark. Text only (textContent), and a rename shows at once. */
function liveTagName(R) {
  const name = R.def.title || '';
  if (name === (R.nameShown || '')) return;
  R.nameShown = name;
  R.tag.querySelector('.nm').textContent = name;
  R.tag.firstElementChild.hidden = !!name;
  R.tag.classList.toggle('named', !!name);
}
function liveCallTag(R, call) {
  R.robot.call = call && CALL_ON_LINE.has(call.state) ? call : null;
  const c = R.robot.call;
  const text = c ? `☎ ${c.role === 'callee' && c.state !== 'answered' ? '着信' : CALL_TAG_TEXT[c.state]}${c.peer ? ` ${c.peer}` : ''}`
    : R.solo ? SOLO_TAG_TEXT[R.solo.kind] || '' : playText(R) || brkTagText(R);   // a game and a break never overlap
  if (text === (R.callText || '')) return;
  R.callText = text;
  if (!R.callEl) { R.callEl = document.createElement('span'); R.callEl.className = 'call-mark'; R.tag.insertBefore(R.callEl, R.text); }
  R.callEl.textContent = text;
  R.callEl.hidden = !text;
  R.callEl.classList.toggle('solo-mark', !c && !!text);
  R.tag.classList.toggle('on-call', !!c);
}
/* Play (requester, 10-18): "同じ部屋で待機が長いロボットが複数いたらロボット同士で遊ぶ", "動きはランダムでいい",
   "遊んだらまた元の場所に戻る", "指示が来たら遊ぶのやめて作業始めて". Looks only: the server, the panel and the tasks
   still say 待機. Main robots only (a subagent idle for long has usually left). Once a second a room with two robots
   idle for PLAY.idleMs or more may start a game (probability PLAY.p, a seeded generator): the two walk to the front
   aisle of their room, play one of PLAY_KINDS for a random while, and walk back to their desks. Any reason to stop —
   anything the server sets on the robot (an instruction keeps the state idle and changes only its act and updatedAt:
   jsonuidocument-96, 10-18), the robot no longer idle, its phone rings, it leaves, its seat moves — stops it at once: it
   walks back with its real lamp (through the doors when its desk is in another room now), and a partner left alone
   walks back too. A robot that played rests a while before the next game; at most PLAY.games at a time, one to a room,
   and none in a room with standing robots (a full room: they stand along the front wall, where the game would be).
   None under reduced motion. The e2e build can shorten the times (80-dbg.js). */
const PLAY_KINDS = ['ball', 'highfive', 'rps'];
/* 2.3.1 (requester, 10-18: "完了とか待機でもあんまり遊ばない"): idle for a minute, about 15 s to start once two are there,
   shorter rests, three games at a time. A robot that finished (完了) is idle again three seconds later and counts from
   then. Robots alone in their room nap or eat a bento at their desks (SOLO). Every end is kept with its reason in
   PLAY.ends (80-dbg.js shows them): the requester saw two walk up and go back without playing. */
const PLAY = { seed: 20261019, kinds: PLAY_KINDS, idleMs: 60_000, p: 1 / 15, games: 3, minSec: 15, maxSec: 35, restMinSec: 45, restMaxSec: 120,
  walkSec: 30, next: 0, rng: null, list: [], ends: [] };
const SOLO_KINDS = ['nap', 'bento'];
const SOLO = { p: 1 / 20, minSec: 20, maxSec: 60, kinds: SOLO_KINDS };
/* What a game looks like (2.3.3, requester 10-19: "ずっと二人で向き合ってるだけで何やってるかわからない"): the name tag,
   the robot's card and the building's window say which game it is (遊びに行く on the way), the ball is big enough to
   see from the usual view and goes from hand to hands, and at highfive the two walk toward each other and slap with a
   パチン mark. The poses are 10-robot-core.js's; both read the same phase helpers (ballPhase, highfivePhase). */
const PLAY_LOOK = { ballR: 0.3, gap: { ball: 1.3, highfive: 1.4 }, hfNear: 0.8 };   // gap: half the distance between the two spots
const PLAY_TAG_TEXT = { ball: 'キャッチボール中', highfive: 'ハイタッチ中', rps: 'じゃんけん中' };
function playText(R) {
  if (!R.play) return '';
  return R.robot.play ? PLAY_TAG_TEXT[R.robot.play.kind] || '' : '遊びに行く';
}
function playTagText(id) { const R = robots.find((x) => x.def.id === id); return R ? playText(R) : ''; }   // the card (50-panel.js)
function playRoomText(room) { const G = PLAY.list.find((x) => x.room === room); return !G ? '' : G.t0 ? PLAY_TAG_TEXT[G.kind] || '' : '遊びに行く'; }   // the building
const playV = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
function playHand(r, side, out) { return (side === 'L' ? r.armL : r.armR).localToWorld(out.set(0, -0.38, 0)); }
function pachinCanvas() {
  const c = makeCanvas(280, 180), ctx = c.getContext('2d');
  ctx.beginPath();
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, rad = i % 2 ? 52 : 88; ctx.lineTo(140 + Math.cos(a) * rad * 1.45, 90 + Math.sin(a) * rad); }
  ctx.closePath(); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = '#1f2532'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.font = `700 52px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 8; ctx.strokeStyle = '#ffffff'; ctx.strokeText('パチン!', 140, 92);
  ctx.fillStyle = '#d0352b'; ctx.fillText('パチン!', 140, 92);
  return c;
}
function playMove(G, left, nowSec) {
  if (left.length < 2) return;
  const u = Math.max(0, nowSec - G.t0);
  if (G.kind === 'ball') {
    if (!G.ball) { G.ball = new THREE.Mesh(new THREE.SphereGeometry(PLAY_LOOK.ballR, 16, 12), toon('#ff7a3d')); scene.add(G.ball); }
    const { n, thrower, w } = ballPhase(u), from = left[thrower].robot, to = left[1 - thrower].robot;
    const hand = playHand(from, 'R', playV[0]);
    if (w < BALL_T.release) { G.ball.position.copy(hand); return; }   // in the thrower's hand through the wind-up
    if (G.ballN !== n) { G.ballFrom = hand.clone(); G.ballN = n; }
    const at = playHand(to, 'L', playV[1]).add(playHand(to, 'R', playV[2])).multiplyScalar(0.5);   // between the catcher's hands
    const k = (w - BALL_T.release) / (1 - BALL_T.release);
    G.ball.position.lerpVectors(G.ballFrom, at, k); G.ball.position.y += Math.sin(Math.PI * k) * 0.8;
  } else if (G.kind === 'highfive') {
    const H = highfivePhase(u), [a, b] = left, sa = a.play.spot, sb = b.play.spot;
    const dx = sb[0] - sa[0], dz = sb[1] - sa[1], d = Math.hypot(dx, dz) || 1;
    const walk = Math.max(0, d / 2 - PLAY_LOOK.hfNear) * H.near;   // each walks this far toward the other
    left.forEach((R, i) => {
      const s = i ? -1 : 1, root = R.robot.root;
      root.position.x = R.play.spot[0] + (s * dx / d) * walk; root.position.z = R.play.spot[1] + (s * dz / d) * walk;
      R.play.turn = (i ? 1 : -1) * HIGHFIVE_T.turn * H.up;   // a little to the front: the inner hands meet between them
    });
    if (!G.mark) {
      G.mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFrom(pachinCanvas()), transparent: true, depthTest: false }));
      G.mark.renderOrder = 6; G.mark.scale.set(1.5, 0.96, 1); G.mark.userData.playMark = true; scene.add(G.mark);
    }
    G.mark.visible = H.slap;
    if (H.slap) { G.mark.position.copy(playHand(a.robot, 'L', playV[0])).add(playHand(b.robot, 'R', playV[1])).multiplyScalar(0.5); G.mark.position.y += 0.6; }
  }
}
const playIdle = (R, st, now) => R.def.kind === 'main' && st.state === 'idle' && Number.isFinite(st.since) && st.since > 0
  && now - st.since >= PLAY.idleMs && !LIVE.leaving[R.def.id] && !R.robot.call && !R.path.length && !R.playBack && !R.play && !R.solo && !R.brk && !R.shred && !R.git;   // nothing starts on the way to the shredder or the git box (2.3.4)
/* Why a robot stops (null: it does not): the reasons the requester's "walked up and went back" can be told by. Only a
   desk in another room stops it now; a desk that moves within the room (another session came or went and the room
   was laid out again — common with many sessions) no longer does: it walks back to the new desk afterwards. */
function playStopReason(R, st, room, since) {
  if (!robots.includes(R)) return 'gone';
  if (LIVE.leaving[R.def.id]) return 'leaving';
  if (R.robot.call) return 'call';
  if (st.state !== 'idle') return `state:${st.state}`;
  if (st.since !== since) return 'updated';
  if (R.def.room !== room) return 'room';
  return null;
}
function playLog(G, reason, nowSec) {
  PLAY.ends.push({ room: G.room, kind: G.kind, players: G.players.map((R) => R.def.id), reason, playedSec: G.t0 ? +(nowSec - G.t0).toFixed(1) : 0 });
  if (PLAY.ends.length > 30) PLAY.ends.shift();
}
function playStop(R) {
  if (!R.play) return;
  R.play = null; R.robot.play = null; R.playBack = true;
  if (R.robot.desk) R.robot.desk.visible = false;
  const p = R.robot.root.position, from = roomAtPoint([p.x, p.z]);
  R.path = from && from !== R.def.room ? [...liveRoute(from, R.def.room), R.def.pos] : [R.def.pos];   // never through a wall
}
function playEnd(G) {
  for (const R of G.players) playStop(R);
  if (G.ball) { scene.remove(G.ball); G.ball.geometry.dispose(); G.ball.material.dispose(); }
  if (G.mark) { scene.remove(G.mark); G.mark.material.map.dispose(); G.mark.material.dispose(); }
  PLAY.list.splice(PLAY.list.indexOf(G), 1);
}
/* The game's room laid out again (another room came or went, its robot count changed its size): the spot and the
   players move with it, as a jump (the e2e wall check skips jumps, as it does for livePlan's), and the game goes on.
   Without it the spot and the players stayed where the room had been — inside a wall of the new layout. */
// ball and highfive (2.3.3): farther apart, so the ball's flight shows and the two can walk toward each other (playMove)
const playSpotOf = (rm, side, kind) => [(rm.x0 + rm.x1) / 2 + (side ? 1 : -1) * (PLAY_LOOK.gap[kind] || 0.8), rm.z1 - 0.9];
function playFollowRoom(G) {
  const rm = PROJECT[G.room];
  if (!rm) return;
  const rect = `${rm.x0},${rm.z0},${rm.x1},${rm.z1}`;
  if (rect === G.rect) return;
  G.rect = rect;
  G.players.forEach((R, i) => {
    if (!R.play) return;
    const to = playSpotOf(rm, i, G.kind), dx = to[0] - R.play.spot[0], dz = to[1] - R.play.spot[1];
    const root = R.robot.root;
    root.position.x += dx; root.position.z += dz;
    R.path = R.path.map((p) => [p[0] + dx, p[1] + dz]);
    R.play.spot = to;
    R.jumps = (R.jumps || 0) + 1;
  });
}
function playTick(nowSec, now) {
  // stop at once: every frame
  for (const G of [...PLAY.list]) {
    playFollowRoom(G);
    let why = null;
    for (const R of G.players) {
      if (!R.play) continue;
      const reason = playStopReason(R, robotState[R.def.id] || { state: 'idle' }, G.room, R.play.since);
      if (reason) { playStop(R); why = why || `${R.def.id} ${reason}`; }
    }
    const left = G.players.filter((R) => R.play);
    playClock(G, nowSec);
    const end = left.length < 2 ? `alone (${why || 'partner stopped'})` : G.t0 && nowSec >= G.until ? 'done'
      : !G.t0 && nowSec >= G.walkUntil ? 'walk too long' : null;
    if (end) { playLog(G, end, nowSec); G.players = left; playEnd(G); continue; }
    if (G.t0) playMove(G, left, nowSec);
  }
  if (reduceMotion || nowSec < PLAY.next) return;
  const n = rollsDue(PLAY, nowSec);
  if (!PLAY.rng) PLAY.rng = snackRandom.call(null, PLAY.seed);
  if (PLAY.list.length >= PLAY.games) return;
  const byRoom = {};
  for (const R of robots) {
    const st = robotState[R.def.id];
    if (!st || !playIdle(R, st, now) || (R.restUntil || 0) > nowSec) continue;
    (byRoom[R.def.room] = byRoom[R.def.room] || []).push(R);
  }
  for (const [room, idle] of Object.entries(byRoom)) {
    if (PLAY.list.length >= PLAY.games || idle.length < 2 || PLAY.list.some((G) => G.room === room) || !PROJECT[room]) continue;
    if (robots.some((R) => R.def.room === room && R.def.standing)) continue;   // a full room: no aisle to play in
    if (PLAY.rng() >= chanceIn(PLAY.p, n)) continue;
    const a = idle.splice(Math.floor(PLAY.rng() * idle.length), 1)[0], b = idle[Math.floor(PLAY.rng() * idle.length)];
    const rm = PROJECT[room];
    const kind = PLAY.kinds[Math.floor(PLAY.rng() * PLAY.kinds.length)];
    const len = PLAY.minSec + PLAY.rng() * (PLAY.maxSec - PLAY.minSec);
    PLAY.count = (PLAY.count || 0) + 1;
    const G = { room, kind, players: [a, b], t0: 0, len, until: 0, walkUntil: nowSec + PLAY.walkSec, ball: null, rect: `${rm.x0},${rm.z0},${rm.x1},${rm.z1}`, seed: PLAY.seed + PLAY.count };
    [a, b].forEach((R, i) => {
      const spot = playSpotOf(rm, i, kind);
      R.play = { phase: 'going', spot, partner: i ? a : b, since: robotState[R.def.id].since, len, kind };
      R.path = [spot];
      R.restUntil = nowSec + PLAY.walkSec + len + PLAY.restMinSec + PLAY.rng() * (PLAY.restMaxSec - PLAY.restMinSec);
    });
    PLAY.list.push(G);
  }
  soloTick(nowSec, now);
}
/* Alone (requester, 10-18: "一人の部屋のやつはzzzで居眠りしたり弁当食べたりさせてほしい"): a robot idle for long that has
   no one to play with in its room naps (its head nods, zzz) or eats a bento at its desk, for a while. It stops on the
   same reasons as a game. The state, its lamp and its label stay as they are; it never leaves its desk. */
function soloStop(R) { R.solo = null; R.robot.solo = null; }
function soloTick(nowSec, now) {
  for (const R of robots) {
    if (!R.solo) continue;
    const st = robotState[R.def.id] || { state: 'idle' };
    const reason = playStopReason(R, st, R.solo.room, R.solo.since) || (nowSec >= R.solo.until ? 'done' : null) || (R.path.length ? 'walking' : null);
    if (reason) { PLAY.ends.push({ room: R.solo.room, kind: R.solo.kind, players: [R.def.id], reason, playedSec: +(nowSec - R.solo.t0).toFixed(1) }); soloStop(R); }
  }
  if (reduceMotion || nowSec < (SOLO.next || 0)) return;
  const n = rollsDue(SOLO, nowSec);
  const byRoom = {};
  for (const R of robots) {
    const st = robotState[R.def.id];
    if (st && playIdle(R, st, now)) (byRoom[R.def.room] = byRoom[R.def.room] || []).push(R);
  }
  for (const [room, idle] of Object.entries(byRoom)) {
    // with two or more a game comes first; one left over (or alone) may nap or eat
    if (idle.length !== 1) continue;
    const R = idle[0];
    if ((R.restUntil || 0) > nowSec || PLAY.rng() >= chanceIn(SOLO.p, n)) continue;
    const kind = SOLO.kinds[Math.floor(PLAY.rng() * SOLO.kinds.length)], len = SOLO.minSec + PLAY.rng() * (SOLO.maxSec - SOLO.minSec);
    R.solo = { kind, room, t0: nowSec, until: nowSec + len, since: robotState[R.def.id].since };
    R.robot.solo = { kind, t0: nowSec };
    R.restUntil = nowSec + len + PLAY.restMinSec + PLAY.rng() * (PLAY.restMaxSec - PLAY.restMinSec);
  }
}
// All the players there: the game's clock starts now (playTick; and in the frame the last one arrived, liveUpdateRobots).
function playClock(G, nowSec) {
  const left = G.players.filter((R) => R.play);
  if (left.length >= 2 && !G.t0 && left.every((R) => R.play.phase === 'playing')) {
    G.t0 = nowSec; G.until = nowSec + G.len;
    left.forEach((R, i) => { R.robot.play = { kind: G.kind, t0: nowSec, side: i, seed: G.seed }; });
  }
}
function liveUpdateRobots(nowSec, dt) {
  if (SOURCE.layoutRev !== LIVE3D.rev) liveSync();
  liveLinks(latestModel, nowSec);
  const nowMs = performance.now();
  // Walking uses the real time between frames, not the animation's capped step: a slow frame rate
  // must not slow the walk down.
  // No cap: a step only ever moves along the path and stops at its end (liveWalk), so even a gap of minutes (a hidden
  // tab, rAF stopped) only brings each walk to where it was going - where it would have been anyway.
  const walkDt = LIVE3D.lastWalk ? Math.max(0, (nowMs - LIVE3D.lastWalk) / 1000) : 0;
  LIVE3D.lastWalk = nowMs;
  snackTick(nowSec);
  const now = vizNow();
  playTick(nowSec, now);
  brkTick(nowSec, now);
  gitTick(nowSec);   // the box (2.3.4): trips to the box and back
  const calls = callsByLabel();
  for (const R of [...robots]) {
    const st = robotState[R.def.id] || { state: 'idle', act: '' };
    liveTagName(R);
    liveCallTag(R, calls[R.def.id] || null);
    setRobotTired(R.robot, forced(R.robot, 'tired', R.def.kind === 'main' && isTired(sinceOf(R.def.id), now)));
    R.robot.heavy = forced(R.robot, 'heavy', heavyOf(R.def.id));   // one look per cause while it works (the robot decides when)
    shredTick(R, st, nowSec);
    const how = liveWalk(R, walkDt, nowMs, nowSec);
    if (how === 'gone') continue;
    if (how === 'shredding') shredAt(R, nowSec);
    const playing = !!(R.play || R.playBack || R.brk || R.shred);
    R.robot.lampState = playing || R.git ? st.state : null;   // to, at and back from play, a break, the shredder or the box: the real state's lamp
    const vis = R.git ? gitLook(R) : how === 'walking' ? (playing ? 'stroll' : 'carry') : how === 'playing' || how === 'shredding' ? 'idle' : st.state;
    if (vis !== R.robot.state) setRobotState(R.robot, vis);
    // a subagent called: the whistle from the call's start until its fixed end, only at the desk (10-20)
    R.robot.launch = forced(R.robot, 'launch', !!(st.whistle && vizNow() < st.whistle.until) && !playing && !R.git && how !== 'walking' && !R.path.length);
    if (vis === 'reading') R.robot.readKind = st.readKind || null;   // kept after it: the dictionary fades out as it came (10-20)
    // over its head: the errand under way says its own line (one robot never runs both, gitTick / shredTick); else, of
    // what it deleted (SHRED.labelMs after) and the box's line (GITBOX.showMs after), the newer one; else what it does
    const shredLine = st.shred && (R.shred || vizNow() - st.shred.at < SHRED.labelMs) ? `${st.shred.ok ? 'シュレッダー' : '削除できず'} ${st.shred.label}` : '';
    const gitLine = gitSaid(R, st);
    const act = R.shred ? shredLine : R.git ? gitLine || st.act
      : shredLine && gitLine ? (st.shred.at >= (st.git.at || 0) ? shredLine : gitLine) : shredLine || gitLine || st.act;
    if (act !== R.act) { R.act = act; R.text.textContent = act; }
    updateRobot(R.robot, nowSec, dt);
    if (R.tiltUntil && R.robot.head) {   // a deletion that found nothing: a puzzled tilt of the head
      const left = R.tiltUntil - nowSec;
      R.robot.head.rotation.z = left > 0 ? Math.sin(Math.min(1, (1.6 - left) / 0.3) * Math.PI / 2) * 0.32 * Math.min(1, left / 0.3) : 0;
      if (left <= 0) R.tiltUntil = 0;
    }
  }
  for (const G of PLAY.list) playClock(G, nowSec);   // the last player arrived this frame: the game starts in it
  if (SOURCE.layoutRev !== LIVE3D.rev) liveSync();   // a robot walked out this frame: the room counts it out now
  propsTick(nowSec, dt);
  shredBits(nowSec, dt);
  if (LIVE3D.afterFrame) LIVE3D.afterFrame(nowSec);   // a test's recorder of the frame's outcome (80-dbg.js), else none
}
/* One room at a time (requester, 10-18): a project picked (its room's tag, its floor in 3D, the menu) lays out only
   that room, wider (layoutRooms, SOLO_GROW), with the way back at the top left. The other rooms' robots keep their
   desks for when the floor comes back. */
const liveSolo = () => (SOURCE.mode === 'live' ? soloRoomId() : null);
function liveSoloSync() {
  const solo = liveSolo();
  for (const [id, R] of Object.entries(LIVE3D.rooms)) { const on = !solo || id === solo; R.group.visible = on; R.rt.el.hidden = !!solo; }   // alone, its name is in the box
  for (const R of robots) {
    const p = R.robot.root.position, on = !solo || R.def.room === solo || roomAtPoint([p.x, p.z]) === solo;
    R.robot.root.visible = on; R.tag.hidden = !on;
  }
  const box = document.getElementById('room-solo');
  if (!box) return;
  box.hidden = !solo || !has3D || TOWER.on || zoom.zoomed || ds.open || pr.open;   // the data server's sheet covers it (2.3.5)
  if (solo) setText(document.getElementById('room-solo-name'), PROJECT[solo].name);
  const call = document.getElementById('room-call');
  if (call) call.hidden = SOURCE.mode !== 'live';   // the call bell's keyboard way in (2.3.5); the demo has no folder
}
/* ---------- the room up close: a water server, a robot vacuum and a wooden floor (requester, 10-18) ----------
   Only in the one-room view (room-solo) and only while that room has 10 robots or fewer; built when it is wanted and
   disposed as soon as it is not (back to the floor, the building, an 11th robot). The floor's own material is swapped
   for a toon material with a canvas plank texture (512 px, repeated; no image, no light, no shadow) and put back.
   2.3.3 (requester, 10-19): a glass smoking booth and a vending machine come with them, on the same rule (the one-room
   view, PROPS.max robots or fewer); robots on a break walk to them (BRK below). Where the three stand: propsPlace. */
const PROPS = { max: 10, room: null, geo: null, dark: null, group: null, server: null, vac: null, woodMat: null, woodTex: null, floorMat: null,
  boxes: [], boxesAt: 0, rng: null, seed: 20261020, speed: 0.45, radius: 0.64, serverScale: 1.9,   // the robots' scale (they stand about 1 m)
  place: null, booth: null, vend: null, fan: null, smoke: [], shredder: null, bits: [], gitDesk: null, gitFill: null, bell: null, dataServer: null, serverDoor: null };
const PROPS_EMPTY = { room: null, geo: null, dark: null, group: null, server: null, vac: null, woodMat: null, woodTex: null, floorMat: null, boxes: [], boxesAt: 0,
  place: null, booth: null, vend: null, fan: null, smoke: [], shredder: null, bits: [], gitDesk: null, gitFill: null, bell: null, dataServer: null, serverDoor: null };
function woodTexture(dark) {
  const N = 512, cv = makeCanvas(N, N), ctx = cv.getContext('2d'), W = { rng: snackRandom(PROPS.seed) };   // the same planks every time
  const base = dark ? [92, 72, 55] : [214, 184, 146], rows = 8, h = N / rows;
  for (let r = 0; r < rows; r++) {
    let x = -Math.floor(W.rng() * N);
    while (x < N) {
      const len = N * (0.45 + W.rng() * 0.5), k = (W.rng() - 0.5) * (dark ? 14 : 22);
      ctx.fillStyle = `rgb(${base.map((c) => Math.round(c + k)).join(',')})`;
      ctx.fillRect(x, r * h, len, h);
      ctx.globalAlpha = dark ? 0.10 : 0.12;   // a few faint grain lines along the plank
      ctx.strokeStyle = dark ? '#2b2018' : '#8a6a45'; ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) { const y = r * h + 6 + W.rng() * (h - 12); ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + len / 3, y + (W.rng() - 0.5) * 6, x + len * 2 / 3, y + (W.rng() - 0.5) * 6, x + len, y); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = dark ? '#2a1f17' : '#9c7b55'; ctx.fillRect(x, r * h, 2, h);   // the joint at the plank's end
      x += len;
    }
    ctx.fillStyle = dark ? '#2a1f17' : '#a5845c'; ctx.fillRect(0, r * h, N, 2);       // the seam between rows
  }
  const t = texFrom(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function propsWanted() {
  const solo = liveSolo();
  if (!solo || !has3D || TOWER.on || !LIVE3D.rooms[solo]) return null;
  return robots.filter((R) => R.def.room === solo).length <= PROPS.max ? solo : null;
}
function propsClear() {
  if (!PROPS.room) return;
  for (const Q of robots) if (Q.shred) shredStop(Q);   // an errand to a shredder that is going away ends here
  const R = LIVE3D.rooms[PROPS.room];
  if (R && PROPS.floorMat && R.floor.material === PROPS.woodMat) R.floor.material = PROPS.floorMat;
  if (PROPS.group) { scene.remove(PROPS.group); disposeTree(PROPS.group); }
  if (PROPS.woodMat) PROPS.woodMat.dispose();
  if (PROPS.woodTex) PROPS.woodTex.dispose();
  if (PROPS.shredder) { PROPS.shredder.bit.geo.dispose(); PROPS.shredder.bit.mat.dispose(); }   // shared by bits that may all be gone
  Object.assign(PROPS, PROPS_EMPTY, { boxes: [], smoke: [], bits: [] });
}
function propsBuild(id) {
  const r = PROJECT[id], R = LIVE3D.rooms[id], g = new THREE.Group();
  PROPS.room = id; PROPS.geo = R.geo; PROPS.dark = isDark(); PROPS.group = g; PROPS.rng = snackRandom(PROPS.seed);
  // the floor: the same mesh, a wooden material while the room is up close
  PROPS.woodTex = woodTexture(PROPS.dark); PROPS.woodTex.repeat.set((r.x1 - r.x0) / 2.4, (r.z1 - r.z0) / 2.4);
  PROPS.woodMat = toon('#ffffff', { map: PROPS.woodTex }); PROPS.floorMat = R.floor.material; R.floor.material = PROPS.woodMat;
  // the water server: the back-right corner (propsPlace), in sight from the usual view
  const P = PROPS.place = propsPlace(r);
  const sv = new THREE.Group(), body = toon('#eef1f4'), dark = toon('#5b6573');
  const cab = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.95, 0.38, 2, 0.04), body); cab.position.y = 0.475; sv.add(cab);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.02), dark); panel.position.set(0, 0.72, 0.2); sv.add(panel);
  for (const [x, c] of [[-0.07, '#4aa3ff'], [0.07, '#ff6b5b']]) { const tap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.06), toon(c)); tap.position.set(x, 0.66, 0.22); sv.add(tap); }
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.12), dark); tray.position.set(0, 0.5, 0.2); sv.add(tray);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.42, 20), toon('#8fd0f2', { transparent: true, opacity: 0.82 }));
  tank.position.y = 0.95 + 0.21; sv.add(tank);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), toon('#2f7fd1')); cap.position.y = 1.39; sv.add(cap);
  sv.scale.setScalar(PROPS.serverScale);   // built at 1, shown bigger (requester, 10-18: the robots' size)
  sv.position.set(P.server.x, 0, P.server.z); sv.rotation.y = P.server.ry; g.add(sv); PROPS.server = sv;
  PROPS.booth = boothBuild(P.booth); g.add(PROPS.booth);
  PROPS.vend = vendBuild(P.vend); g.add(PROPS.vend);
  // the robot vacuum: a flat disc with a bumper and a light, on the floor clear of desks, robots and the front aisle
  const vac = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(PROPS.radius, PROPS.radius, 0.11, 32), toon('#3a3f47')); shell.position.y = 0.065; vac.add(shell);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(PROPS.radius * 0.74, PROPS.radius * 0.74, 0.02, 28), toon('#5d6470')); top.position.y = 0.13; vac.add(top);
  const bumper = new THREE.Mesh(new THREE.CylinderGeometry(PROPS.radius * 1.02, PROPS.radius * 1.02, 0.04, 32, 1, true, -Math.PI / 2, Math.PI), toon('#9aa3ad')); bumper.position.y = 0.05; vac.add(bumper);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), toon('#52e08a')); lamp.position.set(0, 0.145, PROPS.radius * 0.5); vac.add(lamp);
  vac.userData.heading = PROPS.rng() * Math.PI * 2;
  g.add(vac); PROPS.vac = vac;
  PROPS.shredder = shredderBuild(r, g);
  gitDeskBuild(id, g);   // the cardboard box on its desk (2.3.4)
  PROPS.bell = bellBuild(P.callButton); g.add(PROPS.bell);   // the call bell (2.3.5)
  if (dataServerWanted(id)) PROPS.dataServer = dataServerBuild(P.dataServer, g);   // the rack (2.3.5)
  if (serverDoorWanted(id)) PROPS.serverDoor = serverDoorBuild(P.serverDoor, g);   // the server room's door
  propsBoxes(0, true);
  const start = propsSpot();
  vac.position.set(start[0], 0, start[1]);
  scene.add(g);
}
// Where the vacuum may go: the room's floor less the front aisle (doors, the play spot, the easel) and the corner of the
// water server; and never into a robot or its desk (their boxes, kept current while robots come and go).
function propsArea() {
  const r = PROJECT[PROPS.room];
  return { x0: r.x0 + 0.3, x1: r.x1 - 0.3, z0: r.z0 + 0.3, z1: r.z1 - SEAT.aisleF - 0.1 };
}
function propsBoxes(nowSec, force) {
  if (!force && nowSec - PROPS.boxesAt < 0.25) return;
  PROPS.boxesAt = nowSec;
  const box = new THREE.Box3();
  PROPS.boxes = robots.filter((R) => R.robot.root.visible && (R.def.room === PROPS.room || roomAtPoint([R.robot.root.position.x, R.robot.root.position.z]) === PROPS.room))
    .map((R) => { box.setFromObject(R.robot.root); return [box.min.x, box.max.x, box.min.z, box.max.z]; });
  if (PROPS.shredder) PROPS.boxes.push(PROPS.shredder.box);
  if (PROPS.dataServer) PROPS.boxes.push(PROPS.place.dataServer.rect);
  if (PROPS.serverDoor) PROPS.boxes.push(PROPS.place.serverDoor.rect);   // the floor in front of the server room's door
  const s = PROPS.server.position;
  const half = 0.42 * PROPS.serverScale;
  PROPS.boxes.push([s.x - half, s.x + half, s.z - half, s.z + half]);
  const P = PROPS.place;   // the booth and the machine with the spot in front of it (10-19), the box's desk (2.3.4)
  PROPS.boxes.push([P.booth.x0, P.booth.x1, P.booth.z0, P.booth.z1], [P.vend.x0, P.vend.x1, P.vend.z0, P.vend.spot[1] + 0.3], P.git.rect, P.callButton.rect);
}
function propsClearAt(x, z) {
  const a = propsArea(), m = PROPS.radius + 0.06;
  if (x < a.x0 || x > a.x1 || z < a.z0 || z > a.z1) return false;
  return !PROPS.boxes.some(([x0, x1, z0, z1]) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m);
}
function propsSpot() {
  const a = propsArea();
  for (let i = 0; i < 200; i++) {
    const x = a.x0 + PROPS.rng() * (a.x1 - a.x0), z = a.z0 + PROPS.rng() * (a.z1 - a.z0);
    if (propsClearAt(x, z)) return [x, z];
  }
  return [a.x1, a.z1];
}
/* ---------- the call bell (2.3.5, requester 10-19: 「ロボット呼び出しボタンを部屋に置いて、そのボタン押したらそのプロジェクトで
   新規セッション呼び出すためのスクリプトコピーできるダイアログ出してほしい」) ----------
   A desk bell on a slim stand, one of PROPS (the one-room view only), in the strip along the back wall that no desk
   takes (z0 to z0 + SEAT.back): BELL.x from the back-left corner, past the smoking booth (BOOTH.w) and short of the
   shredder near the middle. No robot walks to it: a click (or the header's button, 50-panel.js) opens the dialog with
   the command to copy; viz runs nothing (callcmd.py). Its footprint is propsPlace's bell row, in the breaks arm's 12
   room configs with the others (row callButton; b8's data server, row dataServer, stands just to its right), and the vacuum keeps off it (propsBoxes). */
const BELL = { x: 3.3, z: 0.5, w: 0.36, h: 1.0 };
function bellSpot(r) {
  const x = r.x0 + BELL.x, z = r.z0 + BELL.z, h = BELL.w / 2;
  return { x, z, rect: [x - h, x + h, z - h, z + h] };
}
function bellBuild(B) {
  const g = new THREE.Group(), metal = toon('#5b6370'), brass = toon('#d9a53a'), red = toon('#e5484d');
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.04, 20), metal); base.position.y = 0.02; g.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, BELL.h - 0.1, 12), metal); pole.position.y = (BELL.h - 0.1) / 2; g.add(pole);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 20), metal); top.position.y = BELL.h - 0.08; g.add(top);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), brass); dome.position.y = BELL.h - 0.06; g.add(dome);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 10), red); knob.position.y = BELL.h + 0.08; g.add(knob);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.18), new THREE.MeshBasicMaterial({ map: signTexture('呼び出し', '#e5484d', '#ffffff'), toneMapped: false }));
  sign.position.set(0, BELL.h - 0.32, 0.035); g.add(sign);
  g.position.set(B.x, 0, B.z);
  g.traverse((o) => { o.userData.callBell = true; });
  return g;
}
/* ---------- the cardboard box: git push / pull (2.3.4, requester 10-19) ----------
   "部屋拡大の時に…机おいてその上にダンボール箱を設置 Gitのプッシュとかの場合はダンボールにコミットしたコード量に応じて書類をロボットが
   入れに行く(表示でコミットしたブランチ名とか情報を出す) 逆にプルした時は箱から書類を持って机に帰る", "場所は真ん中じゃなくてもいいよ
   他のアイテムと被らないように気をつけてくれればはしっこでも良い".
   Where: one desk with a box, only in the one-room view (it is one of PROPS), against the left wall, its middle
   GITBOX.fromBack from the back wall: past the back-left corner (the smoking booth, BOOTH 2.6 x 2.0, and the point in
   front of its door, booth.way[0] = z1 + 0.7, kept clear by 0.5 as the breaks arm draws it), short of the cork board,
   the left door and the easel at the front left. The left strip is kept clear of desks (SEAT.left, SEAT_SOLO.left); no
   door, aisle or play spot is on it. It is one row of propsPlace (PROPS.place.git: desk, stand, rect), so the breaks
   arm's 12 room configs and gitDeskOverlaps both see it, and the vacuum keeps off it (propsBoxes).
   A trip, a break (or play) and the shredder's errand never share a robot: playIdle is false on a trip or an errand.
   Between a trip and an errand the one that comes second waits for the first to end — a trip while it is fresh
   (GITBOX.freshMs), a deletion up to SHRED.waitSec (then it is dropped). A deletion ends a break, a game or a nap
   instead (shredTick: work ends them). gitTick runs before shredTick in a frame, so both cannot start in one frame.
   What: the server's agent.git (gitbox.py: a push or a pull a session's Bash ran, its branch, commits and lines).
   A robot in the room up close walks to the box with a stack as thick as the push (1 to CARRY_MAX sheets), puts it in
   and walks back empty; for a pull it walks there empty and comes back with the stack. Nothing to pull (up to date):
   back empty. Rejected: it walks back with its stack. Its line over its head shows the trip's label for GITBOX.showMs.
   It stops at once — walking back — on a call, a question or a permission (waiting), an instruction (the server marks
   agent.git stopped, and keeps it for the card), leaving, or another trip, or the props going away; no trip starts while it plays, takes a break or feeds the shredder. */
const GITBOX = { fromBack: 4.0, half: [0.33, 0.66], stand: 0.95, atSec: 1.4, freshMs: 60_000, showMs: 20_000, ends: [] };
function gitDeskSpot(rm) {
  const x = rm.x0 + 0.48, z = rm.z0 + GITBOX.fromBack, [hx, hz] = GITBOX.half;
  return { desk: [x, z], stand: [x + GITBOX.stand, z], rect: [x - hx, x + hx, z - hz, z + hz] };
}
function gitDeskBuild(id, g) {
  const sp = PROPS.place.git, desk = new THREE.Group(), wood = toon('#b98a5e'), card = toon('#c99a62'), cardDark = toon('#a97c48');
  const [hx, hz] = GITBOX.half;
  const top = new THREE.Mesh(new RoundedBoxGeometry(hx * 2, 0.06, hz * 2, 1, 0.02), wood); top.position.y = 0.7; desk.add(top);
  for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.68, 0.06), wood); leg.position.set(lx * (hx - 0.06), 0.34, lz * (hz - 0.06)); desk.add(leg);
  }
  // the box: open at the top, four flaps out, the papers inside (their height is PROPS.gitFill)
  const box = new THREE.Group(); box.position.y = 0.73; desk.add(box);
  const bw = 0.5, bh = 0.32, bd = 0.62, t = 0.02;
  for (const [w, d, x, z] of [[bw, t, 0, -bd / 2], [bw, t, 0, bd / 2], [t, bd, -bw / 2, 0], [t, bd, bw / 2, 0]]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(w, bh, d), card); side.position.set(x, bh / 2, z); box.add(side);
  }
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(bw, t, bd), cardDark); bottom.position.y = t / 2; box.add(bottom);
  for (const [w, d, x, z, rx, rz] of [[bw, 0.16, 0, -bd / 2 - 0.07, -0.7, 0], [bw, 0.16, 0, bd / 2 + 0.07, 0.7, 0], [0.16, bd, -bw / 2 - 0.07, 0, 0, 0.7], [0.16, bd, bw / 2 + 0.07, 0, 0, -0.7]]) {
    const flap = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), cardDark); flap.position.set(x, bh, z); flap.rotation.set(rx, 0, rz); box.add(flap);
  }
  const papers = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.08, 1, bd - 0.1), toon('#f4efe3')); papers.position.y = t; box.add(papers);
  desk.position.set(sp.desk[0], 0, sp.desk[1]);
  desk.userData.gitDesk = true;
  g.add(desk);
  PROPS.gitDesk = { group: desk, papers };
  if (PROPS.gitFill === null) PROPS.gitFill = 0.35;
  gitFillShow();
}
function gitFillShow() {
  if (!PROPS.gitDesk) return;
  const h = Math.max(0.02, Math.min(1, PROPS.gitFill)) * 0.26, p = PROPS.gitDesk.papers;
  p.scale.y = h; p.position.y = 0.02 + h / 2;
}
/* How many sheets a trip carries: 1 to CARRY_MAX, by the lines it changed (added + removed), 0 for nothing. */
function gitSheets(trip) {
  if (!trip || ['uptodate', 'failed', 'deleted', 'unknown'].includes(trip.status)) return 0;
  if (trip.status === 'tag') return 1;
  const c = trip.counted || {}, lines = (c.ins || 0) + (c.dels || 0);
  if (!c.ins && !c.dels) return 3;   // not counted: a modest stack
  return Math.max(1, Math.min(CARRY_MAX, 1 + Math.round(Math.log2(1 + lines / 10))));
}
function gitEnd(entry) {
  GITBOX.ends.push(entry);
  if (GITBOX.ends.length > 30) GITBOX.ends.shift();
}
function gitStop(R, why, nowSec) {
  if (!R.git || (R.git.phase === 'back' && why !== 'relaid')) return;
  gitEnd({ id: R.def.id, kind: R.git.trip.kind, phase: R.git.phase, why, at: +nowSec.toFixed(1) });
  if (why === 'relaid') {   // its room was laid out again (a bigger room): a jump to its new desk, as a break's and livePlan's
    const root = R.robot.root;
    root.position.x = R.def.pos[0]; root.position.z = R.def.pos[1]; R.path = []; R.jumps = (R.jumps || 0) + 1;
    R.git = null;
    return;
  }
  R.git.phase = 'back'; R.git.stopped = why;
  const p = R.robot.root.position, from = roomAtPoint([p.x, p.z]);
  R.path = from && from !== R.def.room ? [...liveRoute(from, R.def.room), R.def.pos] : [R.def.pos];
}
// its room's rect and its seat: a change in the same room while on a trip is the room laid out again (a bigger room:
// the box's desk moves with it, the trip's way would not), and the trip stops with a jump to the new desk
// (docs/bugs/2026-10-19-jui-viz-git-trip-walks-to-the-old-box-when-the-room-grows.md). Another room is 'props': it walks
// back through the doors. So livePlan need not keep a trip's path: whatever it does to it, gitTick stops the trip in
// the same frame (measured 10-19: with or without that, the same jump to the same seat).
const gitLaid = (R) => { const rm = PROJECT[R.def.room]; return `${rm ? rectOf(rm) : ''}|${R.def.pos ? R.def.pos.join() : ''}`; };
// At the box: its time there starts (in the frame it arrived: liveWalk; gitTick for one that was there already).
function gitArrive(R, nowSec) {
  if (R.git && R.git.phase === 'going' && !R.path.length && nowSec !== undefined) { R.git.phase = 'at'; R.git.until = nowSec + GITBOX.atSec; }
}
function gitTick(nowSec) {
  for (const R of robots) {
    const st = robotState[R.def.id] || { state: 'idle' }, trip = st.git;
    if (R.git) {
      // stop at once: a call, waiting (a question or a permission), an instruction or another trip, leaving
      const why = R.robot.call ? 'call' : st.state === 'waiting' ? 'waiting' : !trip || trip.stopped ? 'cleared' : trip.id !== R.git.trip.id ? 'replaced'
        : LIVE.leaving[R.def.id] ? 'leaving' : R.def.room === R.git.room && gitLaid(R) !== R.git.laid ? 'relaid' : PROPS.room !== R.def.room ? 'props' : null;   // props: the box went away (the floor, a bigger room)
      if (why) gitStop(R, why, nowSec);
      if (!R.git) continue;   // relaid: at its new desk already
      gitArrive(R, nowSec);
      if (R.git.phase === 'at' && nowSec >= R.git.until) {
        const k = R.git.trip.kind, rejected = R.git.trip.status === 'rejected';
        if (k === 'push' && !rejected) { PROPS.gitFill = Math.min(1, (PROPS.gitFill || 0) + R.git.sheets / 30); R.git.sheets = 0; }
        if (k === 'pull') { R.git.sheets = gitSheets(R.git.trip); PROPS.gitFill = Math.max(0.05, (PROPS.gitFill || 0) - R.git.sheets / 30); }
        gitFillShow();
        gitEnd({ id: R.def.id, kind: k, phase: 'at', why: rejected ? 'rejected' : 'done', at: +nowSec.toFixed(1) });
        R.git.phase = 'back'; R.path = [R.def.pos];
      }
      if (R.git.phase === 'back' && !R.path.length) R.git = null;   // home
      continue;
    }
    if (!trip || trip.id === R.gitSeen || trip.pending) continue;
    if (trip.stopped) { R.gitSeen = trip.id; continue; }               // an instruction came before it could start
    const deskHere = PROPS.gitDesk && PROPS.room === R.def.room && !R.def.standing;
    // an old one (a reload) or no box in sight: its line only, never later; busy now (walking to a new desk, playing,
    // a call, a question, a break, the shredder): it waits — still fresh, the trip starts once the robot is free
    if (vizNow() - (trip.at || 0) > GITBOX.freshMs || !deskHere) { R.gitSeen = trip.id; continue; }
    if (R.play || R.playBack || R.brk || R.shred || R.solo || R.path.length || LIVE.leaving[R.def.id] || R.robot.call || st.state === 'waiting') continue;
    R.gitSeen = trip.id;
    const sp = PROPS.place.git;
    R.git = { trip, phase: 'going', desk: sp.desk, sheets: trip.kind === 'push' ? gitSheets(trip) : 0, t0: nowSec, room: R.def.room, laid: gitLaid(R) };
    R.path = [sp.stand];
  }
}
/* The robot's look on a trip: a stack while it carries (to the box for a push; back for a pull, or a rejected push). */
function gitLook(R) {
  const g = R.git, push = g.trip.kind === 'push', rejected = g.trip.status === 'rejected';
  R.robot.carrySheets = g.phase === 'back' ? (push ? (rejected ? gitSheets(g.trip) : 0) : g.sheets) : push ? gitSheets(g.trip) : 0;
  if (g.phase === 'at') return push ? 'carry' : 'idle';
  return R.robot.carrySheets > 0 ? 'carry' : 'stroll';
}
/* The line over the robot: the trip's label while it is on its way, and for GITBOX.showMs after the push / pull. */
function gitSaid(R, st) {
  const trip = st.git;
  if (!trip || !trip.label || (trip.stopped && !R.git)) return '';
  return R.git || vizNow() - (trip.at || 0) < GITBOX.showMs ? trip.label : '';
}
/* What the box's desk overlaps in its room (the arm, and dd's check against the smoking room when it lands). */
function gitDeskOverlaps() {
  if (!PROPS.gitDesk || !PROPS.room) return null;
  const rm = PROJECT[PROPS.room], P = PROPS.place, G = P.git, out = [];
  const box = (q, r) => [q[0] - r, q[0] + r, q[1] - r, q[1] + r], stand = box(G.stand, 0.5);
  const hit = (name, a) => {
    for (const [who, b] of [['desk', G.rect], ['stand', stand]]) if (b[0] < a[1] && b[1] > a[0] && b[2] < a[3] && b[3] > a[2]) out.push(`${who} x ${name}`);
  };
  hit('server', box([P.server.x, P.server.z], P.server.half));
  for (const R of robots) if (R.def.room === PROPS.room && R.def.pos && !R.def.standing) {
    const [px, pz] = R.def.pos, F = SEAT.foot;
    hit(`desk ${R.def.id}`, [px - F.l, px + F.r, pz - F.b, pz + F.f]);
  }
  const da = doorAt(rm), dh = DOOR_W / 2 + 0.3;
  if (rm.doors && rm.doors.left) hit('left door', [rm.x0 - 0.2, rm.x0 + 1.2, da.leftZ - dh, da.leftZ + dh]);
  if (rm.doors && rm.doors.back) hit('back door', [da.backX - dh, da.backX + dh, rm.z0 - 0.2, rm.z0 + 1.2]);
  if (rm.doors && rm.doors.front) hit('entrance', [da.frontX - dh, da.frontX + dh, rm.z1 - 1.2, rm.z1 + 0.2]);
  for (const side of [0, 1]) { const p = playSpotOf(rm, side); hit(`play ${side}`, [p[0] - 0.6, p[0] + 0.6, p[1] - 0.6, p[1] + 0.6]); }
  if (rm.tests) hit('easel', [rm.x0 + 0.15, rm.x0 + 2.15, rm.z1 - 1.5, rm.z1 - 0.3]);
  const kw = Math.min(rm.z1 - rm.z0 - 1.4, 2.6), cz = (rm.z0 + rm.z1) / 2;
  const kz = rm.doors && rm.doors.left ? Math.min(cz, da.leftZ - DOOR_W / 2 - 0.25 - kw / 2) : cz;
  hit('cork board', [rm.x0 - 0.1, rm.x0 + 0.9, kz - kw / 2, kz + kw / 2]);
  // the smoking booth and the vending machine (2.3.3, propsPlace) with the walks to them, drawn as the breaks arm draws them
  hit('smoking booth', [P.booth.x0, P.booth.x1, P.booth.z0, P.booth.z1]);
  hit('booth way', box(P.booth.way[0], 0.5));
  hit('vending machine', [P.vend.x0, P.vend.x1, P.vend.z0, P.vend.z1]);
  hit('vend customer', box(P.vend.spot, 0.5));
  hit('vend way', box(P.vend.way[0], 0.5));
  hit('shredder', P.shredder.box);
  hit('shredder spot', box(P.shredder.spot, 0.5));
  const [x0, x1, z0, z1] = G.rect;
  return { rect: G.rect, stand: G.stand, room: [rm.x0, rm.x1, rm.z0, rm.z1], inRoom: x0 >= rm.x0 && x1 <= rm.x1 && z0 >= rm.z0 && z1 <= rm.z1, overlaps: out };
}
function propsTick(nowSec, dt) {
  const want = propsWanted();
  if (PROPS.room && (want !== PROPS.room || LIVE3D.rooms[PROPS.room].geo !== PROPS.geo || isDark() !== PROPS.dark || dataServerWanted(PROPS.room) !== !!PROPS.dataServer || serverDoorWanted(PROPS.room) !== !!PROPS.serverDoor)) propsClear();
  if (!want) return;
  if (!PROPS.room) propsBuild(want);
  propsBoxes(nowSec, false);
  dataServerTick(nowSec);
  serverDoorTick(nowSec);
  if (reduceMotion) return;   // placed, not driven
  const v = PROPS.vac, p = v.position;
  if (!propsClearAt(p.x, p.z)) { const s = propsSpot(); p.set(s[0], 0, s[1]); return; }   // a robot sat down on it: start elsewhere
  const step = PROPS.speed * Math.min(dt, 0.1), h = v.userData.heading;
  const nx = p.x + Math.sin(h) * step, nz = p.z + Math.cos(h) * step;
  if (propsClearAt(nx, nz)) { p.x = nx; p.z = nz; v.rotation.y = h; }
  else v.userData.heading = h + Math.PI * (0.5 + PROPS.rng());   // a bump: turn away and try again next frame
}
/* ---------- breaks: a cigarette in the smoking booth, a drink from the vending machine (requester, 10-19) ----------
   「セッションが少ない時には部屋の隅っこに喫煙室作って待機中の時にたまにタバコ吸うようにして。これはbot１対でもやるし複数でもやる」,
   「部屋のbotが少ない時は自販機も設置して。たまにそこに行って飲み物を飲むパターンも追加で」, placement (10-19):
   「喫煙所は左上端、自販機はウォーターサーバーの横がいいかな」.
   Where (propsPlace; built with the room's other props, so only in the one-room view of a room with PROPS.max robots or
   fewer, and never on the floor or in the building):
   - the booth: the back-left corner (the top left of the usual view), BOOTH.w by BOOTH.d, its door in the front glass.
     The one-room view keeps that corner free of desks (SEAT_SOLO.left, 30-source-live.js).
   - the water server: the back-right corner, as before; the vending machine beside it on its left, facing the front.
     A room with a back door (near the right, doorAt) keeps the door's apron clear: the two stand BACK_DOOR_APRON in
     front of the back wall, still on the right. (The server's old place in such a room, the back-left corner, is the
     booth's now.) SEAT_SOLO.right keeps the machine's customer clear of the desks.
   Looks only, like play: the server, the panel's state and the lamp still say 待機. Once a second a main robot in that
   room, idle for PLAY.idleMs or more and not at play, a nap or a bento, may go (BRK.p per kind; a second smoker joins
   one already in the booth with BRK.joinP). At most BOOTH.seats in the booth and one at the machine; none in a room
   with standing robots (as play). Anything that stops a game stops a break at once (playStopReason: an instruction,
   a call, another state, leaving, another room), and so do the props going away or the room laid out again; it walks
   back with its real lamp (playBack), or jumps to its desk when the room was laid out again. None under reduced motion
   (as play). The e2e build can shorten the times (80-dbg.js). */
const BOOTH = { w: 2.6, d: 2.0, h: 2.3, door: 1.0, seats: 2 };
// taller than a robot, as a real one is than a person (requester, 10-19: 「自販機が小さい 人よりは背が高いのが普通でしょ」);
// the robots stand about 2.1 with the antenna (the e2e measures both)
const VEND = { w: 1.2, d: 0.9, h: 2.5 };
const BACK_DOOR_APRON = 1.3;
function propsPlace(r) {
  const backDoor = !!(r.doors && r.doors.back), zb = r.z0 + (backDoor ? BACK_DOOR_APRON : 0);
  const booth = { x0: r.x0, x1: r.x0 + BOOTH.w, z0: r.z0, z1: r.z0 + BOOTH.d };
  const bx = (booth.x0 + booth.x1) / 2;
  booth.ashtray = [bx, r.z0 + 0.6];
  booth.spots = [[booth.x0 + 0.6, r.z0 + 0.95, Math.PI / 2], [booth.x1 - 0.6, r.z0 + 0.95, -Math.PI / 2]];   // facing each other over the ashtray
  booth.way = [[bx, booth.z1 + 0.7], [bx, booth.z1 - 0.4]];   // in front of the door, then just inside it
  const server = { x: r.x1 - 0.42 * PROPS.serverScale, z: zb + 0.38 * PROPS.serverScale, ry: -Math.PI / 4, half: 0.55 };   // its footprint, turned
  const vx1 = server.x - server.half - 0.1;
  const vend = { x0: vx1 - VEND.w, x1: vx1, z0: zb + 0.05, z1: zb + 0.05 + VEND.d };
  vend.cx = (vend.x0 + vend.x1) / 2;
  vend.spot = [vend.cx, vend.z1 + 0.55, Math.PI];   // in front of it, facing it
  vend.way = [[vend.cx, vend.z1 + 1.3]];              // from the front: never round its corner
  return { booth, server, vend, backDoor, git: gitDeskSpot(r), shredder: shredderSpot(r), callButton: bellSpot(r), dataServer: dataServerSpot(r), serverDoor: serverDoorSpot(r) };   // the call bell (2.3.5, BELL)   // the git box's desk (2.3.4, GITBOX) and the shredder (10-19)   // the git box's desk (2.3.4, GITBOX)
}
function signTexture(text, bg, ink, w = 256, h = 96) {
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  ctx.fillStyle = bg; rr(ctx, 0, 0, w, h, 14); ctx.fill();
  ctx.fillStyle = ink; ctx.font = `${Math.round(h * 0.5)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 2);
  return texFrom(cv);
}
function boothBuild(B) {
  const g = new THREE.Group(), w = B.x1 - B.x0, d = B.z1 - B.z0, h = BOOTH.h, t = 0.06, fz = B.z1, rx = B.x1, dx = (B.x0 + B.x1) / 2, half = BOOTH.door / 2;
  const metal = toon('#4a515c');
  const glass = new THREE.MeshBasicMaterial({ color: 0xbfe6f5, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), toon('#9aa1ab')); base.position.set(dx, 0.02, B.z0 + d / 2); g.add(base);
  const bar = (bw, bh, bd, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), metal); m.position.set(x, y, z); g.add(m); };
  const pane = (pw, ph, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), glass); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); };
  for (const [x, z] of [[B.x0 + t / 2, fz - t / 2], [rx - t / 2, fz - t / 2], [rx - t / 2, B.z0 + t / 2], [dx - half, fz - t / 2], [dx + half, fz - t / 2]]) bar(t, h, t, x, h / 2, z);
  bar(w, t, t, dx, h, fz - t / 2); bar(w, t, t, dx, h, B.z0 + t / 2); bar(t, t, d, rx - t / 2, h, B.z0 + d / 2); bar(t, t, d, B.x0 + t / 2, h, B.z0 + d / 2);
  bar(BOOTH.door, t, t, dx, 1.95, fz - t / 2);   // over the door
  const lw = dx - half - B.x0, rw = rx - dx - half;
  pane(lw, h, B.x0 + lw / 2, h / 2, fz - 0.03, 0); pane(rw, h, dx + half + rw / 2, h / 2, fz - 0.03, 0); pane(BOOTH.door, h - 1.95, dx, (h + 1.95) / 2, fz - 0.03, 0);
  pane(d, h, rx - 0.03, h / 2, B.z0 + d / 2, Math.PI / 2);
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(w, d), glass); roof.rotation.x = -Math.PI / 2; roof.position.set(dx, h, B.z0 + d / 2); g.add(roof);   // glass: the view from above sees in
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.34), new THREE.MeshBasicMaterial({ map: signTexture('喫煙室', '#2b3340', '#ffffff'), toneMapped: false }));
  sign.position.set(dx, (h + 1.95) / 2, fz + 0.01); g.add(sign);
  // the ventilation fan on the back wall inside, turning (BRK's tick turns it)
  const fan = new THREE.Group(); fan.position.set(dx, 1.85, B.z0 + 0.06); g.add(fan);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 24, 1, true), toon('#d7dce3', { side: THREE.DoubleSide })); ring.rotation.x = Math.PI / 2; fan.add(ring);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12), toon('#3a3f47')); hub.rotation.x = Math.PI / 2; fan.add(hub);
  const blades = new THREE.Group(); fan.add(blades);
  for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.012), toon('#7d8794')); b.position.set(Math.cos(k * 2.094) * 0.13, Math.sin(k * 2.094) * 0.13, 0); b.rotation.z = k * 2.094; blades.add(b); }
  PROPS.fan = blades;
  // the ashtray stand between the two spots
  const [ax, az] = B.ashtray;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.03, 20), metal); foot.position.set(ax, 0.055, az); g.add(foot);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 10), metal); pole.position.set(ax, 0.45, az); g.add(pole);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.08, 20), toon('#aab3bd')); bowl.position.set(ax, 0.88, az); g.add(bowl);
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.01, 20), toon('#d8cfb8')); sand.position.set(ax, 0.92, az); g.add(sand);
  // the smoke: a fixed pool of soft sprites (BRK.puffs), nothing made while it runs; grey on the light wall, pale on the dark one
  const cv = makeCanvas(64, 64), ctx = cv.getContext('2d'), grd = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.55, 'rgba(255,255,255,0.8)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
  const puffTex = texFrom(cv);
  PROPS.smoke = [];
  for (let k = 0; k < BRK.puffs; k++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: PROPS.dark ? 0xd9dee5 : 0x8f98a3, transparent: true, opacity: 0, depthWrite: false }));
    s.visible = false; s.renderOrder = 4; g.add(s);
    PROPS.smoke.push({ s, age: 0, life: 1, size: 0.1, alpha: 0, vx: 0, vy: 0, vz: 0 });
  }
  return g;
}
function vendTexture() {
  const W = 256, H = 576, cv = makeCanvas(W, H), ctx = cv.getContext('2d');
  ctx.fillStyle = '#f6f8fb'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#d8343c'; ctx.fillRect(0, 0, W, 64);
  ctx.fillStyle = '#ffffff'; ctx.font = `34px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('のみもの', W / 2, 34);
  const colors = [['#1c2440', '#b6f03c'], ['#2f7fd1', '#ffffff'], ['#e8554e', '#fff3bf'], ['#2e9e5b', '#e1f1ef'], ['#7a4a2a', '#f3e6d4'], ['#f2b632', '#3b2410']];
  for (let row = 0; row < 3; row++) {
    const y = 84 + row * 128;
    ctx.fillStyle = '#e3eaf4'; ctx.fillRect(14, y, W - 28, 92);
    for (let k = 0; k < 4; k++) {
      const [body, band] = colors[(row * 4 + k) % colors.length], x = 24 + k * 56;
      rr(ctx, x, y + 10, 40, 74, 8); ctx.fillStyle = body; ctx.fill();
      ctx.fillStyle = band; ctx.fillRect(x, y + 36, 40, 16);
      ctx.fillStyle = '#41505f'; ctx.fillRect(x + 4, y + 98, 32, 12);   // the price
      ctx.fillStyle = '#ff5a4f'; ctx.beginPath(); ctx.arc(x + 20, y + 120, 5, 0, Math.PI * 2); ctx.fill();   // the button
    }
  }
  ctx.fillStyle = '#2b3340'; ctx.fillRect(W - 62, 470, 30, 44);   // the coin slot
  ctx.fillStyle = '#cfd6df'; ctx.fillRect(W - 54, 478, 14, 28);
  return texFrom(cv);
}
function vendBuild(V) {
  const g = new THREE.Group(), cz = (V.z0 + V.z1) / 2;
  const body = new THREE.Mesh(new RoundedBoxGeometry(VEND.w, VEND.h, VEND.d, 2, 0.04), toon('#d8343c')); body.position.set(V.cx, VEND.h / 2, cz); g.add(body);
  const ph = VEND.h - 0.55, pw = Math.min(VEND.w - 0.12, ph * 256 / 576);   // the texture's shape, a red frame round it
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: vendTexture(), toneMapped: false }));
  panel.position.set(V.cx, 0.42 + ph / 2, V.z1 + 0.006); g.add(panel);   // lit: no light needed
  const slot = new THREE.Mesh(new THREE.BoxGeometry(VEND.w - 0.3, 0.2, 0.04), toon('#1f242c')); slot.position.set(V.cx, 0.22, V.z1 + 0.01); g.add(slot);
  return g;
}
const BRK_TAG_TEXT = { smoke: 'タバコ休憩', vend: '飲み物を買いに' };
const BRK = { seed: 20261021, kinds: ['smoke', 'vend'], p: { smoke: 1 / 40, vend: 1 / 40 }, joinP: 1 / 6, smokeMinSec: 20, smokeMaxSec: 40,
  buySec: 2.4, drinkMinSec: 8, drinkMaxSec: 16, restMinSec: 60, restMaxSec: 180, walkSec: 30, puffs: 10, next: 0, last: 0, rng: null, ends: [] };
const brkTagText = (R) => (R.brk ? BRK_TAG_TEXT[R.brk.kind] || '' : '');
function brkPanelText(id) { const R = robots.find((x) => x.def.id === id); return R ? brkTagText(R) : ''; }   // the robot card (50-panel.js)
const brkCap = (kind) => (kind === 'smoke' ? BOOTH.seats : 1);
const rectOf = (rm) => `${rm.x0},${rm.z0},${rm.x1},${rm.z1}`;
function brkStart(R, kind, slot, nowSec) {
  const P = PROPS.place, st = robotState[R.def.id];
  const len = kind === 'smoke' ? BRK.smokeMinSec + BRK.rng() * (BRK.smokeMaxSec - BRK.smokeMinSec)
    : BRK.buySec + BRK.drinkMinSec + BRK.rng() * (BRK.drinkMaxSec - BRK.drinkMinSec);
  const spot = kind === 'smoke' ? P.booth.spots[slot] : P.vend.spot, way = kind === 'smoke' ? P.booth.way : P.vend.way;
  R.brk = { kind, slot, room: R.def.room, rect: rectOf(PROJECT[R.def.room]), since: st.since, phase: 'going', spot, way, len, t0: 0, until: 0, walkUntil: nowSec + BRK.walkSec };
  if (R.robot.gesture) endGesture(R.robot);
  R.path = [...way.map((q) => [q[0], q[1]]), [spot[0], spot[1]]];
  R.restUntil = nowSec + BRK.walkSec + len + BRK.restMinSec + BRK.rng() * (BRK.restMaxSec - BRK.restMinSec);
}
function brkStop(R, reason, nowSec) {
  const B = R.brk;
  BRK.ends.push({ room: B.room, kind: B.kind, who: R.def.id, reason, atSec: B.t0 ? +(nowSec - B.t0).toFixed(1) : 0 });
  if (BRK.ends.length > 30) BRK.ends.shift();
  // the way points it has passed, back out the same way (out of the booth's door, round the front of the machine)
  const reached = Math.min(B.way.length, B.way.length + 1 - R.path.length);
  R.brk = null; R.robot.brk = null;
  if (!robots.includes(R) || !R.def.pos) return;
  const root = R.robot.root;
  if (reason === 'relaid') {   // its room was laid out again (back to the floor, a bigger room): a jump to its desk, as livePlan's
    root.position.x = R.def.pos[0]; root.position.z = R.def.pos[1]; R.path = []; R.jumps = (R.jumps || 0) + 1;
    return;
  }
  const out = B.way.slice(0, Math.max(0, reached)).reverse().map((q) => [q[0], q[1]]);
  const from = roomAtPoint([root.position.x, root.position.z]);
  R.playBack = true;   // walking back: the real state's lamp, no papers (as from play)
  if (R.robot.desk) R.robot.desk.visible = false;
  R.path = from && from !== R.def.room ? [...out, ...liveRoute(from, R.def.room), R.def.pos] : [...out, R.def.pos];   // never through a wall
}
function brkAt(R, dt, nowSec) {
  const B = R.brk, root = R.robot.root;
  if (R.robot.desk) R.robot.desk.visible = false;
  if (B.phase === 'going') B.phase = 'at';
  brkClock(R, nowSec);   // in the frame it arrived (brkTick did it a frame later)
  // bought: it turns round to the room with the can (its back hid the can and the machine's panel from the usual view)
  const ry = B.kind === 'vend' && R.robot.brkHandKind === 'vend' ? 0 : B.spot[2];
  const turn = ((ry - root.rotation.y) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;   // the short way round
  root.rotation.y += turn * Math.min(1, dt * 6);
  return 'playing';
}
// At the booth or the machine: its clock starts (the cigarette, the can), once.
function brkClock(R, nowSec) {
  const B = R.brk;
  if (B && B.phase === 'at' && !B.t0 && nowSec !== undefined) { B.t0 = nowSec; B.until = nowSec + B.len; R.robot.brk = { kind: B.kind, t0: nowSec, buySec: BRK.buySec }; }
}
function brkTick(nowSec, now) {
  if (!BRK.rng) BRK.rng = snackRandom(BRK.seed);
  // stop at once: every frame
  for (const R of robots) {
    const B = R.brk;
    if (!B) continue;
    const st = robotState[R.def.id] || { state: 'idle' }, rm = PROJECT[B.room];
    const reason = playStopReason(R, st, B.room, B.since) || (!rm || !rm.shown || rectOf(rm) !== B.rect ? 'relaid' : null) || (PROPS.room !== B.room ? 'props' : null)
      || (B.phase === 'going' && nowSec >= B.walkUntil ? 'walk too long' : null) || (B.t0 && nowSec >= B.until ? 'done' : null);
    if (reason) { brkStop(R, reason, nowSec); continue; }
    brkClock(R, nowSec);
  }
  brkSmoke(nowSec);
  if (reduceMotion || nowSec < BRK.next) return;
  const n = rollsDue(BRK, nowSec);
  const room = PROPS.room;
  if (!room || !PROPS.place || robots.some((R) => R.def.room === room && R.def.standing)) return;
  const here = robots.filter((R) => R.def.room === room);
  for (const R of here) {
    const st = robotState[R.def.id];
    if (!st || !playIdle(R, st, now) || (R.restUntil || 0) > nowSec) continue;
    for (const kind of BRK.kinds) {
      const on = here.filter((x) => x.brk && x.brk.kind === kind);
      if (on.length >= brkCap(kind)) continue;
      if (BRK.rng() >= chanceIn(kind === 'smoke' && on.length ? BRK.joinP : BRK.p[kind], n)) continue;
      const used = new Set(on.map((x) => x.brk.slot));
      brkStart(R, kind, kind === 'smoke' ? [0, 1].find((k) => !used.has(k)) : 0, nowSec);
      break;
    }
  }
}
/* The smoke: from the cigarette's tip now and then, and out of the mouth after each puff (brkPuff); each sprite rises,
   grows and fades. Never more than BRK.puffs at once (a free sprite or none). */
const brkV = new THREE.Vector3();
function brkSmoke(nowSec) {
  const dt = Math.max(0, Math.min(0.1, nowSec - (BRK.last || nowSec)));
  BRK.last = nowSec;
  if (PROPS.fan && !reduceMotion) PROPS.fan.rotation.z += dt * 7;
  const pool = PROPS.smoke;
  if (!pool.length) return;
  for (const q of pool) {
    if (!q.s.visible) continue;
    q.age += dt;
    if (q.age >= q.life) { q.s.visible = false; continue; }
    const k = q.age / q.life;
    q.s.position.x += q.vx * dt; q.s.position.y += q.vy * dt; q.s.position.z += q.vz * dt;
    q.s.scale.setScalar(q.size * (1 + k * 1.2));
    q.s.material.opacity = q.alpha * (1 - k);
  }
  if (reduceMotion) return;
  for (const R of robots) {
    const B = R.robot.brk, hand = R.robot.brkHand;
    if (!B || B.kind !== 'smoke' || !hand || R.robot.call) continue;
    const c = (nowSec - B.t0) % BRK_PUFF_SEC, exhale = c >= 2.3 && c < 3.3;
    if (nowSec - (R.puffAt || 0) < (exhale ? 0.22 : 0.6)) continue;
    const q = pool.find((x) => !x.s.visible);
    if (!q) continue;
    R.puffAt = nowSec;
    const ry = R.robot.root.rotation.y, fw = exhale ? 0.25 : 0.03;
    if (exhale) { R.robot.head.getWorldPosition(brkV); brkV.x += Math.sin(ry) * 0.7; brkV.z += Math.cos(ry) * 0.7; brkV.y += 0.3; }   // in front of the face (HEAD.d)
    else hand.userData.tip.getWorldPosition(brkV);
    Object.assign(q, { age: 0, life: exhale ? 2.8 : 2.2, size: exhale ? 0.8 : 0.4, alpha: exhale ? 0.95 : 0.8,
      vx: Math.sin(ry) * fw + (BRK.rng() - 0.5) * 0.08, vy: 0.35, vz: Math.cos(ry) * fw + (BRK.rng() - 0.5) * 0.08 });
    q.s.position.copy(brkV); q.s.scale.setScalar(q.size); q.s.material.opacity = q.alpha; q.s.visible = true;
  }
}
/* ---------- the shredder: a robot that deleted files feeds them to it (requester, 10-19) ----------
   Claude Code deletes with Bash (rm, git rm, find -delete …); ingest reads which files from the command (robots.py
   deletions) and gives the robot a shred. In a room up close with its props (propsWanted) the robot carries the papers
   (a stack as thick as the count, a box for a folder) to the shredder against the back wall, feeds them, paper bits
   fall into the bin, and it goes back to its desk; a new instruction, a call or a question ends it at once. A deletion
   that found nothing: no errand, a puzzled tilt of the head. The name of what went is the robot's act (over its head,
   in its card and in the log). Not seen: a script that deletes from inside, or the user by hand. */
const SHRED = { w: 0.8, d: 0.55, h: 1.1, bitsMax: 24, feedSec: 1.2, bitsSec: 2.0, doneSec: 3.6, tiltSec: 1.6, labelMs: 8000, every: 0.07, scale: 1.35, waitSec: 15 };   // built at 1, shown at the robots' size (as the other props)
// where it stands (pure: propsPlace's row, so the breaks arm's 12 room configs see it next to the booth, the machine
// and the git box's desk; 2.3.4)
/* ---------- the data server (requester, 10-19; 2.3.5): a rack for a JsonUI room's API and DB specifications ----------
   「dbとapiのファイルがある場合は部屋にデータサーバーっぽいもの置いてそれクリックでDB仕様書とAPI仕様書みれるようにしてほしい」.
   With the room's other props (the one-room view, PROPS.max robots or fewer), only in a room whose docs/api or docs/db
   hold a specification (PROJECT[id].dataDocs, counted by the server: data_docs.counts); it comes and goes with them.
   Against the back wall, DATASRV.fromLeft from the room's left edge: right of the call button's stand (c2, 2.3.5),
   left of the shredder and its feeder in the smallest room. No robot walks to it. Pressed (liveHit: kind 'data'), the
   big sheet opens (50-panel.js openDataDocs) and the documents are read from the server then (POST /api/data-docs). */
const DATASRV = { fromLeft: 4.25, w: 0.6, d: 0.5, h: 1.75, blinkSec: 0.6 };
function dataServerWanted(id) { const d = PROJECT[id] && PROJECT[id].dataDocs; return !!(d && (d.api > 0 || d.db > 0)); }
function dataServerSpot(r) {
  const x = r.x0 + DATASRV.fromLeft, z = r.z0 + 0.05 + DATASRV.d / 2;
  return { x, z, rect: [x - DATASRV.w / 2, x + DATASRV.w / 2, z - DATASRV.d / 2, z + DATASRV.d / 2] };
}
function dataServerBuild(S, g) {
  const rack = new THREE.Group(), W = DATASRV.w, D = DATASRV.d, H = DATASRV.h, leds = [];
  const cab = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 2, 0.03), toon('#2f3540')); cab.position.y = H / 2; rack.add(cab);
  for (let k = 0; k < 6; k++) {   // six units, three lamps each
    const y = 0.28 + k * 0.22;
    const u = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.16, 0.02), toon(k % 2 ? '#5d6675' : '#4c5462')); u.position.set(0, y, D / 2 + 0.005); rack.add(u);
    for (let j = 0; j < 3; j++) {
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), new THREE.MeshBasicMaterial({ color: j === 1 ? 0x6aa5ff : 0x52e08a, toneMapped: false }));
      led.position.set(-W / 2 + 0.12 + j * 0.06, y, D / 2 + 0.02); rack.add(led); leds.push(led);
    }
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.18), new THREE.MeshBasicMaterial({ map: signTexture('API · DB', '#1f6feb', '#ffffff'), toneMapped: false }));
  sign.position.set(0, H - 0.16, D / 2 + 0.012); rack.add(sign);
  rack.position.set(S.x, 0, S.z);
  rack.traverse((o) => { o.userData.dataServer = true; });
  g.add(rack);
  return { group: rack, leds, next: 0 };
}
/* ---------- the server room's door (ticket 2026-10-20-jui-viz-server-room, part B) ----------
   Requester 10-20: 「各リポジトリの部屋にサーバールームの扉を置く そこクリックで全体をサーバールームの3Dページに遷移させる」, and 「読み込みに
   時間かかりそうならサーバールームクリックしたタイミングで処理走らせてアニメーションは壁についてるパネルにパスワード打ち込んでるように」.
   A door on the left wall, just in front of the cork board, in a room up close whose model has files (infraDocs, a
   count only); a keypad on the wall at its front side. Pressing either starts the read (56-server-room.js): the
   keypad fills with * while it reads (the viewer types: no robot has to walk there, and none may be free), turns green
   (解錠) and the door swings open, or turns red with the reason in a bubble and the room stays. Its floor in front is
   propsPlace's serverDoor row (the breaks arm's 12 room configs see it), kept clear by the vacuum. */
const SRDOOR = { w: 1.0, h: 2.2, gap: 0.4, padY: 1.35, swingSec: 0.45 };
const SRDOOR_DEMO = { x: -9.6, z: -3.0, pad: [-9.57, SRDOOR.padY, -2.2], rect: null };   // shop-app/'s left wall, behind the task board
let DEMO_SRDOOR = null;
/* The door in sight now: the live room's up close (PROPS), or the demo's one. */
function srDoorNow() {
  if (SOURCE.mode !== 'live') return DEMO_SRDOOR;
  return PROPS.serverDoor ? { D: PROPS.serverDoor, room: PROPS.room, place: PROPS.place.serverDoor } : null;
}
function serverDoorWanted(id) { const d = PROJECT[id] && PROJECT[id].infraDocs; return !!(d && d.files > 0); }
function serverDoorSpot(r) {
  const d = r.z1 - r.z0, kw = Math.min(d - 1.4, 2.6), cz = (r.z0 + r.z1) / 2, da = doorAt(r);
  const kz = r.doors && r.doors.left ? Math.min(cz, da.leftZ - DOOR_W / 2 - 0.25 - kw / 2) : cz;   // the cork board (liveBuildRoom)
  const z = kz + kw / 2 + SRDOOR.gap + SRDOOR.w / 2, pz = z + SRDOOR.w / 2 + 0.3;
  return { x: r.x0, z, pad: [r.x0 + 0.03, SRDOOR.padY, pz], rect: [r.x0, r.x0 + 1.2, z - SRDOOR.w / 2 - 0.1, pz + 0.2] };
}
function serverDoorBuild(S, g) {
  const root = new THREE.Group(), metal = toon('#3d4450'), steel = toon('#8d96a3');
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.08, SRDOOR.h + 0.1, SRDOOR.w + 0.14), metal); frame.position.set(0.02, (SRDOOR.h + 0.1) / 2, 0); root.add(frame);
  const hinge = new THREE.Group(); hinge.position.set(0.07, 0, -SRDOOR.w / 2); root.add(hinge);   // swings from its back edge
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.05, SRDOOR.h, SRDOOR.w), steel); leaf.position.set(0, SRDOOR.h / 2, SRDOOR.w / 2); hinge.add(leaf);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.22), new THREE.MeshBasicMaterial({ map: signTexture('サーバールーム', '#2b3340', '#ffffff'), toneMapped: false }));
  sign.rotation.y = Math.PI / 2; sign.position.set(0.1, SRDOOR.h - 0.35, SRDOOR.w / 2); hinge.add(sign);
  root.position.set(S.x, 0, S.z);
  const cv = makeCanvas(256, 160), tex = texFrom(cv);
  const pad = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.26), metal); pad.add(box);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.rotation.y = Math.PI / 2; screen.position.set(0.032, 0.06, 0); pad.add(screen);
  for (let k = 0; k < 9; k++) {   // the keys
    const key = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.05), toon('#c7cdd6'));
    key.position.set(0.034, -0.04 - Math.floor(k / 3) * 0.04, -0.065 + (k % 3) * 0.065); pad.add(key);
  }
  pad.position.set(S.pad[0], S.pad[1], S.pad[2]);
  g.add(root); g.add(pad);
  for (const o of [root, pad]) o.traverse((m) => { m.userData.serverDoor = true; });
  const D = { root, hinge, pad, cv, tex, sig: '', open: 0 };
  serverDoorDraw(D, { state: 'idle', stars: 0 });
  return D;
}
/* The keypad's screen: dark when idle, blue while it reads (a * per key pressed), green 解錠, red with the stars gone. */
function serverDoorDraw(D, k) {
  const sig = `${k.state}:${k.stars}`;
  if (sig === D.sig) return;
  D.sig = sig;
  const ctx = D.cv.getContext('2d'), W = D.cv.width, H = D.cv.height;
  ctx.fillStyle = { idle: '#1d2430', loading: '#123a6b', ok: '#1d7a3e', failed: '#8a1f24' }[k.state] || '#1d2430';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold 46px ${FONT_MONO}`;
  const text = k.state === 'ok' ? '解錠' : k.state === 'failed' ? '× エラー' : '*'.repeat(Math.min(k.stars, 8)) || '— — — —';
  if (k.state === 'ok' || k.state === 'failed') ctx.font = `bold 44px ${FONT_BODY}`;
  ctx.fillText(text, W / 2, H / 2 + 4);
  D.tex.needsUpdate = true;
}
function serverDoorTick(nowSec) {
  const at = srDoorNow(), D = at && at.D;
  if (!D || typeof srKeypad !== 'function') return;
  const k = srKeypad(at.room, nowSec);   // 56-server-room.js: {state, stars, open (0..1), shake}
  serverDoorDraw(D, k);
  D.open += ((k.open || 0) - D.open) * (reduceMotion ? 1 : Math.min(1, 0.016 / SRDOOR.swingSec * 6));
  D.hinge.rotation.y = -D.open * 1.4;
  D.pad.position.z = at.place.pad[2] + (k.shake && !reduceMotion ? Math.sin(nowSec * 60) * 0.012 : 0);
}
/* Where the keypad is on the page (the bubble above it, 56-server-room.js); null when it is not in sight. */
function serverDoorScreen() {
  const at = srDoorNow(), D = at && at.D;
  if (!D) return null;
  const v = new THREE.Vector3(); D.pad.getWorldPosition(v); v.y += 0.35;
  v.project(camera);
  if (v.z < -1 || v.z > 1) return null;
  const r = canvas.getBoundingClientRect();
  return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
}
function dataServerTick(nowSec) {   // the lamps blink now and then (none with reduced motion)
  const S = PROPS.dataServer;
  if (!S || reduceMotion || nowSec < S.next) return;
  S.next = nowSec + DATASRV.blinkSec;
  for (const led of S.leds) led.visible = PROPS.rng() > 0.25;
}
function shredderSpot(r) {
  const k = SHRED.scale, W = SHRED.w * k, D = SHRED.d * k;
  const cx = (r.x0 + r.x1) / 2, x = Math.min(cx + 1.6, r.x1 - SEAT.aisleR - W), z = r.z0 + 0.12 + D / 2;
  // the feeder's spot 0.1 in front of the machine's middle: as the arms draw it (0.5 round it) it ends at z0 + 1.09, short of
  // the back row of desks (z0 + SEAT.back); + 0.2 reached 0.09 into it (docs/bugs/2026-10-19-jui-viz-shredder-spot-in-desk-zone.md)
  return { x, z, k, spot: [x - W / 2 - 0.45, z + 0.1], box: [x - W / 2, x + W / 2, z - D / 2, z + D / 2] };
}
function shredderBuild(r, g) {
  const k = SHRED.scale, W = SHRED.w * k, D = SHRED.d * k;
  const { x, z, spot } = shredderSpot(r);
  const sg = new THREE.Group(), body = toon('#4a515c'), lid = toon('#6b7480'), bin = toon('#c7cdd6');
  const box = new THREE.Mesh(new RoundedBoxGeometry(SHRED.w, SHRED.h - 0.08, SHRED.d, 2, 0.03), body); box.position.y = (SHRED.h - 0.08) / 2; sg.add(box);
  const top = new THREE.Mesh(new RoundedBoxGeometry(SHRED.w + 0.02, 0.08, SHRED.d + 0.02, 2, 0.02), lid); top.position.y = SHRED.h - 0.04; sg.add(top);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(SHRED.w * 0.7, 0.012, 0.03), toon('#1d2127')); slot.position.set(0, SHRED.h + 0.001, 0.02); sg.add(slot);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(SHRED.w * 0.72, SHRED.h * 0.42), bin); pane.position.set(0, SHRED.h * 0.3, SHRED.d / 2 + 0.002); sg.add(pane);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), toon('#52e08a')); led.position.set(SHRED.w * 0.36, SHRED.h - 0.04, SHRED.d / 2 + 0.01); sg.add(led);
  sg.position.set(x, 0, z); sg.scale.setScalar(k); g.add(sg);
  const bit = { geo: new THREE.PlaneGeometry(0.07, 0.022), mat: toon('#ffffff', { side: THREE.DoubleSide }) };
  // the robot stands at its left side, so the usual view from the front sees the machine and the bits (in front of
  // it, the robot hid both, 10-19)
  return { group: sg, x, z, k, spot, box: [x - W / 2, x + W / 2, z - D / 2, z + D / 2], bit, led };
}
function shredHeld(folder, count) {
  if (folder) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.26), toon('#b98a56'));
    m.position.set(0, 0.58, 0.34); return m;
  }
  const t = 0.012 * Math.min(12, Math.max(1, count));   // as thick as the count, up to a dozen sheets' worth
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.24, t, 0.32), toon('#fbfaf6'));
  m.position.set(0, 0.6, 0.34); return m;
}
function shredTick(R, st, nowSec) {
  const sh = st.shred;
  if (sh && sh.at !== R.shredAt) {
    const first = R.shredAt === undefined;
    R.shredAt = sh.at;
    if (first && vizNow() - sh.at > 30_000) return;   // a deletion from before the page opened: not acted out now
    if (!sh.ok) { R.tiltUntil = nowSec + SHRED.tiltSec; return; }
    // only with a shredder in its room now: a deletion seen on the floor view is not acted out on coming up close
    if (PROPS.shredder && PROPS.room === R.def.room) {
      R.shredPending = { sh, until: nowSec + SHRED.waitSec };
      // A deletion is work, and work ends a break, a game or a nap. Most are ended already (playTick / brkTick, earlier
      // in the frame, see the new since), but one begun this very frame took that since and would hold the errand:
      // it ends here. A git trip is not ended: the errand waits for it (gitTick).
      if (R.brk) brkStop(R, 'shred', nowSec);
      if (R.play) playStop(R);
      if (R.solo) { PLAY.ends.push({ room: R.solo.room, kind: R.solo.kind, players: [R.def.id], reason: 'shred', playedSec: +(nowSec - R.solo.t0).toFixed(1) }); soloStop(R); }
    }
  }
  const want = R.shredPending;
  if (want && nowSec > want.until) R.shredPending = null;
  const P = PROPS.shredder;
  // It goes when nothing else holds it. A break, a game or a nap is never under way here: the deletion ended it above,
  // and none starts while the errand waits, for what holds it (a git trip, an errand, a call) keeps playIdle false too.
  // It goes straight from the walk back from one. A git trip (2.3.4) holds it: it waits, up to SHRED.waitSec.
  if (R.shredPending && P && PROPS.room === R.def.room && R.robot.root.visible && !R.shred && !R.git
      && !LIVE.leaving[R.def.id] && !R.robot.call && (st.promptAt || 0) <= want.sh.at) {
    const s0 = R.shredPending.sh;
    R.shredPending = null; R.playBack = false;
    R.shred = { phase: 'going', at: s0.at, t0: 0, held: shredHeld(s0.folder, s0.count), count: s0.count };
    R.robot.root.add(R.shred.held);
    const p = R.robot.root.position, from = roomAtPoint([p.x, p.z]);
    R.path = from && from !== R.def.room ? [...liveRoute(from, R.def.room), P.spot] : [P.spot];
  }
  // stop at once: a new instruction (promptAt after the deletion), a tool, a wait or a question (any state but idle and
  // done), a call, leaving. The turn ending (done, and back to idle 3 s later) is not one: a deletion is often the last
  // thing a turn does, so the errand goes on through it.
  if (R.shred && ((st.state !== 'idle' && st.state !== 'done') || (st.promptAt || 0) > R.shred.at || R.robot.call || LIVE.leaving[R.def.id])) shredStop(R);
}
function shredAt(R, nowSec) {
  const S0 = R.shred;
  if (!S0) return;
  if (!S0.t0) { S0.t0 = nowSec; S0.phase = 'feeding'; }
  const t = nowSec - S0.t0;
  if (S0.held) {   // fed into the slot: forward and down, then gone
    const k = Math.min(1, t / SHRED.feedSec);
    S0.held.position.z = 0.34 + 0.18 * k; S0.held.position.y = 0.6 + 0.3 * k; S0.held.scale.z = Math.max(0.02, 1 - k);
    if (k >= 1) { R.robot.root.remove(S0.held); S0.held.geometry.dispose(); S0.held.material.dispose(); S0.held = null; }
  }
  const P = PROPS.shredder;
  if (P && !reduceMotion && t > 0.4 && t < SHRED.feedSec + SHRED.bitsSec && PROPS.bits.length < SHRED.bitsMax && t - (S0.lastBit || 0) >= SHRED.every) {
    S0.lastBit = t;
    const m = new THREE.Mesh(P.bit.geo, P.bit.mat);
    m.position.set(P.x + (Math.random() - 0.5) * SHRED.w * P.k * 0.6, SHRED.h * P.k * 0.5, P.z + SHRED.d * P.k / 2 + 0.01);
    m.rotation.set(0, 0, Math.random() * Math.PI);
    m.userData.v = -0.18 - Math.random() * 0.14;
    PROPS.group.add(m); PROPS.bits.push(m);
  }
  if (P) P.led.material.color.set(t < SHRED.feedSec + SHRED.bitsSec ? '#ff9b3d' : '#52e08a');
  if (t >= SHRED.doneSec) shredStop(R);
}
function shredStop(R) {
  const S0 = R.shred;
  if (!S0) return;
  if (S0.held) { R.robot.root.remove(S0.held); S0.held.geometry.dispose(); S0.held.material.dispose(); }
  if (PROPS.shredder) PROPS.shredder.led.material.color.set('#52e08a');
  R.shred = null; R.playBack = true;
  const p = R.robot.root.position, from = roomAtPoint([p.x, p.z]);
  R.path = from && from !== R.def.room ? [...liveRoute(from, R.def.room), R.def.pos] : [R.def.pos];
}
function shredBits(nowSec, dt) {   // the bits fall into the bin behind its window and are gone
  for (const m of [...(PROPS.bits || [])]) {
    m.position.y += m.userData.v * Math.min(dt, 0.1); m.rotation.z += 3 * Math.min(dt, 0.1);
    if (m.position.y < 0.06) { PROPS.group.remove(m); PROPS.bits.splice(PROPS.bits.indexOf(m), 1); }
  }
}
/* A board press in the live office: the project board opens that project's spec board (overview), its lower
   part and the cork board the task board, a robot its card. */
function towerHit(ray) {
  ray.layers.set(TOWER.LAYER);
  const h = ray.intersectObjects(TOWER.floors.map((F) => F.box), false)[0];
  ray.layers.set(0);
  if (!h) return null;
  // The window pressed names its room (towerHover reads the same bay): the room, not the one open before (10-18).
  const F = TOWER.floors[h.object.userData.floor];
  const bay = F && h.uv ? F.bays.find((b) => h.uv.x >= b.x0 && h.uv.x <= b.x1) : null;
  return { kind: 'floor', k: h.object.userData.floor, project: bay && bay.id && PROJECT[bay.id] ? bay.id : null, title: towerHover(h) };
}
function liveRooms() {
  const solo = liveSolo();
  return Object.entries(LIVE3D.rooms).filter(([id]) => !solo || id === solo).map(([, R]) => R);
}
// What a press in the live office can pick, nearest first by the ray (liveHit; the e2e hook reads the same list).
function liveTargets() {
  const solo = liveSolo();
  return [...liveRooms().flatMap((R) => [R.pb.mesh, R.kb.mesh, ...(R.tb ? [R.tb.mesh] : [])]), ...robots.filter((R) => R.robot.root.visible).map((R) => R.robot.root),
    ...(PROPS.bell && PROPS.room === solo ? [PROPS.bell] : []),
    ...(PROPS.dataServer ? [PROPS.dataServer.group] : []), ...(PROPS.serverDoor ? [PROPS.serverDoor.root, PROPS.serverDoor.pad] : [])];   // the data server's rack (2.3.5), the server room's door and keypad
}
const robotOf = (obj) => { let o = obj; while (o && o.userData.robotId === undefined && o.parent) o = o.parent; return o && o.userData.robotId !== undefined ? o.userData.robotId : undefined; };
const isFixture = (obj) => { for (let q = obj; q; q = q.parent) if (q.userData.callBell || q.userData.serverDoor) return true; return !!obj.userData.dataServer; };
/* The call bell, the data server's rack and the server room's door and keypad (dd's verification D2, 10-20) are small and stand against the back wall: a robot's desk drawn in front of
   one (or a robot walking past) covered all of it, and the press opened the robot's card (ticket
   2026-10-20-jui-viz-callbell-bell-hidden-behind-a-desk). A fixture the ray reaches behind a robot wins over that robot,
   from any camera; the robot is still opened by the rest of its body and by its name tag. Boards are not fixtures here
   (wide, a robot covers only a part). */
function liveFirstHit(ray) {
  const hits = ray.intersectObjects(liveTargets(), true);
  if (hits.length && robotOf(hits[0].object) !== undefined) { const f = hits.find((h) => isFixture(h.object)); if (f) return f; }
  return hits[0];
}
function liveHit(ray) {
  const solo = liveSolo(), rooms = liveRooms();
  const hit = liveFirstHit(ray);
  if (!hit) {
    // a room's floor picks the room (the floor view only)
    const f = solo ? null : ray.intersectObjects(rooms.map((R) => R.floor), false)[0];
    const id = f && Object.keys(LIVE3D.rooms).find((k) => LIVE3D.rooms[k].floor === f.object);
    return id ? { kind: 'room', project: id, title: `${PROJECT[id].name} を選ぶ` } : null;
  }
  const rid = robotOf(hit.object);
  if (rid !== undefined) return { kind: 'robot', id: rid };
  for (let q = hit.object; q; q = q.parent) if (q.userData.callBell) return { kind: 'call', project: PROPS.room, title: 'ロボットを呼ぶ（起動のコマンドをコピー）' };
  if (hit.object.userData.dataServer && PROPS.room) return { kind: 'data', project: PROPS.room, title: 'API 仕様書・DB 仕様書を見る' };
  if (hit.object.userData.serverDoor && PROPS.room) return { kind: 'serverroom', project: PROPS.room, title: 'サーバールームに入る（構成を読み込む）' };
  for (const [id, R] of Object.entries(LIVE3D.rooms)) {
    if (hit.object === R.kb.mesh) return { kind: 'tasks', project: id };
    if (R.tb && hit.object === R.tb.mesh) return { kind: 'board', project: id };
    if (hit.object === R.pb.mesh) {
      const px = hit.uv.x * R.pb.W, py = (1 - hit.uv.y) * R.pb.H;
      if (py >= R.pb.splitY) return { kind: 'tasks', project: id };
      const t = R.pb.tiles.find((q) => px >= q.x && px <= q.x + q.w && py >= q.y && py <= q.y + q.h);
      return t ? { kind: 'spec', i: t.i } : { kind: 'board', project: id };
    }
  }
  return null;
}
function liveRedrawBoards(model, now, force) {
  if (SOURCE.layoutRev !== LIVE3D.rev) { liveSync(); return; }   // rooms first (liveSync redraws them)
  const theme = isDark() ? 'd' : 'l';
  for (const [id, R] of Object.entries(LIVE3D.rooms)) {
    if (!PROJECT[id]) continue;
    // the room's label: its name, and its mock server when one runs (P7 §A3)
    const mk = PROJECT[id].mock, label = `${PROJECT[id].name}${mk && mk.running ? ` · モック :${mk.port}` : mk && mk.other ? ` · :${mk.port} は別のモック` : ''}`;
    if (R.rt.el.textContent !== label) { R.rt.el.textContent = label; R.rt.el.classList.toggle('mock-on', !!(mk && mk.running)); }
    const tasks = model.tasks.filter((x) => PROJECT_OF[x.list] === id);
    const pend = model.pending.filter((p) => projectOfRobot(p.who) === id).map((p) => p.id).join();
    const robotsIn = ROBOT_DEFS.filter((d) => d.room === id).length;
    R.pb.specs = model.specs.map((s, i) => [s, i]).filter(([s]) => s.project === id).map(([, i]) => i);
    const blink = R.pb.specs.some((i) => model.specs[i].writingIdx >= 0 && model.specs[i].by) ? Math.floor(now * 2.5) % 2 : 0;
    const specSig = R.pb.specs.map((i) => { const x = model.specs[i]; return [x.bucket, x.status.text, x.by, x.written.map((v) => Math.round(v * 50)).join(), x.implN.join(), activeSec(x)].join('|'); }).join(';');
    const sig = theme + blink + robotsIn + SESSIONS.filter((s) => s.project === id).length + pend + tasks.map((x) => x.key + x.col).join() + specSig;
    if (force || sig !== R.pb.sig) { if (R.pb.big) drawBigSpecBoard(R.pb, model, now); else drawProjectBoard(R.pb, model, now); R.pb.sig = sig; }
    const taskSig = theme + pend + tasks.map((x) => x.key + x.col + (x.perm ? '!' : '')).join();
    if (force || taskSig !== R.kb.sig) { drawTaskBoard(model, id, R.kb); R.kb.sig = taskSig; }
    if (R.tb) {
      const run = liveTestsFor(id);
      const testSig = theme + JSON.stringify([run.statusText, run.rows.map((r) => r.status), run.command]);
      if (force || testSig !== R.tb.sig) { drawTestBoard(model, R.tb, run); R.tb.sig = testSig; }
    }
  }
}
/* Where the camera goes for a room or for everything: the same direction as the prototype's view, far enough
   for what is shown. */
function liveBounds(ids) {
  const rs = ROOMS.filter((r) => r.shown && (!ids || ids.includes(r.id)));
  if (!rs.length) return null;
  const x0 = Math.min(...rs.map((r) => r.x0)), x1 = Math.max(...rs.map((r) => r.x1));
  const z0 = Math.min(...rs.map((r) => r.z0)), z1 = Math.max(...rs.map((r) => r.z1));
  return { c: new THREE.Vector3((x0 + x1) / 2, 0.4, (z0 + z1) / 2), size: Math.max(x1 - x0, (z1 - z0) * 1.3) };
}
/* The big spec board for a room with many specs (plan 09 §7): the prototype's drawSpecBoard, tile size from the
   count. Each tile is the prototype's drawSpecTile, scaled. */
function drawBigSpecBoard(pb, model, now) {
  const dark = isDark(), P = BOARD[dark ? 'dark' : 'light'], ST = ST_STYLE[dark ? 'dark' : 'light'];
  const ctx = pb.canvas.getContext('2d'), { W, H } = pb, proj = PROJECT[pb.project];
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = P.grid;
  for (let x = 0; x < W; x += 32) ctx.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += 32) ctx.fillRect(0, y, W, 1);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const specs = pb.specs.map((i) => model.specs[i]), c = bucketCounts(specs);
  ctx.fillStyle = P.title; ctx.font = `36px ${FONT_DISPLAY}`; ctx.fillText('spec ボード', 26, 52);
  ctx.fillStyle = P.sub; ctx.font = `700 24px ${FONT_BODY}`;
  fitText(ctx, `${proj.name} · 全 ${specs.length} 画面 · 作業中 ${c.live} · 途中 ${c.partial} · 未着手 ${c.todo} · 完了 ${c.done}`, 276, 50, W - 300);
  const pad = 22, top = 76, n = Math.max(1, specs.length), aspect = 2.6;
  // columns so that the tiles keep roughly the prototype's shape
  let cols = Math.max(1, Math.round(Math.sqrt((n * (W - pad * 2)) / ((H - top - pad) * aspect))));
  while (Math.ceil(n / cols) * ((W - pad * 2) / cols / aspect) > H - top - pad && cols < n) cols += 1;
  const rows = Math.ceil(n / cols), gap = Math.max(4, Math.round(14 * Math.min(1, 8 / cols)));
  const tw = (W - pad * 2 - gap * (cols - 1)) / cols, th = Math.min(tw / aspect * 1.25, (H - top - pad - gap * (rows - 1)) / rows);
  const k = Math.min(1, th / 104), g = Object.fromEntries(Object.entries(PBG).map(([key, v]) => [key, v * k]));
  pb.tiles = [];
  pb.specs.forEach((i, pos) => {
    const x = pad + (pos % cols) * (tw + gap), y = top + Math.floor(pos / cols) * (th + gap);
    drawSpecTile(ctx, P, ST, model.specs[i], x, y, tw, th, now, g);
    pb.tiles.push({ i, x, y, w: tw, h: th, g });
  });
  pb.tex.needsUpdate = true;
}
/* A line from a robot to the part of the board it works on (the prototype's links), live. */
function liveLinks(model, nowSec) {
  const used = new Set();
  if (!zoom.zoomed) {
    model.specs.forEach((s, i) => {
      if (!s.by || !robots.some((R) => R.def.id === s.by && R.robot.root.visible)) return;
      const R = LIVE3D.rooms[s.project];
      const t = R && R.pb.tiles.find((q) => q.i === i);
      if (!t) return;
      const [px, py] = tileFocus(t.x, t.y, t.w, t.h, t.g || PBG, activeSec(s));
      linkFor(s.by).set(robotPoint(s.by, HEAD_UP), pbPoint(R.pb, px, py), true, nowSec);
      used.add(s.by);
    });
  }
  for (const [id, L] of Object.entries(links)) if (!used.has(id)) L.set(null, null, false, nowSec);
}
/* One room fills most of the view (about 80 % of the narrower side, from the camera's field of view and aspect);
   everything is framed with a margin. */
function liveRoomPose(id) {
  const b = liveBounds(id === 'all' ? null : [id]) || { c: new THREE.Vector3(0, 0.4, 0), size: 12 };
  const half = THREE.MathUtils.degToRad(camera.fov) / 2, tanH = Math.tan(half) * Math.min(1, camera.aspect || 1);
  const fit = (size, share) => (size / 2) / (tanH * share);
  const dist = id === 'all' ? Math.max(22, fit(b.size, 0.92)) : Math.max(9, fit(b.size, (camera.aspect || 1) < 1 ? 0.7 : 0.86));   // one room: most of the view (less on a tall screen, where its corners reach out)
  return { p: b.c.clone().add(new THREE.Vector3(6.5, 15.5, 22.5).normalize().multiplyScalar(dist)), t: b.c };
}
/* The near weather's switch (10-18), in the building view of a live page. Off by default. Turning it on is the only
   place that asks the browser for the position — the permission dialog shows inside this click, never on opening the
   page — and the position is rounded to two decimals (about 1 km) before it leaves the page; the server rounds again
   and asks Open-Meteo itself (the page never talks to anyone but this server). Turning it off removes the position. */
const WEATHER_JA = { clear: '晴れ', cloudy: '曇り', fog: '霧', rain: '雨', snow: '雪', thunder: '雷雨' };
const WEATHER_UI = { busy: false, note: '' };
const roundCoord = (v) => Math.round(v * 100) / 100;
/* Two places show the same switch (10-18): the building view's corner, and the side panel's 設定 — the latter for every
   live page, so the weather can be turned on and its state read with fewer than seven rooms (no building view). */
function weatherPaint(towerHidden) {
  const box = document.getElementById('tower-weather'), sec = document.getElementById('sec-settings');
  if (!box) return;
  box.hidden = towerHidden;
  if (sec) sec.hidden = SOURCE.mode !== 'live';
  if (SOURCE.mode !== 'live') return;   // the demo has no server to ask, and no LIVE.slices
  const w = LIVE.slices.weather || { on: false };
  const at = typeof w.at === 'number' ? new Date(w.at).toTimeString().slice(0, 5) : '';
  const text = WEATHER_UI.note || (!w.on ? 'オフ — 外への通信はしません'
    : w.kind ? `${WEATHER_JA[w.kind] || w.kind}${typeof w.tempC === 'number' ? ` ${Math.round(w.tempC)}℃` : ''}（最後に取れた時刻 ${at}${w.stale ? '・古い値' : ''}）${w.error ? ` — 失敗: ${w.error}` : ''}`
      : w.error ? `取れていません — 失敗: ${w.error}` : '取得中…');
  for (const [b, n, hidden] of [['weather-switch', 'weather-note', towerHidden], ['weather-switch-panel', 'weather-note-panel', !sec || sec.hidden]]) {
    if (hidden) continue;
    const btn = document.getElementById(b), note = document.getElementById(n);
    btn.setAttribute('aria-checked', w.on ? 'true' : 'false');
    btn.setAttribute('aria-busy', WEATHER_UI.busy ? 'true' : 'false');
    setText(note, text);
    note.toggleAttribute('data-error', !!(WEATHER_UI.note || w.error));
  }
}
async function weatherSwitch() {
  if (WEATHER_UI.busy) return;
  const on = !(LIVE.slices.weather && LIVE.slices.weather.on);
  WEATHER_UI.busy = true; WEATHER_UI.note = on ? '位置の許可を待っています…' : '';
  floorNavSync();
  try {
    if (!on) {
      const ack = await SOURCE.setWeather({ on: false });
      WEATHER_UI.note = ack.ok ? '' : `オフにできませんでした — ${ack.error || ''}`;
      return;
    }
    if (!navigator.geolocation) { WEATHER_UI.note = 'このブラウザでは位置を取れないため、オフのままです'; return; }
    const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject,
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 600000 }));
    const lat = roundCoord(pos.coords.latitude), lon = roundCoord(pos.coords.longitude);   // about 1 km, before it leaves the page
    const ack = await SOURCE.setWeather({ on: true, lat, lon });
    WEATHER_UI.note = ack.ok ? '' : `オンにできませんでした — ${ack.error || ''}`;
  } catch (err) {
    const why = err && err.code === 1 ? '位置の利用が許可されませんでした' : err && err.code === 3 ? '位置を取るのに時間がかかりすぎました' : '位置を取れませんでした';
    WEATHER_UI.note = `${why}。オフのままです`;
  } finally {
    WEATHER_UI.busy = false;
    floorNavSync();
  }
}
// The panel's switch works without 3D too (no WebGL: no building, but the setting and its state are still here).
{ const btn = document.getElementById('weather-switch-panel'); if (btn) btn.addEventListener('click', () => { weatherSwitch(); }); }
/* The floor buttons (both views). Hidden while a board, the log, a zoom or a robot card covers the 3D (10-18). The
   demo has one office: its buttons show in the building only, and look at the floors there. */
function floorNavSync() {
  const nav = document.getElementById('floor-nav'), legend = document.getElementById('tower-legend');
  if (!nav) return;
  const n = LIVE.floors.length, k = SOURCE.mode === 'demo' || TOWER.on ? TOWER.look : LIVE.floor;
  const covered = wb.open || tb.open || logState.open || zoom.zoomed || !!rbState.id;
  nav.hidden = !has3D || n < 2 || covered || (SOURCE.mode === 'demo' && !TOWER.on);
  legend.hidden = nav.hidden || !TOWER.on;
  weatherPaint(!has3D || covered || !TOWER.on || SOURCE.mode !== 'live');
  if (nav.hidden) return;
  setText(document.getElementById('floor-label'), TOWER.on && SOURCE.mode === 'live' ? `全 ${n} 階` : `${k + 1}F / ${n}F`);
  const waits = LIVE.floors.map((f) => f.some((id) => LIVE.rank[id] === 0));
  const up = document.getElementById('floor-up'), down = document.getElementById('floor-down'), bld = document.getElementById('floor-building');
  const free = TOWER.on && SOURCE.mode === 'live';
  up.disabled = !free && k >= n - 1; down.disabled = !free && k <= 0;
  const above = waits.some((w, j) => w && j > k), below = waits.some((w, j) => w && j < k);
  up.toggleAttribute('data-alert', above && !free); down.toggleAttribute('data-alert', below && !free);
  bld.toggleAttribute('data-alert', (above || below) && !TOWER.on);
  up.setAttribute('aria-label', above ? '上の階へ（上の階に許可待ち）' : '上の階へ');
  down.setAttribute('aria-label', below ? '下の階へ（下の階に許可待ち）' : '下の階へ');
  bld.setAttribute('aria-pressed', TOWER.on ? 'true' : 'false');
}
/* The demo's director: once a loop, the camera beats (out to the building, up to 2F, back, down; the building at
   night), scripted coffee and meals, and a small fist pump when a permission is granted. The camera beats skip
   while someone uses the 3D view (a touch in the last 8 s) or a board / card covers it. */
const DIRECTOR = { userAt: -1e9, prevT: null, perm: {} };
function demoDirector(model, nowSec) {
  const t = model.t, prev = DIRECTOR.prevT;
  DIRECTOR.prevT = t;
  demoBuilding(t);
  if (prev === null) return;
  // a beat between the last frame and this one; across the loop's end only when time wrapped (not a jump back)
  const wrapped = prev - t > LOOP / 2;
  const crossed = (beat) => (prev <= t ? prev < beat && beat <= t : wrapped && (prev < beat || beat <= t));
  const robot = (id) => { const R = robots.find((x) => x.def.id === id); return R && R.robot; };
  const B = DEMO_BEATS, quiet = performance.now() - DIRECTOR.userAt > 8000 && !wb.open && !tb.open && !logState.open && !zoom.zoomed && !rbState.id;
  if (quiet && has3D && playing) {
    if (crossed(B.towerOut) || crossed(B.nightOut)) towerEnter();
    if (crossed(B.look2F)) towerLookAt(1);
    if (crossed(B.look1F)) towerLookAt(0);
    if (crossed(B.towerIn) || crossed(B.nightIn)) towerLeave(0);
  }
  for (const [at, id, kind] of B.snacks) if (crossed(at) && robot(id)) startGesture(robot(id), kind, nowSec);
  for (const p of model.perms) {                     // granted (in the view, by a rule or in the terminal): a fist pump
    const was = DIRECTOR.perm[p.id];
    if (was === 'pending' && p.status !== 'pending' && p.status !== 'deny' && robot(p.who)) {
      setRobotState(robot(p.who), robotState[p.who].state);   // the 3D robot still shows last frame's 許可待ち
      startGesture(robot(p.who), 'cheer', nowSec);
    }
    DIRECTOR.perm[p.id] = p.status;
  }
}
/* ---------- the building: every floor of six rooms, stacked (requester's ruling, 10-18) ----------
   Looking at a floor, the 3D is that floor's rooms in full, as before; the other floors are not drawn. Zoomed out
   (the ビル全体 button, or the wheel past the farthest distance) the building replaces them: one plain box per floor
   on its own layer, with the floor number, a window per room (lit: a robot works; yellow: one waits for permission),
   the counts and the room names on its front. Pressing a floor goes down to it. Changing floors moves the camera
   up or down into the new floor. */
/* The sky behind the building follows the local time of the machine viewing it (requester, 10-18): dawn, day, dusk,
   night. The panels, the floor buttons and the legend carry their own background, so they read at any hour. */
const SKY = { dawn: ['#8fa9d6', '#f6c49f'], day: ['#8fc4f2', '#e3f1ff'], dusk: ['#3f4486', '#f0935f'], night: ['#050c1c', '#17264a'] };
function skyPhase(date) {
  const h = date.getHours() + date.getMinutes() / 60;
  return h >= 5 && h < 7 ? 'dawn' : h >= 7 && h < 16.5 ? 'day' : h >= 16.5 && h < 19 ? 'dusk' : 'night';
}
/* The outside of the building: the season and, when turned on, the weather near this machine (requester, 10-18).
   The season comes from the viewer's date (northern hemisphere): spring cherry blossom with a few petals in the air,
   summer deep green with cicadas on the trunks (no sound), autumn red and orange leaves with a few falling, winter
   bare branches and a thin snow on the plaza and the roof. Only the trees, the plaza and the roof change; the rooms
   and the robots do not. The weather (the server's weather slice: off by default, and then nothing is asked of
   anyone) greys the sky, rains, snows, flashes or fogs over the season. Falling things are capped at OUTSIDE.max and
   stand still under reduced motion. */
const OUTSIDE = { max: 160, force: null, weatherForce: null };
function seasonOf(date) {
  const m = date.getMonth() + 1;
  return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
}
const season = () => OUTSIDE.force || seasonOf(new Date(vizNow()));
/* The weather to draw: { kind, isDay } or null (off, not read yet, too old, or the demo). */
function weatherNow() {
  if (OUTSIDE.weatherForce) return OUTSIDE.weatherForce;
  const w = SOURCE.mode === 'live' ? LIVE.slices.weather : null;
  return w && w.on && typeof w.kind === 'string' ? { kind: w.kind, isDay: w.isDay !== false } : null;
}
// How far each weather pulls the sky toward its grey (light rain under a dark cloud, a pale fog).
const SKY_GREY = { cloudy: ['#8d99a8', 0.55], rain: ['#6f7b8a', 0.7], thunder: ['#4c5563', 0.8], fog: ['#c3cad3', 0.7], snow: ['#c9d1dc', 0.55] };
function skyColors(phase, w) {
  const base = SKY[phase];
  const g = w && SKY_GREY[w.kind];
  if (!g) return base;
  const mix = (hex) => '#' + new THREE.Color(hex).lerp(new THREE.Color(g[0]), phase === 'night' ? g[1] * 0.4 : g[1]).getHexString();
  return [mix(base[0]), mix(base[1])];
}
function skySync() {
  if (!TOWER.on && TOWER.flash) { TOWER.flash = false; sceneEl.style.filter = ''; }   // left the building mid-flash
  const w = weatherNow();
  let phase = TOWER.on || SOURCE.mode === 'demo' ? skyPhase(new Date(vizNow())) : '';   // the demo's office has its clock's sky too
  if (phase && w) phase = !w.isDay ? 'night' : phase === 'night' ? 'day' : phase;   // the place's own day and night
  const key = phase ? `${phase}:${w ? w.kind : ''}` : '';
  const fog = TOWER.on && w && w.kind === 'fog';
  if (!!scene.fog !== !!fog) scene.fog = fog ? new THREE.Fog(new THREE.Color(SKY_GREY.fog[0]), 18, 70) : null;
  if ((sceneEl.dataset.sky || '') === key) return;
  sceneEl.dataset.sky = key;
  const c = phase ? skyColors(phase, w) : null;
  sceneEl.style.background = c ? `linear-gradient(180deg, ${c[0]}, ${c[1]})` : '';
}
const outsideKey = () => { const w = weatherNow(); return `${season()}:${w ? w.kind : ''}`; };
const TOWER = { on: false, look: 0, sign: null, group: null, floors: [], sig: '', theme: null, W: 16, D: 9, H: 3, SLAB: 0.28, LOBBY: 1.1, LAYER: 1, pulse: 1,
  lights: null, actors: null, bayColor: [] };
const towerBase = (k) => TOWER.LOBBY + k * (TOWER.H + TOWER.SLAB);          // the slab under floor k
const towerY = (k) => towerBase(k) + TOWER.SLAB + TOWER.H / 2;              // the middle of floor k
// The page's colours (the side panel's state badges: 作業中 = --ok, 許可待ち = --warn, 待機 = --chip), per theme.
function towerPalette() {
  const dark = isDark(), t = (name, light, darkV) => readToken(name, dark ? darkV : light);
  return {
    dark, ink: t('--ink', '#13233a', '#e4ecf8'), soft: t('--ink-soft', '#4b5c76', '#9fb1cb'), panel: t('--panel', '#fbfcfe', '#111f34'),
    line: t('--line', '#cfd9e7', '#24395a'), chip: t('--chip', '#e3eaf4', '#182c47'), ok: t('--ok', '#1d8f4e', '#5ad893'),
    okBg: t('--ok-bg', '#dcf3e5', '#123a2a'), warn: t('--warn', '#9a6200', '#ffc65c'), warnBg: t('--warn-bg', '#fff0d1', '#3a2b0c'),
    frame: dark ? '#4a5f80' : '#5d6f88', concrete: dark ? '#2a3546' : '#dfe5ee', glass: dark ? '#1b3150' : '#9fbbd9',
    // the light in a window: on (warm), off (a dark room), none (no room at all)
    on: '#ffd585', off: dark ? '#152238' : '#33445e', none: '#05070b',
  };
}
function towerFloorText(k) {
  const ids = LIVE.floors[k] || [];
  let working = 0, waiting = 0, idle = 0;
  for (const d of ROBOT_DEFS) {
    if (!ids.includes(roomOfDef(d)) || LIVE.leaving[d.id]) continue;
    const st = (robotState[d.id] || {}).state;
    if (st === 'waiting') waiting += 1; else if (st && st !== 'idle' && st !== 'done') working += 1; else idle += 1;
  }
  waiting = Math.max(waiting, PERMS_LIVE.filter((p) => p.status === 'pending' && DEF[p.who] && ids.includes(DEF[p.who].room)).length);
  return { ids, working, waiting, idle };
}
const TOWER_STATE = ['waiting', 'working', 'idle', 'idle'];   // rank 0..3 → what a window shows
// A working room where nobody does more than think shows "thinking" (lit, its own badge and pose).
const roomThinks = (id) => { const st = ROBOT_DEFS.filter((d) => roomOfDef(d) === id && !LIVE.leaving[d.id]).map((d) => (robotState[d.id] || {}).state);
  return st.includes('thinking') && !st.some((x) => x && !['idle', 'done', 'thinking', 'waiting'].includes(x)); };
const towerState = (id) => { if (!id) return 'empty'; const t = TOWER_STATE[LIVE.rank[id]] || 'idle'; return t === 'working' && roomThinks(id) ? 'thinking' : t; };
const towerName = (id) => String(TOWER_NAMES[id] || (PROJECT[id] && PROJECT[id].name) || id || '').replace(/\/+$/, '');
const roomOfDef = (d) => d.room || projectOfRobot(d.id);   // the live defs carry a room; the demo's come from their session
/* A name in up to two lines that fit maxW, broken after '-', '_' or a space when it can be (not "tea-finder-ag / ent");
   a part longer than a line breaks where it must; a name longer than two lines ends with '…'. */
function towerLines(ctx, text, maxW) {
  const parts = text.match(/[^-_\s]*[-_\s]|[^-_\s]+$/g) || [text];
  const lines = [''];
  for (const part of parts) {
    const cur = lines[lines.length - 1];
    if (ctx.measureText(cur + part).width <= maxW) { lines[lines.length - 1] = cur + part; continue; }
    if (cur) lines.push('');
    for (const ch of [...part]) {                         // a part wider than a line: by character
      const now = lines[lines.length - 1];
      if (ctx.measureText(now + ch).width > maxW && now) lines.push(ch); else lines[lines.length - 1] = now + ch;
    }
  }
  if (lines.length <= 2) return lines.filter(Boolean);
  let last = lines[1];
  lines.cut = true;
  while (last && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
  const out = [lines[0], last + '…'];
  out.cut = true;
  return out;
}
/* The largest of 30 / 26 / 22 px at which the name fits two lines uncut (only the smallest may cut it). */
function towerNameFit(ctx, text, maxW) {
  for (const size of [30, 26, 22]) {
    ctx.font = `700 ${size}px ${FONT_BODY}`;
    const lines = towerLines(ctx, text, maxW);
    if (!lines.cut || size === 22) return { size, lines };
  }
  return null;
}
/* A floor's front, 2048 × 384: the floor number | six bays (a badge band, the window — cut out, the light and the
   robots behind it show through — and the name band) | the counts. Nothing shares a band, so nothing overlaps. */
const FACADE = { W: 2048, H: 384, NUM: 210, STATS: 330, WIN_TOP: 22, BADGE: 52, WIN_BOTTOM: 246, NAME_TOP: 262 };
function towerBays() {
  const bw = (FACADE.W - FACADE.NUM - FACADE.STATS) / ROOM_MAX;
  return Array.from({ length: ROOM_MAX }, (_, i) => ({ x: FACADE.NUM + i * bw + 10, w: bw - 20 }));
}
function towerFacade(F, k, P) {
  const { ids, working, waiting, idle } = towerFloorText(k);
  const ctx = F.canvas.getContext('2d'), { W, H, NUM, STATS, WIN_TOP, BADGE, WIN_BOTTOM, NAME_TOP } = FACADE;
  ctx.textBaseline = 'alphabetic';
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = P.panel; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = P.ink; ctx.beginPath(); ctx.roundRect(28, 120, NUM - 56, 140, 24); ctx.fill();
  ctx.fillStyle = P.panel; ctx.font = `78px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(`${k + 1}F`, NUM / 2, 220);
  F.bays = [];
  towerBays().forEach(({ x, w }, i) => {
    const id = ids[i], state = towerState(id), gy = WIN_TOP + BADGE;
    // the badge band: the state in words and a symbol (not only a colour)
    ctx.fillStyle = P.frame; ctx.fillRect(x, WIN_TOP, w, BADGE);
    const badge = { working: ['▶ 作業中', P.ok, P.okBg], thinking: ['… 考え中', P.ok, P.okBg], waiting: ['! 許可待ち', P.warn, P.warnBg], idle: ['● 待機（消灯）', P.soft, P.chip], empty: ['空き', P.soft, P.panel] }[state];
    ctx.font = `700 26px ${FONT_BODY}`;
    const bwid = ctx.measureText(badge[0]).width + 26;
    ctx.fillStyle = badge[2]; ctx.beginPath(); ctx.roundRect(x + 10, WIN_TOP + 8, bwid, 36, 18); ctx.fill();
    if (state === 'empty') { ctx.setLineDash([8, 6]); ctx.strokeStyle = P.soft; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle = badge[1]; ctx.textAlign = 'left'; ctx.fillText(badge[0], x + 23, WIN_TOP + 35);
    // the window: cut out of the front
    ctx.clearRect(x, gy, w, WIN_BOTTOM - gy);
    ctx.strokeStyle = P.frame; ctx.lineWidth = 6; ctx.strokeRect(x, WIN_TOP, w, WIN_BOTTOM - WIN_TOP);
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + w / 2, gy); ctx.lineTo(x + w / 2, gy + 30); ctx.stroke();
    if (state === 'empty') {                         // no room: a dashed frame across the dark glass
      ctx.setLineDash([14, 10]); ctx.strokeStyle = P.soft; ctx.lineWidth = 4; ctx.strokeRect(x + 10, gy + 10, w - 20, WIN_BOTTOM - gy - 20); ctx.setLineDash([]);
    }
    if (state === 'waiting') { ctx.strokeStyle = P.warn; ctx.lineWidth = 12; ctx.globalAlpha = 0.5 + 0.5 * TOWER.pulse; ctx.strokeRect(x + 6, WIN_TOP + 6, w - 12, WIN_BOTTOM - WIN_TOP - 12); ctx.globalAlpha = 1; }
    const play = id && SOURCE.mode === 'live' ? playRoomText(id) : '';   // a game in the room (2.3.3): its name at the window's foot
    if (play) {
      let size = 32; ctx.font = `700 ${size}px ${FONT_BODY}`;
      while (ctx.measureText(play).width > w - 40 && size > 14) { size -= 2; ctx.font = `700 ${size}px ${FONT_BODY}`; }
      const pw = ctx.measureText(play).width + 28;
      ctx.fillStyle = P.panel; ctx.beginPath(); ctx.roundRect(x + (w - pw) / 2, WIN_BOTTOM - 58, pw, size + 22, 12); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.fillText(play, x + w / 2, WIN_BOTTOM - 58 + size + 8);
    }
    // the name band
    ctx.fillStyle = id ? P.ink : P.soft; ctx.textAlign = 'center';
    const fit = id ? towerNameFit(ctx, towerName(id), w - 8) : (ctx.font = `700 30px ${FONT_BODY}`, { size: 30, lines: ['—'] });
    fit.lines.forEach((ln, j) => ctx.fillText(ln, x + w / 2, NAME_TOP + 30 + j * (fit.size + 10)));
    F.bays.push({ x0: x / W, x1: (x + w) / W, gy0: gy / H, gy1: WIN_BOTTOM / H, id, state, play });
  });
  const sx = W - STATS + 18;
  ctx.fillStyle = P.chip; ctx.beginPath(); ctx.roundRect(sx - 8, 22, STATS - 36, H - 44, 20); ctx.fill();
  const row = (y, icon, label, n, fg, bg) => {
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(sx + 34, y - 12, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = fg; ctx.font = `700 30px ${FONT_BODY}`; ctx.textAlign = 'center'; ctx.fillText(icon, sx + 34, y - 1);
    ctx.textAlign = 'left'; ctx.fillStyle = P.ink; ctx.fillText(label, sx + 70, y);
    ctx.font = `700 40px ${FONT_MONO}`; ctx.textAlign = 'right'; ctx.fillText(String(n), W - 48, y + 2);
  };
  row(110, '▶', '作業中', working, P.ok, P.okBg);
  row(206, '!', '許可待ち', waiting, P.warn, P.warnBg);
  row(302, '●', '待機', idle, P.soft, P.panel);
  F.tex.needsUpdate = true;
}
/* The office robots seen through the windows: one sprite per pose (a desk, a walk in two steps, pointing at a
   board, a raised hand, a shadow in a dark room). How many and where is a picture of an office, not a count. */
function towerSprite(pose, P) {
  const c = makeCanvas(160, 200), ctx = c.getContext('2d');
  const ink = pose === 'shadow' ? (P.dark ? 'rgba(140, 160, 192, 0.55)' : 'rgba(170, 186, 210, 0.6)') : '#2b2f3a';
  const band = pose === 'shadow' ? ink : '#d62839';
  const head = (x, y) => { ctx.fillStyle = ink; ctx.beginPath(); ctx.roundRect(x - 26, y - 22, 52, 44, 12); ctx.fill(); ctx.fillRect(x - 2, y - 38, 4, 16); ctx.beginPath(); ctx.arc(x, y - 40, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = band; ctx.fillRect(x - 26, y - 10, 52, 7); };
  const limb = (x1, y1, x2, y2, wdt = 12) => { ctx.strokeStyle = ink; ctx.lineWidth = wdt; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const torso = (x, y, h = 56) => { ctx.fillStyle = ink; ctx.beginPath(); ctx.roundRect(x - 22, y, 44, h, 10); ctx.fill(); };
  if (pose === 'type' || pose === 'shadow') {          // at a desk, side on, hands on the keyboard
    head(62, 74); torso(62, 98, 50); limb(70, 112, 112, 124);
    ctx.fillStyle = ink; ctx.fillRect(40, 146, 46, 10); limb(48, 156, 48, 196, 10); limb(76, 156, 76, 196, 10);
    ctx.fillStyle = pose === 'shadow' ? ink : '#6b4f33'; ctx.fillRect(96, 126, 64, 10); ctx.fillRect(146, 136, 8, 64);
    if (pose === 'type') { ctx.fillStyle = '#9ad1ff'; ctx.fillRect(118, 96, 30, 26); }
  } else if (pose === 'walkA' || pose === 'walkB') {
    const s = pose === 'walkA' ? 1 : -1;
    head(80, 52); torso(80, 76);
    limb(72, 90, 72 - 16 * s, 126); limb(88, 90, 88 + 16 * s, 126);
    limb(72, 132, 72 - 18 * s, 194); limb(88, 132, 88 + 18 * s, 194);
  } else if (pose === 'point') {                       // at a board, one arm out
    ctx.fillStyle = '#f4f6fa'; ctx.fillRect(100, 40, 58, 70); ctx.strokeStyle = '#6b4f33'; ctx.lineWidth = 4; ctx.strokeRect(100, 40, 58, 70);
    ctx.fillStyle = '#7aa2d6'; ctx.fillRect(108, 52, 40, 6); ctx.fillRect(108, 66, 30, 6); ctx.fillRect(108, 80, 36, 6);
    head(56, 60); torso(56, 84); limb(66, 98, 104, 70); limb(48, 98, 44, 136);
    limb(48, 140, 46, 194); limb(64, 140, 66, 194);
  } else if (pose === 'think') {                       // standing, a hand to the chin, a … above
    head(70, 70); torso(70, 94); limb(80, 108, 82, 76); limb(60, 108, 70, 128);
    limb(62, 150, 60, 194); limb(78, 150, 80, 194);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(120, 26, 30, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f6fd8'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(106 + i * 14, 26, 4.5, 0, Math.PI * 2); ctx.fill(); }
  } else {                                             // a raised hand, looking up
    head(80, 60); torso(80, 84); limb(92, 96, 112, 30); limb(68, 96, 60, 136);
    limb(72, 140, 70, 194); limb(88, 140, 90, 194);
    ctx.fillStyle = '#ffc65c'; ctx.beginPath(); ctx.arc(126, 22, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d00'; ctx.font = `700 24px ${FONT_BODY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 126, 23);
  }
  return texFrom(c);
}
const TOWER_POSES = ['type', 'walkA', 'walkB', 'point', 'raise', 'think', 'shadow'];
function towerBuild() {
  const n = LIVE.floors.length, dark = isDark();
  const outside = outsideKey();
  if (TOWER.group && TOWER.floors.length === n && TOWER.theme === dark && TOWER.outside === outside) return;
  if (TOWER.group) { scene.remove(TOWER.group); disposeTree(TOWER.group); }
  const P = towerPalette(), L = TOWER.LAYER, { W, D, H, SLAB, LOBBY } = TOWER;
  TOWER.group = new THREE.Group(); TOWER.floors = []; TOWER.sig = ''; TOWER.theme = dark; TOWER.bayColor = []; TOWER.outside = outside;
  const put = (mesh) => { mesh.layers.set(L); TOWER.group.add(mesh); return mesh; };
  for (const o of scene.children) if (o.isLight) o.layers.enable(L);
  const top = towerBase(n), front = D / 2;
  const body = put(new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, top - LOBBY, D - 0.1), toon(P.glass)));
  body.position.set(0, LOBBY + (top - LOBBY) / 2, 0);
  const m = new THREE.Matrix4();
  const slabs = put(new THREE.InstancedMesh(new THREE.BoxGeometry(W + 0.5, SLAB, D + 0.5), toon(P.concrete), n + 1));
  for (let k = 0; k <= n; k++) { m.makeTranslation(0, towerBase(k) + SLAB / 2, 0); slabs.setMatrixAt(k, m); }
  // the lights behind every window: one instanced quad each, coloured per window (on / off / no room)
  const glow = makeCanvas(4, 64), gctx = glow.getContext('2d'), gg = gctx.createLinearGradient(0, 0, 0, 64);
  gg.addColorStop(0, '#ffffff'); gg.addColorStop(1, '#b8bcc4'); gctx.fillStyle = gg; gctx.fillRect(0, 0, 4, 64);
  TOWER.lights = put(new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texFrom(glow), toneMapped: false }), n * ROOM_MAX));
  TOWER.lights.renderOrder = 1;
  const bays = towerBays(), off = new THREE.Color(P.off);
  for (let k = 0; k < n; k++) bays.forEach((b, i) => {
    const x0 = (b.x / FACADE.W - 0.5) * W, x1 = ((b.x + b.w) / FACADE.W - 0.5) * W;
    const yTop = towerY(k) + H / 2 - ((FACADE.WIN_TOP + FACADE.BADGE) / FACADE.H) * H, yBot = towerY(k) + H / 2 - (FACADE.WIN_BOTTOM / FACADE.H) * H;
    m.compose(new THREE.Vector3((x0 + x1) / 2, (yTop + yBot) / 2, front + 0.004), new THREE.Quaternion(), new THREE.Vector3(x1 - x0, yTop - yBot, 1));
    TOWER.lights.setMatrixAt(k * ROOM_MAX + i, m);
    TOWER.lights.setColorAt(k * ROOM_MAX + i, off);
    TOWER.bayColor.push({ x0, x1, yBot, yTop, c: off.clone() });
  });
  // the robots in the windows: one instanced mesh per pose
  TOWER.actors = {};
  for (const pose of TOWER_POSES) {
    const mesh = put(new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.62), new THREE.MeshBasicMaterial({ map: towerSprite(pose, P), transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide /* flipped to face left */ }), n * ROOM_MAX * 3));
    mesh.renderOrder = 2; mesh.count = 0; mesh.frustumCulled = false;
    TOWER.actors[pose] = mesh;
  }
  // every floor's front over them: frames, badges, names, counts; the windows cut out
  for (let k = 0; k < n; k++) {
    const canvas = makeCanvas(FACADE.W, FACADE.H), tex = texFrom(canvas);
    const face = put(new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })));
    face.position.set(0, towerY(k), front + 0.012); face.userData.floor = k; face.renderOrder = 3;
    TOWER.floors.push({ box: face, canvas, tex, bays: [] });
  }
  // the lobby with its entrance, the roof (parapet, plant, the JsonUI sign), the plaza with a shadow and trees
  const lobby = put(new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, LOBBY, D - 0.6), toon(P.concrete)));
  lobby.position.set(0, LOBBY / 2, 0);
  const doorC = makeCanvas(1024, 160), dctx = doorC.getContext('2d');
  dctx.fillStyle = P.concrete; dctx.fillRect(0, 0, 1024, 160);
  dctx.fillStyle = P.on; dctx.fillRect(352, 20, 320, 140); dctx.strokeStyle = P.frame; dctx.lineWidth = 8; dctx.strokeRect(352, 20, 320, 140);
  dctx.beginPath(); dctx.moveTo(512, 20); dctx.lineTo(512, 160); dctx.stroke();
  const door = put(new THREE.Mesh(new THREE.PlaneGeometry(W - 0.6, LOBBY), new THREE.MeshBasicMaterial({ map: texFrom(doorC), toneMapped: false })));
  door.position.set(0, LOBBY / 2, (D - 0.6) / 2 + 0.01);
  const canopy = put(new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 1.4), toon(P.frame)));
  canopy.position.set(0, LOBBY + 0.02, front + 0.55);
  const parapet = put(new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.5, D + 0.5), toon(P.concrete)));
  parapet.position.set(0, top + SLAB + 0.25, 0);
  const plant = put(new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 2.4), toon(P.frame)));
  plant.position.set(-W / 2 + 2.6, top + SLAB + 0.95, -D / 2 + 2);
  const signC = makeCanvas(1024, 256), sctx = signC.getContext('2d');
  sctx.fillStyle = P.ink; sctx.beginPath(); sctx.roundRect(8, 8, 1008, 240, 40); sctx.fill();
  sctx.fillStyle = P.panel; sctx.font = `150px ${FONT_DISPLAY}`; sctx.textAlign = 'center'; sctx.textBaseline = 'middle'; sctx.fillText('JsonUI', 512, 136);
  const sign = put(new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.3), new THREE.MeshBasicMaterial({ map: texFrom(signC), toneMapped: false, side: THREE.DoubleSide })));
  sign.position.set(1.6, top + SLAB + 1.4, front - 0.4);
  TOWER.sign = sign.material;
  // the outside: the season, with the weather over it (OUTSIDE above)
  const sea = season(), w = weatherNow(), snowy = sea === 'winter' || (w && w.kind === 'snow'), wet = w && (w.kind === 'rain' || w.kind === 'thunder');
  const ground = snowy ? (dark ? '#c3ccd8' : '#f1f5fa') : wet ? (dark ? '#151d2a' : '#b4bfcd') : (dark ? '#1c2636' : '#cfd8e4');
  const plaza = put(new THREE.Mesh(new THREE.BoxGeometry(W + 9, 0.2, D + 9), toon(ground)));
  plaza.position.set(0, -0.1, 0); plaza.userData.outside = 'plaza';
  const shadow = put(new THREE.Mesh(new THREE.PlaneGeometry(W + 3, D + 3), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: dark ? 0.35 : 0.14, depthWrite: false })));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(0.8, 0.01, 0.6);
  if (snowy) {                                        // a thin snow on the roof, inside the parapet
    const roofSnow = put(new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.06, D + 0.4), toon(dark ? '#d6dde8' : '#ffffff')));
    roofSnow.position.set(0, top + SLAB + 0.53, 0); roofSnow.userData.outside = 'roofSnow';
  }
  const spots = [[-W / 2 - 2.2, front + 2.2], [W / 2 + 2.2, front + 2.2], [-W / 2 - 2.6, -D / 2 + 0.5], [W / 2 + 2.6, -D / 2 + 0.5], [-5.2, front + 3.4], [5.2, front + 3.4]];
  const trunks = put(new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 6), toon('#7a5a3c'), spots.length));
  spots.forEach(([x, z], i) => { m.makeTranslation(x, 0.45, z); trunks.setMatrixAt(i, m); });
  const CROWN = { spring: ['#f6bfd0', '#b98597'], summer: ['#2f8a4e', '#2a6643'], autumn: ['#de7a2e', '#a95a2a'] };
  if (sea === 'winter') {                             // bare: three branches each, a little snow on top
    const branches = put(new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.06, 1.0, 5), toon('#6b4e33'), spots.length * 3));
    branches.userData.outside = 'branches';
    const q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
    spots.forEach(([x, z], i) => [-0.5, 0, 0.55].forEach((tilt, j) => {
      e.set(0, j * 2.1 + i, tilt); q.setFromEuler(e); m.compose(new THREE.Vector3(x + tilt * 0.4, 1.3, z), q, one); branches.setMatrixAt(i * 3 + j, m);
    }));
  } else {
    const crowns = put(new THREE.InstancedMesh(new THREE.ConeGeometry(0.85, 1.9, 8), toon('#ffffff'), spots.length));
    crowns.userData.outside = 'crowns';
    const autumn2 = new THREE.Color(dark ? '#8c3424' : '#c8452f');
    spots.forEach(([x, z], i) => {
      m.makeTranslation(x, 1.7, z); crowns.setMatrixAt(i, m);
      crowns.setColorAt(i, sea === 'autumn' && i % 2 ? autumn2 : new THREE.Color(CROWN[sea][dark ? 1 : 0]));
    });
    if (sea === 'summer') {                           // a cicada on each trunk, facing out
      const cicadas = put(new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.15, 0.06), toon('#3d2f1c'), spots.length));
      cicadas.userData.outside = 'cicadas';
      spots.forEach(([x, z], i) => { m.makeTranslation(x, 0.62 + (i % 3) * 0.08, z + 0.16); cicadas.setMatrixAt(i, m); });
    }
  }
  // falling things: the weather's (rain, snow) over the season's (petals, leaves); none in a summer or winter calm
  const fall = wet ? 'rain' : w && w.kind === 'snow' ? 'snow' : sea === 'spring' ? 'petal' : sea === 'autumn' ? 'leaf' : null;
  TOWER.fall = null;
  if (fall) {
    const N = Math.min(OUTSIDE.max, { rain: 160, snow: 120, petal: 50, leaf: 40 }[fall]);
    const geo = fall === 'rain' ? new THREE.PlaneGeometry(0.025, 0.42) : new THREE.PlaneGeometry(0.13, 0.1);
    const color = { rain: dark ? '#7f93ad' : '#7d8fa6', snow: '#ffffff', petal: '#ffc2d3', leaf: '#d96a2a' }[fall];
    const mesh = put(new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: fall === 'rain' ? 0.7 : 0.95, depthWrite: false }), N));
    mesh.userData.outside = fall;
    const rnd = snackRandom(20261020), span = [W / 2 + 6, top + 4, D / 2 + 6];
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = (rnd() * 2 - 1) * span[0]; pos[i * 3 + 1] = rnd() * span[1]; pos[i * 3 + 2] = (rnd() * 2 - 1) * span[2]; }
    TOWER.fall = { kind: fall, mesh, pos, span, speed: { rain: 9, snow: 0.9, petal: 0.7, leaf: 1.1 }[fall], n: N };
    fallPlace(0);
  }
  scene.add(TOWER.group);
}
/* The falling things, placed for time t (still under reduced motion: where they were made). */
function fallPlace(dt, t = 0) {
  const F = TOWER.fall;
  if (!F) return;
  const { m, q, p, s } = towerTmp, e = new THREE.Euler();
  for (let i = 0; i < F.n; i++) {
    const k = i * 3;
    if (dt > 0) {
      F.pos[k + 1] -= F.speed * dt * (0.8 + (i % 5) * 0.1);
      if (F.kind !== 'rain') F.pos[k] += Math.sin(t * 0.9 + i) * 0.4 * dt;
      if (F.pos[k + 1] < 0) F.pos[k + 1] += F.span[1];
    }
    e.set(F.kind === 'rain' ? 0 : t * 1.3 + i, F.kind === 'rain' ? 0 : i, F.kind === 'rain' ? 0.15 : t + i * 0.7);
    q.setFromEuler(e); p.set(F.pos[k], F.pos[k + 1], F.pos[k + 2]); s.set(1, 1, 1);
    m.compose(p, q, s); F.mesh.setMatrixAt(i, m);
  }
  F.mesh.instanceMatrix.needsUpdate = true;
}
function towerSync(now = performance.now()) {
  towerBuild();
  const waits = LIVE.floors.some((f) => f.some((id) => LIVE.rank[id] === 0));
  const pulse = waits && !reduceMotion ? Math.round((0.5 + 0.5 * Math.sin(now / 160)) * 4) / 4 : 1;   // a waiting window's frame
  const sig = JSON.stringify([LIVE.floors, LIVE.rank, TOWER.floors.map((F, k) => towerFloorText(k)).map((t) => [t.working, t.waiting, t.idle]),
    SOURCE.mode === 'live' ? PLAY.list.map((G) => [G.room, G.kind, !!G.t0]) : []]);   // a game's name on its window (2.3.3)
  if (sig === TOWER.sig && pulse === TOWER.pulse) return;
  const P = towerPalette(), all = sig !== TOWER.sig;
  TOWER.sig = sig; TOWER.pulse = pulse;
  // A pulse alone redraws only the floors with a waiting window (a whole front is a 2048 × 384 upload).
  TOWER.floors.forEach((F, k) => { if (all || (LIVE.floors[k] || []).some((id) => LIVE.rank[id] === 0)) towerFacade(F, k, P); });
}
/* Every frame in the building: the lights fade toward on / off / none (instant under reduced motion), and the
   robots move — at their desks, walking across, pointing at a board where the room works; a raised hand where it
   waits for permission; a still shadow in a room whose lights are off; nobody where there is no room. */
const towerTmp = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(1, 1, 1), c: new THREE.Color() };
function towerAnimate(t, dt) {
  if (!TOWER.lights || !TOWER.actors) return;
  const P = towerPalette(), want = { working: P.on, thinking: P.on, waiting: P.on, idle: P.off, empty: P.none };
  const k = reduceMotion ? 1 : Math.min(1, dt * 4);
  const counts = Object.fromEntries(TOWER_POSES.map((p) => [p, 0]));
  const { m, q, p, s, c } = towerTmp;
  const place = (pose, x, y, flip = 1, tilt = 0) => {
    const mesh = TOWER.actors[pose];
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), tilt); p.set(x, y + 0.31, (TOWER.D / 2) + 0.008); s.set(flip, 1, 1);
    m.compose(p, q, s); mesh.setMatrixAt(counts[pose]++, m);
  };
  const still = reduceMotion;
  TOWER.floors.forEach((F, fk) => F.bays.forEach((bay, i) => {
    const B = TOWER.bayColor[fk * ROOM_MAX + i];
    if (!B) return;
    B.c.lerp(c.set(want[bay.state]), k);
    TOWER.lights.setColorAt(fk * ROOM_MAX + i, B.c);
    const w = B.x1 - B.x0, x = (f) => B.x0 + w * f, seed = fk * 7 + i * 3;
    if (bay.state === 'working') {
      place('type', x(0.22), B.yBot + (still ? 0 : Math.abs(Math.sin(t * 9 + seed)) * 0.015));
      const ph = still ? 0.25 : ((t / 6 + seed * 0.13) % 1);
      const fwd = ph < 0.5, f = fwd ? ph * 2 : 2 - ph * 2;
      place(still || Math.floor(t * 4 + seed) % 2 ? 'walkA' : 'walkB', x(0.38 + f * 0.36), B.yBot, fwd ? 1 : -1);
      place('point', x(0.86), B.yBot, -1, still ? 0 : Math.sin(t * 1.4 + seed) * 0.04);
    } else if (bay.state === 'thinking') {          // hands to chins, a … over one of them
      place('think', x(0.35), B.yBot, 1, still ? 0 : Math.sin(t * 0.9 + seed) * 0.05); place('type', x(0.72), B.yBot, -1);
    } else if (bay.state === 'waiting') {
      place('raise', x(0.55), B.yBot + (still ? 0 : Math.abs(Math.sin(t * 3 + seed)) * 0.05));
      place('type', x(0.2), B.yBot);
    } else if (bay.state === 'idle') {
      place('shadow', x(0.3), B.yBot); place('shadow', x(0.72), B.yBot, -1);
    }
  }));
  TOWER.lights.instanceColor.needsUpdate = true;
  if (TOWER.sign) {                                  // the roof's sign lights up at night, a slow glow (steady under reduced motion)
    const night = skyPhase(new Date(vizNow())) === 'night', glow = reduceMotion ? 1 : 0.6 + 0.4 * Math.abs(Math.sin(t * 1.4));
    TOWER.sign.color.set(night ? c.set('#ffffff').lerp(new THREE.Color('#ffd76a'), glow) : c.set('#ffffff'));
  }
  for (const pose of TOWER_POSES) { const mesh = TOWER.actors[pose]; mesh.count = counts[pose]; mesh.instanceMatrix.needsUpdate = true; }
  if (!reduceMotion) fallPlace(Math.min(dt, 0.1), t);   // petals, leaves, rain or snow (still under reduced motion)
  const w = weatherNow();                               // thunder: a short white flash now and then (none under reduced motion)
  const flash = w && w.kind === 'thunder' && !reduceMotion && (t % 7.3) < 0.12;
  if (flash !== !!TOWER.flash) { TOWER.flash = flash; sceneEl.style.filter = flash ? 'brightness(1.8)' : ''; }
}
/* The room under the pointer in the building: its full name and state, as the canvas's title. */
const TOWER_STATE_JA = { working: '作業中', thinking: '考え中', waiting: '許可待ち', idle: '待機（消灯）', empty: '空き' };
function towerHover(hit) {
  const F = hit && TOWER.floors[hit.object.userData.floor];
  const bay = F && hit.uv ? F.bays.find((b) => hit.uv.x >= b.x0 && hit.uv.x <= b.x1) : null;
  return bay ? `${hit.object.userData.floor + 1}F · ${bay.id ? towerName(bay.id) : '（空き）'} · ${TOWER_STATE_JA[bay.state]}` : '';
}
function towerPose() {
  const h = towerBase(LIVE.floors.length) + 3, c = new THREE.Vector3(0, h / 2, 0);
  const dist = Math.max(24, h * 1.5 + 15);
  return { p: c.clone().add(new THREE.Vector3(6.5, 6, 22.5).normalize().multiplyScalar(dist)), t: c };
}
function towerSetView(on) {
  TOWER.on = on;
  camera.layers.set(on ? TOWER.LAYER : 0);
  controls.minDistance = on ? 14 : 8; controls.maxDistance = on ? 150 : 80;
  // The building is looked at from its middle, so it can turn almost to face-on (just above the horizon);
  // a floor keeps the office's limit, which never shows the underside of the floor.
  controls.maxPolarAngle = on ? 1.52 : 1.25;
}
function towerEnter() {
  if (TOWER.on || LIVE.floors.length < 2 || zoom.zoomed) return;
  TOWER.look = LIVE.floor;
  towerSync();
  towerSetView(true);
  const pose = towerPose();
  controls.enabled = false;
  flyTo(pose.p, pose.t, controls.target, reduceMotion ? 0 : 0.8, () => { controls.target.copy(pose.t); controls.enabled = true; controls.update(); });
}
/* Down from the building into floor k (the camera starts at that floor's height in the building).
   ``project``: the room of the window pressed (that room alone), or null for an empty window (the whole floor);
   left out (the building button, the wheel), the view stays on what was picked before. */
function towerLeave(k, project) {
  if (!TOWER.on) return;
  towerSetView(false);
  if (liveGoToFloor(k)) LIVE3D.floorMove = true;
  const picked = project === undefined ? undefined : project && PROJECT[project] ? project : 'all';
  if (picked !== undefined && UI.project !== picked) { setProject(picked); return; }   // setProject flies there
  const pose = SOURCE.mode === 'live' ? liveRoomPose(UI.project !== 'all' && PROJECT[UI.project] && PROJECT[UI.project].shown ? UI.project : 'all') : roomPose(UI.project);
  controls.enabled = false;
  flyTo(pose.p, pose.t, controls.target, reduceMotion ? 0 : 0.8, () => { controls.target.copy(pose.t); controls.enabled = true; controls.update(); });
}
/* In the building, look at floor k's front (the demo's floor change; the floor buttons in the demo's building). */
function towerLookAt(k) {
  if (!TOWER.on) return;
  TOWER.look = Math.max(0, Math.min(LIVE.floors.length - 1, k));
  const y = towerY(TOWER.look), t = new THREE.Vector3(0, y, TOWER.D / 2), p = t.clone().add(new THREE.Vector3(5, 3, 30));
  controls.enabled = false;
  flyTo(p, t, controls.target, reduceMotion ? 0 : 0.9, () => { controls.target.copy(t); controls.enabled = true; controls.update(); });
}
/* One floor up (+1) or down (-1): the camera comes in from above or below. */
function liveFloorStep(dir) {
  const k = LIVE.floor + dir;
  if (TOWER.on) { towerLeave(Math.max(0, Math.min(LIVE.floors.length - 1, k))); return; }
  if (zoom.zoomed || !liveGoToFloor(k)) return;
  LIVE3D.floorMove = true;
  const id = UI.project !== 'all' && PROJECT[UI.project] && PROJECT[UI.project].shown ? UI.project : 'all';
  const pose = liveRoomPose(id), lift = new THREE.Vector3(0, -dir * 14, 0);
  camera.position.copy(pose.p).add(lift); controls.target.copy(pose.t).add(lift);
  controls.enabled = false;
  flyTo(pose.p, pose.t, controls.target, reduceMotion ? 0 : 0.7, () => { controls.target.copy(pose.t); controls.enabled = true; controls.update(); });
}
/* A project picked in the menu: its floor first (out of the building if need be); focusProject then flies to it. */
function liveShowFloorOf(id) {
  if (id === 'all' || !PROJECT[id]) return;
  if (TOWER.on) towerSetView(false);
  const k = liveFloorOf(id);
  if (k >= 0 && liveGoToFloor(k)) LIVE3D.floorMove = true;
}
function liveBoardPose(project, which, i) {
  const R = LIVE3D.rooms[project] || Object.values(LIVE3D.rooms)[0];
  if (!R) return { p: camera.position.clone(), t: controls.target.clone() };
  const b = which === 'tasks' ? R.kb : R.pb;
  const t = which !== 'tasks' && i >= 0 ? b.tiles.find((q) => q.i === i) : null;
  if (t) return meshPose(b.mesh, b.w, b.h, (t.x + t.w / 2) / b.W, (t.y + t.h / 2) / b.H, Math.max(1.2, (t.w / b.W) * b.w * 2.2));
  return meshPose(b.mesh, b.w, b.h, undefined, undefined, b.w * 1.15 + 0.6);
}
/* The live phone screen: the command a robot runs on a device (the device itself comes in P7). */
function drawLivePhone(r, t) {
  const c = r.phoneCanvas, ctx = c.getContext('2d'), W = c.width;
  const act = (robotState[r.label] && robotState[r.label].act) || '';
  const run = (Array.isArray(LIVE.slices.tests) ? LIVE.slices.tests : []).find((x) => x && x.status === 'running' && labelOf(x.agentId) === r.label);
  const cases = run && Array.isArray(run.cases) ? run.cases : [];
  const done = cases.filter((c) => c.status === 'passed').length, now = cases.find((c) => c.status === 'running');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1d2330'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  rr(ctx, 6, 6, W - 12, 360, 28); ctx.fill(); ctx.stroke();
  ctx.save(); rr(ctx, 24, 24, 192, 320, 18); ctx.clip();
  ctx.fillStyle = '#0d1828'; ctx.fillRect(24, 24, 192, 320);
  ctx.fillStyle = pillBg(r.role); ctx.fillRect(24, 24, 192, 46);   // a header with text: the pill's pair
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = pillInk(r.role); ctx.font = `700 15px ${FONT_BODY}`; ctx.fillText('テスト実行', 36, 54);
  ctx.fillStyle = '#9fc3ff'; ctx.font = `600 12px ${FONT_MONO}`;
  wrapText(ctx, act || '待機中', 36, 96, 168, 18, cases.length ? 6 : 12);
  if (cases.length) {
    ctx.fillStyle = '#4fd48a'; ctx.font = `700 14px ${FONT_BODY}`; ctx.fillText(`${done}/${cases.length} 通過`, 36, 222);
    if (now) { ctx.fillStyle = '#ffffff'; ctx.font = `500 12px ${FONT_BODY}`; wrapText(ctx, `▶ ${now.name}`, 36, 244, 168, 16, 3); }
  }
  const ph = (t * 0.9) % 1;
  ctx.beginPath(); ctx.arc(120, 300, 6 + ph * 18, 0, Math.PI * 2); ctx.strokeStyle = `rgba(122, 180, 255, ${(0.9 * (1 - ph)).toFixed(2)})`; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  r.phoneTex.needsUpdate = true; r.phoneScreenTex.needsUpdate = true;
}

if (has3D) build3D();

const tmpV = new THREE.Vector3();
function placeTag(el, p) {
  tmpV.copy(p).project(camera);
  if (tmpV.z > 1 || tmpV.z < -1) { el.style.visibility = 'hidden'; return; }
  el.style.visibility = 'visible';
  const x = ((tmpV.x + 1) / 2) * canvas.clientWidth, y = ((1 - tmpV.y) / 2) * canvas.clientHeight;
  el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
}
/* Robots' name tags kept apart on screen (10-19): two robots close by (at play, in the smoking booth, at desks side
   by side) put their tags on each other and the one behind could not be read. Each frame, nearest first, a tag that
   would cross one already placed moves up just above it; the move eases (no flicker when the order swaps). Sizes
   are read again only when the text changes or every TAGS.measureMs, all reads before all writes (one layout). A
   robot showing じゃんけん lifts its tag clear of the hand. Cost per frame: TAGS.stats (the e2e reads it). */
const TAGS = { gap: 3, ease: 0.35, measureMs: 500, maxPasses: 12, rpsLift: 0.55, stats: { n: 0, sumMs: 0, maxMs: 0, frames: 0 } };
const tagNdc = new THREE.Vector3();
function placeRobotTags(dt = 1 / 60) {
  const ease = 1 - Math.pow(1 - TAGS.ease, dt * 60);   // TAGS.ease of the way each 1/60 s, in real time (it was per frame)
  const t0 = performance.now(), W = canvas.clientWidth, H = canvas.clientHeight, list = [];
  billsExpire();   // 54-bills.js
  for (const R of robots) {
    const size = R.robot.size || 1;   // a subagent is smaller (2.3.5): its tag just above its own head
    tagNdc.copy(R.robot.root.position).addScaledVector(TAG_UP, size);
    if (R.robot.rps && R.robot.rps.visible) tagNdc.y += TAGS.rpsLift * size;
    tagNdc.project(camera);
    const hidden = tagNdc.z > 1 || tagNdc.z < -1 || !R.robot.root.visible || R.tag.hidden;
    const text = R.tag.textContent;
    if (!hidden && (!R.tagSize || R.tagSize.text !== text || t0 - R.tagSize.at > TAGS.measureMs)) R.tagSize = { text, at: t0, w: R.tag.offsetWidth, h: R.tag.offsetHeight };
    // the bill (54-bills.js) sits on the tag, inside the tag's box: what keeps tags apart keeps it off every tag
    const bill = !hidden && R.bill && !R.bill.hidden ? R.bill : null, btext = bill ? bill.textContent : '';
    if (bill && (!R.billSize || R.billSize.text !== btext)) R.billSize = { text: btext, w: bill.offsetWidth, h: bill.offsetHeight };
    list.push({ R, hidden, bill, x: ((tagNdc.x + 1) / 2) * W, y: ((1 - tagNdc.y) / 2) * H, z: tagNdc.z });
  }
  const placed = [];
  for (const it of list.filter((q) => !q.hidden).sort((a, b) => a.z - b.z)) {   // nearest first: it keeps its spot
    const b = it.bill ? it.R.billSize : null;
    const w = Math.max(it.R.tagSize.w, b ? b.w : 0), h = it.R.tagSize.h + (b ? b.h + BILL.gap + BILL.rise : 0);
    const x0 = it.x - w / 2, x1 = it.x + w / 2;
    let bottom = it.y;
    for (let pass = 0; pass < TAGS.maxPasses; pass++) {
      const hit = placed.find((p) => x0 < p.x1 && p.x0 < x1 && bottom - h < p.y1 && p.y0 < bottom);
      if (!hit) break;
      bottom = hit.y0 - TAGS.gap;   // just above the one it crossed
    }
    placed.push({ x0, x1, y0: bottom - h, y1: bottom });
    it.target = it.y - bottom;
    it.front = placed.length;   // 1 = the nearest: its tag (and bill) is drawn over, and takes the click from, any farther one
  }
  for (const it of list) {   // the writes
    const el = it.R.tag;
    if (it.hidden) { el.style.visibility = 'hidden'; it.R.tagDy = 0; if (it.R.bill) it.R.bill.style.visibility = 'hidden'; continue; }
    el.style.visibility = 'visible';
    const zi = String(-it.front);   // negative: under the rooms' signs (z-index 1), inside .tags (isolation: isolate)
    if (el.style.zIndex !== zi) el.style.zIndex = zi;
    if (it.R.bill && it.R.bill.style.zIndex !== zi) it.R.bill.style.zIndex = zi;
    const dy = it.R.tagDy === undefined ? it.target : it.R.tagDy + (it.target - it.R.tagDy) * ease;
    it.R.tagDy = Math.abs(dy - it.target) < 0.5 ? it.target : dy;
    it.R.tagTarget = it.target;   // where the tag is going (the e2e reads a tag once tagDy has reached it: the settle hook of 80-dbg.js)
    el.style.transform = `translate(${it.x.toFixed(1)}px, ${(it.y - it.R.tagDy).toFixed(1)}px) translate(-50%, -100%)`;
    if (it.bill) {   // its bottom just above the tag; it rises inside the room the box kept for it (BILL.rise)
      it.bill.style.visibility = 'visible';
      it.bill.style.transform = `translate(${it.x.toFixed(1)}px, ${(it.y - it.R.tagDy - it.R.tagSize.h - BILL.gap).toFixed(1)}px) translate(-50%, -100%)`;
    } else if (it.R.bill) it.R.bill.style.visibility = 'hidden';
  }
  const ms = performance.now() - t0, S0 = TAGS.stats;
  S0.n = list.length; S0.frames++; S0.sumMs += ms; S0.maxMs = Math.max(S0.maxMs, ms);
}
const HEAD_UP = new THREE.Vector3(0, 2.2, 0);
const TAG_UP = new THREE.Vector3(0, 2.62, 0);
function robotPoint(id, up) { const R = robots.find((x) => x.def.id === id); return R.robot.root.position.clone().addScaledVector(up, R.robot.size || 1); }   // a subagent is smaller (2.3.5)

function update3D(model, nowSec, dt) {
  if (SOURCE.mode === 'live') { liveUpdateRobots(nowSec, dt); liveSoloSync(); }
  else {
    demoDirector(model, nowSec);
    serverDoorTick(nowSec);
    for (const R of robots) {
      const st = robotState[R.def.id];
      setRobotTired(R.robot, forced(R.robot, 'tired', demoTired(R.def.id)));
      R.robot.heavy = forced(R.robot, 'heavy', demoHeavy(R.def.id, model.t));
      R.robot.launch = forced(R.robot, 'launch', demoLaunch(R.def.id, model.t));   // a subagent called (10-20)
      if (st.walk) { R.robot.root.position.x = st.walk.x; R.robot.root.position.z = st.walk.z; R.robot.root.rotation.y = st.walk.ry; }
      if (st.state !== R.robot.state) setRobotState(R.robot, st.state);
      if (st.act !== R.act) { R.act = st.act; R.text.textContent = st.act; }
      updateRobot(R.robot, nowSec, dt);
    }
    // A line from each busy robot to the part of the board it is working on (a2 points at the test board).
    const used = new Set();
    model.specs.forEach((s, i) => {
      if (!s.by || s.by === 'a2' || zoom.zoomed) return;
      let to;
      if (s.project === 'shop') { const [px, py] = sbFocus(SHOP_POS[i], activeSec(s)); to = sbPoint(px, py); }
      else {
        const pb = PBOARD[s.project], t = pb && pb.tiles.find((q) => q.i === i);
        if (!t) return;
        const [px, py] = tileFocus(t.x, t.y, t.w, t.h, PBG, activeSec(s)); to = pbPoint(pb, px, py);
      }
      linkFor(s.by).set(robotPoint(s.by, HEAD_UP), to, true, nowSec);
      used.add(s.by);
    });
    if (model.tests.runningIdx >= 0 && !zoom.zoomed) { linkFor('a2').set(robotPoint('a2', HEAD_UP), tbPoint(TB.W - 70, tbRowTop(model.tests.runningIdx) + 36), true, nowSec); used.add('a2'); }
    for (const [id, L] of Object.entries(links)) if (!used.has(id)) L.set(null, null, false, nowSec);

    const shopTasks = model.tasks.filter((x) => PROJECT_OF[x.list] === 'shop');
    const open = shopTasks.filter((x) => x.status !== 'completed').length;
    const closed = shopTasks.filter((x) => x.status === 'completed').length;
    trayPending.forEach((p, i) => { p.visible = i < open; });
    trayDone.forEach((p, i) => { p.visible = i < closed; });
    trayTag.el.textContent = `書類 未完了 ${open} ／ 完了 ${closed}`;

    const a2 = robots.find((x) => x.def.id === 'a2').robot;
    standMat.map = robotState.a2.state === 'phone' ? a2.phoneScreenTex : standOffTex;
  }

  const w = sceneEl.clientWidth, h = sceneEl.clientHeight, pr = renderer.getPixelRatio();
  if (canvas.width !== Math.floor(w * pr) || canvas.height !== Math.floor(h * pr)) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = Math.min(62, 32 * Math.max(1, Math.pow(1.4 / camera.aspect, 0.85)));
    camera.updateProjectionMatrix();
  }
  const sel = rbState.id && robots.find((x) => x.def.id === rbState.id);
  selRing.visible = !!sel;
  if (sel) {
    selRing.position.set(sel.robot.root.position.x, 0.03, sel.robot.root.position.z);
    selRing.material.color.set(ROLES[sel.def.role].color);
    selRing.scale.setScalar(1 + 0.06 * Math.sin(nowSec * 3));
    // keep the robot framed, also while it walks or after switching to another robot
    // 8% of the way each 1/60 s, in real time (it was 8% a frame: the camera crawled on a busy machine)
    if (!camTween && zoom.zoomed) { const pose = robotPose(rbState.id), k = 1 - Math.pow(1 - 0.08, dt * 60); camera.position.lerp(pose.p, k); viewTarget.lerp(pose.t, k); }
  }
  stepTween(performance.now());
  if (camTween || zoom.zoomed) camera.lookAt(viewTarget); else controls.update();
  if (!srCovers()) renderer.render(scene, camera);   // the server room covers the whole page: its own 3D is the one drawn
  if (TOWER.on) { towerSync(); towerAnimate(nowSec, dt); }
  skySync();
  tagsEl.hidden = zoom.zoomed || TOWER.on;
  placeRobotTags(dt);
  for (const rt of roomTags) { placeTag(rt.el, rt.p); rt.el.classList.toggle('on', UI.project === rt.id); }
  if (trayTag) placeTag(trayTag.el, trayTag.p);   // the demo's document tray
}
// ---- web/js/50-panel.js ----

/* ---------- side panel ---------- */
const $ = (id) => document.getElementById(id);
const setHTML = (el, html) => { if (el._html !== html) { el.innerHTML = html; el._html = html; } };
const setText = (el, text) => { if (el && el.textContent !== text) el.textContent = text; };
/* The legend of heavy work's three looks (2.3.6), under the card's 重い作業 line. */
const HEAVY_LEGEND = '見た目: 赤い顔＝出力が多い · 青い顔＝ツールが長く走っている · 笛＝サブエージェント 3 体以上（重なると交互） · 裏で作業中でも、サブエージェント 3 体以上なら笛（ヘッドセットを外す）';
const STATUS_CLASS = { idle: 'st-idle', write: 'st-write', written: 'st-idle', impl: 'st-impl', verify: 'st-verify', 'impl-done': 'st-idle', paused: 'st-paused', test: 'st-test', done: 'st-complete' };
function robotBadge(id) {
  const s = robotState[id].state;
  // a question waits for the person too, but it is no permission: its own badge and filter (requester, 10-18)
  if (s === 'waiting') return robotState[id].asking ? ['st-asking', '質問に回答待ち'] : ['st-waiting', '許可待ち'];
  if (s === 'done') return ['st-done', '完了'];
  if (s === 'idle') return ['st-idle', '待機'];
  if (s === 'thinking') return ['st-busy', '考え中'];
  if (s === 'background') return ['st-bg', '裏で作業中'];
  return ['st-busy', '作業中'];
}
/* What the view is narrowed to: one project (or all), which sessions, how the session list is shown. */
const prefJSON = (key, fallback) => { try { return JSON.parse(readPref(key, JSON.stringify(fallback))); } catch (err) { return fallback; } };
const UI = {
  project: PROJECT[readPref('project', 'all')] ? readPref('project', 'all') : 'all',
  hiddenLists: new Set(),          // task lists left off the task board
  lanes: readPref('lanes', 'off') === 'on',
  sessFilter: readPref('sessFilter', 'all'),
  collapsed: new Set(prefJSON('collapsed', [])),
};
if (!['all', 'active', 'waiting', 'asking', 'background', 'idle'].includes(UI.sessFilter)) UI.sessFilter = 'all';
const inScope = (project) => UI.project === 'all' || UI.project === project;
const scopeLabel = () => (UI.project === 'all' ? 'すべて' : PROJECT[UI.project].name);
function sessionBadge(s) {
  const b = s.robots.map(robotBadge);
  // A session whose busy robots only think says 考え中, as its robot row does (they disagreed — 10-18 review).
  return b.some((x) => x[0] === 'st-waiting') ? ['st-waiting', '許可待ち'] : b.some((x) => x[0] === 'st-asking') ? ['st-asking', '質問に回答待ち'] : b.some((x) => x[1] === '作業中') ? ['st-busy', '作業中']
    : b.some((x) => x[1] === '考え中') ? ['st-busy', '考え中'] : b.some((x) => x[0] === 'st-bg') ? ['st-bg', '裏で作業中'] : ['st-idle', '待機'];
}
/* A robot on the whiteboards (10-19): its mark, and its session's name when it has one. */
const robotWho = (id) => `${pill(id, DEF[id].role)}${DEF[id].title ? `<span class="who-name">${esc(DEF[id].title)}</span>` : ''}`;
const roleVar = (s) => (s.by ? ` style="--c:${ROLES[DEF[s.by].role].color}"` : '');
/* Lists of buttons are rebuilt only when their membership changes, so keyboard focus survives the
   four-times-a-second refresh; the changing text and bars inside are updated in place. */
/* Everything a permission card shows that can change while it waits: its state, what the hooks allow (the async
   forward reports first with nothing allowed; --decide comes a moment later and allows the buttons), what was sent. */
const permSig = (p) => (p ? JSON.stringify([p.id, p.status, p.can, p.tooLongToShow, p.sentBy, p.sentRules, p.sentReason, p.input && p.input.command, p.task]) : '');
function keyed(el, sig, build) {
  if (el._sig === sig) return;
  const a = document.activeElement, fk = el.contains(a) ? a.dataset.fk : undefined;
  el.innerHTML = build(); el._sig = sig; el._html = null;
  if (fk !== undefined) { const again = el.querySelector(`[data-fk="${CSS.escape(fk)}"]`); if (again) again.focus({ preventScroll: true }); else el._lostFk = fk; }
}
const SEGS = `<span class="segs" aria-hidden="true">${'<i></i>'.repeat(7)}</span>`;
const SG_CLASS = { empty: 'sg-empty', writing: 'sg-writing', written: 'sg-written', impl: 'sg-impl', done: 'sg-done', test: 'sg-test', tested: 'sg-tested' };
function paintSegs(el, s) {
  const act = s.by ? activeSec(s) : -1;
  [...el.children].forEach((node, k) => {
    const g = secState(s, k), cls = SG_CLASS[g.kind] + (k === act ? ' sg-now' : ''), f = `${pct(g.f)}%`;
    if (node.className !== cls) node.className = cls;
    if (node._f !== f) { node.style.setProperty('--f', f); node._f = f; }
  });
}

/* panel open / close */
const mainEl = document.querySelector('.main');
let sideOpen = readPref('side', 'open') === 'open';
function applySide() {
  mainEl.classList.toggle('side-closed', !sideOpen);
  const b = $('btn-side');
  b.setAttribute('aria-expanded', String(sideOpen));
  b.textContent = sideOpen ? 'パネルを閉じる' : 'パネルを開く';
}
$('btn-side').addEventListener('click', () => { sideOpen = !sideOpen; writePref('side', sideOpen ? 'open' : 'closed'); applySide(); });
applySide();

let specFilter = readPref('specFilter', 'live');
if (!['live', 'partial', 'todo', 'done', 'all'].includes(specFilter)) specFilter = 'live';
const specFilterEl = $('spec-filter'), specListEl = $('spec-list');
specFilterEl.innerHTML = [...BUCKETS, ['all', 'すべて']].map(([b, label]) => `<button type="button" data-f="${esc(b)}" aria-pressed="${b === specFilter}">${esc(label)}<b></b></button>`).join('');
specFilterEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-f]');
  if (!b) return;
  specFilter = b.dataset.f; writePref('specFilter', specFilter);
  [...specFilterEl.children].forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  renderPanel(latestModel);
});
specListEl.addEventListener('click', (e) => { const b = e.target.closest('[data-idx]'); if (b) openWhiteboard(Number(b.dataset.idx), b); });
$('btn-specboard').addEventListener('click', (e) => openWhiteboard(-1, e.currentTarget));
$('btn-taskboard').addEventListener('click', (e) => openTaskBoard(e.currentTarget));

const COL_STATE = { doing: ['st-busy', '作業中'], wait: ['st-waiting', '待ち'], todo: ['st-idle', '未着手'], done: ['st-done', '完了'] };
const paintState = (node, [cls, label]) => { if (!node) return; const c = `state ${cls}`; if (node.className !== c) node.className = c; setText(node, label); };
const SESS_FILTERS = [['all', 'すべて'], ['active', '動いている'], ['waiting', '許可待ち'], ['asking', '質問待ち'], ['background', '裏で作業中'], ['idle', '待機']];
const sessFilterEl = $('sess-filter');
sessFilterEl.innerHTML = SESS_FILTERS.map(([k, label]) => `<button type="button" data-sf="${esc(k)}" aria-pressed="${k === UI.sessFilter}">${esc(label)}<b></b></button>`).join('');
sessFilterEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-sf]');
  if (!b) return;
  UI.sessFilter = b.dataset.sf; writePref('sessFilter', UI.sessFilter);
  [...sessFilterEl.children].forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  renderSessions();
});
const sessMatch = (s, f) => { const [c] = sessionBadge(s); return f === 'all' || (f === 'active' && c !== 'st-idle') || (f === 'waiting' && c === 'st-waiting') || (f === 'asking' && c === 'st-asking') || (f === 'background' && c === 'st-bg') || (f === 'idle' && c === 'st-idle'); };
$('sessions').addEventListener('click', (e) => {
  const b = e.target.closest('[data-fold]');
  if (!b) return;
  if (UI.collapsed.has(b.dataset.fold)) UI.collapsed.delete(b.dataset.fold); else UI.collapsed.add(b.dataset.fold);
  writePref('collapsed', JSON.stringify([...UI.collapsed]));
  renderSessions();
});
const SB_ORDER = { 'st-waiting': 0, 'st-asking': 1, 'st-busy': 2, 'st-bg': 3, 'st-idle': 4 };
function renderSessions() {
  const el = $('sessions'), scoped = SESSIONS.filter((s) => inScope(s.project));
  [...sessFilterEl.children].forEach((b) => setText(b.lastElementChild, String(scoped.filter((s) => sessMatch(s, b.dataset.sf)).length)));
  // Sessions that need you come first: waiting for permission, then working, then idle.
  const groups = ROOMS.filter((r) => inScope(r.id)).map((r) => [r, scoped.filter((s) => s.project === r.id && sessMatch(s, UI.sessFilter)).sort((a, b) => SB_ORDER[sessionBadge(a)[0]] - SB_ORDER[sessionBadge(b)[0]] || a.id.localeCompare(b.id))]);
  keyed(el, JSON.stringify([UI.project, UI.sessFilter, [...UI.collapsed], groups.map(([r, l]) => [r.id, l.map((x) => x.id)]), NAMES.rev]), () => groups.map(([r, list]) => {
    const folded = UI.collapsed.has(r.id), any = scoped.some((x) => x.project === r.id);
    const itemsHTML = list.map((x) => {
      const subsHTML = x.robots.filter((id) => id !== x.id).map((id) => `<li><button type="button" class="who-btn" data-robot-open="${esc(id)}" data-fk="ss-${esc(id)}">${pill(id, DEF[id].role)}<span>${esc(DEF[id].agent)}</span></button><span class="state" data-st="${esc(id)}"></span><p class="act" data-sact="${esc(id)}"></p></li>`).join('');
      return `<li class="session"><div class="srow"><button type="button" class="who-btn" data-robot-open="${esc(x.id)}" data-fk="ss-${esc(x.id)}">${pill(x.id, 'main')}<span class="sname">${esc(DEF[x.id].agent)}</span></button><span class="state" data-sst="${esc(x.id)}"></span></div><p class="act" data-sact="${esc(x.id)}"></p>${subsHTML ? `<ul class="subs">${subsHTML}</ul>` : ''}</li>`;
    }).join('');
    return `<section class="pgroup"><button type="button" class="pg-toggle" data-fold="${esc(r.id)}" data-fk="pg-${esc(r.id)}" aria-expanded="${!folded}"><span class="pg-caret" aria-hidden="true"></span><b>${esc(r.name)}</b><small data-pgsum="${esc(r.id)}"></small></button>${folded ? '' : itemsHTML ? `<ul class="sessions">${itemsHTML}</ul>` : `<p class="empty-note">${any ? '条件に合うセッションはない' : 'セッションはない'}</p>`}</section>`;
  }).join(''));
  for (const [r] of groups) {
    const all = scoped.filter((x) => x.project === r.id), badges = all.map(sessionBadge);
    const w = badges.filter((b) => b[0] === 'st-waiting').length, ask = badges.filter((b) => b[0] === 'st-asking').length, busy = badges.filter((b) => b[0] === 'st-busy').length;
    setText(el.querySelector(`[data-pgsum="${CSS.escape(r.id)}"]`), `${all.length} セッション${w ? ` · 許可待ち ${w}` : ''}${ask ? ` · 質問待ち ${ask}` : ''}${busy ? ` · 作業中 ${busy}` : ''}`);
  }
  for (const x of scoped) {
    paintState(el.querySelector(`[data-sst="${CSS.escape(x.id)}"]`), sessionBadge(x));
    for (const id of x.robots) {
      if (id !== x.id) paintState(el.querySelector(`[data-st="${CSS.escape(id)}"]`), robotBadge(id));
      setText(el.querySelector(`[data-sact="${CSS.escape(id)}"]`), robotState[id].act);
    }
  }
}
function renderPanel(model) {
  renderSessions();

  const scopedSpecs = model.specs.filter((x) => inScope(x.project)), counts = bucketCounts(scopedSpecs);
  [...specFilterEl.children].forEach((b) => setText(b.lastElementChild, String(b.dataset.f === 'all' ? scopedSpecs.length : counts[b.dataset.f])));
  const roomOrder = Object.fromEntries(ROOMS.map((r, k) => [r.id, k]));
  const shown = model.specs.map((s, i) => [s, i]).filter(([s]) => inScope(s.project) && (specFilter === 'all' || s.bucket === specFilter)).sort((a, b) => roomOrder[a[0].project] - roomOrder[b[0].project] || a[1] - b[1]);
  const multi = new Set(shown.map(([x]) => x.project)).size > 1;
  keyed(specListEl, JSON.stringify([UI.project, specFilter, scopedSpecs.length, shown.map(([x, i]) => `${i}:${x.bucket}:${x.by || ''}:${x.name}`)]), () => (shown.length
    ? shown.map(([x, i], k) => `${multi && (k === 0 || shown[k - 1][0].project !== x.project) ? `<li class="sl-group">${esc(PROJECT[x.project].name)}<b>${shown.filter(([y]) => y.project === x.project).length}</b></li>` : ''}<li><button type="button" class="spec-row b-${esc(x.bucket)}" data-idx="${i}" data-fk="sp-${i}"${roleVar(x)}><span class="nm">${esc(x.name)}</span><span class="stx"></span>${x.by ? pill(x.by, DEF[x.by].role) : ''}${SEGS}</button></li>`).join('')
    : `<li class="empty-note">${!scopedSpecs.length ? `${esc(scopeLabel())} には画面の spec がない` : specFilter === 'live' ? '今は誰も spec を触っていない' : 'この状態の spec はない'}</li>`));
  specListEl.querySelectorAll('.spec-row').forEach((b) => { const s = model.specs[+b.dataset.idx]; setText(b.querySelector('.stx'), s.status.text); paintSegs(b.querySelector('.segs'), s); });

  const T = model.tests, n = CASES.length;
  const pPct = (T.passed / n) * 100, rPct = T.runningIdx >= 0 ? 100 / n : 0;
  if (SOURCE.mode === 'live' && !T.rows.length && !T.command) setHTML($('tests'), `<p class="empty-note">${T.statusText === 'まだ無い' ? 'テストの実行はまだ無い' : esc(T.statusText)}</p>`);
  else if (SOURCE.mode === 'live') setHTML($('tests'), liveTestsHTML(T));
  else if (!inScope('shop')) setHTML($('tests'), `<p class="empty-note">${esc(scopeLabel())} で動いているテストはない</p>`);
  else setHTML($('tests'), `<div class="test-head"><div>${pill('a2', 'test')} <code>${esc(T.file)}</code></div><code>${esc(T.device)} · ${esc(T.statusText)}</code>
<div class="prog" role="img" aria-label="通過 ${T.passed} 件 / 全 ${n} 件"><span class="p" style="width:${pPct}%"></span><span class="${T.retrying ? 'f' : 'r'}" style="width:${rPct}%"></span></div></div>
<ul class="cases">${T.rows.map((c, i) => {
    const icon = { pending: '○', running: '▶', passed: '✓', flaky: '⚠' }[c.status];
    const subHTML = c.status === 'running' ? `<span class="step">${c.attempt > 1 ? '1 回目は失敗 · 再実行中 · ' : ''}${esc(c.step)}</span>` : `<span class="br">分岐: ${esc(c.branch)}${c.status === 'flaky' ? ' · 1 回目は失敗、再実行で通過' : ''}</span>`;
    return `<li class="c-${esc(c.status)}"><span class="ic">${esc(icon)}</span><span>${i + 1}. ${esc(c.name)}</span>${subHTML}</li>`;
  }).join('')}</ul>`);

  // Tasks: a task whose owner is waiting for permission comes first with the answer buttons; prompts that
  // belong to no task get their own row on top.
  const order = { doing: 0, wait: 1, todo: 2, done: 3 };
  const scopedTasks = model.tasks.filter((x) => inScope(PROJECT_OF[x.list]));
  const tasks = [...scopedTasks].sort((a, b) => (b.perm ? 1 : 0) - (a.perm ? 1 : 0) || order[a.col] - order[b.col] || a.list.localeCompare(b.list) || a.id - b.id);
  const scopedPend = model.pending.filter((p) => inScope(projectOfRobot(p.who)));
  const loose = scopedPend.filter((p) => !p.task);
  const projectTag = (list) => (UI.project === 'all' ? `<span class="ptag">${esc(PROJECT[PROJECT_OF[list]].name)}</span>` : '');
  setHTML($('task-sum'), KCOLS.map(([c, label]) => `<span class="state ${COL_STATE[c][0]}">${esc(label)} ${scopedTasks.filter((x) => x.col === c).length}</span>`).join('') + (scopedPend.length ? `<span class="state st-waiting">許可待ち ${scopedPend.length}</span>` : ''));
  keyed($('tasks'), JSON.stringify([UI.project, NAMES.rev, loose.map(permSig), tasks.map((x) => `${x.key}:${x.col}:${permSig(x.perm)}:${x.subject}:${x.owner || ''}`)]), () => [
    ...loose.map((p) => `<li class="task has-perm perm-only"><button type="button" class="task-open" data-open="perm:${esc(p.id)}" data-fk="to-${esc(p.id)}"><span class="tid">${esc(SESSION_OF[p.who])} セッション</span><span class="subject">タスクの外で許可を求めている</span></button><span class="state st-waiting">許可待ち</span><span class="meta">${pill(p.who, DEF[p.who].role)} ${esc(DEF[p.who].agent)}${projectTag(SESSION_OF[p.who])}</span>${permBox(p)}</li>`),
    ...tasks.map((x) => {
      const [c, l] = x.perm ? ['st-waiting', '許可待ち'] : x.col === 'wait' ? [x.waitingFor === 'question' ? 'st-asking' : 'st-waiting', waitLabel(x)] : COL_STATE[x.col];
      return `<li class="task t-${esc(x.status)}${x.perm ? ' has-perm' : ''}${x.fresh ? ' t-new' : ''}${isTurn(x) ? ' t-turn' : ''}${x.failed ? ' t-failed' : ''}"><button type="button" class="task-open" data-open="${esc(x.key)}" data-fk="to-${esc(x.key)}"><span class="tid">${esc(x.list)} ${esc(taskRef(x))}</span><span class="subject">${x.harness ? `<span class="h-tag">${esc(x.harness)}</span>` : ''}${esc(x.subject)}</span></button><span class="state ${esc(c)}">${esc(l)}</span><span class="meta">${x.owner ? `${pill(x.owner, DEF[x.owner].role)} ${esc(DEF[x.owner].agent)}` : '担当なし'}${projectTag(x.list)}</span>${x.perm ? permBox(x.perm) : ''}</li>`;
    }),
  ].join('') || `<li class="empty-note">${esc(scopeLabel())} にタスクはない</li>`);

  const chip = $('chip-perm');
  chip.hidden = model.pending.length === 0;
  setText(chip, `許可待ち ${model.pending.length}`);
  renderQuestions();
  renderDenials();
  paintSince($('denied'), model.t, '経過');
  const sIn = SESSIONS.filter((x) => inScope(x.project)).length, rIn = ROBOT_DEFS.filter((d) => inScope(projectOfRobot(d.id))).length;
  setText($('chip-robots'), UI.project === 'all' ? `ロボット ${ROBOT_DEFS.length}` : `ロボット ${rIn} / ${ROBOT_DEFS.length}`);
  setText($('chip-sessions'), UI.project === 'all' ? `セッション ${SESSIONS.length}` : `セッション ${sIn} / ${SESSIONS.length}`);
}

/* ---------- answering permission prompts from the view ---------- */
const PERM_NOTE = 'ターミナルでも答えられ、先に答えた方が使われる';
const RELAY_HOW = '有効にするには <code>jui viz relay install</code> を 1 回、セッションを <code>claude --dangerously-load-development-channels server:jui-viz</code> で起動';
const sentWhat = (p) => `${p.sentBehavior === 'deny' ? `拒否${p.sentReason ? '・理由つき' : ''}` : p.sentRules ? `許可・ルール ${p.sentRules.length} 件を追加` : '許可'}${p.sentBy ? `・${p.sentBy === 'hook' ? 'フック' : '中継'}経由` : ''}`;
const permButtonsLive = (p, where) => (p.status === 'sent' ? `<p class="perm-sent">送信済み（${sentWhat(p)}）· Claude Code の確定を待っている</p>`
  : p.tooLongToShow ? '<p class="perm-relay">長すぎて全部を表示できないので、ターミナルで答えてください</p>'
  : !p.can.allowDeny ? `<p class="perm-relay">ターミナルで答えてください（このセッションは中継が無効）<small>${RELAY_HOW}</small></p>`
    : `<button type="button" class="pa pa-allow" data-do="allow" data-perm="${esc(p.id)}" data-fk="${esc(where)}a-${esc(p.id)}">許可</button>${p.can.always && Array.isArray(p.suggestions) && p.suggestions.length ? `<button type="button" class="pa pa-always" data-do="always" data-perm="${esc(p.id)}" data-fk="${esc(where)}w-${esc(p.id)}">今後も許可</button>` : ''}<button type="button" class="pa pa-deny" data-do="deny" data-perm="${esc(p.id)}" data-fk="${esc(where)}d-${esc(p.id)}">拒否</button>`);
const permButtons = (p, where) => (SOURCE.mode === 'live' ? permButtonsLive(p, where) : permButtonsDemo(p, where));
const permButtonsDemo = (p, where) => `<button type="button" class="pa pa-allow" data-do="allow" data-perm="${esc(p.id)}" data-fk="${esc(where)}a-${esc(p.id)}">許可</button><button type="button" class="pa pa-always" data-do="always" data-perm="${esc(p.id)}" data-fk="${esc(where)}w-${esc(p.id)}" title="${esc(p.rule)} を今後は聞かずに許可する">今後も許可</button><button type="button" class="pa pa-deny" data-do="deny" data-perm="${esc(p.id)}" data-fk="${esc(where)}d-${esc(p.id)}">拒否</button>`;
/* What a live card asks about: card.exact verbatim — whitespace and line breaks as they are (pre-wrap), the whole
   command however long (the box scrolls) — never the summary or the clipped preview. A relay request the server
   could not pair with a hook has no exact: its preview is shown as what it is. The demo keeps its one-line code. */
const EXACT_LABEL = { command: '', file_path: 'ファイル', notebook_path: 'ノートブック', url: 'URL', pattern: 'パターン', old_string: '置き換え前', new_string: '置き換え後', content: '書き込む中身' };
function permSubjectLive(p) {
  const e = p.exact;
  if (!e) {
    return p.preview
      ? `<span class="perm-exact" tabindex="0"><span class="pe-k">Claude Code が中継で送った内容（全体とは限らない）</span>${esc(p.preview)}</span>`
      : `<code>${esc(permSummary(p))}</code>`;
  }
  const partsHTML = Object.keys(EXACT_LABEL).filter((k) => typeof e[k] === 'string').map((k) => (EXACT_LABEL[k] ? `<span class="pe-k">${EXACT_LABEL[k]}</span>` : '') + `<span class="pe-v">${esc(e[k])}</span>`);
  if (e.contentTruncated) partsHTML.push(`<span class="pe-note">中身は先頭 ${[...(e.content || '')].length} 字だけ表示（全体 ${Number(e.contentTruncated)} 字）</span>`);
  return `<span class="perm-exact" tabindex="0">${partsHTML.join('')}</span>`;
}
const permSubject = (p) => (SOURCE.mode === 'live' ? permSubjectLive(p) : `<code>${esc(permSummary(p))}</code>`);
const permBox = (p) => `<div class="perm-box"><p class="perm-q"><b>${esc(p.tool)}</b> ${permSubject(p)}</p><div class="perm-acts">${permButtons(p, 's')}</div></div>`;
function recentHTML(id) {
  const items = logItems.filter((e) => e.who === id).slice(0, 6);
  return items.length ? items.map((e) => `<li><time>${fmtClock(BASE_CLOCK + e.abs)}</time><span><b>${esc(e.kind)}</b> ${esc(e.what)}</span></li>`).join('') : '<li><span>まだ記録がない</span></li>';
}
let toastTimer = 0;
function showToast(text) {
  const el = $('toast');
  el.textContent = text; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
}
function refreshNow() {
  const t = ((simT % LOOP) + LOOP) % LOOP;
  latestModel = computeModel(t, Math.floor(simT / LOOP));
  updateRobotStates(simT, t, latestModel.perms);
  renderPanel(latestModel); renderTicker(); renderTaskBoard(latestModel); renderRobot(latestModel); renderLog(true);
  if (has3D) redrawBoards(latestModel, performance.now() / 1000, true);
}
function decide(id, behavior, btn) {
  const p = latestModel.pending.find((q) => q.id === id);
  if (!p) return;
  const where = btn.closest('#tasks, #perm-strip, #kanban, #tb-detail, #rb');
  const reasonEl = $('tbd-reason') || $('rb-reason');
  const reason = behavior === 'deny' && reasonEl && where && where.contains(reasonEl) ? reasonEl.value.trim() : '';
  if (SOURCE.mode === 'live' && behavior === 'always') { openAlwaysConfirm(p, btn); return; }   // confirm the rules first (plan 08 §5)
  SOURCE.decide(id, behavior, { perm: p, reason });
  refreshNow();
  // The answered buttons are gone; keep the keyboard where the person was.
  if (!document.activeElement || document.activeElement === document.body) {
    const next = where && (where.querySelector(`[data-open="${CSS.escape(p.task || `perm:${id}`)}"]`) || where.querySelector('#tbd-close, #rb-close, button'));
    (next || $(tb.open ? 'tb-close' : 'btn-taskboard')).focus({ preventScroll: true });
  }
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-do], [data-open], [data-robot-open], [data-spec-open], [data-log-robot], [data-close-detail], [data-reset-rules], [data-rb-close], [data-set-all]');
  if (!t) return;
  if (t.dataset.do) decide(t.dataset.perm, t.dataset.do, t);
  else if (t.dataset.open) openTaskBoard(t, t.dataset.open);
  else if (t.dataset.robotOpen) openRobot(t.dataset.robotOpen, t);
  else if (t.dataset.specOpen !== undefined) openWhiteboard(Number(t.dataset.specOpen), t);
  else if (t.dataset.logRobot) openLogFor(t.dataset.logRobot, t);
  else if (t.hasAttribute('data-close-detail')) closeTaskDetail();
  else if (t.hasAttribute('data-reset-rules')) { alwaysRules.clear(); showToast('このデモで足した常時許可を取り消した'); refreshNow(); }
  else if (t.hasAttribute('data-rb-close')) closeRobot({ byHand: true });
  else if (t.hasAttribute('data-set-all')) setProject('all');
});
$('chip-perm').addEventListener('click', (e) => { tb.waitView = true; openTaskBoard(e.currentTarget); });

/* ---------- scope: which project (or all) every panel and board shows, and which sessions ---------- */
function paintScopeButtons() {
  document.querySelectorAll('[data-scope-btn]').forEach((b) => setHTML(b, `<span class="sb-k">プロジェクト</span><b>${esc(scopeLabel())}</b><span class="sb-caret" aria-hidden="true"></span>`));
  const scoped = SESSIONS.filter((s) => inScope(s.project));
  const shown = scoped.filter((s) => !UI.hiddenLists.has(s.id));
  setHTML($('tb-sess'), `<span class="sb-k">セッション</span><b>${shown.length === scoped.length ? `すべて（${scoped.length}）` : shown.length === 1 ? esc(shown[0].id) : `${shown.length} / ${scoped.length}`}</b><span class="sb-caret" aria-hidden="true"></span>`);
  const robotsIn = ROBOT_DEFS.filter((d) => inScope(projectOfRobot(d.id)));
  const shownR = robotsIn.filter((d) => !logState.hiddenRobots.has(d.id));
  setHTML($('log-who'), `<span class="sb-k">ロボット</span><b>${shownR.length === robotsIn.length ? `すべて（${robotsIn.length}）` : shownR.length === 1 ? esc(shownR[0].id) : `${shownR.length} / ${robotsIn.length}`}</b><span class="sb-caret" aria-hidden="true"></span>`);
  $('tb-lanes').checked = UI.lanes;
  document.body.dataset.scope = UI.project;
}
function roomPose(id) {
  if (SOURCE.mode === 'live') return liveRoomPose(id);
  if (id === 'all') return { p: new THREE.Vector3(6.8, 15.9, 22.1), t: new THREE.Vector3(0.3, 0.4, -0.4) };
  const r = PROJECT[id], c = new THREE.Vector3((r.x0 + r.x1) / 2, 0.4, (r.z0 + r.z1) / 2);
  const size = Math.max(r.x1 - r.x0, (r.z1 - r.z0) * 1.3);
  return { p: c.clone().add(new THREE.Vector3(6.5, 15.5, 22.5).normalize().multiplyScalar(size * 1.9 + 3)), t: c };
}
function focusProject(id, instant) {
  if (!has3D) return;
  const pose = roomPose(id);
  if (zoom.zoomed) { zoom.returnPose = pose; return; }
  controls.enabled = false;
  flyTo(pose.p, pose.t, controls.target, instant || reduceMotion ? 0 : 0.8, () => { controls.target.copy(pose.t); controls.enabled = true; controls.update(); });
}
/* The robot last picked in each project (ticket 2026-10-20-jui-viz-project-switch-keeps-last-robot-per-project;
   requester: 「ロボット選択状態でプロジェクト切り替えた先のロボットに切り替えて欲しい。各プロジェクトで最後に選択してたロボット
   覚えといて、それがいたらそれを選択、いなかったら未選択で部屋表示」): project id -> robot, or null when its card was closed
   by hand. Kept in the page only (a label may name another robot after the server restarts). */
const LAST_ROBOT = new Map();
/* The robot to pick on switching to a project with a robot picked: the one last picked there if it is still in the
   room (not gone, not walking out), else none. すべて: none. */
function robotToPick(id) {
  const want = id === 'all' ? null : LAST_ROBOT.get(id);
  if (!want || !DEF[want] || !ROBOT_DEFS.some((d) => d.id === want) || projectOfRobot(want) !== id) return null;
  return SOURCE.mode === 'live' && LIVE.leaving[want] ? null : want;
}
function setProject(id, { camera: moveCamera = true } = {}) {
  if (!(id === 'all' || PROJECT[id]) || UI.project === id) return;
  // only a picked robot carries over: with none picked, the room is shown and nothing opens
  const pick = rbState.id ? robotToPick(id) : undefined;
  if (rbState.id) closeRobot();
  UI.project = id; writePref('project', id);
  if (wb.open && wb.idx >= 0 && !inScope(SPECS[wb.idx].project)) wb.idx = -1;
  if (tb.detail && !tb.detail.startsWith('perm:') && !inScope(PROJECT_OF[tb.detail.split('#')[0]])) tb.detail = null;
  if (SOURCE.mode === 'live' && has3D) liveShowFloorOf(id);   // a room on another floor: go there first
  if (SOURCE.mode === 'live') liveRelayout();                // one room at a time: the room picked, wider (or the floor again)
  if (pick) openRobot(pick, document.getElementById('scene-canvas'));   // the camera goes to it, not to the room
  else if (moveCamera) focusProject(id);
  paintScopeButtons();
  refreshNow();
  if (wb.open) { wbCode.scrollTop = 0; renderWhiteboard(latestModel, true); }
  // A zoomed board view moves to the board of the project now shown.
  if (has3D && zoom.zoomed && !camTween && (wb.open || tb.open)) { const pose = wb.open ? specPose(wb.idx) : taskPose(); camera.position.copy(pose.p); viewTarget.copy(pose.t); }
  showToast(id === 'all' ? 'すべてのプロジェクトを表示' : `${PROJECT[id].name} だけを表示`);
}

/* ---------- questions (AskUserQuestion, requester 10-18): single and multiple choice, a free answer per question ----------
   A card shows every question, header, option, description and preview as text (escaped). It can be answered only
   while a hook waits for it (forward.py --ask) and only when everything fits on it; every question needs an answer
   before it can be sent. Options are named by their index, never by their label, in the markup. */
const Q_SHOW_MS = 30_000;   // an answered card stays a moment, saying who answered and what
const qState = (q) => (q.status === 'sent' ? '送信済み · Claude Code の確定を待っている'
  : q.status === 'answered' ? 'ブラウザの答えが届いた' : q.status === 'answered_in_terminal' ? 'ターミナルで答えた'
    : q.status === 'expired' ? '答えないまま終わった' : '');
/* Why a pending card cannot be answered here. It goes at the top, above choices drawn as not pickable: at the
   bottom, under radios that looked live, the requester clicked them and nothing happened (10-18). */
const qWhy = (q) => (q.tooLongToShow ? '質問の全部をここに表示できないため、ここでは答えられません'
  : q.released ? 'ターミナルに返しました' : q.waitEnded ? qWhyEnded(q)
    : 'このセッションは答えの中継を待っていません');
/* Why the wait ended (2.3.6, ticket 2026-10-19-jui-viz-question-window-too-short): the server keeps the reason and
   the time on the card (questions.hook_gave_up), so a reload says the same. */
const qClock = (ms) => (ms ? new Date(ms).toTimeString().slice(0, 8) : '');
function qWhyEnded(q) {
  const at = q.waitEndedAt ? `（${qClock(q.waitEndedAt)}）` : '';
  if (q.waitEndReason === 'hidden') return `viz のページが見えなくなったので、ターミナルに返しました${at}。ターミナルで答えてください`;
  if (q.waitEndReason === 'session') return `セッションが止まったので、待ちを終えました${at}`;
  return `ブラウザで答えられる時間が過ぎました${at}（だれも操作しないまま待ちが終わった）。ターミナルで答えてください`;
}
/* The countdown on a waiting card: "until answered" (2.3.6) has none. */
const Q_NEVER_MS = 2 ** 53 - 1;
function qLeftText(q, now) {
  if (!q || !q.waitUntil) return '';
  if (q.waitUntil >= Q_NEVER_MS) return 'viz で答えるまで待っている（「ターミナルで答える」で戻す）';
  const left = Math.max(0, Math.ceil((q.waitUntil - now) / 1000));
  return left >= 90 ? `あと ${Math.floor(left / 60)} 分 ${left % 60} 秒でターミナルに戻す` : `あと ${left} 秒でターミナルに戻す`;
}
function questionHTML(q, where = '') {   // where: '' in the panel, 'b' on the board (the same card twice in one page)
  const open = q.status === 'pending' && q.hookWaiting && !q.tooLongToShow;
  const closed = q.status === 'pending' && !open;
  const got = q.sentAnswers || q.gotAnswers || null;
  const itemsHTML = q.questions.map((x, i) => {
    const type = x.multiSelect ? 'checkbox' : 'radio', name = `qa-${where}${q.id}-${i}`;   // radios: one group per card
    const optsHTML = x.options.map((o, k) => `<label class="qopt"><input type="${esc(type)}" name="${esc(name)}" data-qi="${i}" data-qk="${k}"${open ? '' : ' disabled'}><span class="qlabel">${esc(o.label)}</span>${o.description ? `<span class="qdesc">${esc(o.description)}</span>` : ''}${o.preview ? `<pre class="qprev">${esc(o.preview)}</pre>` : ''}</label>`).join('');
    const otherHTML = `<label class="qopt qother"><input type="${esc(type)}" name="${esc(name)}" data-qi="${i}" data-qk="other"${open ? '' : ' disabled'}><span class="qlabel">その他（自由記述）</span><input type="text" class="qother-text" data-qi="${i}" aria-label="${esc(x.question)} への自由記述" maxlength="2000"${open ? '' : ' disabled'}></label>`;
    const answeredHTML = got && got[x.question] !== undefined ? `<p class="qgot">答え: <b>${esc(got[x.question])}</b></p>` : '';
    // answered or over: the question and its answer only
    const choicesHTML = q.status === 'pending' ? `${optsHTML}${otherHTML}` : '';
    return `<fieldset class="qq"><legend>${x.header ? `<span class="qhead">${esc(x.header)}</span>` : ''}<span class="qtext">${esc(x.question)}</span>${x.multiSelect ? '<span class="qmulti">複数選べる</span>' : ''}</legend>${choicesHTML}${answeredHTML}</fieldset>`;
  }).join('');
  // While the hook waits the terminal shows no question (measured 10-18): the time left, and the way to the terminal.
  const footHTML = open ? `<div class="qfoot"><button type="button" class="pa pa-allow" data-qsend="${esc(q.id)}" data-fk="${esc(where)}qs-${esc(q.id)}" disabled>答えを送る</button><button type="button" class="pa pa-deny" data-qrelease="${esc(q.id)}" data-fk="${esc(where)}qr-${esc(q.id)}">ターミナルで答える</button></div><p class="qnote">待っている間はターミナルに質問が出ない · <span data-quntil="${esc(q.id)}"></span>（操作すると延びる）</p>`
    : closed ? '' : `<p class="qnote qdone">${esc(qState(q))}</p>`;
  const whyHTML = closed ? `<p class="qnote qwhy" role="note">${esc(qWhy(q))}。ターミナルで答えてください（ここでは選べません）</p>` : '';
  return `<article class="qcard${open ? ' q-open' : ''}${closed ? ' q-closed' : ''}" data-qcard="${esc(q.id)}"><header class="qwho">${pill(q.who, DEF[q.who].role)}<span>${esc(DEF[q.who].agent)}</span><span class="pc-wait" data-since="${q.at}"></span></header>${whyHTML}${itemsHTML}${footHTML}</article>`;
}
/* The question cards the panel shows and the board shows (2.3.5): one list from QUESTIONS, oldest first. */
function questionsShown(now = Date.now()) {
  return QUESTIONS.filter((q) => inScope(projectOfRobot(q.who)) && (q.status === 'pending' || q.status === 'sent' || now - (q.doneAt || 0) < Q_SHOW_MS))
    .sort((a, b) => (a.at || 0) - (b.at || 0));
}
/* The questions waiting for an answer, every project; the chip counts them all. In scope and elsewhere: the board shows
   the first and says how many of the second (as its permission strip does), so the chip = cards in scope + elsewhere. */
const questionsWaiting = () => QUESTIONS.filter((q) => q.status === 'pending');
const questionsElsewhere = () => questionsWaiting().filter((q) => !inScope(projectOfRobot(q.who))).length;
const questionsSig = (shown) => JSON.stringify([NAMES.rev, ...shown.map((q) => [q.id, q.status, q.hookWaiting, q.tooLongToShow, q.waitEnded, q.waitEndReason, q.waitEndedAt, q.released, q.sentAnswers, q.gotAnswers])]);
function renderQuestions() {
  const now = Date.now();
  const shown = questionsShown(now);
  const waiting = questionsWaiting().length;
  const chip = $('chip-ask');
  chip.hidden = waiting === 0;
  setText(chip, `質問 ${waiting}`);
  $('questions-sec').hidden = shown.length === 0;
  keyed($('questions'), questionsSig(shown), () => shown.map((q) => questionHTML(q)).join(''));
  for (const el of document.querySelectorAll('#questions [data-quntil], #q-strip [data-quntil]')) {   // the countdown, in place (inputs keep their state)
    const q = QUESTIONS.find((x) => x.id === el.dataset.quntil);
    setText(el, qLeftText(q, now));
  }
}
const qHeld = {};   // question id -> when the page last asked the hook to wait longer
function holdQuestion(id) {
  const t = Date.now();
  if (t - (qHeld[id] || 0) < 3000) return;
  qHeld[id] = t;
  SOURCE.holdQuestion(id);
}
/* What the card's inputs say: question text -> { labels, other }, and whether every question has an answer. */
function questionPicks(card, q) {
  const picks = {};
  let complete = true;
  q.questions.forEach((x, i) => {
    const boxes = [...card.querySelectorAll(`input[data-qi="${i}"][data-qk]`)].filter((b) => b.checked);
    const labels = boxes.filter((b) => b.dataset.qk !== 'other').map((b) => x.options[Number(b.dataset.qk)].label);
    const otherOn = boxes.some((b) => b.dataset.qk === 'other');
    const other = otherOn ? card.querySelector(`.qother-text[data-qi="${i}"]`).value.trim() : '';
    if (otherOn && !other) complete = false;
    if (!labels.length && !other) complete = false;
    picks[x.question] = { labels, other };
  });
  return { picks, complete };
}
function onQuestionInput(e) {
  const card = e.target.closest('[data-qcard]');
  const q = card && QUESTIONS.find((x) => x.id === card.dataset.qcard);
  if (!q) return;
  // typing a free answer picks その他
  if (e.target.classList.contains('qother-text') && e.target.value) { const box = e.target.parentElement.querySelector('input[data-qk="other"]'); if (box) box.checked = true; }
  const send = card.querySelector('[data-qsend]');
  if (send) send.disabled = !questionPicks(card, q).complete;
  if (send) holdQuestion(q.id);   // someone is answering: the hook waits a little longer
}
function onQuestionClick(e) {
  const r = e.target.closest('[data-qrelease]');
  if (r) { r.disabled = true; SOURCE.releaseQuestion(r.dataset.qrelease); return; }
  const b = e.target.closest('[data-qsend]');
  if (!b) return;
  const card = b.closest('[data-qcard]'), q = QUESTIONS.find((x) => x.id === b.dataset.qsend);
  if (!q) return;
  const { picks, complete } = questionPicks(card, q);
  if (!complete) return;
  b.disabled = true;
  SOURCE.answerQuestion(q.id, picks);
}
// The same handlers for the panel's cards and the board's: the same state (QUESTIONS), the same sending (SOURCE).
for (const id of ['questions', 'q-strip']) { $(id).addEventListener('input', onQuestionInput); $(id).addEventListener('click', onQuestionClick); }
/* 2.3.5 (requester 10-19: "このヘッダーの許可のチップクリックでボード表示してほしい"): the 質問 chip opens the board that
   already lists what waits for a permission (the task board, its strip on top) with the questions waiting over it,
   panel open or not; the 許可待ち chip opens the same board. The chips are hidden while nothing waits (no no-op chip). */
$('chip-ask').addEventListener('click', (e) => { tb.waitView = true; openTaskBoard(e.currentTarget); });

/* ---------- popovers: project switcher, session picker, robot picker ---------- */
const popEl = $('pop');
const pop = { anchor: null, kind: null, q: '' };
function openPop(anchor, kind) {
  if (pop.anchor === anchor && !popEl.hidden) { closePop(); return; }
  if (pop.anchor) pop.anchor.setAttribute('aria-expanded', 'false');
  pop.anchor = anchor; pop.kind = kind; pop.q = '';
  const titles = { project: 'プロジェクトで絞り込む', lists: 'セッションで絞り込む', robots: 'ロボットで絞り込む' };
  popEl.setAttribute('aria-label', titles[kind]);
  popEl.innerHTML = `<p class="pop-title">${titles[kind]}<small data-pop-count></small></p>${kind === 'project' && ROOMS.length <= 6 ? '' : `<input type="search" class="pop-search" placeholder="${kind === 'project' ? '名前で探す' : 'ID・フォルダ・役割で探す'}" aria-label="${titles[kind]}（検索）">`}${kind === 'project' ? '' : `<div class="pop-quick" role="group" aria-label="まとめて選ぶ"><button type="button" data-quick="all">すべて</button><button type="button" data-quick="active">動いているだけ</button><button type="button" data-quick="waiting">許可待ちだけ</button><button type="button" data-quick="none">全部外す</button></div>`}<div class="pop-body"></div>`;
  renderPopBody();
  popEl.hidden = false;
  anchor.setAttribute('aria-expanded', 'true');
  placePop();
  const first = popEl.querySelector('.pop-search') || popEl.querySelector('[role="option"][aria-selected="true"]') || popEl.querySelector('input, button');
  if (first) first.focus({ preventScroll: true });
}
function closePop(back = true) {
  if (popEl.hidden) return;
  popEl.hidden = true;
  const a = pop.anchor;
  pop.anchor = null; pop.kind = null;
  if (a) { a.setAttribute('aria-expanded', 'false'); if (back && document.contains(a)) a.focus({ preventScroll: true }); }
}
function placePop() {
  const r = pop.anchor.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, w = Math.min(380, vw - 16);
  popEl.style.width = `${w}px`;
  popEl.style.left = `${Math.max(8, Math.min(r.left, vw - w - 8))}px`;
  const below = vh - r.bottom - 14, above = r.top - 14;
  if (below >= 280 || below >= above) { popEl.style.top = `${r.bottom + 6}px`; popEl.style.bottom = 'auto'; popEl.style.maxHeight = `${below}px`; }
  else { popEl.style.top = 'auto'; popEl.style.bottom = `${vh - r.top + 6}px`; popEl.style.maxHeight = `${above}px`; }
}
document.addEventListener('pointerdown', (e) => { if (!popEl.hidden && !popEl.contains(e.target) && !(pop.anchor && pop.anchor.contains(e.target))) closePop(false); }, true);
window.addEventListener('resize', () => { if (!popEl.hidden) placePop(); });
function projectStats(model, id) {
  const sess = SESSIONS.filter((s) => id === 'all' || s.project === id);
  const robotIds = sess.flatMap((s) => s.robots);
  return {
    sessions: sess.length,
    busy: robotIds.filter((r) => robotBadge(r)[0] === 'st-busy').length,
    pend: model.pending.filter((p) => id === 'all' || projectOfRobot(p.who) === id).length,
    live: model.specs.filter((s) => (id === 'all' || s.project === id) && s.bucket === 'live').length,
  };
}
const matchQ = (text) => !pop.q || text.toLowerCase().includes(pop.q);
function renderPopBody() {
  const body = popEl.querySelector('.pop-body');
  if (!body) return;
  const keepFocus = popEl.contains(document.activeElement) && document.activeElement.closest('.pop-body') ? document.activeElement.dataset.fk : null;
  if (pop.kind === 'project') {
    const ids = ['all', ...ROOMS.map((r) => r.id)].filter((id) => id === 'all' || matchQ(`${PROJECT[id].name} ${PROJECT[id].path}`));
    body.innerHTML = `<ul class="pop-list" role="listbox" aria-label="プロジェクト">${ids.map((id) => {
      const st = projectStats(latestModel, id), sel = UI.project === id;
      return `<li role="option" tabindex="${sel ? 0 : -1}" aria-selected="${sel ? 'true' : 'false'}" data-pick-project="${esc(id)}" data-fk="pp-${esc(id)}"><span class="po-main"><b>${id === 'all' ? 'すべてのプロジェクト' : esc(PROJECT[id].name)}</b><small>${id === 'all' ? `${ROOMS.length} プロジェクト` : esc(PROJECT[id].path)} · ${st.sessions} セッション</small></span><span class="po-badges">${st.pend ? `<span class="state st-waiting">許可待ち ${st.pend}</span>` : ''}${st.busy ? `<span class="state st-busy">作業中 ${st.busy} 体</span>` : ''}${st.live ? `<span class="state st-write">作業中の spec ${st.live}</span>` : ''}</span></li>`;
    }).join('')}</ul>`;
  } else {
    const isLog = pop.kind === 'robots';
    const hidden = isLog ? logState.hiddenRobots : UI.hiddenLists;
    const sess = SESSIONS.filter((s) => inScope(s.project));
    const groups = ROOMS.filter((r) => inScope(r.id)).map((r) => [r, sess.filter((s) => s.project === r.id && matchQ(`${s.id} ${s.room} ${s.robots.map((id) => `${id} ${DEF[id].agent}`).join(' ')} ${sessionBadge(s)[1]}`))]).filter(([, l]) => l.length);
    const rowHTML = (s) => {
      const [c, l] = sessionBadge(s), n = latestModel.tasks.filter((x) => x.list === s.id).length;
      if (!isLog) return `<label class="pg-item"><input type="checkbox" data-pick-list="${esc(s.id)}" data-fk="pl-${esc(s.id)}"${hidden.has(s.id) ? '' : ' checked'}>${pill(s.id, 'main')}<span class="pg-name">${esc(DEF[s.id].agent)}<small>${n} タスク</small></span><span class="state ${esc(c)}">${esc(l)}</span></label>`;
      const on = s.robots.filter((id) => !hidden.has(id)).length;
      const subsHTML = s.robots.filter((id) => id !== s.id).map((id) => `<label class="pg-item pg-sub"><input type="checkbox" data-pick-robot="${esc(id)}" data-fk="pr-${esc(id)}"${hidden.has(id) ? '' : ' checked'}>${pill(id, DEF[id].role)}<span class="pg-name">${esc(DEF[id].agent)}</span><span class="state ${esc(robotBadge(id)[0])}">${esc(robotBadge(id)[1])}</span></label>`).join('');
      return `<label class="pg-item"><input type="checkbox" data-pick-session="${esc(s.id)}" data-fk="ps-${esc(s.id)}"${on === s.robots.length ? ' checked' : ''}${on > 0 && on < s.robots.length ? ' data-mixed' : ''}>${pill(s.id, 'main')}<span class="pg-name">${esc(DEF[s.id].agent)}<small>ロボット ${s.robots.length}</small></span><span class="state ${esc(c)}">${esc(l)}</span></label>${subsHTML}`;
    };
    body.innerHTML = `<div class="pop-groups">${groups.map(([r, list]) => `<p class="pg-label">${esc(r.name)}</p>${list.map(rowHTML).join('')}`).join('') || '<p class="pop-none">該当するセッションがない</p>'}</div>`;
    body.querySelectorAll('[data-mixed]').forEach((x) => { x.indeterminate = true; });
    const total = isLog ? ROBOT_DEFS.filter((d) => inScope(projectOfRobot(d.id))).length : sess.length;
    const shown = isLog ? ROBOT_DEFS.filter((d) => inScope(projectOfRobot(d.id)) && !hidden.has(d.id)).length : sess.filter((s) => !hidden.has(s.id)).length;
    setText(popEl.querySelector('[data-pop-count]'), `${shown} / ${total} を表示`);
  }
  if (keepFocus) { const again = body.querySelector(`[data-fk="${CSS.escape(keepFocus)}"]`); if (again) again.focus({ preventScroll: true }); }
}
function afterPick() {
  paintScopeButtons();
  renderPopBody();
  if (pop.kind === 'robots') renderLog(true); else renderTaskBoard(latestModel);
}
popEl.addEventListener('input', (e) => { if (e.target.matches('.pop-search')) { pop.q = e.target.value.trim().toLowerCase(); renderPopBody(); } });
popEl.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.pickList) { if (t.checked) UI.hiddenLists.delete(t.dataset.pickList); else UI.hiddenLists.add(t.dataset.pickList); }
  else if (t.dataset.pickRobot) { if (t.checked) logState.hiddenRobots.delete(t.dataset.pickRobot); else logState.hiddenRobots.add(t.dataset.pickRobot); }
  else if (t.dataset.pickSession) { for (const id of SESSIONS.find((s) => s.id === t.dataset.pickSession).robots) { if (t.checked) logState.hiddenRobots.delete(id); else logState.hiddenRobots.add(id); } }
  else return;
  afterPick();
});
popEl.addEventListener('click', (e) => {
  const opt = e.target.closest('[data-pick-project]');
  if (opt) { setProject(opt.dataset.pickProject); closePop(); return; }
  const q = e.target.closest('[data-quick]');
  if (!q) return;
  const isLog = pop.kind === 'robots', hidden = isLog ? logState.hiddenRobots : UI.hiddenLists;
  for (const s of SESSIONS.filter((x) => inScope(x.project))) {
    const [c] = sessionBadge(s);
    const keep = q.dataset.quick === 'all' || (q.dataset.quick === 'active' && c !== 'st-idle') || (q.dataset.quick === 'waiting' && c === 'st-waiting');
    for (const id of isLog ? s.robots : [s.id]) { if (keep) hidden.delete(id); else hidden.add(id); }
  }
  afterPick();
});
popEl.addEventListener('keydown', (e) => {
  const opt = e.target.closest('[role="option"]');
  if (!opt) { if (e.key === 'ArrowDown' && e.target.matches('.pop-search')) { const f = popEl.querySelector('[role="option"], .pop-body input'); if (f) { e.preventDefault(); f.focus(); } } return; }
  const opts = [...popEl.querySelectorAll('[role="option"]')], i = opts.indexOf(opt);
  const go = (j) => { e.preventDefault(); opts.forEach((o) => { o.tabIndex = -1; }); opts[j].tabIndex = 0; opts[j].focus(); };
  if (e.key === 'ArrowDown') go(Math.min(opts.length - 1, i + 1));
  else if (e.key === 'ArrowUp') go(Math.max(0, i - 1));
  else if (e.key === 'Home') go(0);
  else if (e.key === 'End') go(opts.length - 1);
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opt.click(); }
});
document.addEventListener('click', (e) => {
  const sb = e.target.closest('[data-scope-btn]');
  if (sb) { openPop(sb, 'project'); return; }
  const pk = e.target.closest('[data-picker]');
  if (pk) { openPop(pk, pk.dataset.picker); return; }
  const sp = e.target.closest('[data-set-project]');
  if (sp) setProject(UI.project === sp.dataset.setProject ? 'all' : sp.dataset.setProject);
});

/* ---------- event ticker ---------- */
const tickerItems = [];
const fmtClock = (sec) => { const s = Math.floor(sec) % 86400; return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((v) => String(v).padStart(2, '0')).join(':'); };
function emitEvents(prev, now) {
  for (let k = Math.floor(prev / LOOP); k <= Math.floor(now / LOOP); k++) {
    for (const [et, who, kind, what, perm] of EVENTS) {
      const abs = k * LOOP + et;
      if (abs > prev && abs <= now) {
        if (perm && ruleCovers(PERM_BY_ID[perm], abs)) continue;   // an "always allow" rule answered it: no prompt at all
        const item = { abs, who, kind, what, perm, seq: ++logSeq };
        tickerItems.unshift(item);
        logItems.unshift(item);
      }
    }
  }
  tickerItems.length = Math.min(tickerItems.length, 40);
  logItems.length = Math.min(logItems.length, 600);
}
function renderTicker() {
  setHTML($('ticker'), tickerItems.filter((e) => inScope(projectOfRobot(e.who))).slice(0, 5).map((e) => `<li><time>${fmtClock(BASE_CLOCK + e.abs)}</time>${pill(e.who, DEF[e.who].role)}<span class="kind">${esc(e.kind)}</span><span class="what">${esc(e.what)}</span></li>`).join(''));
}

/* ---------- zooming into a board: camera flight, then the board as a page ---------- */
const zoom = { zoomed: false, returnPose: null, opener: null };
let camTween = null;
const viewTarget = new THREE.Vector3();
function flyTo(pos, target, fromTarget, dur, done) {
  camTween = { p0: camera.position.clone(), t0: fromTarget.clone(), p1: pos.clone(), t1: target.clone(), start: performance.now(), dur, done };
}
function stepTween(ms) {
  if (!camTween) return;
  const k = camTween.dur <= 0 ? 1 : Math.min(1, (ms - camTween.start) / (camTween.dur * 1000));
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  camera.position.lerpVectors(camTween.p0, camTween.p1, e);
  viewTarget.lerpVectors(camTween.t0, camTween.t1, e);
  if (k >= 1) { const done = camTween.done; camTween = null; if (done) done(); }
}
// The show class lands a frame later; a hide in between cancels it (an Escape in that frame used to reopen the card).
function showOverlay(el) { el.hidden = false; el._showing = true; requestAnimationFrame(() => { if (el._showing) el.classList.add('show'); }); }
function hideOverlay(el) { el._showing = false; el.classList.remove('show'); setTimeout(() => { if (!el.classList.contains('show')) el.hidden = true; }, reduceMotion ? 0 : 240); }
function zoomTo(pose, opener, arrive) {
  if (opener) zoom.opener = opener;
  if (!has3D) { arrive(); return; }
  if (!zoom.zoomed) {
    zoom.returnPose = { p: camera.position.clone(), t: controls.target.clone() };
    zoom.zoomed = true; controls.enabled = false;
    flyTo(pose.p, pose.t, controls.target, reduceMotion ? 0 : 0.9, arrive);
  } else flyTo(pose.p, pose.t, viewTarget, reduceMotion ? 0 : 0.5, arrive);
}
/* What holds the 3D view (ticket 2026-10-20-jui-viz-data-server-from-robot-card-freezes-3d): every screen that takes
   it — the robot's card, the spec board, the task board, the data server's sheet, the 単価 sheet — holds it while it is
   open. A screen holds as it opens, before it closes the one it replaces, and lets go as it closes; the camera flies
   back and the orbit takes input again only when the last one lets go (and only if it was zoomed: a sheet opened from
   the 3D did not move the camera). The card used to close "keeping the zoom" for whatever came next, and a sheet that
   does not zoom never gave it back: the 3D froze (zoomed, the orbit off) after card → rack → back. */
const VIEW_HOLD = new Set();
function holdView(name) { VIEW_HOLD.add(name); }
function releaseView(name) {
  if (!VIEW_HOLD.delete(name) || VIEW_HOLD.size) return;
  zoomBack();
}
function zoomBack() {
  if (has3D && zoom.returnPose && zoom.zoomed) {    // not zoomed: nothing to fly back from (a pose kept from before)
    const back = zoom.returnPose;
    flyTo(back.p, back.t, viewTarget, reduceMotion ? 0 : 0.8, () => { controls.target.copy(back.t); zoom.zoomed = false; controls.enabled = true; controls.update(); });
  }
  if (zoom.opener && document.contains(zoom.opener)) zoom.opener.focus({ preventScroll: true });
}
const boardProject = (pref) => pref || (UI.project !== 'all' ? UI.project : SOURCE.mode === 'demo' ? 'shop' : ((ROOMS.find((r) => r.shown) || ROOMS[0] || {}).id));
function meshPose(mesh, w, h, px, py, dist) {
  const c = mesh.localToWorld(new THREE.Vector3(px === undefined ? 0 : (px - 0.5) * w, py === undefined ? 0 : (0.5 - py) * h, 0));
  const n = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()));
  return { p: c.clone().add(n.multiplyScalar(dist)), t: c };
}
function specPose(i, pref) {
  if (SOURCE.mode === 'live') return liveBoardPose(i >= 0 ? SPECS[i].project : boardProject(pref), 'spec', i);
  if (i >= 0 && SPECS[i].project === 'shop') { const p = sbTile(SHOP_POS[i]), c = sbPoint(p.x + SB.tw / 2, p.y + SB.th / 2); return { p: c.clone().add(new THREE.Vector3(0, 0, 2.2)), t: c }; }
  const proj = i >= 0 ? SPECS[i].project : boardProject(pref);
  if (proj === 'shop') { const c = new THREE.Vector3(SB.cx, SB.cy, SB.z); return { p: c.clone().add(new THREE.Vector3(0, 0, 4.6)), t: c }; }
  const pb = PBOARD[proj], t = i >= 0 && pb.tiles.find((q) => q.i === i);
  return t ? meshPose(pb.mesh, pb.w, pb.h, (t.x + t.w / 2) / pb.W, (t.y + t.h / 2) / pb.H, 1.6) : meshPose(pb.mesh, pb.w, pb.h, undefined, undefined, pb.w * 1.15 + 0.6);
}
function taskPose(pref) {
  if (SOURCE.mode === 'live') return liveBoardPose(boardProject(pref), 'tasks');
  const proj = boardProject(pref);
  if (proj === 'shop') { const c = new THREE.Vector3(KB.cx, KB.cy, KB.z); return { p: c.clone().add(new THREE.Vector3(0, 0, 3.4)), t: c }; }
  const pb = PBOARD[proj];
  return meshPose(pb.mesh, pb.w, pb.h, undefined, undefined, pb.w * 1.15 + 0.6);
}

/* ---------- spec board up close: every spec (overview) or one spec as a readable sheet ---------- */
const wbEl = $('wb'), wbCode = $('wb-code'), wbNav = $('wb-nav'), wbBody = $('wb-body'), wbSideList = $('wb-side-list');
const wb = { open: false, idx: -1, lastActive: null, q: '', app: 'all', flowFit: false };
/* The data flow diagram (2.3.5): at the sheet's text size (Mermaid's 16 px × FLOW_SCALE = 12 px), with a scroll bar
   when it is wider than the section — fitted, a long flow's text came out at 8 px — or fitted on request. */
const FLOW_SCALE = 0.75;
function flowZoomApply(svg) {
  if (!svg || !svg.viewBox || !svg.viewBox.baseVal) return;
  const vb = svg.viewBox.baseVal;
  svg.style.maxWidth = wb.flowFit ? `${Math.round(vb.width)}px` : 'none';
  svg.style.width = wb.flowFit ? '100%' : `${Math.round(vb.width * FLOW_SCALE)}px`;
  svg.style.height = 'auto';
}
wbCode.addEventListener('click', (e) => {
  const b = e.target.closest('[data-flow-zoom]');
  if (!b) return;
  wb.flowFit = !wb.flowFit;
  b.setAttribute('aria-pressed', String(wb.flowFit)); b.textContent = wb.flowFit ? '実際の大きさ' : '幅に合わせる';
  flowZoomApply(b.closest('.flow-mmd-wrap').querySelector('svg'));
});
/* The apps of the rooms in scope (a repo with client/, admin/, … each declaring its own specs): [app, count, specDir],
   in the order the specs come. The board offers them only when there is more than one; 全体 adds them up. */
function wbApps(model) {
  const apps = new Map();
  for (const s of model.specs) if (inScope(s.project)) { const a = apps.get(s.app || '') || [s.app || '', 0, s.specDir || '']; a[1] += 1; apps.set(s.app || '', a); }
  const list = [...apps.values()];
  if (wb.app !== 'all' && !apps.has(wb.app)) wb.app = 'all';
  return list;
}
const inApp = (s) => wb.app === 'all' || (s.app || '') === wb.app;
const appLabel = (app) => app || '直下';
let wbSideOpen = readPref('wbSide', 'open') === 'open';
const narrowWb = () => sceneEl.clientWidth < 800;
function applyWbSide() {
  wbBody.classList.toggle('side-closed', !wbSideOpen);
  const b = $('wb-side-btn');
  b.setAttribute('aria-expanded', String(wbSideOpen));
  b.textContent = wbSideOpen ? '一覧を閉じる' : 'spec 一覧';
}
$('wb-side-btn').addEventListener('click', () => {
  wbSideOpen = !wbSideOpen;
  if (!narrowWb()) writePref('wbSide', wbSideOpen ? 'open' : 'closed');
  applyWbSide();
  if (wbSideOpen) $('wb-search').focus({ preventScroll: true });
});
$('wb-search').addEventListener('input', (e) => { wb.q = e.target.value.trim().toLowerCase(); renderWbSide(latestModel); });
wbSideList.addEventListener('click', (e) => {
  const a = e.target.closest('[data-app]');
  if (a) { wb.app = a.dataset.app; renderWhiteboard(latestModel, true); return; }
  const b = e.target.closest('[data-idx]');
  if (!b) return;
  openWhiteboard(Number(b.dataset.idx));
  if (narrowWb()) { wbSideOpen = false; applyWbSide(); wbCode.focus({ preventScroll: true }); }
});
wbCode.addEventListener('click', (e) => { const b = e.target.closest('.ov-card'); if (b) { openWhiteboard(Number(b.dataset.idx)); wbCode.focus({ preventScroll: true }); } });
wbNav.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-sec]');
  if (!b) return;
  $('wb-follow').checked = false;
  const el = document.getElementById(`wb-sec-${b.dataset.sec}`);
  if (el) wbCode.scrollTop += el.getBoundingClientRect().top - wbCode.getBoundingClientRect().top - 8;
});
// Scrolling by hand stops the automatic follow until the box is ticked again.
['wheel', 'touchmove'].forEach((type) => wbCode.addEventListener(type, () => { if (wb.idx >= 0) $('wb-follow').checked = false; }, { passive: true }));

function openWhiteboard(i, opener, board) {
  holdView('wb');
  if (tb.open) closeTaskBoard();
  if (rbState.id) closeRobot();
  if (i >= 0 && !inScope(SPECS[i].project)) setProject(SPECS[i].project, { camera: false });
  if (i >= 0 && !inApp(SPECS[i])) wb.app = 'all';
  wb.idx = i; wb.lastActive = null; wb.board = board || null;
  if (wb.open) {
    if (opener) zoom.opener = opener;
    $('wb-follow').checked = true;
    wbCode.scrollTop = 0;
    renderWhiteboard(latestModel, true);
    if (has3D && !camTween) { const pose = specPose(i, wb.board); camera.position.copy(pose.p); viewTarget.copy(pose.t); }
    return;
  }
  wb.open = true;
  wbSideOpen = narrowWb() ? false : readPref('wbSide', 'open') === 'open';
  applyWbSide();
  zoomTo(specPose(i, wb.board), opener, () => {
    if (!wb.open) return;
    showOverlay(wbEl);
    $('wb-follow').checked = true;
    renderWhiteboard(latestModel, true);
    $('wb-close').focus({ preventScroll: true });
  });
}
function closeWhiteboard() {
  if (!wb.open) { releaseView('wb'); return; }
  wb.open = false;
  hideOverlay(wbEl);
  releaseView('wb');
}
$('wb-close').addEventListener('click', closeWhiteboard);

function renderWhiteboard(model, force) {
  if (!wb.open) return;
  renderWbSide(model);
  if (wb.idx < 0) renderOverview(model); else renderSheet(model, force);
}
function renderWbSide(model) {
  const q = wb.q, apps = wbApps(model);
  const match = (s) => inScope(s.project) && inApp(s) && (!q || `${s.name} ${s.screen} ${s.file} ${PROJECT[s.project].name}`.toLowerCase().includes(q));
  const groups = BUCKETS.map(([b, label]) => [label, model.specs.map((s, i) => [s, i]).filter(([s]) => s.bucket === b && match(s))]).filter(([, items]) => items.length);
  const n = model.specs.filter((s) => inScope(s.project) && inApp(s)).length;
  keyed(wbSideList, JSON.stringify([UI.project, q, wb.idx, wb.app, apps, groups.map(([label, items]) => [label, items.map(([s, i]) => `${i}:${s.by || ''}:${s.name}`)])]), () => {
    const total = apps.reduce((k, [, c]) => k + c, 0);
    const appsHTML = apps.length > 1 ? `<div class="seg-filter ws-apps" role="group" aria-label="アプリで絞り込む">${[['all', total], ...apps].map(([a, c]) => `<button type="button" data-app="${esc(a)}" aria-pressed="${wb.app === a}">${esc(a === 'all' ? '全体' : appLabel(a))}<b>${esc(String(c))}</b></button>`).join('')}</div>` : '';
    const allHTML = appsHTML + `<button type="button" class="ws-item ws-all" data-idx="-1" data-fk="ws--1" aria-current="${wb.idx === -1}"><span class="dot" aria-hidden="true"></span><span class="nm">全体を見る</span><span></span><small>${esc(scopeLabel())} · ${n} 画面の進み具合</small></button>`;
    const bodyHTML = groups.map(([label, items]) => `<p class="ws-group"><span>${esc(label)}</span><b>${items.length}</b></p>${items.map(([s, i]) => `<button type="button" class="ws-item b-${esc(s.bucket)}" data-idx="${i}" data-fk="ws-${i}" aria-current="${wb.idx === i}"${roleVar(s)}><span class="dot" aria-hidden="true"></span><span class="nm">${esc(s.name)}</span>${s.by ? pill(s.by, DEF[s.by].role) : '<span></span>'}<small></small></button>`).join('')}`).join('');
    return allHTML + (bodyHTML || '<p class="ws-none">該当する画面がない</p>');
  });
  wbSideList.querySelectorAll('.ws-item:not(.ws-all)').forEach((b) => { const x = model.specs[+b.dataset.idx]; setText(b.lastElementChild, UI.project === 'all' ? `${PROJECT[x.project].name} · ${x.status.text}` : x.status.text); });
}

/* Colours of the spec sheet (2.3.5, requester 10-19: "遷移のところの遷移先が白の太字見にくい 色少しつけてみやすくしてほしい。
   あと状態変数の型も型ごとに色分けできない？"). One source for three things: a transition's tag (its kind, from the spec's
   type / method and the destination's words; the kind is written in the tag too, so the colour is never the only cue),
   a state variable's type text, and their legend in the 「?」 dialog (SPEC_HELP_HTML). The colours themselves are CSS
   variables (app.css, light and dark), each at least 4.5:1 against where it is drawn. */
const TRANSITION_KINDS = [   // [key, label, what it is told by] — the first that matches wins
  ['none', '遷移なし', /遷移なし|画面内|no transition|\bnone\b|alert|confirmationdialog|ダイアログ|toast|トースト/i],
  ['external', '外部（URL・tel・地図）', /外部|ブラウザ|browser|https?:|\burl\b|tel:|mailto:|地図アプリ|マップアプリ|\bmaps? app|google ?maps|apple ?maps|safari|openurl|linking/i],   // a screen named …MAP… is not an app
  ['back', 'pop / dismiss（戻る）', /\bpop|dismiss|戻る|\bback\b|閉じる/i],
  ['replace', 'replace / root（入れ替え）', /replace|\broot|navigatetoscreen|置き換|入れ替/i],
  ['modal', 'sheet / modal（重ねる）', /sheet|modal|present|fullscreen|cover|シート|モーダル/i],
  ['push', 'push（進む）', /push|navigat|router|遷移/i],
];
// No kind written (requester's ruling 10-19): a destination that names a screen (or a path) is 「画面へ」 in a colour
// of its own — never shown as push, the page does not guess what the spec does not say. Grey only when the destination
// names nothing either: empty, blank, or a placeholder (TRANSITION_PLACEHOLDER: 未定・未設定・不明・TBD・TBA・TODO・N/A・
// null・undefined, or only ? / - / — / ー / … / ・ / . characters).
const TRANSITION_SCREEN = ['screen', '画面へ（種類の指定なし）'];
const TRANSITION_OTHER = ['other', '行き先も種類も不明'];
const TRANSITION_PLACEHOLDER = /^(?:未定|未設定|不明|tbd|tba|todo|n\/a|null|undefined|[?？\-—―ー…・.]+)$/i;
// The type / method decides when it is written and names a kind; only then the destination's words (a word in the
// destination — 「sheet 表示」, 「MAP」, 「…Sheet」 — must not beat what the spec says the transition is).
const kindOf = (text) => (text ? TRANSITION_KINDS.find((k) => k[2].test(text)) : null);
function transitionKind(type, dest) {
  const d = String(dest || '').trim();
  return kindOf(String(type || '').trim()) || kindOf(d) || (d && !TRANSITION_PLACEHOLDER.test(d) ? TRANSITION_SCREEN : TRANSITION_OTHER);
}
const transitionTag = (dest, type) => {
  const [key, label] = transitionKind(type, dest);
  return `<span class="scr tk tk-${esc(key)}" data-tk="${esc(key)}" title="${esc(dest)}"><span class="tk-k">${esc(label.split('（')[0])}</span><span class="tk-d">${esc(SCREEN_JA[dest] || dest)}</span></span>`;
};
const TYPE_KINDS = [   // [key, label, sample, test] — Optional first: String? is an Optional
  ['optional', 'Optional（T?）', 'String?', (t) => /\?\s*$/.test(t)],
  ['array', '配列・辞書（[T]・{K: V}）', '[Item]', (t) => /^\s*[[{]|^\s*(array|dictionary|set|list|map)\b/i.test(t)],
  ['string', 'String', 'String', (t) => /^\s*string\s*$/i.test(t)],
  ['bool', 'Bool', 'Bool', (t) => /^\s*(bool|boolean)\s*$/i.test(t)],
  ['number', '数（Int・Double・Float）', 'Int', (t) => /^\s*(u?int\d*|double|float|cgfloat|number|decimal|long)\s*$/i.test(t)],
  ['color', 'Color', 'Color', (t) => /^\s*(color|uicolor|cgcolor)\s*$/i.test(t)],
];
const TYPE_OTHER = ['custom', 'そのほか（自作の型など）', 'Visibility'];
const typeKind = (t) => TYPE_KINDS.find((k) => k[3](String(t || ''))) || TYPE_OTHER;
const typeCell = (t) => { const k = esc(typeKind(t)[0]); return `<td class="mono ty ty-${k}" data-ty="${k}">${esc(t)}</td>`; };
const COLOR_LEGEND_HTML = `<p>遷移先の札は、遷移の種類で色を分ける（札の頭に種類も書く）。</p>
<p class="seg-legend sh-legend sh-kinds">${[...TRANSITION_KINDS, TRANSITION_SCREEN, TRANSITION_OTHER].map(([key, label]) => { const more = label.includes('（') ? label.slice(label.indexOf('（')) : '';
  return `<span class="scr tk tk-${esc(key)}${more ? '' : ' tk-solo'}" data-tk="${esc(key)}"><span class="tk-k">${esc(label.split('（')[0])}</span>${esc(more)}</span>`; }).join('')}</p>
<p>状態の型は、型で文字の色を分ける。</p>
<p class="seg-legend sh-legend sh-types">${[...TYPE_KINDS, TYPE_OTHER].map(([key, label, sample]) => `<span><code class="mono ty ty-${esc(key)}" data-ty="${esc(key)}">${esc(sample)}</code> ${esc(label)}</span>`).join('')}</p>`;
const SWATCHES = '<span><i class="sw sw-writing"></i>書き込み中</span><span><i class="sw sw-written"></i>記入済み</span><span><i class="sw sw-impl"></i>実装済み</span><span><i class="sw sw-tested"></i>テスト済み</span><span><i class="sw sw-empty"></i>未記入</span>';
/* The explanation of 「spec の進み具合」 (2.3.4, requester 10-19: "specの進み具合の説明をボードから消してその代わりに？
   ボタンおいて押したらモーダルで説明出して", for the panel and the overview alike: "同じで"). It used to sit under the
   panel's heading and over the overview's cards; now both places have a 「?」 next to the heading and both open this
   one dialog, built from this one source (the two can no longer say different things). */
const SPEC_HELP_HTML = `<p>spec ファイルの書き込みをファイル監視で追い、今どのセクションが実装・テストされているかを relatedFiles から割り出す。</p>
<p>バーは左から 概要・構造・状態・データ・操作・遷移・分岐 の 7 区分。色は次のとおり。</p>
<p class="seg-legend sh-legend">${SWATCHES}</p>
<p>右のパネルでは行を押すとホワイトボードに寄ってその spec を開く。「ボードで全部見る」の一覧では、カードを押すとその spec を開く。</p>
${COLOR_LEGEND_HTML}`;
let specHelp = null;
function openSpecHelp(opener) {
  closeSpecHelp(false);
  const el = document.createElement('div');
  el.className = 'spec-help'; el.id = 'spec-help';
  el.innerHTML = `<div class="sh-box" role="dialog" aria-modal="true" aria-labelledby="sh-title" tabindex="-1"><div class="sh-head"><h3 id="sh-title">spec の進み具合の見かた</h3><button type="button" class="mini-btn" data-sh-close>閉じる</button></div><div class="sh-body">${SPEC_HELP_HTML}</div></div>`;
  document.body.append(el);
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeSpecHelp(true); return; }
    if (e.key !== 'Tab') return;
    const box = el.querySelector('.sh-box'), list = [...box.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')];
    const first = list[0], last = list[list.length - 1];
    if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey, true);   // first, so Esc closes this and not the board under it
  el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('[data-sh-close]')) closeSpecHelp(true); });
  specHelp = { el, opener, onKey };
  el.querySelector('[data-sh-close]').focus();
}
function closeSpecHelp(back) {
  if (!specHelp) return;
  const { el, opener, onKey } = specHelp;
  specHelp = null; el.remove(); document.removeEventListener('keydown', onKey, true);
  if (back && opener && document.contains(opener)) opener.focus({ preventScroll: true });
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-spec-help]'); if (b) openSpecHelp(b); });
// the overview shows the 「?」 instead of its legend; an open spec keeps its own legend (what the marks on the sheet mean)
function wbHelpMode(overview) { $('spec-help-board').hidden = !overview; $('wb-legend').hidden = overview; }
const SHEET_LEGEND_LIVE = '<span class="lg-writing">✎ 紫の枠 = 書き込み中</span><span class="lg-empty">点線 = 未記入</span><span><b class="m-done">✓</b> 構造: layout に在る ／ 分岐: テスト通過</span><span><b class="m-todo">○</b> 構造: layout が無い ／ 分岐: 未テスト</span><span><b class="m-test">▶</b> テスト中</span><span>状態・データ・操作・遷移は項目ごとの実装を測れないので印なし（関連ファイルの節に、在るファイルの数）</span>';
const SHEET_LEGEND = '<span class="lg-writing">✎ 紫の枠 = 書き込み中</span><span class="lg-empty">点線 = 未記入</span><span><b class="m-done">✓</b> 実装済み・テスト済み</span><span><b class="m-doing">●</b> 実装中</span><span><b class="m-todo">○</b> 未実装・未テスト</span><span><b class="m-test">▶</b> テスト中</span><span><b class="m-flaky">⚠</b> 再実行で通過</span><span>中身はデモの例</span>';
function setHead(title, file, stCls, stText, whoHTML) {
  setText($('wb-title'), title);
  setText($('wb-file'), file);
  const st = $('wb-status'), cls = `state ${stCls}`;
  if (st.className !== cls) st.className = cls;
  setText(st, stText);
  setHTML($('wb-who'), whoHTML);
}
function specSummary(s) {
  if (s.bucket === 'todo') return 'spec ファイルなし';
  const w = s.written.reduce((a, b) => a + b, 0) / 7;
  if (s.measure) {
    const m = s.measure, layout = m.layout === null ? 'layout —' : m.layout ? 'layout あり' : 'layout なし';
    return `記述 ${pct(w)}% · ${layout} · 関連ファイル ${m.related.done}/${m.related.total} · テスト ${s.implN[6]}/${s.totals[6]}`;
  }
  return `記述 ${pct(w)}% · 実装 ${s.implPhase ? `${sumImpl(s.implN)}/${sumImpl(s.totals)}` : '—'} · テスト ${s.implPhase ? `${s.implN[6]}/${s.totals[6]}` : '—'}`;
}
function renderOverview(model) {
  const apps = wbApps(model), inS = model.specs.filter((s) => inScope(s.project) && inApp(s)), c = bucketCounts(inS);
  const dirs = [...new Set(inS.map((s) => s.specDir).filter(Boolean))];
  const where = dirs.length > 1 ? `${dirs.length} か所の spec フォルダ` : `${dirs[0] || 'docs/screens/json'}/`;
  const title = `spec ボード${UI.project === 'all' ? '' : ` · ${PROJECT[UI.project].name}`}${wb.app !== 'all' && apps.length > 1 ? ` · ${appLabel(wb.app)}` : ''}`;
  setHead(title, `${where}（${inS.length} 画面）`, 'st-busy', `作業中 ${c.live} · 途中 ${c.partial} · 未着手 ${c.todo} · 完了 ${c.done}`, '');
  wbNav.hidden = true; $('wb-follow-label').hidden = true;
  wbHelpMode(true);
  const sig = JSON.stringify(['ov', UI.project, wb.app, model.specs.map((s) => `${s.bucket}:${s.by || ''}`)]);
  if (wbCode._sig !== sig) {
    wbCode.innerHTML = !inS.length ? `<p class="sc-ph ov-none">${esc(scopeLabel())} には画面の spec がない（CLI ツールなど）。上の「プロジェクト」で別のプロジェクトを選べる</p>` : BUCKETS.map(([b, label]) => {
      const items = model.specs.map((s, i) => [s, i]).filter(([s]) => s.bucket === b && inScope(s.project) && inApp(s));
      if (!items.length) return '';
      return `<section class="ov-group" aria-label="${esc(label)}"><h3>${esc(label)}<small>${items.length}</small></h3><div class="ov-grid">${items.map(([s, i]) => `<button type="button" class="ov-card b-${esc(s.bucket)}" data-idx="${i}"${roleVar(s)}><span class="ov-top"><strong>${esc(s.name)}</strong><span class="state"></span></span><code class="ov-file">${UI.project === 'all' ? `${esc(PROJECT[s.project].name)} · ` : ''}${esc(s.file)}</code><span class="ov-who"></span><span class="ov-secs">${SEGS}<span class="ov-labels" aria-hidden="true">${SECTIONS.map((x) => `<span>${esc(x)}</span>`).join('')}</span></span><span class="ov-sum"></span></button>`).join('')}</div></section>`;
    }).join('');
    wbCode._sig = sig; wbCode._html = null;
  }
  wbCode.querySelectorAll('.ov-card').forEach((card) => {
    const s = model.specs[+card.dataset.idx], st = card.querySelector('.state'), cls = `state ${STATUS_CLASS[s.status.kind]}`;
    if (st.className !== cls) st.className = cls;
    setText(st, s.status.text);
    setHTML(card.querySelector('.ov-who'), s.by ? `${robotWho(s.by)}<span>${esc(robotState[s.by].act)}</span>` : `<span>${esc(s.note)}</span>`);
    paintSegs(card.querySelector('.segs'), s);
    setText(card.querySelector('.ov-sum'), specSummary(s));
  });
}

const TYPE_JA = { View: 'コンテナ', SafeAreaView: '画面枠', ScrollView: 'スクロール', Label: 'テキスト', TextField: '入力欄', TextView: '複数行入力', Button: 'ボタン', Image: '画像', NetworkImage: '画像', Collection: '一覧', Indicator: '読み込み', Segment: '切り替え', SelectBox: '選択', CheckBox: 'チェック', Switch: 'スイッチ', TabView: 'タブ' };
const PLATFORM_JA = { ios: 'iOS', android: 'Android', web: 'Web' };
const CHIP = { empty: 'c-empty', writing: 'c-writing', written: '', impl: 'c-impl', done: 'c-done', test: 'c-test', tested: 'c-done' };
// A section with nothing implemented or tested yet stays plain; colour marks progress.
const chipCls = (g) => ((g.kind === 'impl' || g.kind === 'test') && g.f === 0 ? '' : CHIP[g.kind]);
/* [section, card title, key in the spec file, full width] */
const SHEET = [[0, '概要', 'metadata', true], [1, '構造（部品と並び）', 'structure', true], [2, '状態', 'stateManagement', false], [3, 'データの流れ', 'dataFlow', false], [4, '操作', 'userActions', false], [5, '遷移', 'transitions', false], [6, '分岐（テストで確かめる条件）', 'branchContracts', true], [7, '関連ファイル', 'relatedFiles', true]];
const reveal = (n, w) => (w >= 1 ? n : w <= 0 ? 0 : Math.min(n, Math.max(1, Math.ceil(n * w))));
function markOf(s, model, k, i) {
  if (s.id === 'cart' && k === 6 && model.t >= 18) {
    const st = (model.tests.rows[i] || {}).status;
    if (st === 'passed') return ['✓', 'm-done', ''];
    if (st === 'flaky') return ['⚠', 'm-flaky', ''];
    if (st === 'running') return ['▶', 'm-test', 'is-testing'];
    return ['○', 'm-todo', ''];
  }
  if (!s.implPhase || (s.unmeasured && s.unmeasured[k])) return ['', '', ''];
  const n = s.implN[k];
  if (i < n) return ['✓', 'm-done', ''];
  if (i === n && s.implIdx === k) return ['●', 'm-doing', 'is-doing'];
  return ['○', 'm-todo', ''];
}
function wfElement([type, id, desc], state, idx) {
  let shapeHTML;
  if (type === 'Button') shapeHTML = `<b class="wf-btn">${esc(desc)}</b>`;
  else if (type === 'TextField' || type === 'TextView') shapeHTML = `<span class="wf-input">${esc(desc)}</span>`;
  else if (type === 'SelectBox') shapeHTML = `<span class="wf-input">${esc(desc)} ▾</span>`;
  else if (type === 'Collection') shapeHTML = '<span class="wf-tiles"><i></i><i></i><i></i></span>';
  else if (type === 'Indicator') shapeHTML = '<span class="wf-spin"></span>';
  else if (type === 'Segment') shapeHTML = '<span class="wf-seg"><i></i><i></i><i></i></span>';
  else if (type === 'Image' || type === 'NetworkImage') shapeHTML = '<span class="wf-img"></span>';
  else if (type === 'Switch' || type === 'CheckBox') shapeHTML = `<span class="wf-check"><span class="bar short"></span><i class="${type === 'CheckBox' ? 'cb' : ''}"></i></span>`;
  else shapeHTML = `<span class="bar${type === 'Label' ? ' short' : ''}"></span>`;
  return `<div ${idx === undefined ? '' : `data-wf="${esc(idx)}" `}class="wf s-${esc(state)}"><span class="wf-id">${esc(id)}</span>${shapeHTML}</div>`;
}
/* The structure as a tree (ticket 2026-10-20-jui-viz-spec-structure-shows-no-nesting). The server sends each
   component as [type, id, desc, depth], depth-first (sheet.py); a row's parent is the nearest row above it one level
   up. TREE_STEP: the list's indent per level. WF_PAD: a box's inner padding in the phone frame by its depth — the cap
   that keeps a deep tree readable in the 196 px frame: 6 px at depths 0–2, 2 px at 3–5, none from 6 (a 1 px border
   only), so a box at depth 4 is still about 110 px wide and one at depth 15 about 80 px. */
const TREE_STEP = 14;
const WF_PAD = (depth) => (depth < 3 ? 6 : depth < 6 ? 2 : 0);
const hasDepths = (rows) => rows.some((c) => Array.isArray(c) && Number.isInteger(c[3]));
// The depths as drawn: the first row at 0, a row never more than one level below the row above it (a bad depth from
// the wire cannot make a row without a parent).
function treeDepths(rows) {
  let prev = -1;
  return rows.map((c) => { const raw = Number.isInteger(c[3]) && c[3] > 0 ? c[3] : 0; prev = Math.min(raw, prev + 1); return prev; });
}
// The list's tree lines for each row: one cell per level above it — 'v' (an ancestor's later sibling below: a line
// down), 'e' (none) — and its own 't' (a later sibling: ├) or 'l' (the last: └). Depth 0: none.
function treeGuides(depths) {
  const later = depths.map((d, i) => { for (let j = i + 1; j < depths.length; j++) { if (depths[j] < d) return false; if (depths[j] === d) return true; } return false; });
  const open = [];
  return depths.map((d, i) => {
    open.length = d;
    const cells = [];
    for (let k = 1; k < d; k++) cells.push(open[k] ? 'v' : 'e');
    if (d > 0) cells.push(later[i] ? 't' : 'l');
    open[d] = later[i];
    return cells;
  });
}
// The phone frame: a box per row, a child's box inside its parent's.
function wfTree(nodes) {
  let i = 0;
  const levelHTML = (depth) => {
    let outHTML = '';
    while (i < nodes.length && nodes[i].depth === depth) {
      const n = nodes[i++];
      const kidsHTML = i < nodes.length && nodes[i].depth > depth ? levelHTML(depth + 1) : '';
      if (!kidsHTML) { outHTML += wfElement(n.c, n.state, n.idx); continue; }
      const [type, id] = n.c, pad = WF_PAD(depth);
      outHTML += `<div data-wf="${esc(n.idx)}" class="wf wf-box${depth >= 6 ? ' wf-deep' : ''} s-${esc(n.state)}" style="padding:${esc(pad + 2)}px ${esc(pad)}px ${esc(pad)}px"><span class="wf-id">${esc(id || type)}</span>${kidsHTML}</div>`;
    }
    return outHTML;
  };
  return levelHTML(0);
}
/* 分岐's condition and result as formatted JSON (ticket 2026-10-20-jui-viz-spec-branch-json-formatted; requester 10-20:
   「json formatterでフォーマットした感じに」). The server sends a when / then the spec wrote as an object or an array as
   it is (sheet._json_or_text); its cell is an empty placeholder in the sheet's HTML, filled after it is set with
   JSON.stringify(v, null, 2) built from text nodes and spans — keys, strings, numbers and true / false / null each
   coloured — with createElement and textContent only: no value of the spec ever goes through HTML. The block scrolls
   sideways inside itself; over BJ_FOLD lines it is folded, 「全部を見る」 opens it (kept open across redraws). Anything
   else stays the one line of text it was. */
const BJ_FOLD = 12;
const bjCell = (v, i, j) => (v !== null && typeof v === 'object' ? `<td class="bj-cell" data-bj="${esc(i)}:${esc(j)}"></td>` : `<td>${esc(v)}</td>`);
const BJ_OPEN = new Set();
function jsonBlock(v, key) {
  const text = JSON.stringify(v, null, 2), lines = text.split('\n').length;
  const box = document.createElement('div'), pre = document.createElement('pre');
  box.className = 'bj'; pre.className = 'bj-pre';
  const put = (t, cls) => {
    if (!t) return;
    if (!cls) { pre.append(document.createTextNode(t)); return; }
    const sp = document.createElement('span'); sp.className = cls; sp.textContent = t; pre.append(sp);
  };
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g;
  let at = 0, m;
  while ((m = re.exec(text))) {
    put(text.slice(at, m.index));
    if (m[1]) { put(m[1], m[2] ? 'bj-key' : 'bj-str'); put(m[2]); } else if (m[3]) put(m[3], 'bj-num'); else put(m[4], 'bj-lit');
    at = re.lastIndex;
  }
  put(text.slice(at));
  box.append(pre);
  if (lines > BJ_FOLD) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'bj-more';
    const show = (open) => { box.classList.toggle('bj-open', open); btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? '畳む' : `全部を見る（${lines} 行）`; };
    btn.addEventListener('click', () => { const open = !box.classList.contains('bj-open'); if (open) BJ_OPEN.add(key); else BJ_OPEN.delete(key); show(open); });
    box.classList.add('bj-fold'); show(BJ_OPEN.has(key));
    box.append(btn);
  }
  return box;
}
function fillBranchJSON(root, branches, specId) {
  for (const td of root.querySelectorAll('td[data-bj]')) {
    if (td.firstChild) continue;   // filled before, the sheet's HTML unchanged
    const [i, j] = td.dataset.bj.split(':').map(Number), row = branches[i];
    if (row && row[j] !== null && typeof row[j] === 'object') td.append(jsonBlock(row[j], `${specId}:${i}:${j}`));
  }
}
function renderNav(s) {
  if (wbNav._idx !== wb.idx) { wbNav.innerHTML = SECTIONS.map((label, k) => `<button type="button" data-sec="${k}"><span>${esc(label)}</span><small></small></button>`).join(''); wbNav._idx = wb.idx; }
  [...wbNav.children].forEach((b, k) => { const g = secState(s, k); const cls = chipCls(g); if (b.className !== cls) b.className = cls; setText(b.lastElementChild, g.text); });
}
function renderSheet(model, force) {
  const s = model.specs[wb.idx], d = s.doc, T = model.tests;
  if (SOURCE.mode === 'live') {
    liveWantSheet(s);
    if (!d) {
      setHead(s.name, s.file, STATUS_CLASS[s.status.kind], s.status.text, s.by ? robotWho(s.by) : '');
      wbNav.hidden = false; $('wb-follow-label').hidden = false;
      setHTML($('wb-legend'), SHEET_LEGEND_LIVE); wbHelpMode(false);
      renderNav(s);
      const failed = LIVE.sheetFailed[s.id];
      setHTML(wbCode, `<p class="sc-ph">${failed ? `この spec を読めなかった（${esc(failed)}）` : 'spec を読み込んでいます…'}</p>`);
      wbCode._sig = null;
      return;
    }
  }
  if (SOURCE.mode === 'live') setHead(s.name, s.file, STATUS_CLASS[s.status.kind], s.status.text, s.by ? robotWho(s.by) : '');
  else setHead(`${s.name}（${s.screen}）`, `docs/screens/json/${s.file}`, STATUS_CLASS[s.status.kind], s.status.text, s.by ? pill(s.by, DEF[s.by].role) : '');
  wbNav.hidden = false; $('wb-follow-label').hidden = false;
  setHTML($('wb-legend'), SOURCE.mode === 'live' ? SHEET_LEGEND_LIVE : SHEET_LEGEND); wbHelpMode(false);
  renderNav(s);
  if (wbCode._sig) { wbCode._sig = null; wbCode._html = null; }

  let activeKey = null;
  const actAttr = (cls, key) => ((cls === 'is-doing' || cls === 'is-testing') && activeKey === null ? (activeKey = key, ' data-act') : '');
  const li = (m, key, innerHTML, depth) => `<li ${depth === undefined ? '' : `data-depth="${esc(depth)}" `}class="rw ${depth === undefined ? '' : 'rw-tree '}${esc(m[2])}"${actAttr(m[2], key)}><span class="mk ${esc(m[1])}">${esc(m[0])}</span><span>${innerHTML}</span></li>`;
  // イベント and 操作: one table (tickets 2026-10-20-jui-viz-spec-events-as-table), the look of the variables above it.
  // Its columns are the spec's own fields, nothing read out of the text; an event's name in one unbroken line.
  const nameTable = (heads, bodyHTML) => `<table class="vt nt"><thead><tr><th><span class="sr">状態</span></th>${heads.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${bodyHTML}</tbody></table>`;
  const nameCells = (cells, named) => cells.map((c, j) => `<td class="${j === 0 && named ? 'mono nt-name' : 'nt-desc'}">${esc(c)}</td>`).join('');
  const tr = (m, key, cellsHTML) => `<tr class="${esc(m[2])}"${actAttr(m[2], key)}><td class="mk ${esc(m[1])}">${esc(m[0])}</td>${cellsHTML}</tr>`;
  // The first n items of a section; while it is being written the newest one is highlighted instead of marked.
  const pick = (k, arr, n, fresh) => arr.slice(0, n).map((x, i) => [x, i, fresh ? ['', '', i === n - 1 ? 'is-new' : ''] : markOf(s, model, k, i)]);
  const bodies = [
    (w) => {
      const m = d.metadata;
      const rows = [['画面名', `${esc(m.displayName)}（<span class="mono">${esc(m.name)}</span>）`], ['説明', esc(m.description)], ['対応', m.platforms.map((p) => `<span class="bdg">${PLATFORM_JA[p] || esc(p)}</span>`).join(' ')], ['レイアウト', m.layoutFile ? `<code>docs/screens/layouts/${esc(m.layoutFile)}.json</code>` : ''], ['作成日', esc(m.createdAt)]].filter(([, v]) => v !== '');
      return `<dl class="kv">${rows.slice(0, reveal(rows.length, w)).map(([a, bHTML]) => `<dt>${esc(a)}</dt><dd>${bHTML}</dd>`).join('')}</dl>`;
    },
    (w, writing) => {
      const COMP_MAX = 60, compAll = reveal(d.components.length, w);
      const items = pick(1, d.components, Math.min(COMP_MAX, compAll), writing);
      const moreHTML = compAll > COMP_MAX ? `<p class="sc-note">ほか ${compAll - COMP_MAX} 個の部品（Layout が大きいので先頭の ${COMP_MAX} 個だけ）</p>` : '';
      const wfState = (m) => (writing ? (m[2] === 'is-new' ? 'writing' : 'defined') : !s.implPhase ? 'defined' : m[1] === 'm-done' ? 'done' : m[1] === 'm-doing' ? 'doing' : 'todo');
      const rowText = (type, id, desc) => `<span class="tp">${esc(TYPE_JA[type] || type)}</span> <span class="id">${esc(id)}</span> <span class="desc">${esc(desc)}</span>`;
      let rowsHTML, wfHTML;
      if (hasDepths(d.components)) {
        // a tree: the list indented by depth with its lines, the phone frame's boxes nested
        const depths = treeDepths(items.map((x) => x[0])), guides = treeGuides(depths);
        rowsHTML = items.map(([[type, id, desc], i, m]) => {
          const gHTML = guides[i].length ? `<span class="tg" aria-hidden="true">${guides[i].map((k) => `<i class="g-${esc(k)}"></i>`).join('')}</span>` : '';
          return li(m, `c${i}`, `${gHTML}<span class="tr-in" style="padding-left:${esc(depths[i] * TREE_STEP)}px">${rowText(type, id, desc)}</span>`, depths[i]);
        }).join('');
        wfHTML = wfTree(items.map(([c, i, m]) => ({ c, idx: i, depth: depths[i], state: wfState(m) })));
      } else {
        // no depths (the demo's screens): one level, the wireframe in layoutChildren's order
        rowsHTML = items.map(([[type, id, desc], i, m]) => li(m, `c${i}`, rowText(type, id, desc))).join('');
        const byId = new Map(items.map((x) => [x[0][1], x]));
        wfHTML = d.layoutChildren.filter((id) => byId.has(id)).map((id) => { const [c, , m] = byId.get(id); return wfElement(c, wfState(m)); }).join('');
      }
      return `<div class="st-grid"><div class="wf-phone" role="img" aria-label="${esc((d.components[0] || [])[1] || '')} の中に並ぶ部品の配置図">${wfHTML}</div><ul class="rows">${rowsHTML}</ul></div>${moreHTML}`;
    },
    (w, writing) => {
      const rowsHTML = pick(2, d.uiVariables, reveal(d.uiVariables.length, w), writing).map(([[name, type, init], i, m]) => tr(m, `v${i}`, `<td class="mono">${esc(name)}</td>${typeCell(type)}<td class="mono">${esc(init)}</td>`)).join('');
      const evHTML = !writing || w >= 0.6 ? `<p class="sub-h">イベント</p>${nameTable(['イベント', '説明'], d.eventHandlers.map(([name, desc], i) => tr(['', '', ''], `e${i}`, nameCells([name, desc], true))).join(''))}` : '';
      return `<table class="vt"><thead><tr><th><span class="sr">状態</span></th><th>変数</th><th>型</th><th>初期値</th></tr></thead><tbody>${rowsHTML}</tbody></table>${evHTML}`;
    },
    (w, writing) => {
      const M = d.vmMethods.length, shown = writing ? reveal(M + 2 + d.apis.length, w) : M + 2 + d.apis.length;
      const methodsHTML = pick(3, d.vmMethods, Math.min(shown, M), writing && shown <= M).map(([name, i, m]) => li(m, `m${i}`, `<span class="id">${esc(name)}</span>`)).join('');
      const varsHTML = shown > M ? `<p class="fb-vars">持つ値: ${d.vmVars.map((v) => `<code>${esc(v)}</code>`).join(' ')}</p>` : '';
      const reposHTML = shown > M + 1 ? `<div class="farrow" aria-hidden="true">↓</div><div class="fbox"><p class="fb-h">Repository</p><p>${d.repositories.map((r) => `<span class="bdg">${esc(r)}</span>`).join(' ')}</p></div>` : '';
      const apiN = Math.max(0, shown - M - 2);
      let apisHTML = '';
      if (shown > M + 1 && !d.apis.length) apisHTML = '<div class="farrow" aria-hidden="true">↓</div><div class="fbox"><p class="fb-h">API</p><p class="sc-ph">通信しない</p></div>';
      else if (apiN > 0) apisHTML = `<div class="farrow" aria-hidden="true">↓</div><div class="fbox"><p class="fb-h">API</p><ul class="rows">${d.apis.slice(0, apiN).map(([op, method, path]) => `<li class="api"><span class="http http-${esc(method)}">${esc(method)}</span><code>${esc(path)}</code><span class="desc">${esc(op)}</span></li>`).join('')}</ul></div>`;
      const boxesHTML = `<div class="flow"><div class="fbox"><p class="fb-h">ViewModel</p><ul class="rows">${methodsHTML}</ul>${varsHTML}</div>${reposHTML}${apisHTML}</div>`;
      // 2.3.5: the diagram the spec page draws (Mermaid), the boxes under it with what it does not say; while the
      // section is being written, the boxes alone (they grow as it is written)
      if (!d.flowMermaid || writing) return boxesHTML;
      return `<div class="flow-mmd-wrap"><div class="flow-mmd-bar"><button type="button" class="wb-btn" data-flow-zoom data-fk="flow-zoom" aria-pressed="${wb.flowFit ? 'true' : 'false'}">${wb.flowFit ? '実際の大きさ' : '幅に合わせる'}</button></div><div class="flow-mmd" data-flow-mmd role="img" aria-label="データの流れの図"></div></div><p class="sub-h">詳しく</p>${boxesHTML}`;
    },
    (w, writing) => {
      // 操作 (userAction: action, processing, destination): the destination column only when the spec writes one
      const dest = d.userActions.some((x) => x[2]);
      return nameTable(dest ? ['操作', '結果', '行き先'] : ['操作', '結果'], pick(4, d.userActions, reveal(d.userActions.length, w), writing)
        .map(([[a, p, to], i, m]) => tr(m, `a${i}`, nameCells(dest ? [a, p, to || ''] : [a, p], false))).join(''));
    },
    (w, writing) => `<ul class="rows">${pick(5, d.transitions, reveal(d.transitions.length, w), writing).map(([[trig, dest, how], i, m]) => li(m, `t${i}`, `${esc(trig)}<span class="to">→</span>${transitionTag(dest, how)}`)).join('')}</ul>`,
    (w, writing) => {
      const rowsHTML = pick(6, d.branches, reveal(d.branches.length, w), writing).map(([[method, when, then], i, m]) => tr(m, `b${i}`, `<td class="mono">${esc(method)}</td>${bjCell(when, i, 1)}${bjCell(then, i, 2)}`)).join('');
      const sheetNoteHTML = s.id === 'cart' && model.t >= 18 ? `<p class="sc-note">tests/screens/cart.test.json の 8 ケースと 1 対 1（${T.passed}/8 通過）</p>` : '';
      return `<table class="vt bt"><thead><tr><th><span class="sr">状態</span></th><th>メソッド</th><th>条件</th><th>結果</th></tr></thead><tbody>${rowsHTML}</tbody></table>${sheetNoteHTML}`;
    },
    () => `<ul class="files">${s.related.map(([type, path, exists], i) => {
      const now = i === s.relatedNow && s.by;
      return `<li class="${now ? 'now' : ''}"><span class="bdg">${esc(type)}</span><code>${esc(path)}</code>${exists === false ? '<span class="desc">まだ無い</span>' : ''}${now ? `<span class="editing">${pill(s.by, DEF[s.by].role)} ${s.status.kind === 'test' ? '実行中' : '編集中'}</span>` : ''}</li>`;
    }).join('')}</ul>`,
  ];
  const sheetHTML = SHEET.map(([k, title, key, wideAlways]) => {
    const wide = wideAlways || (k === 3 && !!d.flowMermaid);   // the data flow diagram takes the whole row (2.3.5)
    // 関連ファイル: live, written when the spec lists any (the demo ties it to 分岐, as its script does).
    const w = k === 7 ? (s.measure ? (s.measure.related.total ? 1 : 0) : (s.written[6] >= 1 ? 1 : 0)) : s.written[k];
    const rel = s.measure && s.measure.related;
    const g = k !== 7 ? secState(s, k) : !w ? { kind: 'empty', text: '未記入' }
      : rel && rel.total ? { kind: rel.done >= rel.total ? 'done' : 'impl', f: rel.done / rel.total, text: `在る ${rel.done}/${rel.total}` } : { kind: 'written', text: '記入済み' };
    const writing = w > 0 && w < 1, live = !!s.by && k === activeSec(s);
    const cls = ['sc', wide && 'wide', w <= 0 && 'sc-empty', live && (k === s.writingIdx ? 'sc-writing' : k === s.testIdx ? 'sc-testing' : 'sc-active')].filter(Boolean).join(' ');
    const headHTML = `<header><h3>${esc(title)}</h3><code>${esc(key)}</code>${live ? pill(s.by, DEF[s.by].role) : ''}<span class="sc-chip ${chipCls(g)}">${esc(g.text)}</span></header>`;
    if (w <= 0) return `<section class="${esc(cls)}" id="wb-sec-${k}">${headHTML}<p class="sc-ph">まだ書かれていません</p></section>`;
    const act = live && k === s.writingIdx && activeKey === null ? (activeKey = `w${k}`, ' data-act') : '';
    const tailHTML = !writing ? '' : s.by ? `<p class="sc-typing">✎ ${esc(s.by)} が書き込み中<span class="caret" aria-hidden="true"></span></p>` : '<p class="sc-ph">ここで書きかけのまま止まっている</p>';
    return `<section class="${esc(cls)}" id="wb-sec-${k}"${esc(act)}>${headHTML}${bodies[k](w, writing)}${tailHTML}</section>`;
  }).join('');
  setHTML(wbCode, sheetHTML);
  fillBranchJSON(wbCode, d.branches, s.id);
  const mmd = wbCode.querySelector('[data-flow-mmd]');
  if (mmd) drawMermaid(mmd, d.flowMermaid).then((svg) => flowZoomApply(svg));

  // Follow: keep the card being written, or the row being implemented or tested, in view.
  if ($('wb-follow').checked && activeKey) {
    const el = wbCode.querySelector('[data-act]');
    if (el) {
      const r = el.getBoundingClientRect(), c = wbCode.getBoundingClientRect();
      if (el.tagName === 'SECTION') { const over = r.bottom - (c.top + c.height * 0.85); if (force || activeKey !== wb.lastActive || over > 0) wbCode.scrollTop += over; }
      else if (force || activeKey !== wb.lastActive) wbCode.scrollTop += r.top + r.height / 2 - (c.top + c.height / 2);
    }
  }
  wb.lastActive = activeKey;
}

/* ---------- task board up close: one column per task state, permission prompts on top ---------- */
const tbEl = $('tb'), kanbanEl = $('kanban'), stripEl = $('perm-strip'), detailEl = $('tb-detail'), qStripEl = $('q-strip');
const tb = { open: false, detail: null, board: null, waitView: false };   // waitView: opened from a 質問 / 許可待ち chip
$('tb-lanes').addEventListener('change', (e) => { UI.lanes = e.target.checked; writePref('lanes', UI.lanes ? 'on' : 'off'); renderTaskBoard(latestModel); });
function openTaskBoard(opener, detail, board) {
  if (detail !== undefined) tb.detail = detail;
  if (board !== undefined) tb.board = board;
  if (detail && !detail.startsWith('perm:') && !inScope(PROJECT_OF[detail.split('#')[0]])) setProject(PROJECT_OF[detail.split('#')[0]], { camera: false });
  if (detail && detail.startsWith('perm:') && !inScope(projectOfRobot(PERM_BY_ID[detail.slice(5)].who))) setProject(projectOfRobot(PERM_BY_ID[detail.slice(5)].who), { camera: false });
  holdView('tb');
  if (wb.open) closeWhiteboard();
  if (rbState.id) closeRobot();
  if (tb.open) { renderTaskBoard(latestModel); if (detail) $('tbd-close').focus({ preventScroll: true }); return; }
  tb.open = true;
  zoomTo(taskPose(tb.board), opener, () => {
    if (!tb.open) return;
    showOverlay(tbEl);
    renderTaskBoard(latestModel);
    const firstQ = tb.waitView && !tb.detail ? qStripEl.querySelector('input:not([disabled])') : null;   // from the 質問 chip: the first choice
    (firstQ || $(tb.detail ? 'tbd-close' : 'tb-close')).focus({ preventScroll: true });
  });
}
function closeTaskDetail() {
  const key = tb.detail;
  tb.detail = null;
  renderTaskBoard(latestModel);
  const back = key && (kanbanEl.querySelector(`[data-open="${CSS.escape(key)}"]`) || stripEl.querySelector(`[data-open="${CSS.escape(key)}"]`));
  (back || $('tb-close')).focus({ preventScroll: true });
}
function closeTaskBoard() {
  if (!tb.open) { releaseView('tb'); return; }
  tb.open = false; tb.detail = null; tb.waitView = false;
  qStripEl.replaceChildren(); qStripEl._sig = null; qStripEl.hidden = true;   // no second copy of the cards while closed
  const dStrip = $('denied-strip'); dStrip.replaceChildren(); dStrip._sig = null; dStrip.hidden = true;
  hideOverlay(tbEl);
  releaseView('tb');
}
$('tb-close').addEventListener('click', closeTaskBoard);
const COL_HINT = { todo: '担当が決まれば始められる', wait: '先に終わるタスクがある', doing: 'ロボットが今やっている', done: '' };
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const paintSince = (root, t, word) => root.querySelectorAll('[data-since]').forEach((el) => setText(el, `${word} ${mmss(Math.max(0, t - Number(el.dataset.since)))}`));
/* The board's question strip (2.3.5): the panel's cards in scope, and how many wait elsewhere (the chip counts both). */
function renderQuestionStrip() {
  const qs = questionsShown(), elsewhere = questionsElsewhere();
  qStripEl.hidden = !qs.length && !elsewhere && !tb.waitView;
  keyed(qStripEl, `${tb.waitView}|${elsewhere}|${questionsSig(qs)}`, () => {
    const otherHTML = elsewhere ? `<p class="ps-rules" data-q-elsewhere="${elsewhere}">ほかのプロジェクトでも ${elsewhere} 件が答えを待っている <button type="button" class="link-btn" data-set-all data-fk="qs-all">すべてのプロジェクトを表示</button></p>` : '';
    return `<h3 class="ps-title">質問に答える<b>${qs.filter((q) => q.status === 'pending').length}</b><small>古い順</small></h3>${qs.some((q) => q.status === 'pending') ? '' : '<p class="ps-none">答えを待っている質問はない</p>'}${otherHTML}${qs.map((q) => questionHTML(q, 'b')).join('')}`;
  });
}
function renderTaskBoard(model) {
  if (!tb.open) return;
  const visible = (list) => inScope(PROJECT_OF[list]) && !UI.hiddenLists.has(list);
  const tasks = model.tasks.filter((x) => visible(x.list));
  // Permission prompts stay on top for the whole project even when some sessions are filtered out; prompts in
  // other projects are counted so they are never missed.
  const pend = model.pending.filter((p) => inScope(projectOfRobot(p.who)));
  const elsewhere = model.pending.length - pend.length;
  setText($('tb-count'), `${tasks.length} 件`);
  setText($('tb-title'), UI.project === 'all' ? 'タスクボード' : `タスクボード · ${PROJECT[UI.project].name}`);
  // the questions waiting, the same cards as the panel's from the same list (questionsShown), on top
  renderQuestionStrip();
  paintSince(qStripEl, model.t, '待ち');
  renderDenialStrip();
  paintSince($('denied-strip'), model.t, '経過');
  stripEl.hidden = !pend.length && !alwaysRules.size && !elsewhere && !tb.waitView;
  keyed(stripEl, JSON.stringify([NAMES.rev, pend.map(permSig), [...alwaysRules.keys()], elsewhere]), () => {
    const cardsHTML = pend.map((p) => {
      const x = p.task && TASK_BY_KEY[p.task];
      return `<li class="pcard"><div class="pc-who">${pill(p.who, DEF[p.who].role)}<span>${esc(DEF[p.who].agent)}</span><span class="pc-wait" data-since="${p.at}"></span></div><p class="pc-what"><b>${esc(p.tool)}</b> ${permSubject(p)}</p><button type="button" class="pc-task" data-open="${x ? esc(p.task) : `perm:${esc(p.id)}`}" data-fk="pt-${esc(p.id)}">${x ? `${esc(x.list)} ${esc(taskRef(x))} ${esc(x.subject)}` : `${esc(SESSION_OF[p.who])} セッション · タスクなし`} › 詳細</button><div class="perm-acts">${permButtons(p, 'p')}</div></li>`;
    }).join('');
    const rulesHTML = alwaysRules.size ? `<p class="ps-rules">このデモで足した常時許可: ${[...alwaysRules.keys()].map((r) => `<code>${esc(r)}</code>`).join(' ')} <button type="button" class="link-btn" data-reset-rules data-fk="rules">取り消す</button></p>` : '';
    const otherHTML = elsewhere ? `<p class="ps-rules">ほかのプロジェクトでも ${elsewhere} 件が許可を待っている <button type="button" class="link-btn" data-set-all data-fk="ps-all">すべてのプロジェクトを表示</button></p>` : '';
    return `<h3 class="ps-title">許可を求めています<b>${pend.length}</b><small>${PERM_NOTE}</small></h3>${cardsHTML ? `<ul class="ps-list">${cardsHTML}</ul>` : '<p class="ps-none">このプロジェクトでは今は誰も許可を求めていない</p>'}${otherHTML}${rulesHTML}`;
  });
  paintSince(stripEl, model.t, '待ち');
  const loopStart = simT - model.t;
  const lists = SESSIONS.filter((x) => visible(x.id)).map((x) => x.id);
  const noteHTML = (x, col) => {
      const ownerHTML = x.owner ? `${pill(x.owner, DEF[x.owner].role)}<span>${esc(DEF[x.owner].agent)}</span>` : '<span>担当なし</span>';
      const extraHTML = col === 'doing' ? `<span class="n-doing">▶ ${esc(isTurn(x) ? (x.background ? 'バックグラウンドで作業中' : '指示を処理中') : x.activeForm || x.subject)}<span data-since="${x.start}"></span></span>`
        : col === 'wait' ? (x.dep ? `<span class="n-wait">#${esc(x.dep.id)}「${esc(x.dep.subject)}」の完了待ち</span>` : `<span class="n-wait">${isTurn(x) ? (x.waitingFor === 'question' ? '質問に回答待ち' : '許可の返事待ち') : '待ち'}</span>`)
          : col === 'done' ? `<span class="n-time">${fmtClock(BASE_CLOCK + loopStart + x.end)} に${x.failed ? '失敗で終了' : '完了'}</span>` : '';
      const permHTML = x.perm ? `<div class="n-permbox"><p class="n-permq"><b>許可待ち</b> ${esc(x.perm.tool)} ${permSubject(x.perm)}</p><div class="perm-acts">${permButtons(x.perm, 'k')}</div></div>` : '';
      return `<li class="note${x.perm ? ' n-perm' : ''}${x.fresh ? ' n-new' : ''}${isTurn(x) ? ' n-turn' : ''}"><button type="button" class="note-open" data-open="${esc(x.key)}" data-fk="nb-${esc(x.key)}"><span class="n-top"><span>${esc(taskRef(x))}</span><span>${UI.lanes ? '' : `${esc(x.list)} の一覧${UI.project === 'all' ? ` · ${esc(PROJECT[PROJECT_OF[x.list]].name)}` : ''}`}</span></span><span class="n-subj">${esc(x.subject)}</span>${extraHTML}<span class="n-owner">${ownerHTML}</span></button>${permHTML}</li>`;
  };
  const sortCol = (col) => (a, b) => (b.perm ? 1 : 0) - (a.perm ? 1 : 0) || (col === 'done' ? b.end - a.end : 0) || a.list.localeCompare(b.list) || a.id - b.id;
  kanbanEl.classList.toggle('lanes', UI.lanes);
  keyed(kanbanEl, JSON.stringify([UI.lanes, NAMES.rev, lists, KCOLS.map(([col]) => tasks.filter((x) => x.col === col).map((x) => `${x.key}:${permSig(x.perm)}:${x.fresh ? 1 : 0}:${x.subject}:${x.owner || ''}`))]), () => {
    if (!lists.length) return `<p class="k-none">表示するセッションがない。上の「セッション」で選ぶ</p>`;
    if (!UI.lanes) return KCOLS.map(([col, label]) => {
      const items = tasks.filter((x) => x.col === col).sort(sortCol(col));
      return `<section class="kcol k-${esc(col)}" aria-label="${esc(label)} ${items.length} 件"><h3 class="ktab"><span>${esc(label)}${COL_HINT[col] ? `<small>${COL_HINT[col]}</small>` : ''}</span><b>${items.length}</b></h3><ol class="knotes">${items.map((x) => noteHTML(x, col)).join('') || '<li class="k-empty">なし</li>'}</ol></section>`;
    }).join('');
    // One lane per session: its four state columns side by side, sessions that need you first.
    const headHTML = `<div class="lane-cols" aria-hidden="true"><span></span>${KCOLS.map(([col, label]) => `<span class="k-${esc(col)}">${esc(label)}<b>${tasks.filter((x) => x.col === col).length}</b></span>`).join('')}</div>`;
    const ordered = SESSIONS.filter((x) => lists.includes(x.id)).sort((a, b) => SB_ORDER[sessionBadge(a)[0]] - SB_ORDER[sessionBadge(b)[0]] || a.id.localeCompare(b.id));
    return headHTML + ordered.map((x) => {
      const mine = tasks.filter((t) => t.list === x.id), [c, l] = sessionBadge(x);
      return `<section class="lane" aria-label="${esc(x.id)} のタスク ${mine.length} 件"><header class="lane-head"><button type="button" class="who-btn" data-robot-open="${esc(x.id)}" data-fk="lh-${esc(x.id)}">${pill(x.id, 'main')}<span>${esc(PROJECT[x.project].name)}</span></button><span class="state ${esc(c)}">${esc(l)}</span><small>${mine.length} 件</small></header>${KCOLS.map(([col, label]) => { const items = mine.filter((t) => t.col === col).sort(sortCol(col)); return `<div class="lane-cell k-${esc(col)}" aria-label="${esc(label)} ${items.length} 件"><span class="lane-label">${esc(label)} ${items.length}</span><ol class="knotes">${items.map((t) => noteHTML(t, col)).join('')}</ol></div>`; }).join('')}</section>`;
    }).join('');
  });
  paintSince(kanbanEl, model.t, '経過');
  renderTaskDetail(model);
}

/* The detail drawer: one task (or one prompt that belongs to no task) with its permission prompt, links and history. */
function renderTaskDetail(model) {
  const key = tb.detail;
  detailEl.hidden = !key;
  if (!key) { detailEl._sig = null; return; }
  const permOnly = key.startsWith('perm:');
  const x = permOnly ? null : model.tasks.find((q) => q.key === key) || null;
  const base = permOnly ? null : TASK_BY_KEY[key];
  const here = model.perms.filter((q) => (permOnly ? q.id === key.slice(5) : q.task === key));
  const pending = here.find((q) => q.status === 'pending') || null;
  const known = permOnly ? PERM_BY_ID[key.slice(5)] : null;
  const who = base ? base.owner : known ? known.who : null;
  const sig = JSON.stringify([key, x && x.col, x && x.status, x && x.subject, here.map(permSig)]);
  keyed(detailEl, sig, () => {
    const loopStart = simT - model.t;
    const clock = (v) => fmtClock(BASE_CLOCK + loopStart + v);
    const [cls, label] = x ? (x.perm ? ['st-waiting', '作業中・許可待ち'] : x.col === 'wait' ? ['st-waiting', '待ち'] : COL_STATE[x.col]) : ['st-idle', 'まだ作られていない'];
    const blocks = base ? TASKS.filter((q) => q.list === base.list && q.blockedBy === base.id) : [];
    const specIdx = base && base.spec ? SPEC_INDEX[base.spec] : -1;
    const spec = specIdx >= 0 ? model.specs[specIdx] : null;
    const histHTML = here.filter((q) => q.status !== 'pending' && q.status !== 'sent').map((q) => {
      const howHTML = SOURCE.mode === 'live' ? livePermHow(q) : q.status === 'terminal' ? 'ターミナルで許可された' : q.status === 'rule' ? `ルール ${esc(q.rule)} で自動許可` : q.status === 'deny' ? 'ビューで拒否した' : q.status === 'always' ? `ビューで許可し、${esc(q.rule)} を追加` : 'ビューで許可した';
      const at = q.decided ? fmtClock(BASE_CLOCK + q.decided.at) : clock(q.status === 'rule' ? q.at : q.end);
      return `<li><time>${esc(at)}</time><span>${howHTML} · ${esc(q.tool)} <code>${esc(permSummary(q))}</code></span></li>`;
    }).join('');
    const sample = pending || here[here.length - 1] || known;
    const times = base ? [base.created >= 0 ? `作成 ${clock(base.created)}` : '', base.start !== null && base.start <= model.t ? `開始 ${clock(base.start)}` : '', base.end !== null && base.end <= model.t ? `完了 ${clock(base.end)}` : ''].filter(Boolean).join(' · ') : '';
    return `<div class="tbd-top"><p class="tbd-id">${base ? `${esc(base.list)} ${esc(taskRef(base))} · ${esc(base.list)} の一覧` : `${esc(SESSION_OF[who])} セッション · タスクなし`}</p><button type="button" class="wb-btn" id="tbd-close" data-close-detail data-fk="tbd-close">閉じる</button></div>
<h3 id="tbd-title">${base ? esc(base.subject) : `${esc(known.tool)} の実行許可`}</h3>
${base ? `<p class="tbd-state"><span class="state ${esc(cls)}">${esc(label)}</span></p>` : ''}
${pending ? permDetail(pending, 'tbd') : ''}
<dl class="tbd-kv">
<dt>担当</dt><dd>${who ? `<button type="button" class="link-btn" data-robot-open="${esc(who)}" data-fk="tbd-who">${pill(who, DEF[who].role)} ${esc(DEF[who].agent)}</button>` : '担当なし'}</dd>
${who ? `<dt>今の作業</dt><dd data-live-act="${esc(who)}"></dd>` : ''}
${base ? `<dt>依存</dt><dd>${base.blockedBy ? `<button type="button" class="link-btn" data-open="${esc(base.list)}#${esc(base.blockedBy)}" data-fk="tbd-dep">#${esc(base.blockedBy)}「${esc(TASK_BY_KEY[`${base.list}#${base.blockedBy}`].subject)}」</button>${x && x.blocked ? ' の完了待ち' : ''}` : 'なし'}</dd>` : ''}
${base ? `<dt>後続</dt><dd>${blocks.length ? blocks.map((q) => `<button type="button" class="link-btn" data-open="${esc(q.list)}#${esc(q.id)}" data-fk="tbd-b${esc(q.id)}">#${esc(q.id)}「${esc(q.subject)}」</button>`).join(' ') : 'なし'}</dd>` : ''}
${times ? `<dt>時刻</dt><dd>${esc(times)}</dd>` : ''}
${spec ? `<dt>spec</dt><dd><button type="button" class="link-btn" data-spec-open="${specIdx}" data-fk="tbd-spec">${esc(spec.name)}（${esc(spec.screen)}）を開く</button><span class="state ${STATUS_CLASS[spec.status.kind]}">${esc(spec.status.text)}</span></dd>` : ''}
</dl>
${histHTML ? `<h4>許可の履歴</h4><ul class="tbd-list">${histHTML}</ul>` : ''}
${who ? `<h4>${esc(who)} の最近の動き</h4><ul class="tbd-list" data-recent="${esc(who)}"></ul>` : ''}
${sample ? rawDetails(sample) : ''}`;
  });
  paintSince(detailEl, model.t, '待ち');
  detailEl.querySelectorAll('[data-live-act]').forEach((el) => setText(el, robotState[el.dataset.liveAct].act));
  detailEl.querySelectorAll('[data-recent]').forEach((el) => setHTML(el, recentHTML(el.dataset.recent)));
}
const permDetail = (p, where) => (SOURCE.mode === 'live' ? permDetailLive(p, where) : permDetailDemo(p, where));
const permDetailLive = (p, where) => `<div class="tbd-perm"><h4>許可を求めています</h4><p>${pill(p.who, DEF[p.who].role)} ${esc(DEF[p.who].agent)} が <b>${esc(p.tool)}</b> を使いたい<span class="tbd-wait" data-since="${p.at}"></span></p><div class="tbd-cmd">${permSubjectLive(p)}</div>${p.can.reason ? `<label class="tbd-reason">拒否するときの理由（任意。Claude に伝わる）<input type="text" id="${esc(where)}-reason" autocomplete="off"></label>` : ''}<div class="perm-acts">${permButtons(p, where)}</div><p class="tbd-note">${PERM_NOTE}${p.relayOnly ? '。フックと照合できなかった中継の要求（内容は中継の文から）' : ''}</p></div>`;
const permDetailDemo = (p, where) => `<div class="tbd-perm"><h4>許可を求めています</h4><p>${pill(p.who, DEF[p.who].role)} ${esc(DEF[p.who].agent)} が <b>${esc(p.tool)}</b> を使いたい<span class="tbd-wait" data-since="${p.at}"></span></p><pre class="tbd-cmd">${esc(permSummary(p))}</pre><label class="tbd-reason">拒否するときの理由（任意。Claude に伝わる）<input type="text" id="${esc(where)}-reason" placeholder="例: 先に jui build を通して" autocomplete="off"></label><div class="perm-acts">${permButtons(p, where)}</div><p class="tbd-note">${PERM_NOTE}。「今後も許可」は <code>${esc(p.rule)}</code> を設定に足す。これと拒否の理由は PermissionRequest フック経由のときだけ返せる（channel の許可中継は許可・拒否のみ）</p></div>`;
/* The relay's request id: five lowercase letters without "l". */
const relayId = (p) => [...`${p.id}${p.who}xyz`].slice(0, 5).map((ch, k) => 'abcdefghijkmnopqrstuvwxyz'[(ch.charCodeAt(0) * 7 + k * 11) % 25]).join('');
const livePermHow = (q) => (q.status === 'terminal' ? (q.terminalBehavior === 'deny' ? 'ターミナルで拒否された' : 'ターミナルで許可された')
  : q.status === 'allow' ? (q.decidedBy === 'terminal' ? 'ターミナルで許可された' : q.sentRules ? `ビューで許可し、ルール ${q.sentRules.length} 件を追加` : 'ビューで許可した')
    : q.status === 'deny' ? (q.decidedBy === 'terminal' ? 'ターミナルで拒否された' : q.sentReason ? `ビューで拒否した（理由: ${esc(q.sentReason)}）` : 'ビューで拒否した')
    : q.status === 'expired' ? '答えないまま終わった' : esc(q.status));
const rawDetails = (p) => {
  if (SOURCE.mode === 'live') return `<details class="tbd-raw"><summary>受け取った内容</summary><pre>${esc(p.preview || permSummary(p))}</pre>${p.suggestions ? `<p>Claude Code が示した選択肢</p><pre>${esc(JSON.stringify(p.suggestions, null, 2))}</pre>` : ''}</details>`;
  const id = relayId(p);
  const relayIn = { method: 'notifications/claude/channel/permission_request', params: { request_id: id, tool_name: p.tool, description: p.tool + ' ' + permSummary(p), input_preview: JSON.stringify(p.input) } };
  const relayOut = { method: 'notifications/claude/channel/permission', params: { request_id: id, behavior: 'allow' } };
  return `<details class="tbd-raw"><summary>Claude Code とのやりとり（例）</summary><p>channel の許可中継で受け取る（ターミナルのダイアログも開いたまま）</p><pre>${esc(JSON.stringify(relayIn, null, 2))}</pre><p>返す（「許可」または「拒否」）</p><pre>${esc(JSON.stringify(relayOut, null, 2))}</pre><p>PermissionRequest フックで受け取る場合</p><pre>${esc(JSON.stringify(permRequestPayload(p), null, 2))}</pre><p>返す（「今後も許可」）</p><pre>${esc(JSON.stringify(permResponse(p, 'always'), null, 2))}</pre></details>`;
};

/* ---------- a robot up close: what it is doing, its tasks and its prompts ---------- */
const rbEl = $('rb');
const rbState = { id: null };
/* The chat icon of トーク (58-talk.js): a speech bubble, drawn with the text's colour. */
const TALK_ICON = '<svg class="rb-talk-icon" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 4.5A2.5 2.5 0 0 1 5.5 2h9A2.5 2.5 0 0 1 17 4.5v6a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.5V13h0A2 2 0 0 1 3 11z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="7" cy="7.6" r="1" fill="currentColor"/><circle cx="10" cy="7.6" r="1" fill="currentColor"/><circle cx="13" cy="7.6" r="1" fill="currentColor"/></svg>';
const CAM_DIR = new THREE.Vector3(0.25, 0.42, 0.87).normalize();
/* ---------- the camera on a robot (requester, 10-18: "ズーム中も回転とか拡大縮小とかできるようにしたい",
   "ロボットの場所によってはこんな感じになって見えない") ----------
   While the card is open the camera orbits the robot: azimuth, elevation and distance (FOCUS), changed by a drag, the
   wheel or a pinch. Its first direction is chosen when a robot is focused (opened, ← →, another robot clicked): of 12
   azimuths × 2 elevations, the one whose lines from the robot (chest, head, knees) to the camera cross the fewest
   walls, boards and furniture, nearest the usual direction on a tie. What still stands between them is drawn faint
   until the camera leaves (focusFadeSync, with the card's refresh). */
const FOCUS = { id: null, az: 0, el: 0, dist: 8, chosen: null, faded: new Map(), drag: null, pinch: null, touches: new Map() };
const FOCUS_DIST = [4, 18], FOCUS_EL = [0.12, 1.3], FOCUS_FADE = 0.22;
const FOCUS_BASE = { az: Math.atan2(CAM_DIR.x, CAM_DIR.z), el: Math.asin(CAM_DIR.y) };
const FOCUS_SAMPLES = [0.55, 1.15, 1.65];   // heights on the robot the camera must see
const focusRay = new THREE.Raycaster();
const focusDir = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
function focusPose(R, az, el, dist, fitted = false) {
  const dir = focusDir(az, el), wide = sceneEl.clientWidth > 900;
  const right = new THREE.Vector3().crossVectors(dir.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();
  const viewH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), viewW = viewH * camera.aspect;
  // a subagent is 0.8 (2.3.5). The floor under the robot, not its root's height: a hop or a jump (play) moves the root up and
  // down, and the camera does not go with the robot's motion (ticket 2026-10-20-jui-viz-wide-history-camera-jitters).
  const rp = R.robot.root.position, t = new THREE.Vector3(rp.x, 1.15 * (R.robot.size || 1), rp.z);
  // Wide: the card covers the right of the scene, so the robot sits left of centre. Narrow: the card is a
  // bottom sheet, so the robot sits high.
  // The wide 応答の履歴 (2.3.4, 55-history.js): the card leaves only histWideMargin() on the left, and the robot sits in its middle:
  // the middle of a fixed box around its seat (FOCUS_BOX: the desk and a little room around it) in the middle of the margin,
  // and the camera backs off if that box would not fit. Fixed, so the camera stays still whatever the robot does (10-20).
  const margin = typeof histWideMargin === 'function' ? histWideMargin() : 0;
  if (wide && margin) {
    const ext = focusExtent(R, right, dir, dist), mid = (ext.l + ext.r) / 2, width = ext.r - ext.l;
    const fit = (margin / sceneEl.clientWidth) * viewW * FOCUS_FIT;
    if (width > fit && !fitted) return focusPose(R, az, el, dist * (width / fit), true);   // farther, so the fixed box fits the margin
    t.add(right.clone().multiplyScalar(((sceneEl.clientWidth - margin) / 2 / sceneEl.clientWidth) * viewW + mid));
  }
  else if (wide) t.add(right.multiplyScalar((Math.min(420, sceneEl.clientWidth - 28) / 2 / sceneEl.clientWidth) * viewW));
  else t.y -= viewH * 0.2;
  return { p: t.clone().add(dir.multiplyScalar(dist)), t };
}
/* The width the wide history keeps in its margin: a fixed box in the robot's own space (its seat: the root's turn and its
   size go with it), the desk and a little room around it — not the robot as posed (requester 10-20: 「あんまり難しいことしなく
   ていいよ 机プラス少しの余裕くらいの固定値にしたら？」). 2.3.5 measured every shown mesh each frame and kept the widest per
   posture, turn and distance: the sweat drops coming and going, and a key with the distance in it that a backed-off camera
   changed every other frame, moved the camera with the robot's motion (ticket 2026-10-20-jui-viz-wide-history-camera-jitters).
   The box holds the widest pose there is: FOCUS_SPARE past each side of the desk (DESK_W wide, 10-robot-core.js) takes the
   tired slump, the headset's cups, the waving arm and the sweat drops: measured 10-20 in the robot's own space over 5 s each,
   the widest x ±1.09 (the sweat drops, the whistle's arm), y -0.02..2.19, z -0.77..1.00 (tired with sweat). Along the camera's right, in
   units of the plane it looks at, a corner nearer the camera counted wider (perspective). */
const FOCUS_FIT = 0.9;
const DESK_W = 1.0, FOCUS_SPARE = 0.65;
const FOCUS_BOX = { x: [-(DESK_W / 2 + FOCUS_SPARE), DESK_W / 2 + FOCUS_SPARE], y: [-0.05, 2.45], z: [-0.8, 1.05] };
const focusCorner = new THREE.Vector3(), focusQuat = new THREE.Quaternion(), focusScale = new THREE.Vector3(), FOCUS_LOOK = new THREE.Vector3(0, 1.15, 0);
function focusExtent(R, right, dir, dist) {
  const root = R.robot.root, B = FOCUS_BOX;
  root.updateWorldMatrix(true, false);
  root.matrixWorld.decompose(focusCorner, focusQuat, focusScale);
  let l = 0, r = 0;
  for (let i = 0; i < 8; i++) {
    focusCorner.set(B.x[i & 1 ? 1 : 0], B.y[i & 2 ? 1 : 0], B.z[i & 4 ? 1 : 0]).multiply(focusScale).applyQuaternion(focusQuat);
    const side = focusCorner.dot(right), depth = dist - focusCorner.sub(FOCUS_LOOK).dot(dir);
    const d = depth > 0.1 ? side * (dist / depth) : side;
    if (d < l) l = d;
    if (d > r) r = d;
  }
  return { l, r };
}
const shownChain = (o) => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };
const ofRobot = (o) => { for (let x = o; x; x = x.parent) if (x.userData && x.userData.robotId !== undefined) return true; return false; };
/* The meshes (walls, boards, furniture — not robots, not the selection ring) between the robot's sample points and p. */
function focusBlockers(R, p) {
  const out = new Set();
  for (const y of FOCUS_SAMPLES) {
    const from = R.robot.root.position.clone().add(new THREE.Vector3(0, y * (R.robot.size || 1), 0)), dir = p.clone().sub(from), len = dir.length();
    focusRay.set(from, dir.normalize());
    focusRay.far = len;
    focusRay.camera = camera;   // a sprite (a tag, a label) cannot be raycast without it: three.js throws
    for (const h of focusRay.intersectObject(scene, true)) {
      const o = h.object;
      if (o.isMesh && o !== selRing && !ofRobot(o) && shownChain(o)) out.add(o);
    }
  }
  return out;
}
function focusChoose(id) {
  const R = robots.find((x) => x.def.id === id);
  FOCUS.id = id; FOCUS.dist = 8; FOCUS.az = FOCUS_BASE.az; FOCUS.el = FOCUS_BASE.el; FOCUS.chosen = null;
  if (!R) return;
  let best = null;
  for (const el of [FOCUS_BASE.el, FOCUS_BASE.el + 0.3]) {
    for (const k of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6]) {
      const az = FOCUS_BASE.az + (k * Math.PI) / 6, n = focusBlockers(R, focusPose(R, az, el, FOCUS.dist).p).size;
      if (!best || n < best.n) best = { az, el, n, k };
      if (n === 0) break;
    }
    if (best.n === 0) break;
  }
  FOCUS.az = best.az; FOCUS.el = best.el;
  FOCUS.chosen = { step: best.k, raised: best.el !== FOCUS_BASE.el, blockers: best.n,
    usual: focusBlockers(R, focusPose(R, FOCUS_BASE.az, FOCUS_BASE.el, FOCUS.dist).p).size };
}
function robotPose(id) {
  if (FOCUS.id !== id) focusChoose(id);
  const R = robots.find((x) => x.def.id === id);
  return focusPose(R, FOCUS.az, FOCUS.el, FOCUS.dist);
}
/* Faint what stands between the camera and the focused robot now; give the rest its own material back. */
function focusFadeSync() {
  const R = has3D && rbState.id && zoom.zoomed && !rbEl.hidden ? robots.find((x) => x.def.id === rbState.id) : null;
  const now = R ? focusBlockers(R, camera.position) : new Set();
  for (const [o, mat] of FOCUS.faded) {
    if (now.has(o)) continue;
    const faint = o.material;
    o.material = mat;
    for (const m of [].concat(faint)) m.dispose();
    FOCUS.faded.delete(o);
  }
  for (const o of now) {
    if (FOCUS.faded.has(o)) continue;
    FOCUS.faded.set(o, o.material);
    o.material = [].concat(o.material).map((m) => { const c = m.clone(); c.transparent = true; c.opacity = FOCUS_FADE; c.depthWrite = false; return c; });
    if (!Array.isArray(FOCUS.faded.get(o))) o.material = o.material[0];
  }
}
/* A room or a robot about to be taken down (40-scene.js liveDropRoom / liveDropRobot): what of it is faint gets its
   own material back first, so disposeTree works as if nothing had been faint — the room's own materials disposed,
   the shared ones left — and the faint copies go with it. Left faint, disposeTree disposed the copies and never the
   own materials (5b's review, 10-18). */
function focusRelease(root) {
  for (const [o, mat] of FOCUS.faded) {
    let inside = false;
    for (let x = o; x; x = x.parent) if (x === root) { inside = true; break; }
    if (!inside) continue;
    const faint = o.material;
    o.material = mat;
    for (const m of [].concat(faint)) m.dispose();
    FOCUS.faded.delete(o);
  }
}
const focusing = () => has3D && !!rbState.id && zoom.zoomed && !camTween;
{
  // drag: around the robot; wheel and pinch: nearer or farther. Only while a robot's card has the camera.
  canvas.addEventListener('pointerdown', (e) => {
    if (!focusing()) return;
    FOCUS.touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (FOCUS.touches.size === 2) { const [a, b] = [...FOCUS.touches.values()]; FOCUS.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), dist: FOCUS.dist }; FOCUS.drag = null; }
    else FOCUS.drag = { x: e.clientX, y: e.clientY, az: FOCUS.az, el: FOCUS.el };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!focusing() || !FOCUS.touches.has(e.pointerId)) return;
    FOCUS.touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (FOCUS.pinch && FOCUS.touches.size === 2) {
      const [a, b] = [...FOCUS.touches.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      FOCUS.dist = Math.min(FOCUS_DIST[1], Math.max(FOCUS_DIST[0], FOCUS.pinch.dist * (FOCUS.pinch.d / Math.max(1, d))));
    } else if (FOCUS.drag) {
      FOCUS.az = FOCUS.drag.az - (e.clientX - FOCUS.drag.x) * 0.008;
      FOCUS.el = Math.min(FOCUS_EL[1], Math.max(FOCUS_EL[0], FOCUS.drag.el + (e.clientY - FOCUS.drag.y) * 0.006));
    }
  });
  const up = (e) => { FOCUS.touches.delete(e.pointerId); if (FOCUS.touches.size < 2) FOCUS.pinch = null; if (!FOCUS.touches.size) FOCUS.drag = null; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', (e) => {
    if (!focusing()) return;
    e.preventDefault();
    FOCUS.dist = Math.min(FOCUS_DIST[1], Math.max(FOCUS_DIST[0], FOCUS.dist * Math.exp(e.deltaY * 0.0015)));
  }, { passive: false });
}
function openRobot(id, opener) {
  if (projectOfRobot(id)) LAST_ROBOT.set(projectOfRobot(id), id);   // whichever way it was opened (list, tag, card, notification)
  NOTIFY.opened.set(id, Date.now());   // the session looked at since its turn's end: no 入力待ち reminder (notifyIdle)
  holdView('rb');
  if (wb.open) closeWhiteboard();
  if (tb.open) closeTaskBoard();
  const showing = !!rbState.id;
  rbState.id = id;
  if (showing) { renderRobot(latestModel); $('rb-close').focus({ preventScroll: true }); return; }
  // no 3D, or the robot is not in the scene (another floor, another room of the one-room view): the card alone
  if (!has3D || !robots.some((x) => x.def.id === id)) {
    if (!zoom.zoomed) zoom.returnPose = null;   // nothing to fly back from when the card closes
    showOverlay(rbEl); renderRobot(latestModel); $('rb-close').focus({ preventScroll: true }); return; }
  zoomTo(robotPose(id), opener, () => {
    if (rbState.id !== id) return;
    showOverlay(rbEl);
    renderRobot(latestModel);
    $('rb-close').focus({ preventScroll: true });
  });
}
function closeRobot({ byHand = false } = {}) {
  if (!rbState.id) { releaseView('rb'); return; }
  if (byHand && projectOfRobot(rbState.id)) LAST_ROBOT.set(projectOfRobot(rbState.id), null);   // closed by hand: none is remembered
  rbState.id = null;
  hideOverlay(rbEl);
  histSync();
  talkSync();
  FOCUS.id = null;      // the next robot opened chooses its view afresh
  focusFadeSync();      // everything faint gets its own material back
  releaseView('rb');    // the camera goes back only when no other screen holds the view (VIEW_HOLD)
}
/* ← → on the robot card (requester, 10-18: "この画面の時に左右キーとかでロボットを切り替えれるようにできる？"): the
   robots in view — the project picked, or the rooms of the floor shown — room by room in the rooms' order, then by
   label; robots leaving are skipped; the ends wrap. The card keeps its tab (55-history.js holds it), and the camera
   flies with the existing zoomTo (the camera itself is 40-scene.js's). */
function robotCycle() {
  const live = SOURCE.mode === 'live';
  const rooms = ROOMS.filter((r) => inScope(r.id) && (!live || UI.project !== 'all' || !LIVE.shown.length || LIVE.shown.includes(r.id))).map((r) => r.id);
  return ROBOT_DEFS.filter((d) => rooms.includes(projectOfRobot(d.id)) && !(live && LIVE.leaving[d.id]))
    .sort((a, b) => rooms.indexOf(projectOfRobot(a.id)) - rooms.indexOf(projectOfRobot(b.id)) || a.id.localeCompare(b.id, 'ja', { numeric: true }))
    .map((d) => d.id);
}
function stepRobot(dir) {
  const list = robotCycle();
  if (!rbState.id || list.length < 2) return;
  const i = list.indexOf(rbState.id);
  goRobot(list[i < 0 ? 0 : (i + dir + list.length) % list.length]);
}
/* The card on another robot, as ← → do it (the camera flies, the tab stays): also a linked name in the history. */
function goRobot(next) {
  if (!rbState.id || !next || next === rbState.id) return;
  rbState.id = next;
  renderRobot(latestModel);
  if (has3D && robots.some((x) => x.def.id === next)) zoomTo(robotPose(next), null, () => {});
}
rbEl.addEventListener('click', (e) => { const b = e.target.closest('[data-rb-step]'); if (b) stepRobot(Number(b.dataset.rbStep)); });
/* 2.3.4 (requester 10-19: "タブ選択してる時左右キーがタブの移動になるのやめてほしい 左右はロボットの移動でタブの移動はtabキーに
   できる？"): ← → switch robots wherever the focus is on the card, the tabs included (2.3.1 moved between the tabs there),
   except where text is typed (an input, a textarea, a select, an editable element) and while an IME composes. The tabs
   move with Tab instead (below). */
document.addEventListener('keydown', (e) => {
  if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (e.isComposing || e.keyCode === 229) return;                                                   // an IME is composing
  if (!rbState.id || rbEl.hidden || !popEl.hidden || logState.open || alwaysDlg || clockDlg) return;
  const t = e.target;
  if (t && (t.isContentEditable || (t.closest && t.closest('input, textarea, select')))) return;   // typing keeps its keys
  e.preventDefault();
  stepRobot(e.key === 'ArrowRight' ? 1 : -1);
});
/* 2.3.5 (requester 10-19: "部屋の状態で左右キー押したら左右の部屋に移動したい それと階全体表示で上下押したら上下の階に移動したい"):
   with no card open, in the room close-up ← → go to the room before / after on this floor, and on the whole floor ↑ ↓ go
   one floor up / down (the same as ▲ ▼). The card's own ← → (above) are untouched: this handler does nothing while a
   card is open. Nothing either where text is typed, while an IME composes, with a modifier, while a dialog, a board,
   the log or the building covers the floor, and in the demo (one office). Only a key that acts is taken
   (preventDefault); the room's ↑ ↓ and the floor's ← → stay the page's (they do nothing here). */
/* The rooms of the floor shown, in the order ← → walk them. The requester's rulings (10-19): the floor's own layout
   (the scene's row and column of each room, layoutRooms), read like text — the back row left to right, then the front
   row left to right; empty slots are skipped. Swap this one function to change the order. The walk wraps (ruling 2:
   after the last room the first, before the first the last) and never leaves the floor (floors are ↑ ↓). */
function arrowRoomOrder() {
  const ids = (LIVE.floors[LIVE.floor] || []).filter((id) => PROJECT[id]);
  return ids.sort((a, b) => (PROJECT[a].row - PROJECT[b].row) || (PROJECT[a].col - PROJECT[b].col));
}
function roomStep(dir) {
  const list = arrowRoomOrder(), i = list.indexOf(UI.project);
  if (i < 0 || list.length < 2) return false;
  const next = list[(i + dir + list.length) % list.length];   // wraps, on this floor
  setProject(next);                  // the room's tag, ← フロア全体に戻る, the project menu and the camera follow
  return true;
}
const arrowsCovered = () => !!(rbState.id || !rbEl.hidden || !popEl.hidden || logState.open || wb.open || tb.open || alwaysDlg || clockDlg
  || specHelp || LIGHT.el || document.querySelector('[aria-modal="true"]:not([hidden])'));
document.addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (e.isComposing || e.keyCode === 229 || e.defaultPrevented) return;
  const t = e.target;
  if (t && (t.isContentEditable || (t.closest && t.closest('input, textarea, select')))) return;
  if (SOURCE.mode !== 'live' || !has3D || TOWER.on || zoom.zoomed || arrowsCovered()) return;
  const room = UI.project !== 'all' && PROJECT[UI.project] && PROJECT[UI.project].shown;
  if (room && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    roomStep(e.key === 'ArrowRight' ? 1 : -1);
  } else if (UI.project === 'all' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    e.preventDefault();
    if (LIVE.floors.length > 1) liveFloorStep(e.key === 'ArrowUp' ? 1 : -1);
  }
});
/* Tab on the card's tabs: 今の様子 → Tab selects 応答の履歴 and focuses it; 応答の履歴 → Tab goes on into the card (the
   browser's own order); Shift+Tab is the reverse (応答の履歴 → 今の様子 → what is before the tabs). Never a dead end. */
rbEl.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey) return;
  const tab = e.target && e.target.closest && e.target.closest('[role="tablist"] [role="tab"]');
  if (!tab) return;
  const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')], k = tabs.indexOf(tab);
  const next = tabs[k + (e.shiftKey ? -1 : 1)];
  if (!next) return;                                  // the last tab forward, the first back: the browser's order
  e.preventDefault();
  next.click();
  const want = next.dataset.rbTab;
  const again = [...rbEl.querySelectorAll('[role="tab"]')].find((b) => b.dataset.rbTab === want);   // the card may have been rebuilt
  if (again) again.focus();
});
function renderRobot(model) {
  const id = rbState.id;
  if (!id || rbEl.hidden) return;
  const d = DEF[id], sess = SESSION_OF[id], isMain = sess === id, st = robotState[id];
  const specIdx = model.specs.findIndex((s) => s.by === id), spec = specIdx >= 0 ? model.specs[specIdx] : null;
  const pending = model.pending.find((p) => p.who === id) || null;
  const order = { doing: 0, wait: 1, todo: 2, done: 3 };
  const owned = model.tasks.filter((x) => (isMain ? x.list === id : x.owner === id)).sort((a, b) => order[a.col] - order[b.col] || a.id - b.id);
  const subs = isMain ? (SESSIONS.find((s) => s.id === id) || { robots: [] }).robots.filter((r) => r !== id) : [];
  keyed(rbEl, JSON.stringify([id, NAMES.rev, permSig(pending), specIdx, owned.map((x) => `${x.key}:${x.col}:${x.perm ? 1 : 0}:${x.subject}`)]), () => {
    const room = (SESSIONS.find((s) => s.id === sess) || { room: (PROJECT[projectOfRobot(id)] || {}).name || '' }).room;
    const tasksHTML = owned.length ? `<ul class="rb-tasks">${owned.map((x) => {
      const [c, l] = x.perm ? ['st-waiting', '許可待ち'] : x.col === 'wait' ? [x.waitingFor === 'question' ? 'st-asking' : 'st-waiting', waitLabel(x)] : COL_STATE[x.col];
      return `<li><button type="button" class="task-open" data-open="${esc(x.key)}" data-fk="rt-${esc(x.key)}"><span class="state ${esc(c)}">${esc(l)}</span><span class="tid">${esc(x.list)} ${esc(taskRef(x))}</span><span class="subject">${x.harness ? `<span class="h-tag">${esc(x.harness)}</span>` : ''}${esc(x.subject)}</span>${!isMain || !x.owner ? '' : `<span class="rb-owner">${pill(x.owner, DEF[x.owner].role)}</span>`}</button></li>`;
    }).join('')}</ul>` : `<p class="rb-none">${isMain ? 'このセッションのタスク一覧は空' : '担当しているタスクはない'}</p>`;
    return `<div class="rb-head" style="--c:${ROLES[d.role].color}"><span class="rb-badge" aria-hidden="true">${esc(id)}</span><div><h2 class="rb-name" id="rb-title">${esc(isMain ? d.title || `${id} のメインセッション` : d.agent)}</h2><p class="rb-sub">${esc(isMain ? `${d.title ? `${id} のメインセッション · ${d.head}` : d.agent} · ${room}` : `${ROLE_JA[d.role]} · ${sess} セッションのサブエージェント · ${room}`)}</p></div><div class="rb-side"><div class="rb-menu"><button type="button" class="wb-btn rb-talk" data-rb-talk data-fk="rb-talk" aria-pressed="false" aria-label="トーク" title="トーク（SendMessage の会話）">${TALK_ICON}<span>トーク</span><span class="rb-talk-n" data-rb-talk-n hidden></span></button><button type="button" class="wb-btn rb-clock" data-rb-clock data-fk="rb-clock" aria-haspopup="dialog" aria-describedby="rb-clock-why">退勤…</button></div><div class="rb-nav"><button type="button" class="rb-step" data-rb-step="-1" data-fk="rb-prev" aria-label="前のロボット（←）" title="前のロボット（←）">‹</button><button type="button" class="rb-step" data-rb-step="1" data-fk="rb-next" aria-label="次のロボット（→）" title="次のロボット（→）">›</button><button type="button" class="wb-btn" id="rb-close" data-rb-close data-fk="rb-close">← 3D に戻る</button></div></div><p class="rb-clock-why" id="rb-clock-why" data-rb-clock-why hidden></p></div>
<div class="rb-tabs"><button type="button" class="wb-btn rb-wide-btn" data-rb-wide data-fk="rb-wide" aria-pressed="false" hidden>広げる</button><div class="rb-tablist" role="tablist" aria-label="表示"><button type="button" role="tab" data-rb-tab="now" data-fk="rb-tab-now" aria-selected="true">今の様子</button><button type="button" role="tab" data-rb-tab="history" data-fk="rb-tab-history" aria-selected="false">応答の履歴</button></div></div>
<div class="rb-body rb-hist" data-rb-hist hidden aria-label="応答の履歴" tabindex="0"></div>
<div class="rb-body" tabindex="0" aria-label="今の様子">
<section class="rb-sec" aria-labelledby="rb-h-now"><h3 id="rb-h-now">今やっていること</h3><div class="rb-now"><p class="rb-state"><span class="rb-lamp" data-rb-lamp></span><b data-rb-state></b><span class="rb-since">ランプ: <span data-rb-lampname></span></span></p><p class="rb-act" data-rb-act></p><p class="rb-git" data-rb-git hidden title="Claude のセッションが Bash で撃った git push / pull だけが見える（自分のターミナル、エディタの git、GitHub での merge は見えない）"></p><p class="rb-cond" data-rb-cond></p><p class="rb-looks" data-rb-looks hidden></p>${spec ? `<p class="rb-spec"><button type="button" class="link-btn" data-spec-open="${specIdx}" data-fk="rb-spec">${esc(spec.name)}（${esc(spec.screen)}）の spec</button> <span data-rb-specnow></span></p><span class="rb-segs" style="--c:${ROLES[d.role].color}">${SEGS}</span>` : ''}${(SOURCE.mode === 'demo' && id === 'a2') ? '<p class="rb-test" data-rb-test></p><div class="prog" data-rb-prog role="img"><span class="p"></span><span class="r"></span></div>' : ''}</div></section>
${pending ? `<section class="rb-sec" aria-label="許可">${permDetail(pending, 'rb')}</section>` : ''}
${SOURCE.mode === 'live' ? '<section class="rb-sec" aria-labelledby="rb-h-tests"><h3 id="rb-h-tests">テスト実行</h3><div data-rb-tests></div></section>' : ''}
<section class="rb-sec" aria-labelledby="rb-h-tasks"><h3 id="rb-h-tasks">${isMain ? 'このセッションのタスク' : '担当しているタスク'}<small>${owned.length} 件</small></h3>${tasksHTML}</section>
${subs.length ? `<section class="rb-sec" aria-labelledby="rb-h-subs"><h3 id="rb-h-subs">サブエージェント</h3><ul class="rb-subs">${subs.map((r) => `<li><button type="button" class="who-btn" data-robot-open="${esc(r)}" data-fk="rs-${esc(r)}">${pill(r, DEF[r].role)}<span>${esc(DEF[r].agent)}</span></button><span class="state" data-rb-sub="${esc(r)}"></span><p class="act" data-rb-subact="${esc(r)}"></p></li>`).join('')}</ul></section>` : ''}
<section class="rb-sec" aria-labelledby="rb-h-log"><h3 id="rb-h-log">最近の動き</h3><ul class="tbd-list" data-recent="${esc(id)}"></ul><button type="button" class="link-btn" data-log-robot="${esc(id)}" data-fk="rb-log">ログで ${esc(id)} だけを見る</button></section>
</div>`;
  });
  const S = STATES[st.state] || STATES.idle;
  const play = SOURCE.mode === 'live' && has3D ? playTagText(id) : '';   // a game (2.3.3): the same words as the name tag
  setText(rbEl.querySelector('[data-rb-state]'), st.asking ? '質問に回答待ち' : play ? `${S.name} · ${play}` : S.name);
  setText(rbEl.querySelector('[data-rb-lampname]'), st.asking ? '黄（質問に回答待ち）' : LAMP_TEXT[S.lamp] || '');
  const lamp = rbEl.querySelector('[data-rb-lamp]'); if (lamp) lamp.style.background = LAMP[S.lamp];
  setText(rbEl.querySelector('[data-rb-act]'), st.act);
  // the box (2.3.4): its last push / pull, from the server's agent.git
  const gitEl = rbEl.querySelector('[data-rb-git]');
  if (gitEl) { const g = st.git; gitEl.hidden = !g; if (g) setText(gitEl, `最近の git: ${g.label || ''}（${new Date(g.at || 0).toTimeString().slice(0, 5)}）`); }
  // Tiredness and heavy work in words too (the 3D showed them, the card did not — 10-18 review)
  const cond = robotCondition(id), parts = [];
  if (cond.tired) parts.push(`稼働 ${Math.floor(cond.hours)} 時間（疲れ気味）`);
  if (cond.heavy) {
    const H = cond.heavy, why = [];
    if (H.reasons.includes('tokens')) why.push(`出力 ${Math.round(H.tokensPerMin || 0).toLocaleString('ja-JP')} トークン/分`);
    if (H.reasons.includes('tool')) why.push(`ツールが ${Math.round(H.toolSec || 0)} 秒走っている`);
    if (H.reasons.includes('subagents')) why.push(`サブエージェント ${H.subagents || 0} 体`);
    parts.push(`重い作業: ${why.join(' · ')}`);
  }
  const brk = SOURCE.mode === 'live' ? brkPanelText(id) : '';   // on a break (10-19): the name tag's words
  if (brk) parts.push(brk);
  const condEl = rbEl.querySelector('[data-rb-cond]');
  if (condEl) { setText(condEl, parts.join(' / ')); condEl.hidden = !parts.length; }
  // what the three looks of heavy work mean (2.3.6), only while the robot works hard
  const looksEl = rbEl.querySelector('[data-rb-looks]');
  const RB = robots.find((x) => x.def.id === id), causes = RB ? heavyCauses(RB.robot) : [];   // what the robot shows
  if (looksEl) { looksEl.hidden = !causes.length; if (causes.length) setText(looksEl, HEAVY_LEGEND); }
  if (spec) {
    const k = activeSec(spec);
    setText(rbEl.querySelector('[data-rb-specnow]'), `${spec.status.text}${k >= 0 ? ` · ${SECTIONS[k]}` : ''}`);
    paintSegs(rbEl.querySelector('.rb-segs .segs'), spec);
  }
  if ((SOURCE.mode === 'demo' && id === 'a2')) {
    const T = model.tests, n = CASES.length;
    setText(rbEl.querySelector('[data-rb-test]'), `${T.file} · ${T.statusText}`);
    const bar = rbEl.querySelector('[data-rb-prog]');
    bar.setAttribute('aria-label', `通過 ${T.passed} 件 / 全 ${n} 件`);
    bar.children[0].style.width = `${(T.passed / n) * 100}%`; bar.children[1].style.width = `${T.runningIdx >= 0 ? 100 / n : 0}%`;
  }
  clockPaint(id);
  rbEl.querySelectorAll('[data-rb-sub]').forEach((el) => paintState(el, robotBadge(el.dataset.rbSub)));
  rbEl.querySelectorAll('[data-rb-subact]').forEach((el) => setText(el, robotState[el.dataset.rbSubact].act));
  paintSince(rbEl, model.t, '待ち');
  rbEl.querySelectorAll('[data-recent]').forEach((el) => setHTML(el, recentHTML(el.dataset.recent)));
  const testsEl = rbEl.querySelector('[data-rb-tests]');
  if (testsEl) setHTML(testsEl, robotTestsHTML(robotRuns(id)));   // rewritten on every refresh while a run moves
  histSync();   // 55-history.js: the tab shown, and the history kept fresh while it is
  talkSync();   // 58-talk.js: the talk socket follows this robot, and its pane shows while トーク is on
  focusFadeSync();   // what stands between the camera and this robot, faint
}

/* ---------- 退勤: end this robot's session from its card (requester, 10-19) ----------
   「3Dに戻るの上あたりに退勤ボタン置いて、それ押したら確認ダイアログの後にセッション消す」. Measured with the requester (11:10–11:15):
   SIGTERM ends claude in about 1.5 s everywhere, but only a terminal is left in a good state (back at its shell); the
   VS Code tab stays with an error and the desktop app shows no change. So the button works for terminal sessions only and
   is disabled elsewhere with the reason (the server refuses those too: clockout.py). The dialog names the robot, the
   session (its title), the folder and the client; its default focus is やめる. After 退勤させる the server sends SIGTERM once,
   sees the process go and marks the session ended — the robot then walks out of the door like any session that ended. */
const CLOCK_WHY = {
  vscode: 'VS Code ではタブがエラーで残るので使えない。タブを閉じて終わらせる',
  desktop: 'デスクトップアプリでは画面が変わらないので使えない',
  other: 'ターミナルで起動したセッションだけ退勤させられる',
  unknown: '起動元が分からないので使えない（ターミナルで起動したセッションだけ）',
};
const CLIENT_JA = { terminal: 'ターミナル', vscode: 'VS Code 拡張', desktop: 'デスクトップアプリ', other: 'その他', unknown: '不明' };
const CLOCK = { busy: null, last: null };
let clockDlg = null;
function clockTarget(id) {
  if (SOURCE.mode !== 'live') return { why: 'デモでは使えない' };
  if (!id || !DEF[id]) return { why: '' };
  if (DEF[id].kind === 'sub') return { why: `サブエージェントは退勤させられない（${SESSION_OF[id]} のメインセッションのカードから）` };
  const sess = SESSIONS.find((x) => x.id === SESSION_OF[id]);
  if (!sess || sess.status === 'ended' || LIVE.leaving[id]) return { why: 'このセッションは終わっている' };
  const client = sess.client || 'unknown';
  if (client !== 'terminal') return { why: CLOCK_WHY[client] || CLOCK_WHY.unknown, client };
  if (location.hostname !== '127.0.0.1') return { why: `このページは http://127.0.0.1:${location.port}/ で開いたときだけ使える（jui viz open）`, client };
  return { why: '', sess, client };
}
function clockPaint(id) {
  const btn = rbEl.querySelector('[data-rb-clock]'), why = rbEl.querySelector('[data-rb-clock-why]');
  if (!btn || !why) return;
  const t = clockTarget(id), busy = CLOCK.busy === id, last = CLOCK.last && CLOCK.last.id === id ? CLOCK.last : null;
  btn.disabled = !!t.why || busy;
  setText(btn, busy ? '退勤中…' : '退勤…');
  const text = t.why || (last ? `退勤させられなかった（${last.error}）` : '');
  setText(why, text);
  why.hidden = !text;
  why.classList.toggle('rb-clock-err', !t.why && !!last);
}
function openClockConfirm(id) {
  const t = clockTarget(id);
  if (t.why || clockDlg) return;
  const opener = rbEl.querySelector('[data-rb-clock]');
  const el = document.createElement('div');
  el.className = 'perm-confirm clock-confirm'; el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'clk-title'); el.setAttribute('aria-describedby', 'clk-note');
  const title = t.sess.title || '（名前なし）';
  el.innerHTML = `<div class="pcf-box"><h3 id="clk-title">${esc(id)} を退勤させる</h3>
<dl class="clk-facts"><dt>ロボット</dt><dd data-clk-robot>${pill(id, DEF[id].role)} ${esc(id)} のメインセッション</dd><dt>セッション</dt><dd data-clk-title>${esc(title)}</dd><dt>フォルダ</dt><dd data-clk-cwd><code>${esc(CWD[id] || '?')}</code></dd><dt>クライアント</dt><dd data-clk-client>${esc(CLIENT_JA[t.client] || t.client)}</dd></dl>
<p id="clk-note">このセッションの claude に終了の合図（SIGTERM）を 1 回送る。途中の作業はそこで止まる。終わらなければ「終わらなかった」と出すだけで、強制終了はしない。</p>
<div class="pcf-acts"><button type="button" class="pa clk-go" data-clk-go>退勤させる</button><button type="button" class="pa clk-cancel" data-clk-cancel>やめる</button></div></div>`;
  document.body.append(el);
  clockDlg = { el, id, opener, at: Date.now() };
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('[data-clk-cancel]')) { closeClockConfirm(true); return; }
    if (e.target.closest('[data-clk-go]') && Date.now() - clockDlg.at > 350) clockGo(id);   // not the press that opened it
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeClockConfirm(true); return; }
    if (e.key === 'Tab') {   // the focus stays in the dialog
      const f = [...el.querySelectorAll('button')];
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  el.querySelector('[data-clk-cancel]').focus();
}
function closeClockConfirm(back) {
  if (!clockDlg) return;
  const { el, opener } = clockDlg;
  clockDlg = null; el.remove();
  const again = back ? rbEl.querySelector('[data-rb-clock]') || opener : null;
  if (again && document.contains(again) && !again.disabled) again.focus({ preventScroll: true });
}
async function clockGo(id) {
  closeClockConfirm(false);
  if (clockTarget(id).why || CLOCK.busy) return;
  CLOCK.busy = id; CLOCK.last = null;
  if (rbState.id === id) clockPaint(id);
  const got = await SOURCE.clockOut(id);
  CLOCK.busy = null;
  if (got.ok) showToast(`${id} を退勤させた（セッションは終わった）`);
  else { CLOCK.last = { id, error: got.error || `HTTP ${got.status}` }; showToast(`${id} を退勤させられなかった（${CLOCK.last.error}）`); }
  if (rbState.id === id) clockPaint(id);
}
rbEl.addEventListener('click', (e) => { if (e.target.closest('[data-rb-clock]') && rbState.id) openClockConfirm(rbState.id); });

/* ---------- live: the test run in the side panel (plan 09 §4) ---------- */
const CASE_ICON = { pending: '○', running: '▶', passed: '✓', flaky: '⚠', failed: '✗', skipped: '–' };
/* A robot's runs on its card: platform, state, counts, the bar, and the failed cases by name (FAILED_SHOWN at most). */
const FAILED_SHOWN = 5;
function robotTestsHTML(runs) {
  if (!runs.length) return '<p class="rb-none">このロボットが走らせたテストはまだ無い</p>';
  return `<ul class="rb-runs">${runs.map((T) => robotRunHTML(T)).join('')}</ul>`;
}
function robotRunHTML(T) {
  const n = T.rows.length, pPct = n ? (T.passed / n) * 100 : T.runStatus === 'passed' ? 100 : 0, rPct = n && T.runningIdx >= 0 ? 100 / n : 0;
  const fPct = n ? (T.failed / n) * 100 : T.runStatus === 'failed' ? 100 : 0;
  const failedRows = T.rows.filter((c) => c.status === 'failed');
  const namesHTML = failedRows.slice(0, FAILED_SHOWN).map((c) => `<li>${esc(c.name)}</li>`).join('');
  const moreHTML = failedRows.length > FAILED_SHOWN ? `<li class="rb-fail-more">ほか ${Math.max(0, failedRows.length - FAILED_SHOWN)} 件</li>` : '';
  return `<li class="rb-run r-${esc(T.runStatus)}" data-rb-run="${esc(T.id)}"><p class="rb-run-head"><b>${esc(T.device || 'テスト')}</b> <span>${esc(T.statusText)}</span>${T.savedAt ? '<small class="rb-saved">保存された結果</small>' : ''}</p><code class="rb-run-file">${esc(T.file)}</code>
<div class="prog" role="img" aria-label="通過 ${Number(T.passed)} 件 / 失敗 ${Number(T.failed)} 件 / 全 ${Number(n)} 件"><span class="p" style="width:${Number(pPct)}%"></span><span class="r" style="width:${Number(rPct)}%"></span><span class="x" style="width:${Number(fPct)}%"></span></div>${namesHTML ? `<ul class="rb-fails" aria-label="失敗したケース">${namesHTML}${moreHTML}</ul>` : ''}</li>`;
}
function liveTestsHTML(T) {
  const n = T.rows.length, pPct = n ? (T.passed / n) * 100 : T.runStatus === 'passed' ? 100 : 0, rPct = n && T.runningIdx >= 0 ? 100 / n : 0;
  const fPct = n ? (T.failed / n) * 100 : T.runStatus === 'failed' ? 100 : 0;
  const whoPillHTML = T.who && DEF[T.who] ? pill(T.who, DEF[T.who].role) : '';
  return `<div class="test-head"><div>${whoPillHTML} <code>${esc(T.file)}</code></div><code>${esc(T.device)}${T.device ? ' · ' : ''}${esc(T.statusText)}</code>
<div class="prog" role="img" aria-label="通過 ${Number(T.passed)} 件 / 全 ${Number(n)} 件"><span class="p" style="width:${Number(pPct)}%"></span><span class="r" style="width:${Number(rPct)}%"></span><span class="x" style="width:${Number(fPct)}%"></span></div></div>
<ul class="cases">${T.rows.map((c, i) => `<li class="c-${esc(c.status)}"><span class="ic">${CASE_ICON[c.status] || '○'}</span><span>${i + 1}. ${esc(c.name)}</span>${c.status === 'running' ? `<span class="step">${esc(c.step)}</span>` : ''}</li>`).join('')}</ul>`;
}

/* ---------- live: "from now on" asks first (plan 08 §5) ----------
   Only the request's own suggestions can be added. The dialog lists each one — the rules and where they are
   saved — with a box each; the answer goes out only from its confirm button. */
const DEST_JA = {
  localSettings: 'このプロジェクトの .claude/settings.local.json（自分だけ）',
  projectSettings: 'このプロジェクトの .claude/settings.json（共有）',
  userSettings: '~/.claude/settings.json（すべてのプロジェクト）',
  session: 'このセッションの間だけ',
};
function suggestionHTML(sg) {
  if (!sg || typeof sg !== 'object') return `<code>${esc(JSON.stringify(sg))}</code>`;
  const whereHTML = sg.destination ? `<small>保存先: ${esc(DEST_JA[sg.destination] || sg.destination)}</small>` : '';
  if (sg.type === 'addRules' && Array.isArray(sg.rules)) {
    const rulesHTML = sg.rules.map((r) => `<code>${esc(r && r.toolName ? `${r.toolName}${r.ruleContent ? `(${r.ruleContent})` : ''}` : JSON.stringify(r))}</code>`).join(' ');
    return `<span>${sg.behavior === 'deny' ? '拒否するルール' : '許可するルール'} ${rulesHTML}</span>${whereHTML}`;
  }
  if (sg.type === 'setMode') return `<span>モードを <code>${esc(sg.mode)}</code> にする</span>${whereHTML}`;
  if (sg.type === 'addDirectories' && Array.isArray(sg.directories)) return `<span>作業フォルダを足す ${sg.directories.map((d) => `<code>${esc(d)}</code>`).join(' ')}</span>${whereHTML}`;
  return `<code>${esc(JSON.stringify(sg))}</code>${whereHTML}`;
}
let alwaysDlg = null;
function openAlwaysConfirm(p, opener) {
  const list = Array.isArray(p.suggestions) ? p.suggestions : [];
  if (!list.length) { showToast('この要求には今後も許可できるルールが無い'); return; }
  closeAlwaysConfirm(false);
  const el = document.createElement('div');
  el.className = 'perm-confirm'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'pcf-title');
  el.innerHTML = `<div class="pcf-box"><h3 id="pcf-title">今後も許可する内容を確かめる</h3><p>${pill(p.who, DEF[p.who].role)} の <b>${esc(p.tool)}</b> ${permSubject(p)} を許可し、次を設定に足す。外したものは足さない。</p>
<ul class="pcf-list">${list.map((sg, i) => `<li><label><input type="checkbox" data-pcf="${i}" checked>${suggestionHTML(sg)}</label></li>`).join('')}</ul>
<div class="pcf-acts"><button type="button" class="pa pa-always" data-pcf-ok>この内容で今後も許可</button><button type="button" class="pa" data-pcf-cancel>やめる</button></div></div>`;
  document.body.append(el);
  alwaysDlg = { el, p, opener };
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('[data-pcf-cancel]')) { closeAlwaysConfirm(true); return; }
    if (!e.target.closest('[data-pcf-ok]')) return;
    const keep = [...el.querySelectorAll('[data-pcf]')].filter((c) => c.checked).map((c) => Number(c.dataset.pcf));
    if (!keep.length) { showToast('足すルールを 1 つ以上選んでください'); return; }
    const perm = alwaysDlg.p;
    closeAlwaysConfirm(true);
    SOURCE.decide(perm.id, 'allow', { perm, always: keep.length === list.length ? true : keep });
    refreshNow();
  });
  el.addEventListener('change', () => { el.querySelector('[data-pcf-ok]').disabled = ![...el.querySelectorAll('[data-pcf]')].some((c) => c.checked); });
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeAlwaysConfirm(true); } });
  el.querySelector('[data-pcf-ok]').focus();
}
function closeAlwaysConfirm(back) {
  if (!alwaysDlg) return;
  const { el, opener } = alwaysDlg;
  alwaysDlg = null; el.remove();
  if (back && opener && document.contains(opener)) opener.focus({ preventScroll: true });
}

/* ---------- the call bell's dialog (2.3.5, ticket 2026-10-19-jui-viz-call-a-robot-button) ----------
   The bell in the room up close (40-scene.js) or the header's 呼び出し opens it for that project: a name (required, one
   line), a role text (optional), the command the server makes from them (SOURCE.callCommand -> /api/call-command,
   callcmd.py) and a copy button. Each edit asks again; only the latest answer is shown (CALL.seq), and the copy button
   is off whenever the shown line is not the one for what is typed now. Copy: the clipboard API (127.0.0.1 is a secure
   context); when that fails, the line is selected for a manual copy. viz runs nothing. */
const CALL = { project: null, opener: null, seq: 0, command: '', timer: 0 };
const callEl = $('call');
function openCall(project, opener) {
  if (!project || !PROJECT[project]) return;
  CALL.project = project; CALL.opener = opener || document.activeElement; CALL.command = '';
  const p = PROJECT[project];
  setText($('call-lead'), `${p.name}（${p.path || ''}）に、担当名つきの新しいセッションを起動するコマンド`);
  $('call-cmd').value = ''; setText($('call-why'), '担当名を入れてください'); $('call-copy').disabled = true;
  callEl.hidden = false;
  $('call-name').focus();
  callAsk();
}
function closeCall() {
  if (callEl.hidden) return;
  callEl.hidden = true; CALL.seq++; clearTimeout(CALL.timer);
  const back = CALL.opener;
  CALL.project = null; CALL.opener = null;
  if (back && document.contains(back) && back.focus) back.focus({ preventScroll: true });
}
function callAsk() {
  clearTimeout(CALL.timer);
  const seq = ++CALL.seq, project = CALL.project, name = $('call-name').value, role = $('call-role').value;
  CALL.command = ''; $('call-copy').disabled = true;
  if (!name.trim()) { $('call-cmd').value = ''; setText($('call-why'), '担当名を入れてください'); return; }
  CALL.timer = setTimeout(async () => {
    const got = await SOURCE.callCommand(project, name, role);
    if (seq !== CALL.seq || callEl.hidden) return;   // typed again (or closed) meanwhile: a newer answer comes
    if (!got.ok) { $('call-cmd').value = ''; setText($('call-why'), got.why || '作れなかった'); return; }
    CALL.command = got.command; $('call-cmd').value = got.command; $('call-copy').disabled = false;
    setText($('call-why'), got.flag === '--channels' ? '貼って実行すると、このプロジェクトで新しいセッションが始まります'
      : '貼って実行すると、このプロジェクトで新しいセッションが始まります（起動時に development channels の警告が 1 回出ます）');
  }, 150);
}
async function callCopy() {
  const line = CALL.command;
  if (!line) return;
  try {
    await navigator.clipboard.writeText(line);
    showToast('コマンドをコピーした（ターミナルに貼って実行）');
    setText($('call-why'), 'コピーした。ターミナルに貼って実行してください');
  } catch (err) {
    const t = $('call-cmd'); t.focus(); t.select();
    showToast('コピーできなかった。選択したので ⌘C でコピーしてください');
    setText($('call-why'), 'コピーできなかった。コマンドを選択したので ⌘C でコピーしてください');
  }
}
$('call-name').addEventListener('input', callAsk);
$('call-role').addEventListener('input', callAsk);
$('call-copy').addEventListener('click', callCopy);
$('call-close').addEventListener('click', closeCall);
$('room-call').addEventListener('click', (e) => openCall(liveSolo(), e.currentTarget));
callEl.addEventListener('click', (e) => { if (e.target === callEl) closeCall(); });
callEl.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeCall(); return; }
  if (e.key === 'Tab') {   // the focus stays in the dialog
    const f = [...callEl.querySelectorAll('input, textarea, button')].filter((x) => !x.disabled);
    const i = f.indexOf(document.activeElement);
    e.preventDefault();
    f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  }
});

/* ---------- browser notifications and the question window's setting (2.3.6) ----------
   Requester 10-19: 「完了通知がwebプッシュで届くようにしてほしい。許可や質問も同様」, then 「開いている間でいい」: the
   Notification API only, while a viz page is open — no service worker, no push service; nothing leaves the machine.
   - done: a main robot's turn ends (its Stop); subagents never. perm: a new permission waits. ask: a new question waits.
   - one ring per event in all the tabs: the rung keys (server start + kind + id) are kept in localStorage and read
     and written under one Web Lock; a tab without storage decides alone. The notification's tag is the key too.
   - nothing from before the page was loaded or connected: the waiting permissions and questions of the first snapshot
     are taken as seen; neither the recent events the server sends after each snapshot nor the history asked for are
     rung; and an event older than 2 minutes is not either.
   - quiet: the page in front and focused, and that very thing on screen (the robot's card; that permission or that
     question on the board).
   - a click: the page comes forward and opens the robot's card, or the board on that permission, or the questions.
   - the switches per kind are kept in this browser (localStorage, try/catch); the browser's permission is asked only
     from the button in the settings, never on load.
   - while question notifications can be shown (permission granted, the kind on) the page says so to the server every
     4 s and whenever the server asks (notify.ping): then a question waits for an answer though the page is hidden
     (cd's ruling 10-19; it lapses notifyPresenceSec after the last word, a closed tab included). */
const NOTIFY_PREFS = 'jui-viz-notify', NOTIFY_RUNG = 'jui-viz-notify-rung', NOTIFY_KINDS = ['done', 'perm', 'ask', 'idle', 'chime'];
// the chime's loudness (requester 10-20: 「音が少し小さいね」): the tones' peak gain, 中 by default (0.08 before)
const NOTIFY_VOLUMES = { low: 0.1, mid: 0.2, high: 0.35 };
const NOTIFY = { on: { done: true, perm: true, ask: true, idle: true, chime: true }, lastStop: new Map(), opened: new Map(), volume: 'mid', audio: null, seen: new Set(), based: { perm: false, ask: false }, said: false, settings: null, pings: 0,
  tab: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, peers: new Map(), yieldMs: 1500 };
function notifyLoadPrefs() {
  try {
    const v = JSON.parse(localStorage.getItem(NOTIFY_PREFS) || 'null');
    if (v && typeof v === 'object') for (const k of NOTIFY_KINDS) if (typeof v[k] === 'boolean') NOTIFY.on[k] = v[k];
    if (v && Object.hasOwn(NOTIFY_VOLUMES, v.volume)) NOTIFY.volume = v.volume;
  } catch (err) { /* no storage: the defaults */ }
}
notifyLoadPrefs();
// a switch turned in another tab holds here too (a kind turned off there must not ring from this one)
window.addEventListener('storage', (e) => { if (e.key === NOTIFY_PREFS) { notifyLoadPrefs(); notifySettingsShow(); notifyPresenceSay(); } });
function notifySavePrefs() { try { localStorage.setItem(NOTIFY_PREFS, JSON.stringify({ ...NOTIFY.on, volume: NOTIFY.volume })); } catch (err) { /* kept for this page only */ } }
const notifyCan = () => typeof Notification !== 'undefined';
const notifyGranted = () => notifyCan() && Notification.permission === 'granted';
const notifyName = (who) => String((DEF[who] && (DEF[who].title || DEF[who].agent)) || who).slice(0, 40);
function notifyViewing(kind, ref) {
  if (document.visibilityState !== 'visible' || !document.hasFocus()) return false;
  if (kind === 'done' || kind === 'idle') return rbState.id === ref.who;
  if (kind === 'perm') return tb.open && (tb.detail === `perm:${ref.id}` || (!!ref.task && tb.detail === ref.task) || (tb.waitView && !tb.detail));
  return tb.open && !!(qStripEl && qStripEl.querySelector(`[data-qcard="${CSS.escape(ref.id)}"]`));
}
function notifyOpen(kind, ref) {
  try { window.focus(); } catch (err) { /* the OS may keep it behind */ }
  if (kind === 'done' || kind === 'idle') { NOTIFY.opened.set(ref.who, Date.now()); if (DEF[ref.who]) openRobot(ref.who, document.getElementById('scene-canvas')); }
  else if (kind === 'perm') openTaskBoard(null, ref.task || `perm:${ref.id}`);
  else { tb.waitView = true; openTaskBoard(null); }
}
/* The one place a notification is made. */
function notifyOut(key, body, onClick, title = 'jui viz') {
  const n = new Notification(title, { body, tag: key });
  n.onclick = () => { n.close(); onClick(); };
  return n;
}
/* The chime (2.3.6, ticket 2026-10-20-jui-viz-notify-chime; requester: 「鳴らす 鳴らすかどうかは設定で変えれる」): the
   page makes it with Web Audio (no sound file), quietly, when it shows a notification — the tab that showed it only,
   never when quiet. One switch for all three kinds (on by default, kept with them); done falls, a permission or a
   question rises. A browser starts an AudioContext only after the person has pressed something on the page: it is
   woken by the permission button and by the first press anywhere; until then the notification shows without sound
   and the settings say a press is needed. */
function notifyAudioMake() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && !NOTIFY.audio) { NOTIFY.audio = new AC(); NOTIFY.audio.onstatechange = () => { notifySettingsShow(); notifyAudioSay(); }; }
  } catch (err) { /* no sound: the notification still shows */ }
  return NOTIFY.audio;
}
function notifyAudioWake() {
  const ac = notifyAudioMake();
  if (ac && ac.state !== 'running') ac.resume().catch(() => {}).finally(() => notifySettingsShow());
}
const notifyAudioReady = () => !!(NOTIFY.audio && NOTIFY.audio.state === 'running');
const notifyAudioState = () => (NOTIFY.audio ? NOTIFY.audio.state : 'none');
/* The real check (10-20): the banner showed and no chime was heard, though the same tones from a new AudioContext in
   the console were. A browser lets a context run only after a press on the page since it was loaded, and a context
   can go back to suspended; so right before each chime the page asks it to resume (at most RESUME_MS) and sounds only
   if it then runs. Each try is kept (NOTIFY.lastChime: the state before and after, the clock, played or not) and shown
   in the settings and the console, to tell the two apart the next time. */
const NOTIFY_RESUME_MS = 600;
async function notifyChime(kind) {
  if (!NOTIFY.on.chime) return;
  const rec = { at: Date.now(), kind, before: notifyAudioState(), after: null, t: null, played: false };
  try {
    const ac = notifyAudioMake();
    if (ac && ac.state !== 'running') await Promise.race([ac.resume().catch(() => {}), new Promise((done) => setTimeout(done, NOTIFY_RESUME_MS))]);
    rec.after = notifyAudioState();
    rec.t = ac ? +Number(ac.currentTime || 0).toFixed(2) : null;
    if (ac && ac.state === 'running') { rec.peak = notifyTones(ac, kind); rec.played = true; }
  } catch (err) { rec.error = String((err && err.message) || err); }
  rec.noTab = !rec.played && !notifyPeerCanSound();   // no tab of this browser could make it (the settings say so)
  NOTIFY.lastChime = rec;
  try { console.info('jui viz: chime', JSON.stringify(rec)); } catch (err) { /* the console is for the eye only */ }
  notifySettingsShow();
}
function notifyTones(ac, kind) {
  const peak = NOTIFY_VOLUMES[NOTIFY.volume] || NOTIFY_VOLUMES.mid;
  try {
    const t = ac.currentTime, notes = kind === 'done' ? [880, 660] : [660, 988];
    notes.forEach((hz, i) => {
      const o = ac.createOscillator(), g = ac.createGain(), at = t + i * 0.16;
      o.type = 'sine'; o.frequency.setValueAtTime(hz, at);
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(peak, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
      o.connect(g); g.connect(ac.destination); o.start(at); o.stop(at + 0.32);
    });
  } catch (err) { /* no sound: the notification has shown */ }
  return peak;
}
/* Which tab rings (the real check 2, 10-20): two old tabs of an earlier check, their sound never started, took the
   one-time key first and showed the notification silently, while the tab in front could sound. Each tab says on a
   BroadcastChannel whether its sound runs (when it changes, every NOTIFY_SAY_MS, when a new tab asks, and good-bye
   when it goes); a tab that cannot sound leaves an event to a tab whose last word was that it can, and takes it
   itself only if, NOTIFY.yieldMs later, nobody has (the notification is never lost, and still shows once). A last
   word does not age: a hidden tab's timers can run once a minute (the browser's throttling), so its every-2-s word
   comes late though its sound runs; one gone without a good-bye costs NOTIFY.yieldMs and a silent notification.
   When no tab can sound, the notification shows without it and the settings say so. */
const NOTIFY_SAY_MS = 2000;
const notifyBus = typeof BroadcastChannel === 'function' ? new BroadcastChannel('jui-viz-notify-audio') : null;
function notifyAudioSay(bye = false, hello = false) {
  if (!notifyBus) return;
  try { notifyBus.postMessage({ tab: NOTIFY.tab, running: !bye && notifyAudioReady(), bye, hello }); } catch (err) { /* a closed channel */ }
}
if (notifyBus) {
  notifyBus.onmessage = (e) => {
    const m = e.data || {};
    if (typeof m.tab !== 'string' || m.tab === NOTIFY.tab) return;
    if (m.bye) NOTIFY.peers.delete(m.tab); else NOTIFY.peers.set(m.tab, { running: !!m.running, at: Date.now() });
    if (m.hello) notifyAudioSay();   // a new tab: it hears this one now, not a throttled timer later
    notifySettingsShow();
  };
  NOTIFY.sayTimer = setInterval(() => notifyAudioSay(), NOTIFY_SAY_MS);
  window.addEventListener('pagehide', () => notifyAudioSay(true));
  notifyAudioSay(false, true);
}
const notifyPeerCanSound = () => [...NOTIFY.peers.values()].some((p) => p.running);
// every press until the sound runs (not the first only: a context can go back to suspended)
for (const ev of ['pointerdown', 'keydown']) document.addEventListener(ev, () => { if (!notifyAudioReady()) notifyAudioWake(); }, { capture: true });
/* true: this tab rings it (the first to take the key); false: another tab (or this one) already did. */
function notifyRungTake(key) {
  let rung;
  try { rung = JSON.parse(localStorage.getItem(NOTIFY_RUNG) || '[]'); if (!Array.isArray(rung)) rung = []; } catch (err) { return true; }
  if (rung.includes(key)) return false;
  rung.push(key);
  try { localStorage.setItem(NOTIFY_RUNG, JSON.stringify(rung.slice(-300))); } catch (err) { /* the next tab may ring it too */ }
  return true;
}
function notifyEvent(kind, key, ref, body, title) {
  if (NOTIFY.seen.has(key)) return;
  NOTIFY.seen.add(key);
  if (!NOTIFY.on[kind] || !notifyGranted()) return;
  // quiet (this very thing on screen, in front): the key is taken without a ring, so a tab that comes to it later does
  // not ring it either (tabs take an event in no fixed order: one that came first may already have rung it)
  const quiet = notifyViewing(kind, ref);
  const ring = () => { if (notifyRungTake(key) && !quiet) { notifyOut(key, body, () => notifyOpen(kind, ref), title); notifyChime(kind); } };   // the sound: the same one tab
  const locked = (fn) => (navigator.locks && navigator.locks.request ? navigator.locks.request('jui-viz-notify', fn).catch(() => {}) : fn());
  locked(() => {
    // this tab cannot sound and another says it can: that one rings it; this one only if nobody has, a moment later
    if (!quiet && NOTIFY.on.chime && !notifyAudioReady() && notifyPeerCanSound()) { setTimeout(() => locked(ring), NOTIFY.yieldMs); return; }
    ring();
  });
}
/* From the live source: a turn's end, the permissions and the questions as they are now. */
const notifyServer = () => (typeof LIVE !== 'undefined' && LIVE.slices.server && LIVE.slices.server.startedAt) || 0;
function notifyStop(raw, item, replay = false) {
  if (replay) { NOTIFY.seen.add(`${notifyServer()}:done:${raw.seq}`); return; }   // sent again after a snapshot: seen, not rung
  if (!item || !DEF[item.who] || DEF[item.who].kind !== 'main' || !(Date.now() - (Number(raw.at) || 0) < 120_000)) return;
  NOTIFY.lastStop.set(item.who, Date.now());
  notifyEvent('done', `${notifyServer()}:done:${raw.seq}`, { who: item.who }, `${notifyName(item.who)} が完了${raw.kind === 'StopFailure' ? '（失敗で止まった）' : ''}`);
}
const NOTIFY_ASK_GRACE_MS = 1500;
NOTIFY.askFirst = new Map();
/* 入力待ち (2.3.7, ticket 2026-10-20-jui-viz-notify-waiting-for-input; requester: 「入力待ち…検知出来るなら許可とかと同じ
   ように通知鳴らして欲しい」). Claude Code sends Notification idle_prompt 60 s after a turn's end that nobody answered
   (measured by the requester 10-20 10:36: Stop 10:36:45, idle_prompt 10:37:45, "Claude is waiting for your input").
   cd's ruling: a reminder — not rung when, since that turn's end, its 完了 notification was clicked or the session was
   opened on the page (NOTIFY.opened, by openRobot and by a click on the notification); otherwise once, with the chime,
   by the same one-tab, yield and quiet rules; its own switch. A replay after a snapshot is seen, never rung. */
function notifyIdle(raw, item, replay = false) {
  const key = `${notifyServer()}:idle:${raw.seq}`;
  if (replay) { NOTIFY.seen.add(key); return; }
  if (!item || !DEF[item.who] || DEF[item.who].kind !== 'main' || !(Date.now() - (Number(raw.at) || 0) < 120_000)) return;
  const stop = NOTIFY.lastStop.get(item.who) || 0, opened = NOTIFY.opened.get(item.who) || 0;
  if (stop && opened >= stop) { NOTIFY.seen.add(key); return; }   // looked at since the turn's end: no reminder
  const name = notifyName(item.who);
  notifyEvent('idle', key, { who: item.who }, `${name} が返事を待っています`, `入力待ち: ${name}`);
}
function notifyWaiting(kind, rows) {
  const waiting = rows.filter((x) => x.status === 'pending');
  if (!NOTIFY.based[kind]) {   // the first look after loading: what already waits was there before this page
    NOTIFY.based[kind] = true;
    for (const x of waiting) NOTIFY.seen.add(`${notifyServer()}:${kind}:${x.id}`);
    return;
  }
  for (const x of waiting) {
    const key = `${notifyServer()}:${kind}:${x.id}`;
    // a question comes with two hooks in no fixed order (the async forward and --ask, ingest.py): before --ask the card
    // does not wait in viz yet, so the text would send the person to the terminal while viz waits — give --ask
    // NOTIFY_ASK_GRACE_MS from this tab's first sight (ticket 2026-10-20-jui-viz-notify-ask-says-terminal-while-viz-waits)
    if (kind === 'ask' && !x.hookWaiting && !NOTIFY.seen.has(key)) {
      const first = NOTIFY.askFirst.get(key) || Date.now();
      NOTIFY.askFirst.set(key, first);
      const left = first + NOTIFY_ASK_GRACE_MS - Date.now();
      if (left > 0) { setTimeout(() => notifyWaiting('ask', typeof QUESTIONS !== 'undefined' ? QUESTIONS : rows), left + 20); continue; }
    }
    NOTIFY.askFirst.delete(key);
    const name = notifyName(x.who);
    const body = kind === 'perm' ? `${name} が許可を待っています: ${String(x.tool || '').slice(0, 40)}`
      : `${name} が質問しています — ${x.hookWaiting ? notifyAskLeft() : 'ターミナルで答えてください'}`;
    notifyEvent(kind, key, { id: x.id, who: x.who, task: x.task || null }, body);
  }
}
function notifyAskLeft() {
  const s = NOTIFY.settings;
  if (!s) return 'viz で答えるか、ターミナルで';
  return s.askWaitSec > 0 ? `viz で答えるか、${s.askWaitText}後にターミナルへ` : 'viz で答えるまで待ちます';
}
/* The page tells the server its question notifications are on (or no longer). */
const notifyPresenceWanted = () => SOURCE.mode === 'live' && notifyGranted() && NOTIFY.on.ask;
function notifyPresenceSay() {
  const want = notifyPresenceWanted();
  if (!want && !NOTIFY.said) return;
  NOTIFY.said = want;
  if (SOURCE.notifyPresence) SOURCE.notifyPresence(want);
}
setInterval(notifyPresenceSay, 4000);
document.addEventListener('visibilitychange', notifyPresenceSay);

/* The settings: a button in the header, a chip saying how long a question waits, a small panel. */
const notifyEl = $('notify-pop');
function notifySettingsShow(settings) {
  if (settings && typeof settings === 'object') NOTIFY.settings = settings;
  const s = NOTIFY.settings, live = SOURCE.mode === 'live';
  $('btn-notify').hidden = !live;
  const chip = $('chip-askwait');
  chip.hidden = !live || !s;
  if (s) setText(chip, s.askWaitSec > 0 ? `質問は viz で ${s.askWaitText}待つ` : '質問は viz で答えるまで待つ');
  if (notifyEl.hidden) return;
  const state = !notifyCan() ? 'このブラウザは通知を出せません'
    : Notification.permission === 'granted' ? 'ブラウザの通知: 許可済み'
      : Notification.permission === 'denied' ? 'ブラウザの通知: 拒否されています（ブラウザのサイトの設定で許可してください）'
        : 'ブラウザの通知: まだ許可していません';
  setText($('notify-perm-state'), state);
  $('notify-ask-perm').hidden = !notifyCan() || Notification.permission !== 'default';
  for (const el of notifyEl.querySelectorAll('[data-notify-kind]')) el.checked = !!NOTIFY.on[el.dataset.notifyKind];
  const st = notifyAudioState(), lc = NOTIFY.lastChime;
  $('notify-volume').value = NOTIFY.volume;
  $('notify-volume').disabled = !NOTIFY.on.chime;
  setText($('notify-chime-note'), !NOTIFY.on.chime ? '' : `音の状態: ${st === 'running' ? '鳴らせる' : st === 'none' ? 'まだ作られていない（ページを一度クリックすると鳴ります）' : '止まっている（ページを一度クリックすると鳴ります）'}（${st}）`
    + (st !== 'running' && notifyPeerCanSound() ? ' · ほかのタブが鳴らします' : '')
    + (lc ? ` · 最後のチャイム ${new Date(lc.at).toTimeString().slice(0, 8)}: ${lc.before} → ${lc.after}、currentTime ${lc.t}、${lc.played ? '鳴らした' : '鳴らせなかった'}` : '')
    + (lc && lc.noTab ? ' · このブラウザのどのタブも音を鳴らせません（どれかのタブをクリックすると鳴ります）' : ''));
  const sel = $('ask-wait');
  if (s) {
    // "until answered" is bounded by the hook's timeout (ticket 2026-10-20): the server says how long
    const most = Number(s.askUntilAnsweredSec) > 0 ? Number(s.askUntilAnsweredSec) : 0;
    const mostText = most >= 3600 ? `${Math.round(most / 3600)} 時間` : most >= 60 ? `${Math.round(most / 60)} 分` : '';
    const label = (sec) => (sec <= 0 ? (mostText ? `答えるまで（最長 ${mostText}）` : '答えるまで') : sec < 60 ? `${sec} 秒` : `${sec / 60} 分`);
    const choices = s.askWaitChoices.includes(s.askWaitSec) ? s.askWaitChoices : [...s.askWaitChoices, s.askWaitSec];
    const sig = JSON.stringify(choices);
    if (sel.dataset.sig !== sig) { sel.dataset.sig = sig; sel.innerHTML = choices.map((c) => `<option value="${esc(String(c))}">${esc(label(c))}</option>`).join(''); }
    sel.value = String(s.askWaitSec);
  }
}
function notifyOpenPanel(opener) {
  NOTIFY.opener = opener || null;
  notifyEl.hidden = false;
  $('btn-notify').setAttribute('aria-expanded', 'true');
  notifySettingsShow();
  (notifyEl.querySelector('#notify-ask-perm:not([hidden])') || notifyEl.querySelector('[data-notify-kind]')).focus({ preventScroll: true });
}
function notifyClosePanel() {
  if (notifyEl.hidden) return;
  notifyEl.hidden = true;
  $('btn-notify').setAttribute('aria-expanded', 'false');
  const back = NOTIFY.opener; NOTIFY.opener = null;
  if (back && document.contains(back)) back.focus({ preventScroll: true });
}
$('btn-notify').addEventListener('click', (e) => (notifyEl.hidden ? notifyOpenPanel(e.currentTarget) : notifyClosePanel()));
$('chip-askwait').addEventListener('click', (e) => notifyOpenPanel(e.currentTarget));
$('notify-close').addEventListener('click', notifyClosePanel);
$('notify-ask-perm').addEventListener('click', async () => {
  if (!notifyCan()) return;
  notifyAudioWake();   // the press that asks also lets the page make a sound (the chime)
  try { await Notification.requestPermission(); } catch (err) { /* refused or not asked */ }
  notifySettingsShow();
  notifyPresenceSay();
});
notifyEl.addEventListener('change', async (e) => {
  const k = e.target.closest('[data-notify-kind]');
  if (k) { NOTIFY.on[k.dataset.notifyKind] = k.checked; notifySavePrefs(); notifyPresenceSay(); notifySettingsShow(); return; }
  if (e.target.id === 'notify-volume') { if (Object.hasOwn(NOTIFY_VOLUMES, e.target.value)) NOTIFY.volume = e.target.value; notifySavePrefs(); return; }
  if (e.target.id === 'ask-wait') {
    const got = SOURCE.setAskWait ? await SOURCE.setAskWait(Number(e.target.value)) : { ok: false, why: 'デモでは変えられません' };
    setText($('ask-wait-note'), got.ok ? '保存した。次の質問から使います' : `変えられなかった（${got.why || '?'}）`);
  }
});
notifyEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); notifyClosePanel(); } });
document.addEventListener('pointerdown', (e) => {
  if (!notifyEl.hidden && !notifyEl.contains(e.target) && !$('btn-notify').contains(e.target) && !$('chip-askwait').contains(e.target)) notifyClosePanel();
}, true);
notifySettingsShow();
// ---- web/js/51-denials.js ----
/* ---------- tool calls stopped by auto mode (ticket 2026-10-20-jui-viz-auto-mode-denial-approve-from-page) ----------
   Requester: 「このケースの時に許可できる仕組み実装できない？」. The server's cards (denials.py: the PermissionDenied hook
   and the transcript's denial, one card per call) are shown next to the questions: in the panel, on the board's strip,
   and counted by the 止められた chip. 「実行してよいと伝える…」 opens a confirmation that shows the exact words the server
   will send (the card's prompt); only its 送る sends, and the page names the card, never the words (POST /api/denial).
   That prompt is all: no rule, no setting, no answer to a hook — whether the next try passes is Claude Code's call.
   cd's ruling (10-20 15:30): what this claims is that the person's judgement reaches the receiver unmistaken, not
   that the receiver goes on — it may rightly ask for a confirmation in the terminal. Once sent, the card says 伝えた
   and shows the receiver's next response under it.
   A session whose channel cannot take a prompt gets the reason instead of the button. 「そのまま」 closes the card. */
const DENIALS = [];
const DEN = { asking: null, askedAt: 0, based: false };
const DEN_SHOW_MS = 60000;
function rebuildDenials() {
  const list = typeof LIVE !== 'undefined' && Array.isArray(LIVE.slices.denials) ? LIVE.slices.denials : [];
  const rows = [];
  for (const x of list) {
    const who = x && (labelOf(x.agentId) || labelOf(x.sessionId));
    if (!who || !DEF[who] || typeof x.id !== 'string') continue;
    rows.push({ ...x, who, atMs: x.at, at: secOfDay(x.at || Date.now()) });   // at: the second of the day, as a question's
  }
  DENIALS.splice(0, DENIALS.length, ...rows);
  if (DEN.asking && !DENIALS.some((d) => d.id === DEN.asking.split('|')[0] && d.status === 'pending')) DEN.asking = null;
  denialsNotify();
}
/* The same rule as a permission (c2's notification rules, kind perm): one ring per card; what waited before the page
   loaded is not rung. */
function denialsNotify() {
  const waiting = DENIALS.filter((d) => d.status === 'pending');
  if (!DEN.based) { DEN.based = true; for (const d of waiting) NOTIFY.seen.add(`${notifyServer()}:denied:${d.id}`); return; }
  for (const d of waiting) {
    notifyEvent('perm', `${notifyServer()}:denied:${d.id}`, { id: `denied:${d.id}`, who: d.who },
      `${notifyName(d.who)} の操作が自動モードで止められました: ${String(d.tool || '').slice(0, 40)}`);
  }
}
const denialsShown = (now = Date.now()) => DENIALS.filter((d) => inScope(projectOfRobot(d.who)) && (d.status === 'pending' || now - (d.doneAt || 0) < DEN_SHOW_MS));
const denialsWaiting = () => DENIALS.filter((d) => d.status === 'pending');
/* Whether a prompt can reach the card's session (the box under the history says the same: composeTarget). */
function denialTarget(d) {
  const main = SESSION_OF[d.who];
  return main && DEF[main] ? composeTarget(main) : { why: 'このセッションは見えていない' };
}
const DEN_DONE = { sent: '伝えた', dismissed: 'そのままにした', ended: 'セッションが終わった' };
const DEN_MAY = '受け手は続けることも、端末での確認を求めることもある（求められたら端末で答える）';
function denialHTML(d, where = '') {
  const t = d.status === 'pending' ? denialTarget(d) : { why: '' };
  const asking = DEN.asking === `${d.id}|${where}`;
  const whatHTML = `<p class="dwhat"><b>${esc(d.tool)}</b>${d.input ? ` <code>${esc(d.input)}</code>` : ''}</p>${d.reason ? `<p class="dwhy">理由 ${esc(d.reason)}</p>` : ''}`;
  let footHTML;
  if (d.status === 'sent') {
    footHTML = `<p class="qnote qdone">${esc(DEN_DONE.sent)}</p>` + (d.reply
      ? `<p class="dreply" data-dreply="${esc(d.id)}"><b>受け手の次の応答</b> ${esc(d.reply)}</p>`
      : `<p class="qnote" data-dreply-wait="${esc(d.id)}">受け手の応答を待っている。${esc(DEN_MAY)}</p>`);
  } else if (d.status !== 'pending') footHTML = `<p class="qnote qdone">${esc(DEN_DONE[d.status] || d.status)}</p>`;
  else if (t.why) footHTML = `<p class="qnote qwhy" role="note">${esc(t.why)}。端末で許可を伝えてください</p><div class="qfoot"><button type="button" class="pa pa-deny" data-ddismiss="${esc(d.id)}" data-fk="${esc(where)}dd-${esc(d.id)}">そのまま</button></div>`;
  else if (asking) {
    footHTML = `<div class="dconfirm" role="group" aria-label="送信の確認"><p class="dconfirm-to">このセッションへ次の文を伝える（${esc(t.name || '')}）</p><blockquote class="dprompt" data-dprompt="${esc(d.id)}">${esc(d.prompt)}</blockquote><p class="qnote" data-dmay>${esc(DEN_MAY)}</p>`
      + `<div class="qfoot"><button type="button" class="pa pa-allow" data-dgo="${esc(d.id)}" data-fk="${esc(where)}dg-${esc(d.id)}">送る</button><button type="button" class="pa pa-deny" data-dback="${esc(d.id)}" data-fk="${esc(where)}db-${esc(d.id)}">やめる</button></div></div>`;
  } else {
    footHTML = `<div class="qfoot"><button type="button" class="pa pa-allow" data-dask="${esc(d.id)}" data-fk="${esc(where)}da-${esc(d.id)}">実行してよいと伝える…</button><button type="button" class="pa pa-deny" data-ddismiss="${esc(d.id)}" data-fk="${esc(where)}dd-${esc(d.id)}">そのまま</button></div>`
      + `<p class="qnote">押すと、確認の後に、止められた操作と理由と「実行してよいと判断した」をこのセッションへ伝える。${esc(DEN_MAY)}。許可の規則や設定は変えない</p>`;
  }
  return `<article class="qcard dcard${d.status === 'pending' ? ' q-open' : ''}" data-dcard="${esc(d.id)}"><header class="qwho">${pill(d.who, DEF[d.who].role)}<span>${esc(DEF[d.who].agent)}</span><span class="dtag">自動モードが止めた</span><span class="pc-wait" data-since="${d.at}"></span></header>${whatHTML}${footHTML}</article>`;
}
const denialsSig = (shown) => JSON.stringify([NAMES.rev, DEN.asking, ...shown.map((d) => [d.id, d.status, d.reason, d.input, d.reply, denialTarget(d).why])]);
function renderDenials() {
  const shown = denialsShown(), waiting = denialsWaiting().length;
  const chip = $('chip-denied');
  chip.hidden = waiting === 0;
  setText(chip, `止められた ${waiting}`);
  $('denied-sec').hidden = shown.length === 0;
  keyed($('denied'), denialsSig(shown), () => shown.map((d) => denialHTML(d)).join(''));
}
function renderDenialStrip() {
  const el = $('denied-strip'), shown = denialsShown(), elsewhere = denialsWaiting().filter((d) => !inScope(projectOfRobot(d.who))).length;
  el.hidden = !shown.length && !elsewhere;
  keyed(el, `${elsewhere}|${denialsSig(shown)}`, () => {
    const otherHTML = elsewhere ? `<p class="ps-rules">ほかのプロジェクトでも ${elsewhere} 件 <button type="button" class="link-btn" data-set-all data-fk="ds-all">すべてのプロジェクトを表示</button></p>` : '';
    return `<h3 class="ps-title">自動モードが止めた操作<b>${shown.filter((d) => d.status === 'pending').length}</b><small>古い順</small></h3>${otherHTML}${shown.map((d) => denialHTML(d, 'b')).join('')}`;
  });
}
function onDenialClick(e) {
  const where = e.currentTarget.id === 'denied-strip' ? 'b' : '';
  const ask = e.target.closest('[data-dask]'), go = e.target.closest('[data-dgo]'), back = e.target.closest('[data-dback]'), dismiss = e.target.closest('[data-ddismiss]');
  const repaint = () => { renderDenials(); if (typeof tb !== 'undefined' && tb.open) renderDenialStrip(); };
  if (ask) {
    DEN.asking = `${ask.dataset.dask}|${where}`; DEN.askedAt = Date.now(); repaint();
    const btn = e.currentTarget.querySelector(`[data-dgo="${CSS.escape(ask.dataset.dask)}"]`);
    if (btn) btn.focus({ preventScroll: true });
    return;
  }
  if (back) { DEN.asking = null; repaint(); return; }
  if (go) {
    if (Date.now() - DEN.askedAt < 350 || DEN.asking !== `${go.dataset.dgo}|${where}`) return;   // not the press that opened it
    go.disabled = true;
    SOURCE.denial(go.dataset.dgo, 'approve').then((got) => {
      DEN.asking = null;
      showToast(got.ok ? 'このセッションへ伝えた（受け手の次の応答が札の下に出る）' : `送れなかった（${got.error || `HTTP ${got.status}`}）`);
      repaint();
    });
    return;
  }
  if (dismiss) {
    dismiss.disabled = true;
    SOURCE.denial(dismiss.dataset.ddismiss, 'dismiss').then((got) => { if (!got.ok) showToast(`閉じられなかった（${got.error || `HTTP ${got.status}`}）`); repaint(); });
  }
}
for (const id of ['denied', 'denied-strip']) $(id).addEventListener('click', onDenialClick);
$('chip-denied').addEventListener('click', (e) => { tb.waitView = true; openTaskBoard(e.currentTarget); });
// ---- web/js/52-data-docs.js ----
/* ---------- the data server's sheet (requester, 10-19; 2.3.5): a JsonUI room's API and DB specifications ----------
   Opened by pressing the rack (40-scene.js, kind 'data'). Read from the server then (SOURCE.dataDocs: POST
   /api/data-docs, the room's id only), never kept: closing drops it, opening again reads it again (a changed file
   shows). Two tabs, each only when the room has that kind: API 仕様書 — per document its endpoints (method, path,
   summary), a row opening its parameters, request body and responses; DB 仕様書 — per database its ER diagram
   (document_tools' Mermaid text, drawn strict like the data flow) and its tables, column by column as the generated
   schema page shows them. Every text is the specification's own, escaped here. */
const dsEl = $('ds'), dsBody = $('ds-body'), dsTabs = $('ds-tabs');
const ds = { open: false, project: null, tab: 'api', doc: null, error: '', loading: false, ep: null, seq: 0, opener: null };
async function openDataDocs(project, opener) {
  holdView('ds');   // 50-panel.js VIEW_HOLD: held before the card it replaces lets go
  if (wb.open) closeWhiteboard();
  if (tb.open) closeTaskBoard();
  if (rbState.id) closeRobot();
  if (pr.open) closePrices();   // 54-bills.js
  Object.assign(ds, { open: true, project, doc: null, error: '', loading: true, ep: null, opener: opener || null });
  setText($('ds-room'), PROJECT[project] ? PROJECT[project].name : '');
  showOverlay(dsEl);
  liveSoloSync();   // the room's 'back to the floor' box hides under the sheet
  renderDataDocs();
  $('ds-close').focus({ preventScroll: true });
  const seq = ++ds.seq;
  const got = typeof SOURCE.dataDocs === 'function' ? await SOURCE.dataDocs(project) : { ok: false, error: 'ライブ表示だけで見られます' };
  if (seq !== ds.seq || !ds.open) return;
  ds.loading = false;
  if (!got.ok) ds.error = got.error || '読めなかった';
  else { ds.doc = got.doc; ds.tab = got.doc.api.length ? 'api' : 'db'; }
  renderDataDocs();
}
function closeDataDocs() {
  if (!ds.open) { releaseView('ds'); return; }
  ds.open = false; ds.doc = null; ds.seq += 1;
  hideOverlay(dsEl);
  releaseView('ds');
  liveSoloSync();
  if (ds.opener && ds.opener.focus) ds.opener.focus({ preventScroll: true });
}
$('ds-close').addEventListener('click', closeDataDocs);
dsTabs.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ds-tab]');
  if (!b || !ds.doc) return;
  ds.tab = b.dataset.dsTab; ds.ep = null;
  renderDataDocs();
});
dsBody.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ep]');
  if (!b) return;
  ds.ep = ds.ep === b.dataset.ep ? null : b.dataset.ep;
  renderDataDocs();
});
const DS_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
// A schema as text, a $ref to the document's own schemas followed one level (the name, then what it holds).
function dsSchemaText(schema, schemas) {
  if (!schema || typeof schema !== 'object') return '';
  const ref = typeof schema.$ref === 'string' ? schema.$ref : schema.items && typeof schema.items.$ref === 'string' ? schema.items.$ref : '';
  const name = ref.split('/').pop();
  const target = ref && schemas && typeof schemas === 'object' ? schemas[name] : null;
  const head = ref ? `${schema.items ? `${name}[]` : name}\n` : '';
  return head + JSON.stringify(target || schema, null, 2);
}
function dsContentHTML(content, schemas) {
  if (!content || typeof content !== 'object') return '';
  const partsHTML = Object.entries(content).slice(0, 8).map(([type, c]) => `<p class="ds-ct">${esc(type)}</p><pre class="ds-json">${esc(dsSchemaText(c && c.schema, schemas))}</pre>`);
  return partsHTML.join('');
}
function dsParamType(p) { return p.schema && typeof p.schema === 'object' ? String(p.schema.type || (p.schema.$ref || '').split('/').pop() || '') : ''; }
function dsEndpointHTML(e, schemas) {
  const params = (Array.isArray(e.parameters) ? e.parameters : []).filter((p) => p && typeof p === 'object');
  const paramRowsHTML = params.map((p) => `<tr><td><code>${esc(p.name || '')}</code></td><td>${esc(p.in || '')}</td><td>${p.required ? '必須' : ''}</td><td><code>${esc(dsParamType(p))}</code></td><td>${esc(p.description || '')}</td></tr>`).join('');
  const paramsHTML = params.length ? `<table class="ds-table"><thead><tr><th>名前</th><th>場所</th><th>必須</th><th>型</th><th>説明</th></tr></thead><tbody>${paramRowsHTML}</tbody></table>` : '<p class="ds-none">パラメータなし</p>';
  const rb = e.requestBody && typeof e.requestBody === 'object' ? e.requestBody : null;
  const rbDescHTML = rb && rb.description ? `<p>${esc(rb.description)}</p>` : '';
  const reqHTML = rb ? rbDescHTML + dsContentHTML(rb.content, schemas) : '<p class="ds-none">リクエストの本文なし</p>';
  const responses = Object.entries(e.responses && typeof e.responses === 'object' ? e.responses : {}).slice(0, 20);
  const resRowsHTML = responses.map(([code, r]) => `<div class="ds-res"><p><b class="ds-code">${esc(code)}</b> ${esc((r && r.description) || '')}</p>${dsContentHTML(r && r.content, schemas)}</div>`).join('');
  const resHTML = resRowsHTML || '<p class="ds-none">レスポンスの記述なし</p>';
  const descHTML = e.description ? `<p class="ds-desc">${esc(e.description)}</p>` : '';
  return `<div class="ds-detail">${descHTML}<h5>パラメータ</h5>${paramsHTML}<h5>リクエスト</h5>${reqHTML}<h5>レスポンス</h5>${resHTML}</div>`;
}
function dsEpHTML(e, i, k, schemas) {
  const key = `${i}:${k}`, open = ds.ep === key, m = DS_METHODS.has(e.method) ? e.method : 'GET';
  const detailHTML = open ? dsEndpointHTML(e, schemas) : '';
  return `<li><button type="button" class="ds-ep" data-ep="${esc(key)}" data-fk="ds-ep-${esc(key)}" aria-expanded="${open ? 'true' : 'false'}"><span class="http http-${esc(m)}">${esc(e.method)}</span><code>${esc(e.path)}</code><span class="desc">${esc(e.summary || e.operationId || '')}</span></button>${detailHTML}</li>`;
}
function dsApiHTML(doc) {
  const docsHTML = doc.api.map((d, i) => {
    const epsHTML = d.endpoints.map((e, k) => dsEpHTML(e, i, k, d.schemas)).join('');
    const verHTML = d.version ? `<span class="chip">v${esc(d.version)}</span>` : '';
    const descHTML = d.description ? `<p class="ds-desc">${esc(d.description)}</p>` : '';
    return `<section class="ds-doc"><header><h3>${esc(d.title)}</h3>${verHTML}<code>${esc(d.file)}</code></header>${descHTML}<ul class="ds-eps">${epsHTML}</ul></section>`;
  });
  return docsHTML.join('');
}
function dsTableHTML(t) {
  const descHTML = t.description ? `<p class="ds-desc">${esc(t.description)}</p>` : '';
  if (Array.isArray(t.enum)) {
    const valsHTML = t.enum.map((v) => `<code>${esc(v)}</code>`).join(' ');
    return `<div class="ds-tbl"><h4>${esc(t.name)} <span class="chip">enum</span></h4>${descHTML}<p>${valsHTML}</p></div>`;
  }
  const rowsHTML = t.columns.map((c) => {
    const keysHTML = c.keys.map((x) => `<span class="ds-key">${esc(x)}</span>`).join(' ') || '-';
    const consHTML = c.constraints.map((x) => esc(x)).join('<br>') || '-';
    const notesHTML = c.notes.map((x) => esc(x)).join('<br>') || '-';
    return `<tr><td><code>${esc(c.name)}</code></td><td><code>${esc(c.type)}</code></td><td>${esc(c.description)}</td><td><code>${esc(c.default)}</code></td><td>${keysHTML}</td><td>${consHTML}</td><td>${notesHTML}</td></tr>`;
  }).join('');
  return `<div class="ds-tbl"><h4>${esc(t.name)}</h4><code class="ds-file">${esc(t.file || '')}</code>${descHTML}<table class="ds-table"><thead><tr><th>列</th><th>型</th><th>説明</th><th>既定</th><th>キー</th><th>制約</th><th>メモ</th></tr></thead><tbody>${rowsHTML}</tbody></table></div>`;
}
function dsDbHTML(doc) {
  const dbsHTML = doc.db.map((d, k) => {
    const erdHTML = d.erd ? `<div class="flow-mmd ds-erd" data-erd="${k}" role="img" aria-label="${esc(d.name)} の ER 図"></div>` : '';
    const tablesHTML = d.tables.map((t) => dsTableHTML(t)).join('');
    return `<section class="ds-doc"><header><h3>${esc(d.name)}</h3><span class="chip">${Number(d.tables.length)} 件</span></header>${erdHTML}${tablesHTML}</section>`;
  });
  return dbsHTML.join('');
}
function renderDataDocs() {
  if (!ds.open) return;
  const doc = ds.doc;
  const tabs = doc ? [['api', 'API 仕様書', doc.api.length], ['db', 'DB 仕様書', doc.db.length]].filter((t) => t[2] > 0) : [];
  const tabsHTML = tabs.map(([k, label, n]) => `<button type="button" role="tab" class="ds-tab" data-ds-tab="${esc(k)}" data-fk="ds-tab-${esc(k)}" aria-selected="${ds.tab === k ? 'true' : 'false'}">${esc(label)}<b>${Number(n)}</b></button>`).join('');
  setHTML(dsTabs, tabsHTML);
  const bodyHTML = ds.loading ? '<p class="ds-none">読み込み中…</p>'
    : ds.error ? `<p class="ds-none">${esc(ds.error)}</p>`
    : !tabs.length ? '<p class="ds-none">この部屋の docs/api・docs/db に仕様書が見つかりません</p>'
    : ds.tab === 'db' ? dsDbHTML(doc) : dsApiHTML(doc);
  const skippedHTML = doc && doc.skipped ? `<p class="ds-none">大きさの上限で ${Number(doc.skipped)} 件を読んでいません</p>` : '';
  const sheetHTML = `${bodyHTML}${skippedHTML}`;
  setHTML(dsBody, sheetHTML);
  if (doc && ds.tab === 'db') dsBody.querySelectorAll('[data-erd]').forEach((el) => { const d = doc.db[Number(el.dataset.erd)]; if (d && d.erd) drawMermaid(el, d.erd); });
}
// ---- web/js/54-bills.js ----
/* ---------- the bill over a robot (2.3.6, ticket 2026-10-19-jui-viz-cost-bill-over-robot) ----------
   Each response's estimated cost (USD), over the robot that made it, with a banknote: the server prices it (prices.py:
   the four kinds of tokens × the model's row) and puts it in the "bills" slice once per message id; a subagent's go over
   its own robot. A bill rises a little and goes after BILL.showMs; responses that come while one shows are added to it
   (one amount per robot, never a pile). A model with no price shows ? and the tokens, never an amount. The bill takes
   its place above the name tag in placeRobotTags (40-scene.js), as part of the tag's box, so it never covers a tag.
   設定 › お札 turns it off (kept per browser, readPref); reduced motion: shown and gone, no rise. The 単価 sheet lists
   the table in use and changes the user's table (POST /api/prices); a model with no price is told in the top bar. */
const BILL = { showMs: 4200, rise: 12, gap: 3, on: readPref('bills', 'on') !== 'off', seen: new Map(), primed: false,
  notice: 'お札の金額は概算です（公式の単価 × 応答のトークン数）。サブスクリプションでの利用では、実際の請求とは一致しません。' };
const BILL_ICON_HTML = '<svg class="bill-ico" viewBox="0 0 22 14" aria-hidden="true"><rect x="0.75" y="0.75" width="20.5" height="12.5" rx="2" /><circle cx="11" cy="7" r="3" /><path d="M3.5 4v6M18.5 4v6" /></svg>';
function billMoney(usd) {
  if (usd < 0.01) return '< $0.01';
  return usd < 100 ? `≈ $${usd.toFixed(2)}` : `≈ $${Math.round(usd).toLocaleString('en-US')}`;
}
function billTokens(n) { return n < 1000 ? `${n}` : n < 1e6 ? `${(n / 1000).toFixed(1)}k` : `${(n / 1e6).toFixed(2)}M`; }
/* The text of a robot's bill from the responses it holds: their priced sum, "+ ?" when some had no price. */
function billText(items) {
  let usd = 0, priced = 0, tokens = 0;
  for (const it of items.values()) {
    tokens += it.tokens;
    if (typeof it.usd === 'number') { usd += it.usd; priced += 1; }
  }
  if (!priced) return { text: `? ${billTokens(tokens)} tok`, unknown: true };
  return { text: priced < items.size ? `${billMoney(usd)} + ?` : billMoney(usd), unknown: false };
}
function billEl(R) {
  if (R.bill) return R.bill;
  const el = document.createElement('div');
  el.className = 'bill';
  el.dataset.robot = R.def.id;   // a click on the bill selects the robot, as on its tag (40-scene.js, tagPress)
  el.hidden = true;
  el.innerHTML = `<span class="bill-in">${BILL_ICON_HTML}<b></b></span>`;
  tagsEl.append(el);
  R.bill = el;
  return el;
}
/* One response over robot `label` (the page's label): added to the bill showing, or a new one. */
function billShow(label, item) {
  if (!BILL.on || !has3D) return;
  const R = robots.find((x) => x.def.id === label);
  if (!R) return;
  const now = performance.now(), el = billEl(R);
  if (!R.billItems || now >= R.billUntil) R.billItems = new Map();
  R.billItems.set(item.id, { usd: item.usd, tokens: item.tokens, model: item.model, from: item.from });
  R.billUntil = now + BILL.showMs;
  const { text, unknown } = billText(R.billItems);
  el.querySelector('b').textContent = text;
  el.classList.toggle('unknown', unknown);
  const models = [...new Set([...R.billItems.values()].map((x) => x.model))].join(', ');
  const from = [...new Set([...R.billItems.values()].filter((x) => typeof x.usd === 'number').map((x) => (x.from === 'user' ? 'あなたの表' : '既定')))].join('・');
  el.title = `${R.billItems.size} 回の応答 · ${models}${from ? ` · 単価: ${from}` : ''}${unknown ? ' · 単価の無いモデル（設定 › 単価の表で足せます）' : ''}\n${BILL.notice}`;
  el.classList.toggle('own-price', [...R.billItems.values()].some((x) => x.from === 'user' && typeof x.usd === 'number'));
  if (el.hidden) el.style.visibility = 'hidden';   // placeRobotTags shows it where it belongs, from the next frame
  el.hidden = false;
  el.dataset.n = String(R.billItems.size);
  const inner = el.firstElementChild;
  inner.classList.remove('rise');
  if (!reduceMotion) { void inner.offsetWidth; inner.classList.add('rise'); }   // start the rise again from the bottom
}
function billHide(R) {
  if (!R.bill || R.bill.hidden) return;
  R.bill.hidden = true;
  R.billItems = null;
  R.billSize = null;
}
/* Every frame (placeRobotTags): bills past their time go. */
function billsExpire() {
  const now = performance.now();
  for (const R of robots) if (R.bill && !R.bill.hidden && now >= R.billUntil) billHide(R);
}
/* Live: the slice's new bills. The bills already there when the page opens are old: seen, not shown. A bill whose
   amount changed (the same message written again with more tokens) replaces its own line in the robot's sum. */
function billsFromSlice() {
  const list = Array.isArray(LIVE.slices.bills) ? LIVE.slices.bills : [];
  if (list === BILL.list) return;   // a slice is replaced whole when it changes
  BILL.list = list;
  for (const b of list) {
    if (!b || typeof b.id !== 'string') continue;
    const key = `${b.agentId}|${b.id}`, sig = `${b.usd}|${b.tokens}`;
    if (BILL.seen.get(key) === sig) continue;
    BILL.seen.set(key, sig);
    if (!BILL.primed) continue;
    const label = labelOf(b.agentId);
    if (label) billShow(label, { id: key, usd: typeof b.usd === 'number' ? b.usd : null, tokens: Number(b.tokens) || 0, model: String(b.model || ''), from: b.priceFrom === 'user' ? 'user' : 'default' });
  }
  BILL.primed = true;
  if (BILL.seen.size > 600) for (const k of [...BILL.seen.keys()].slice(0, 300)) BILL.seen.delete(k);
}
/* Demo: now and then a working robot's response costs a little (made up: the demo has no transcripts). */
const BILL_DEMO = { next: 0, n: 0, seed: 7 };
function billsDemo(ms) {
  if (SOURCE.mode !== 'demo' || ms < BILL_DEMO.next) return;
  BILL_DEMO.seed = (BILL_DEMO.seed * 16807) % 2147483647;
  const r = (BILL_DEMO.seed % 1000) / 1000;
  BILL_DEMO.next = ms + 2500 + r * 3500;
  const busy = robots.filter((R) => R.robot.root.visible && !['idle', 'sleep'].includes(R.robot.state));
  if (!busy.length) return;
  const R = busy[Math.floor(r * busy.length) % busy.length];
  BILL_DEMO.n += 1;
  billShow(R.def.id, { id: `demo-${BILL_DEMO.n}`, usd: r < 0.12 ? null : 0.004 + r * r * 0.11, tokens: Math.round(20000 + r * 60000), model: r < 0.12 ? 'claude-unknown' : 'claude-opus-5-5' });
}

/* 設定 › お札: on by default; off hides what shows. */
function billPaint() {
  const b = document.getElementById('bill-switch');
  if (b) b.setAttribute('aria-checked', BILL.on ? 'true' : 'false');
  const n = document.getElementById('bill-note');
  if (n) setText(n, BILL.on ? 'オン — 応答ごとの概算の金額をロボットの頭上に出します' : 'オフ — 出しません');
}
{ const b = document.getElementById('bill-switch');
  if (b) b.addEventListener('click', () => {
    BILL.on = !BILL.on;
    writePref('bills', BILL.on ? 'on' : 'off');
    if (!BILL.on) for (const R of robots) billHide(R);
    billPaint();
  });
  billPaint(); }

/* ---------- the 単価 sheet: the table in use, and the user's own (live only) ---------- */
const prEl = $('pr'), prBody = $('pr-body');
const pr = { open: false, edit: null, msg: '', busy: false, opener: null, sig: '' };
const PR_KINDS = [['input', '入力'], ['cache_write_5m', 'キャッシュ書込（5 分）'], ['cache_write_1h', 'キャッシュ書込（1 時間）'], ['cache_read', 'キャッシュ読込'], ['output', '出力']];
const PR_ORIGIN = { default: '既定', user: '追加', changed: '変更', removed: '削除' };
function pricesSlice() { const p = LIVE.slices && LIVE.slices.prices; return p && !Array.isArray(p) && typeof p === 'object' ? p : null; }
function openPrices(opener, model) {
  if (SOURCE.mode !== 'live') return;
  holdView('pr');   // 50-panel.js VIEW_HOLD: held before the card it replaces lets go
  if (wb.open) closeWhiteboard();
  if (tb.open) closeTaskBoard();
  if (rbState.id) closeRobot();
  if (ds.open) closeDataDocs();
  const p = pricesSlice(), row = p && (p.rows || []).find((r) => r.model === model);
  Object.assign(pr, { open: true, msg: '', opener: opener || null, sig: '',
    edit: model ? { model, values: row && row.origin !== 'removed' ? Object.fromEntries(PR_KINDS.map(([k]) => [k, row[k]])) : {}, isNew: !row } : null });
  showOverlay(prEl);
  liveSoloSync();
  renderPrices(true);
  const first = model ? prBody.querySelector('[data-pr-in="input"]') : $('pr-close');
  if (first) first.focus({ preventScroll: true });
}
function closePrices() {
  if (!pr.open) { releaseView('pr'); return; }
  pr.open = false; pr.edit = null;
  hideOverlay(prEl);
  releaseView('pr');
  liveSoloSync();
  if (pr.opener && pr.opener.focus) pr.opener.focus({ preventScroll: true });
}
function renderPrices(force) {
  if (!pr.open) return;
  const p = pricesSlice();
  const sig = JSON.stringify([p, pr.edit, pr.msg, pr.busy]);
  if (!force && sig === pr.sig) return;
  // a form being typed into is not drawn again under the cursor: only the list and the notes change
  if (!force && prBody.contains(document.activeElement) && document.activeElement.matches('input')) return;
  pr.sig = sig;
  if (!p) { prBody.innerHTML = '<p class="ds-none">単価の表がまだ届いていません。</p>'; return; }
  const num = (v) => (typeof v === 'number' ? String(v) : '—');
  const unpricedHTML = (p.unpriced || []).map((m) => `<li><code>${esc(m)}</code> <button type="button" class="mini-btn" data-pr-add="${esc(m)}">単価を足す</button></li>`).join('');
  const errorsHTML = (p.errors || []).map((e) => `<li>${esc(e)}</li>`).join('');
  const rowsHTML = (p.rows || []).map((r) => {
    const removed = r.origin === 'removed', mine = r.origin !== 'default';
    const extra = [r.long ? `プロンプト ${Number(r.long.over).toLocaleString('en-US')} 超は別の単価` : '', r.fast ? 'fast あり' : '', r.us ? `us ×${r.us}` : ''].filter(Boolean).join(' · ');
    return `<tr data-pr-row="${esc(r.model)}"${removed ? ' class="removed"' : ''}><th scope="row"><code>${esc(r.model)}</code>${extra ? `<span class="pr-extra">${esc(extra)}</span>` : ''}</th>`
      + PR_KINDS.map(([k]) => `<td>${removed ? '' : esc(num(r[k]))}</td>`).join('')
      + `<td><span class="pr-origin" data-origin="${esc(r.origin)}">${esc(PR_ORIGIN[r.origin] || r.origin)}</span></td><td class="pr-acts">`
      + (removed ? '' : `<button type="button" class="mini-btn" data-pr-edit="${esc(r.model)}">変更</button><button type="button" class="mini-btn" data-pr-op="remove" data-pr-model="${esc(r.model)}">削除</button>`)
      + (mine && r.origin !== 'user' ? `<button type="button" class="mini-btn" data-pr-op="reset" data-pr-model="${esc(r.model)}">既定に戻す</button>` : '')
      + '</td></tr>';
  }).join('');
  const e = pr.edit;
  const formHTML = e ? `<form class="pr-form" id="pr-form"><h3>${e.isNew ? '単価を足す' : '単価を変える'}</h3>
      <label class="pr-model">モデル（記録の message.model のとおり）<input data-pr-in="model" value="${esc(e.model || '')}" ${e.isNew ? '' : 'readonly'} required maxlength="100" autocomplete="off" spellcheck="false"></label>
      <div class="pr-nums">${PR_KINDS.map(([k, ja]) => `<label>${esc(ja)}<input data-pr-in="${esc(k)}" type="number" min="0" max="100000" step="any" required value="${esc(e.values[k] === undefined ? '' : String(e.values[k]))}"></label>`).join('')}</div>
      <p class="set-hint">USD / 100 万トークン。公式の価格のページの値を写してください。</p>
      <div class="pr-btns"><button type="submit" class="mini-btn pr-save"${pr.busy ? ' disabled' : ''}>保存</button><button type="button" class="mini-btn" data-pr-cancel>やめる</button></div></form>`
    : '<p><button type="button" class="mini-btn" data-pr-add="">単価を足す</button></p>';
  const aboutHTML = `<p class="pr-about">${esc(BILL.notice)} 既定の単価の出典: <code>${esc(p.source || '')}</code>（${esc(p.checked || '')} に確認）。変更はあなたの表 <code>${esc(p.userPath || '')}</code> に書き、次の応答から効きます（<code>jui viz prices</code> でも変えられます）。</p>`;
  const msgHTML = pr.msg ? `<p class="pr-msg" role="status">${esc(pr.msg)}</p>` : '';
  const headHTML = PR_KINDS.map(([, ja]) => `<th>${esc(ja)}</th>`).join('');
  prBody.innerHTML = `${aboutHTML}${msgHTML}`
    + (unpricedHTML ? `<section class="pr-unpriced"><h3>単価の無いモデル（金額は出していません）</h3><ul>${unpricedHTML}</ul></section>` : '')
    + (errorsHTML ? `<section class="pr-errors"><h3>使っていない行（その行だけ）</h3><ul>${errorsHTML}</ul></section>` : '')
    + `${formHTML}<table class="ds-table pr-table"><thead><tr><th>モデル</th>${headHTML}<th>出どころ</th><th></th></tr></thead><tbody>${rowsHTML}</tbody></table>`;
}
async function pricesSend(op, model, row) {
  pr.busy = true; renderPrices(true);
  const got = typeof SOURCE.pricesOp === 'function' ? await SOURCE.pricesOp(op, model, row) : { ok: false, error: 'ライブ表示だけで変えられます' };
  pr.busy = false;
  pr.msg = got.ok ? `${model}: ${{ set: '保存しました', remove: '削除しました', reset: '既定に戻しました' }[op]}（次の応答から）` : `できませんでした: ${got.error || '不明'}`;
  if (got.ok && op === 'set') pr.edit = null;
  renderPrices(true);
}
$('pr-close').addEventListener('click', closePrices);
prBody.addEventListener('click', (ev) => {
  const t = ev.target;
  const add = t.closest('[data-pr-add]'), edit = t.closest('[data-pr-edit]'), op = t.closest('[data-pr-op]');
  if (add) { pr.edit = { model: add.dataset.prAdd, values: {}, isNew: true }; pr.msg = ''; renderPrices(true); const f = prBody.querySelector(add.dataset.prAdd ? '[data-pr-in="input"]' : '[data-pr-in="model"]'); if (f) f.focus(); return; }
  if (edit) {
    const row = ((pricesSlice() || {}).rows || []).find((r) => r.model === edit.dataset.prEdit);
    pr.edit = { model: edit.dataset.prEdit, values: row ? Object.fromEntries(PR_KINDS.map(([k]) => [k, row[k]])) : {}, isNew: false };
    pr.msg = ''; renderPrices(true);
    const f = prBody.querySelector('[data-pr-in="input"]'); if (f) f.focus();
    return;
  }
  if (op) { pricesSend(op.dataset.prOp, op.dataset.prModel, null); return; }
  if (t.closest('[data-pr-cancel]')) { pr.edit = null; renderPrices(true); }
});
prBody.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const val = (k) => (prBody.querySelector(`[data-pr-in="${k}"]`) || {}).value;
  const model = String(val('model') || '').trim();
  const row = Object.fromEntries(PR_KINDS.map(([k]) => [k, Number(val(k))]));
  pricesSend('set', model, row);
});
/* The top bar: models seen with no price — the amount is not shown for them; the chip opens the sheet to add one. */
function pricesNotice() {
  const chip = $('chip-price');
  if (!chip) return;
  const p = SOURCE.mode === 'live' ? pricesSlice() : null, list = (p && p.unpriced) || [];
  chip.hidden = !list.length;
  setText(chip, `単価の無いモデル ${list.length}`);
  chip.title = `${list.join(', ')} — 金額を出していません。押すと単価を足せます`;
}
$('chip-price').addEventListener('click', (e) => { const p = pricesSlice(); openPrices(e.currentTarget, p && p.unpriced && p.unpriced[0]); });
{ const b = document.getElementById('prices-open'); if (b) b.addEventListener('click', (e) => openPrices(e.currentTarget)); }
/* Each frame from the main loop: the live bills (when the slice changed), the demo's. */
function billsFrame(ms) {
  if (SOURCE.mode === 'live') billsFromSlice();
  else billsDemo(ms);
}
/* With the panels (4 a second): the chip, and the sheet when the table changed. */
function pricesPanel() {
  pricesNotice();
  renderPrices(false);
}
// ---- web/js/55-history.js ----
/* ---------- 応答の履歴: the robot card's second tab (requester, 10-18) ----------
   "ロボットに合わせた時に会話履歴みたいな感じで" / "応答の履歴タブをこのメニューに作って、それ選択したらメニュー全体が
   会話の履歴見れるようになる感じがいいな". The server reads the last turns of that robot's transcript only when this tab
   asks (sources/history.py), and again every HIST_POLL_MS while it stays open.

   Everything here is built with DOM nodes: a transcript holds any text at all (files read, pages fetched, HTML), so
   every character of it goes in through textContent, never through innerHTML, and this part has no HTML template.
   The answers are Markdown, drawn by a small subset: headings, lists, quotes, rules, tables, fenced and inline code
   (never converted inside), bold, italics, links — an href only when the URL, its character references decoded,
   is http: or https: — and images as a mark (nothing is fetched). */
const HIST_POLL_MS = 3000;
/* atEnd / top: where the reader is in the pane, kept here because the pane itself is not kept — renderRobot rebuilds the
   whole card (keyed) whenever its key changes, and the new pane starts at scrollTop 0 (measured 10-19: every new turn of
   a working session sent the reader to the top). newer: answers came while the reader was above (the 新しい応答 marker). */
const HIST = { tab: 'now', id: null, data: null, error: '', timer: 0, busy: false, node: null, sig: '',
  atEnd: true, top: 0, newer: false, marker: null, compose: null, sent: null, wide: false, imgs: new Map(), box: null,
  attach: [] };

function hNode(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = String(text);
  return n;
}

/* A link's target as the browser would read it: character references decoded, then whitespace and controls out. */
function histDecodeRefs(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);?/gi, (m, ref) => {
    const r = ref.toLowerCase();
    if (r[0] === '#') {
      const code = r[1] === 'x' ? parseInt(r.slice(2), 16) : parseInt(r.slice(1), 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", colon: ':', tab: '\t', newline: '\n' }[r] ?? m;
  });
}
function histSafeHref(raw) {
  const url = histDecodeRefs(raw).replace(/[\u0000- \u007f-\u009f]/g, '');
  return /^https?:/i.test(url) ? url : null;
}

/* Inline Markdown into parent: code spans first (their text is left as it is), then images, links, bold, italics. */
const HIST_INLINE = /(\x60+)([\s\S]+?)\1|!\[([^\]\n]*)\]\(([^)\s]*)\)|\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n](?:[\s\S]*?[^*\n])?)\*\*|\*([^*\s\n](?:[^*\n]*?[^*\s\n])?)\*/g;
function histInline(parent, text) {
  let last = 0;
  const re = new RegExp(HIST_INLINE.source, 'g');   // its own: the calls below for a link's text or bold recurse
  const src = String(text);
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m.index > last) parent.appendChild(document.createTextNode(src.slice(last, m.index)));
    if (m[1]) parent.appendChild(hNode('code', '', m[2]));
    else if (m[4] !== undefined && m[0][0] === '!') parent.appendChild(hNode('span', 'h-img', `画像: ${m[3] || '（説明なし）'}`));
    else if (m[5] !== undefined) {
      const href = histSafeHref(m[6]);
      if (href) {
        const a = hNode('a');
        a.setAttribute('href', href);
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
        histInline(a, m[5]);
        parent.appendChild(a);
      } else parent.appendChild(document.createTextNode(m[0]));   // not http(s): the text as written
    } else if (m[7] !== undefined) { const b = hNode('strong'); histInline(b, m[7]); parent.appendChild(b); }
    else if (m[8] !== undefined) { const i = hNode('em'); histInline(i, m[8]); parent.appendChild(i); }
    last = re.lastIndex;
  }
  if (last < src.length) parent.appendChild(document.createTextNode(src.slice(last)));
}

const histCells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
/* Block Markdown into a new element. */
function histMarkdown(text) {
  const root = hNode('div', 'h-md');
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  let i = 0, para = null, list = null;
  const flush = () => { para = null; list = null; };
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^\s*(\x60{3,}|~{3,})\s*([\w+-]*)\s*$/);
    if (fence) {                                       // a code block: kept as it is, up to its closing fence
      flush();
      const body = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith(fence[1])) { body.push(lines[i]); i += 1; }
      i += 1;
      const pre = hNode('pre', 'h-code');
      pre.appendChild(hNode('code', '', body.join('\n')));
      root.appendChild(pre);
      continue;
    }
    if (!line.trim()) { flush(); i += 1; continue; }
    const h = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
    if (h) { flush(); const n = hNode(`h${Math.min(6, h[1].length + 3)}`, 'h-h'); histInline(n, h[2].replace(/\s+#+\s*$/, '')); root.appendChild(n); i += 1; continue; }
    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); root.appendChild(hNode('hr')); i += 1; continue; }
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      flush();
      const table = hNode('table', 'h-table'), head = hNode('tr');
      for (const c of histCells(line)) { const th = hNode('th'); histInline(th, c); head.appendChild(th); }
      const thead = hNode('thead'); thead.appendChild(head); table.appendChild(thead);
      const tbody = hNode('tbody');
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        const tr = hNode('tr');
        for (const c of histCells(lines[i])) { const td = hNode('td'); histInline(td, c); tr.appendChild(td); }
        tbody.appendChild(tr);
        i += 1;
      }
      table.appendChild(tbody);
      const wrap = hNode('div', 'h-tablewrap'); wrap.appendChild(table); root.appendChild(wrap);
      continue;
    }
    const q = line.match(/^\s{0,3}>\s?(.*)$/);
    if (q) {
      flush();
      const body = [q[1]];
      i += 1;
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) { body.push(lines[i].replace(/^\s{0,3}>\s?/, '')); i += 1; }
      const bq = hNode('blockquote', 'h-quote');
      bq.appendChild(histMarkdown(body.join('\n')));
      root.appendChild(bq);
      continue;
    }
    const li = line.match(/^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/);
    if (li) {
      const ordered = /\d/.test(li[2]);
      if (!list || list.ordered !== ordered) {
        para = null;
        list = { ordered, el: hNode(ordered ? 'ol' : 'ul', 'h-list') };
        root.appendChild(list.el);
      }
      const item = hNode('li');
      if (li[1].length >= 2) item.className = 'h-sub';
      histInline(item, li[3]);
      list.el.appendChild(item);
      i += 1;
      continue;
    }
    list = null;
    if (!para) { para = hNode('p'); root.appendChild(para); } else para.appendChild(hNode('br'));
    histInline(para, line);
    i += 1;
  }
  return root;
}

/* ---------- the items ---------- */
const HIST_TIME = (at) => (Number.isFinite(at) ? new Date(at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '');
function histCutNote(item) { return item.cut ? hNode('p', 'h-cut', '（長いので途中まで）') : null; }
/* A fold (a message from another session, the harness's text, a tool's IN / OUT): the summary opens and closes it,
   and once open a click anywhere in its body closes it too (requester, 10-20: 「開くと閉じづらい」), then the row's
   head is scrolled back into view if it went above. A click does not close it when it selects text (a drag, a
   double-click: the selection is not empty, the pointer moved, or a second click came within HIST_DBL_MS), or when
   it lands on something with its own action (HIST_FOLD_KEEP: a link, a button, a field, a picture, the whole-text
   tag, a table that scrolls sideways, and the scroll bar of a long code line).
   Keyboard: Enter / Space on the summary, as before — focus stays on the summary after it opens, so the body gets no
   key and no extra tab stop of its own. */
const HIST_FOLD_KEEP = 'a[href], button, input, textarea, select, label, img, video, [contenteditable], .h-thumb, .fulltext';
const HIST_DRAG_PX = 4, HIST_DBL_MS = 280;
const histScrollsX = (el) => el.scrollWidth > el.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(el).overflowX);
function histFoldKeeps(target, d, y) {
  if (!(target instanceof Element) || target.closest('summary') || target.closest(HIST_FOLD_KEEP)) return true;
  const table = target.closest('.h-tablewrap');
  if (table && histScrollsX(table)) return true;
  for (let el = target; el && el !== d; el = el.parentElement) {   // on the scroll bar under a sideways-scrolling box
    if (histScrollsX(el) && y > el.getBoundingClientRect().top + el.clientTop + el.clientHeight) return true;
  }
  const sel = window.getSelection ? window.getSelection() : null;
  return !!(sel && !sel.isCollapsed && String(sel).trim() && d.contains(sel.anchorNode));
}
function histFolded(cls, title, body, open) {
  const d = hNode('details', cls);
  if (open) d.open = true;
  const s = hNode('summary');
  for (const part of title) s.appendChild(part);
  d.appendChild(s);
  for (const b of body) if (b) d.appendChild(b);
  let down = null, pending = 0;
  d.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  d.addEventListener('click', (e) => {
    const moved = down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > HIST_DRAG_PX;
    down = null;
    clearTimeout(pending);
    if (!d.open || moved || e.detail > 1 || histFoldKeeps(e.target, d, e.clientY)) return;
    // a double-click selects a word: wait out its second click before closing (and look at the selection again then)
    const target = e.target, y = e.clientY;
    pending = setTimeout(() => {
      if (!d.open || histFoldKeeps(target, d, y)) return;
      d.open = false;
      const pane = d.closest('[data-rb-hist]'), top = s.getBoundingClientRect().top;
      if (pane && top < pane.getBoundingClientRect().top) s.scrollIntoView({ block: 'nearest' });
    }, HIST_DBL_MS);
  });
  return d;
}
/* The other end of a SendMessage, or the sender of a received message (2.3.6, requester 10-20: 「閉じた状態でも誰宛か
   わかるようにして、その宛先クリックでそのロボットの表示に切り替え」). The server links it to a session here
   (World._history_peers: an agents-list name, `name [ref]`, a uds socket or the pid in it); a session with a robot on
   this page is a button that switches the card to that robot (the same way as ← →: the camera follows, the tab
   stays). Anything else is plain text, not focusable, with a title that says it is not here. */
function histPeerName(text, session) {
  const label = session && typeof labelOf === 'function' ? labelOf(session) : null;
  if (label && robots.some((R) => R.def.id === label)) {
    const b = hNode('button', 'h-peerlink', text);
    b.type = 'button'; b.dataset.hGo = label;
    b.title = `${label} のロボットに切り替える`;
    return b;
  }
  const s = hNode('span', 'h-peername', text);
  s.title = 'この viz にいないセッション';
  return s;
}
function histItem(item) {
  const at = hNode('time', 'h-at', HIST_TIME(item.at));
  if (item.kind === 'user') {
    const n = hNode('div', 'h-item h-user');
    const head = hNode('p', 'h-who', '依頼者'); head.appendChild(at); n.appendChild(head);
    n.appendChild(hNode('p', 'h-plain', item.text));
    const cut = histCutNote(item); if (cut) n.appendChild(cut);
    for (const path of Array.isArray(item.gone) ? item.gone : []) n.appendChild(hNode('p', 'h-gone', `元の画像ファイルは消えている: ${path}`));
    return n;
  }
  if (item.kind === 'assistant') {
    const n = hNode('div', 'h-item h-asst');
    n.appendChild(histMarkdown(item.text));
    const cut = histCutNote(item); if (cut) n.appendChild(cut);
    return n;
  }
  if (item.kind === 'channel') {   // a prompt that came through a channel (from this page, for jui-viz)
    const n = hNode('div', 'h-item h-user h-channel');
    const head = hNode('p', 'h-who', /(^|:)jui-viz$/.test(String(item.server || '')) ? 'ページから（jui-viz の channel）' : `channel ${item.server || ''}`);
    head.appendChild(at); n.appendChild(head);
    const lines = String(item.text).split('\n'), files = lines.filter((l) => HIST_ATTACH_LINE.test(l));
    const rest = lines.filter((l) => !HIST_ATTACH_LINE.test(l)).join('\n');
    if (rest.trim()) n.appendChild(hNode('p', 'h-plain', rest));
    if (files.length) n.appendChild(histAttachMarks(files));
    const cut = histCutNote(item); if (cut) n.appendChild(cut);
    return n;
  }
  if (item.kind === 'peer') {
    const who = hNode('b', 'h-from'); who.append(histPeerName(item.from, item.fromSession), ' から');
    return histFolded('h-item h-peer', [who, hNode('span', 'h-head', String(item.text).split('\n').find((l) => l.trim()) || ''), at],
      [hNode('p', 'h-plain', item.text), histCutNote(item)], false);
  }
  if (item.kind === 'harness') {
    return histFolded('h-item h-harness', [hNode('b', '', item.label), hNode('span', 'h-head', 'ハーネスが入れた文'), at],
      [hNode('p', 'h-plain', item.text), histCutNote(item)], false);
  }
  if (item.kind === 'tool') {
    const first = String(item.in || '').split('\n')[0];
    const title = [hNode('b', 'h-tname', item.name), hNode('span', 'h-head', item.description || first)];
    if (item.name === 'SendMessage' && typeof item.to === 'string') {   // who it went to and what about, folded too
      const to = hNode('span', 'h-to'); to.append('→ ', histPeerName(item.to, item.toSession));
      title.splice(1, 1, to, hNode('span', 'h-head', item.summary || first));
    }
    if (item.error) title.push(hNode('span', 'h-err', 'エラー'));
    if (item.out === undefined) title.push(hNode('span', 'h-run', '結果待ち'));
    // The time the tool was called (its tool_use record's), at the right end after the marks (2.3.7, requester 10-20:
    // 「このBashとかのタイトルの右端にその時の時刻表示できる？」); the description narrows first (.h-head), never the time.
    title.push(at);
    const io = hNode('div', 'h-io');
    io.appendChild(hNode('span', 'h-io-k', 'IN'));
    io.appendChild(hNode('pre', 'h-code', `${item.in || ''}${item.inCut ? '\n…' : ''}`));
    if (item.out !== undefined) {
      io.appendChild(hNode('span', 'h-io-k', 'OUT'));
      io.appendChild(hNode('pre', `h-code${item.error ? ' h-code-err' : ''}`, `${item.out}${item.outCut ? '\n…' : ''}`));
      if (Array.isArray(item.imgs) && item.imgs.length) { const row = hNode('div', 'h-imgs'); for (const ref of item.imgs) row.appendChild(histThumb(ref)); io.appendChild(row); }
    }
    return histFolded('h-item h-tool', title, [io], false);
  }
  if (item.kind === 'thought') return hNode('p', 'h-item h-mark', '考えた');
  if (item.kind === 'image') {
    if (!item.img) return hNode('p', 'h-item h-mark', '画像 1 枚（表示できない形式）');
    const row = hNode('div', 'h-item h-imgs');
    row.appendChild(histThumb(item.img));
    return row;
  }
  return null;
}
function histBuild(data) {
  const box = hNode('div', 'h-list-box');
  const items = Array.isArray(data.items) ? data.items : [];
  if (data.more) box.appendChild(hNode('p', 'h-note', `直近 ${items.filter((x) => x.kind !== 'thought' && x.kind !== 'image').length} 件（それより前は表示しない）`));
  let prev = null;
  const seen = new Map();
  for (const item of items) {
    if (item.kind === 'thought' && prev === 'thought') continue;   // one mark for a run of thinking
    if (item.kind === 'image' && item.img && prev === 'image' && box.lastChild && box.lastChild.classList.contains('h-imgs')) {
      box.lastChild.appendChild(histThumb(item.img));               // pictures side by side
      continue;
    }
    const n = histItem(item);
    if (n) {
      // Which item this is, so the place read above survives a rebuild of the list (the oldest items leave the window).
      const base = `${item.kind}|${item.at}|${String(item.text ?? item.in ?? item.name ?? '').slice(0, 200)}`;
      seen.set(base, (seen.get(base) || 0) + 1);
      n._hk = `${base}|${seen.get(base)}`;
      box.appendChild(n);
    }
    prev = item.kind;
  }
  if (!items.length) box.appendChild(hNode('p', 'h-note', 'まだ応答がない'));
  return box;
}

/* ---------- the tab ---------- */
function histPane() { return rbEl.querySelector('[data-rb-hist]'); }
const HIST_END_PX = 24;
function histMarker() {
  if (!HIST.marker) {
    const b = hNode('button', 'h-newer', '新しい応答 ↓');
    b.type = 'button';
    b.dataset.hNewer = '';
    b.dataset.fk = 'rb-hist-newer';
    b.addEventListener('click', () => { const pane = histPane(); if (pane) histToEnd(pane); });
    HIST.marker = b;
  }
  HIST.marker.hidden = !HIST.newer;
  return HIST.marker;
}
function histToEnd(pane) {
  HIST.atEnd = true; HIST.newer = false;
  pane.scrollTop = pane.scrollHeight;
  HIST.top = pane.scrollTop;
  histMarker();
}
/* The reader's place, on every scroll of the pane (a user's or ours). */
function histRemember(pane) {
  if (pane.hidden || !pane.contains(HIST.node)) return;
  HIST.top = pane.scrollTop;
  HIST.atEnd = pane.scrollHeight - pane.scrollTop - pane.clientHeight < HIST_END_PX;
  if (HIST.atEnd && HIST.newer) { HIST.newer = false; histMarker(); }
}
/* The place kept in HIST, put back on a pane that was just given the list (a rebuilt card, the tab opened). */
function histRestore(pane) {
  if (HIST.atEnd) histToEnd(pane);
  else pane.scrollTop = HIST.top;
}
function histShow() {
  const pane = histPane();
  if (!pane) return;
  if (!pane._histBound) { pane._histBound = true; pane.addEventListener('scroll', () => histRemember(pane), { passive: true }); }
  if (HIST.error && !HIST.data) { pane.replaceChildren(hNode('p', 'h-note', HIST.error)); return; }
  if (!HIST.node) { pane.replaceChildren(hNode('p', 'h-note', '読み込み中…')); return; }
  if (pane.firstChild !== HIST.node) { pane.replaceChildren(HIST.node, histMarker()); histRestore(pane); }
}
/* The first item at the top of the pane and how far below the top it starts. */
function histAnchor(pane) {
  if (!HIST.node || !pane.contains(HIST.node)) return null;
  const top = pane.getBoundingClientRect().top;
  for (const n of HIST.node.children) {
    if (n._hk && n.getBoundingClientRect().bottom > top + 1) return { key: n._hk, y: n.getBoundingClientRect().top - top };
  }
  return null;
}
async function histFetch() {
  const id = HIST.id;
  if (!id || HIST.busy || HIST.tab !== 'history') return;
  HIST.busy = true;
  const got = await SOURCE.history(id);
  HIST.busy = false;
  if (HIST.id !== id || HIST.tab !== 'history') return;
  if (!got.ok) { HIST.error = got.error === 'demo' ? 'デモでは応答の履歴を表示しない' : '応答の履歴を読めない（このロボットの記録が見つからない）'; histShow(); return; }
  HIST.error = '';
  const sig = JSON.stringify(got.data.items);
  if (sig === HIST.sig && HIST.node) return;           // nothing new: the open folds and the scroll stay
  const pane = histPane();
  const shown = pane && !pane.hidden && HIST.node && pane.contains(HIST.node);
  const anchor = shown && !HIST.atEnd ? histAnchor(pane) : null;
  const had = !!HIST.data;
  HIST.sig = sig; HIST.data = got.data; HIST.node = histBuild(got.data);
  composeArrived(got.data.items);
  if (had && !HIST.atEnd) HIST.newer = true;          // the reader is above: leave the place, show the marker
  histShow();                                          // at the end: histRestore sends the pane to the newest
  if (anchor && pane && pane.contains(HIST.node)) {   // the same item at the same place, though the oldest left
    const top = pane.getBoundingClientRect().top;
    const same = [...HIST.node.children].find((n) => n._hk === anchor.key);
    if (same) pane.scrollTop += same.getBoundingClientRect().top - top - anchor.y;
    HIST.top = pane.scrollTop;
  }
}
function histStop() { clearInterval(HIST.timer); HIST.timer = 0; }
/* After every renderRobot: which tab shows, and the polling that keeps an open history fresh. */
function histSync() {
  const id = rbEl.hidden ? null : rbState.id;
  if (id !== HIST.id) { HIST.id = id; HIST.data = null; HIST.node = null; HIST.sig = ''; HIST.error = ''; HIST.atEnd = true; HIST.newer = false; histStop(); histImgsDrop(); }
  const tabs = rbEl.querySelectorAll('[data-rb-tab]');
  tabs.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.rbTab === HIST.tab)));
  const body = rbEl.querySelector('.rb-body:not([data-rb-hist])'), pane = histPane();
  if (body) body.hidden = HIST.tab !== 'now';
  if (pane) pane.hidden = HIST.tab !== 'history';
  composePlace(pane, id);
  histWideSync(id);
  if (!id || HIST.tab !== 'history') { histStop(); return; }
  histShow();
  if (!HIST.timer) { histFetch(); HIST.timer = setInterval(() => { if (document.visibilityState === 'visible') { histFetch(); composePaint(); } }, HIST_POLL_MS); }
}
rbEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-rb-tab]');
  if (!b) return;
  const opening = b.dataset.rbTab === 'history' && HIST.tab !== 'history';
  HIST.tab = b.dataset.rbTab === 'history' ? 'history' : 'now';
  if (opening) {   // the tab opened: the newest shows (the bottom), the old place is not kept
    HIST.atEnd = true; HIST.newer = false;
    const pane = histPane();
    if (pane && HIST.node && pane.contains(HIST.node)) pane.replaceChildren();   // histShow puts it back and restores
  }
  histSync();
});

/* ---------- a prompt to the session of this robot (requester, 10-19) ----------
   "プロンプトをロボットの会話の履歴から打てないと不便だから打てるようにしよう" — and "別端末からは送れなくていいよ": the server takes it
   only from this page at http://127.0.0.1:<port> (server.prompt_checks). Here: the box under the history; Enter is a new
   line, the 送信 button or Ctrl/⌘+Enter opens a confirmation naming the robot and the session, and only its 送る sends.
   After that 「送信済み」 until the prompt shows in the history. The box is built once and moved into each rebuilt card,
   so what is typed survives a rebuild. A session without the relay, or with a jui-viz plugin older than 1.2.0 (its
   channel cannot deliver), gets the box disabled and the reason. */
const PROMPT_MAX_BYTES = 8192;   // server.PROMPT_MAX_BODY: the JSON body, not only the text
const composeBytes = (label, text) => new TextEncoder().encode(JSON.stringify({ sessionId: SESSION_UUID[label] || '', text,
  attachments: HIST.attach.map((a) => a.id || '0000000000000000') })).length;
/* Files attached to the prompt (ticket 2026-10-20 prompt-attach): the 添付… button, a drop on the box, or an image pasted
   into the text (Ctrl/⌘+V). Each goes to the server at once (SOURCE.attachFile, POST /api/attach); the prompt names their
   ids and the server adds a line with each file's path, which the receiver opens with Read (its own permission check:
   the permission board shows it). Limits as the server's (attachments.py). */
const ATTACH_MAX = 10, ATTACH_FILE_MAX = 20 * 1024 * 1024;
const attachReady = () => HIST.attach.filter((a) => a.id);
const attachBusy = () => HIST.attach.some((a) => a.up);
const attachSize = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`);
const RELAY_HOW_TEXT = RELAY_HOW.replace(/<[^>]+>/g, '');   // the same how-to as on a permission card, as plain text
const composeNorm = (t) => String(t || '').split(/\s+/).join(' ').trim();
/* the server's line for one attached file (ingest.attachment_line): 添付: <path>（<name>、<media>、<size>） */
const HIST_ATTACH_LINE = /^添付: (\/\S*?\/uploads\/([A-Za-z0-9_-]+)\/([0-9a-f]{16})\.([a-z]+))（(.*)、([^、]*)、([^、]*)）$/;
/* The files of a prompt sent from this page, as marks. An image's mark is a thumbnail button like a history picture's
   (histThumb): the server reads it from the kept file (SOURCE.attachImage, POST /api/attach-image by session and id),
   and a press — or Enter / Space — opens it in the same large view (ticket 2026-10-20-jui-viz-attachment-thumb-opens-
   large; requester: 「サムネタップで拡大をこのメッセージにもつけてほしい。」). A file that is gone says so and shows no
   picture. Any other file is a mark only: nothing opens. */
function histAttachMarks(lines) {
  const ul = hNode('ul', 'h-attach h-attach-sent');
  for (const line of lines) {
    const m = HIST_ATTACH_LINE.exec(line), li = hNode('li', 'h-attach-item');
    li.title = m[1];
    if (/^image\/(png|jpeg|gif|webp)$/.test(m[6])) li.appendChild(histThumb({ attach: { sessionId: m[2], id: m[3], ext: m[4] } }));
    li.appendChild(hNode('span', 'h-attach-name', `📎 ${m[5]}`));
    li.appendChild(hNode('span', 'h-attach-meta', m[7]));
    ul.appendChild(li);
  }
  return ul;
}
/* Whether the CLI hands the channel's text to the session (sources/launch.py, 2.3.4): it does only for a session started
   naming the channel. The server's sessions slice says which case (launch); the words here are the same as the server's. */
const PROMPT_START = 'claude --dangerously-load-development-channels plugin:jui-viz@jsonui';
const PROMPT_START_CHANNELS = 'claude --channels plugin:jui-viz@jsonui';
const LAUNCH_WHY = {
  dev: [true, ''],
  channels: [true, '--channels で起動したセッション。managed settings の allowedChannelPlugins に jui-viz が載っていなければ届かない'],
  'no-flag': [false, '起動に channel の指定が無いので届かない'],
  other: [false, '起動の channel の指定に jui-viz が無いので届かない'],
  form: [false, '起動の指定の形が、この channel のつながり方と合わない（プラグインなら plugin:jui-viz@jsonui、jui viz relay install なら server:jui-viz）'],
  'server-channels': [false, 'server: の指定は --channels では効かない'],
  vscode: [false, 'VS Code 拡張のセッションは起動の指定を足せないので届かない'],
  desktop: [false, 'デスクトップアプリのセッションは起動の指定を足せないので届かない'],
  unreadable: [false, 'このセッションのプロセスの起動の引数を読めないので、届くか確かめられない'],
};
/* 送信中 until the receiver's own transcript shows the prompt (届いた); 届いていない when it has not, NOT_ARRIVED_MS after
   sending and with the session quiet (not busy) for QUIET_MS — a busy session takes it at the end of its turn. */
const PROMPT_WAIT = { notArrivedMs: 60000, quietMs: 30000 };
function composeTarget(id) {
  if (!id || !DEF[id]) return { why: '' };
  const sess = SESSIONS.find((x) => x.id === SESSION_OF[id]);
  const name = sess ? `${sess.id} のメインセッション（${DEF[sess.id].agent} · ${sess.room}）` : '';
  if (SOURCE.mode !== 'live') return { why: 'デモでは送れない' };
  if (DEF[id].kind === 'sub') return { why: `サブエージェントには送れない。${SESSION_OF[id]} のメインセッションのカードから送る` };
  if (location.hostname !== '127.0.0.1') return { why: `このページは http://127.0.0.1:${location.port}/ で開いたときだけ送れる（jui viz open）` };
  if (!sess || sess.status === 'ended') return { why: 'このセッションは終わっている' };
  if (!sess.relay) return { why: 'このセッションは中継（jui-viz の channel）につながっていないので送れない。' + RELAY_HOW_TEXT };
  if (!sess.prompt) return { why: 'このセッションの jui-viz プラグインが古いので送れない（1.2.0 から送れる）。/plugin で jui-viz を更新して、セッションを起動し直す' };
  const L = LAUNCH_WHY[sess.launch] || LAUNCH_WHY.unreadable;
  if (!L[0]) {
    return { why: `${L[1]}。届くのは、ターミナルで ${PROMPT_START}（起動のたびに確認が出る）か、managed settings の allowedChannelPlugins に jui-viz を載せて ${PROMPT_START_CHANNELS}（警告なし）と起動したセッションだけ。組織のアカウントは channelsEnabled も要る` };
  }
  return { why: '', name, note: L[1] };
}
/* The note above the box for a session that can take a prompt (LAUNCH_WHY's note: --channels) has a × (requester 10-20:
   "この注意書きの部分邪魔だから消せるようにしといて xボタンで消せて、消したら他でも表示されない"). Pressed: gone on every card and,
   kept in this browser (readPref / writePref, both try/catch), after a reload; 設定 › 「カードの説明をまた出す」 brings it
   back. A blocked storage still hides it for this page view. Only the note: the reason a box is disabled always shows. */
const CARD_NOTE_PREF = 'cardNote';
let cardNoteOff = readPref(CARD_NOTE_PREF, 'on') === 'off';
function cardNoteSet(off) {
  cardNoteOff = !!off;
  writePref(CARD_NOTE_PREF, cardNoteOff ? 'off' : 'on');
  composePaint();
  cardNotePaint();
}
function cardNotePaint() {
  const b = document.getElementById('card-note-back'), n = document.getElementById('card-note-state');
  if (b) b.disabled = !cardNoteOff;
  if (n) setText(n, cardNoteOff ? '消してある — ロボットのカードのプロンプト欄の上の説明（--channels のセッション）を出していません' : '出している');
}
{ const b = document.getElementById('card-note-back');
  if (b) b.addEventListener('click', () => cardNoteSet(false));
  cardNotePaint(); }
function composeBuild() {
  const box = hNode('div', 'h-compose');
  box.dataset.hCompose = '';
  const head = hNode('div', 'h-compose-head'); head.dataset.hHead = '';
  const why = hNode('p', 'h-compose-why'); why.dataset.hWhy = '';
  const noteX = hNode('button', 'h-note-x', '×'); noteX.type = 'button'; noteX.dataset.hNoteX = '';
  noteX.setAttribute('aria-label', 'この説明を消す（ほかのカードでも出さない。設定 › カードの説明をまた出す で戻る）'); noteX.title = 'この説明を消す';
  noteX.addEventListener('click', () => cardNoteSet(true));
  head.append(why, noteX);
  const area = hNode('textarea', 'h-compose-text');
  area.rows = 3;
  area.dataset.hText = '';
  area.dataset.fk = 'rb-prompt';
  area.setAttribute('aria-label', 'このセッションへのプロンプト');
  area.placeholder = 'このセッションへのプロンプト（Enter は改行。送信は ボタン か Ctrl/⌘+Enter）';
  const row = hNode('div', 'h-compose-row');
  const state = hNode('span', 'h-compose-state'); state.dataset.hState = ''; state.setAttribute('aria-live', 'polite');
  const send = hNode('button', 'wb-btn h-compose-send', '送信…'); send.type = 'button'; send.dataset.hSend = ''; send.dataset.fk = 'rb-prompt-send';
  const pick = hNode('button', 'wb-btn h-attach-pick', '添付…'); pick.type = 'button'; pick.dataset.hPick = ''; pick.dataset.fk = 'rb-prompt-attach';
  pick.title = 'ファイルを添付（欄へのドロップ、画像の貼り付けでも添付できる）';
  const input = hNode('input', ''); input.type = 'file'; input.multiple = true; input.hidden = true; input.dataset.hFile = '';
  const list = hNode('ul', 'h-attach'); list.dataset.hAttach = ''; list.setAttribute('aria-label', '添付');
  row.append(state, pick, send, input);
  const confirm = hNode('div', 'h-confirm'); confirm.dataset.hConfirm = ''; confirm.hidden = true;
  confirm.setAttribute('role', 'group'); confirm.setAttribute('aria-label', '送信の確認');
  const to = hNode('p', 'h-confirm-to'); to.dataset.hTo = '';
  const preview = hNode('p', 'h-confirm-text'); preview.dataset.hPreview = '';
  const acts = hNode('div', 'h-confirm-acts');
  const go = hNode('button', 'wb-btn h-confirm-go', 'このセッションへ送る'); go.type = 'button'; go.dataset.hGo = '';
  const back = hNode('button', 'wb-btn', 'やめる'); back.type = 'button'; back.dataset.hBack = '';
  acts.append(go, back);
  confirm.append(to, preview, acts);
  box.append(head, area, list, row, confirm);
  area.addEventListener('input', () => composePaint());
  pick.addEventListener('click', () => input.click());
  input.addEventListener('change', () => { attachAdd([...input.files]); input.value = ''; });
  box.addEventListener('dragover', (e) => {
    if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { e.preventDefault(); box.classList.add('h-drop'); }
  });
  box.addEventListener('dragleave', (e) => { if (!box.contains(e.relatedTarget)) box.classList.remove('h-drop'); });
  box.addEventListener('drop', (e) => {
    box.classList.remove('h-drop');
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;
    e.preventDefault(); attachAdd([...e.dataTransfer.files]);
  });
  area.addEventListener('paste', (e) => {   // an image copied to the clipboard; text pastes as usual
    const cd = e.clipboardData;
    const files = cd ? [...cd.items].filter((it) => it.kind === 'file').map((it) => it.getAsFile()).filter(Boolean) : [];
    if (!files.length) return;
    if (!cd.types.includes('text/plain')) e.preventDefault();
    attachAdd(files);
  });
  area.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.isComposing) { e.preventDefault(); composeAsk(); }
  });
  send.addEventListener('click', () => composeAsk());
  back.addEventListener('click', () => composeClose(true));
  go.addEventListener('click', () => { if (Date.now() - (box._askedAt || 0) > 350) composeSend(); });   // not the same key press that opened it
  return box;
}
function composeEls() {
  const b = HIST.compose;
  const q = (k) => b.querySelector(`[data-${k}]`);
  return { box: b, head: q('h-head'), why: q('h-why'), noteX: q('h-note-x'), area: q('h-text'), state: q('h-state'), send: q('h-send'), confirm: q('h-confirm'), to: q('h-to'), preview: q('h-preview'), go: q('h-go'),
    pick: q('h-pick'), list: q('h-attach') };
}
function attachAdd(files) {
  const id = HIST.compose && HIST.compose._for;
  if (!id || composeTarget(id).why) return;
  for (const file of files) {
    if (HIST.attach.length >= ATTACH_MAX) { showToast(`添付は 1 回に ${ATTACH_MAX} 個まで`); break; }
    const a = { key: Math.random().toString(36).slice(2), name: file.name || (file.type.startsWith('image/') ? '貼り付けた画像' : '添付'),
      size: file.size, media: file.type || '', up: true, error: '', id: '',
      thumb: /^image\/(png|jpeg|gif|webp)$/.test(file.type) ? URL.createObjectURL(file) : '' };
    HIST.attach.push(a);
    if (file.size === 0) { a.up = false; a.error = '空のファイル'; continue; }
    if (file.size > ATTACH_FILE_MAX) { a.up = false; a.error = `大きすぎる（1 個 ${attachSize(ATTACH_FILE_MAX)} まで）`; continue; }
    SOURCE.attachFile(id, file).then((got) => {
      a.up = false;
      if (!HIST.attach.includes(a)) { if (got.ok) SOURCE.attachRemove(id, got.id); return; }   // × pressed while it went up
      if (got.ok) { a.id = got.id; a.name = got.name; a.size = got.size; a.media = got.media; }
      else a.error = got.status === 413 ? '大きすぎる' : got.error || `HTTP ${got.status}`;
      composePaint();
    });
  }
  composePaint();
}
function attachRemove(a) {
  HIST.attach = HIST.attach.filter((x) => x !== a);
  if (a.id) SOURCE.attachRemove(HIST.compose._for, a.id);
  if (a.thumb) URL.revokeObjectURL(a.thumb);
  composePaint();
}
function attachDropAll(label) {
  for (const a of HIST.attach) { if (a.id && label) SOURCE.attachRemove(label, a.id); if (a.thumb) URL.revokeObjectURL(a.thumb); }
  HIST.attach = [];
}
/* A sent image's thumbnail stays (by its server id) for the history's own line of it; the oldest go first. */
function attachKeepThumb(a) {   // sent: the history's mark reads the kept file from the server (histAttachMarks)
  if (a.thumb) URL.revokeObjectURL(a.thumb);
}
function attachPaint(E) {
  const sig = HIST.attach.map((a) => `${a.key}:${a.id}:${a.up}:${a.error}`).join('|');
  E.list.hidden = !HIST.attach.length;
  if (E.list._sig === sig) return;
  E.list._sig = sig;
  E.list.replaceChildren(...HIST.attach.map((a) => {
    const li = hNode('li', 'h-attach-item' + (a.error ? ' h-attach-err' : a.up ? ' h-attach-up' : ''));
    li.dataset.hAttachItem = a.id || '';
    if (a.thumb) { const img = hNode('img', 'h-attach-thumb'); img.src = a.thumb; img.alt = ''; li.appendChild(img); }
    li.appendChild(hNode('span', 'h-attach-name', a.name));
    li.appendChild(hNode('span', 'h-attach-meta', a.error ? a.error : a.up ? '送っている…' : attachSize(a.size)));
    const x = hNode('button', 'h-attach-x', '×'); x.type = 'button'; x.setAttribute('aria-label', `${a.name} を外す`);
    x.addEventListener('click', () => attachRemove(a));
    li.appendChild(x);
    return li;
  }));
}
/* After every histSync: the box under the history pane of the card shown, and its state. */
function composePlace(pane, id) {
  if (!HIST.compose) HIST.compose = composeBuild();
  const { box } = composeEls();
  if (HIST.compose._for !== id) {   // another robot: nothing typed for the last one goes to this one
    attachDropAll(HIST.compose._for);
    HIST.compose._for = id;
    composeEls().area.value = '';
    composeClose(false);
  }
  if (pane && box.previousElementSibling !== pane) pane.after(box);
  box.hidden = !pane || HIST.tab !== 'history';
  // The card was rebuilt (50-panel.js, keyed) while the box had the focus, and the box is put back only now: refocus.
  const lost = rbEl._lostFk;
  const again = lost !== undefined && !box.hidden ? box.querySelector('[data-fk="' + CSS.escape(lost) + '"]') : null;
  if (again) { rbEl._lostFk = undefined; again.focus({ preventScroll: true }); }   // not found here: the talk pane may hold it (58-talk.js)
  composePaint();
}
function composePaint() {
  if (!HIST.compose) return;
  const E = composeEls(), id = HIST.compose._for, t = composeTarget(id);
  const asking = !E.confirm.hidden;
  const note = !t.why && t.note && !cardNoteOff ? t.note : '';   // the reason (t.why) is never dismissed
  E.why.textContent = t.why || note;
  E.why.hidden = !(t.why || note);
  E.why.classList.toggle('h-compose-note', !!note);
  E.noteX.hidden = !note;
  E.head.hidden = E.why.hidden;
  E.area.disabled = !!t.why;
  E.area.readOnly = asking;
  const text = E.area.value, files = attachReady().length, bytes = text.trim() || files ? composeBytes(id, text) : 0;
  E.send.disabled = !!t.why || (!text.trim() && !files) || attachBusy() || bytes > PROMPT_MAX_BYTES || asking;
  E.pick.disabled = !!t.why || asking || HIST.attach.length >= ATTACH_MAX;
  attachPaint(E);
  const sent = HIST.sent && HIST.sent.id === id ? HIST.sent : null;
  const phase = sent && !sent.error ? composePhase(sent) : '';
  E.state.textContent = bytes > PROMPT_MAX_BYTES ? `長すぎる（${bytes.toLocaleString('ja-JP')} / ${PROMPT_MAX_BYTES.toLocaleString('ja-JP')} バイト）`
    : sent && sent.error ? `送れなかった（${sent.error}）`
    : phase === 'arrived' ? `届いた ${HIST_TIME(sent.arrivedAt)}（受け手の記録に出た）`
    : phase === 'missing' ? `届いていない（${HIST_TIME(sent.at)} に送ったが、受け手の記録に出ない。候補: 起動の指定が無い・組織の channelsEnabled が無い・セッションが閉じた）`
    : sent ? `送信中 ${HIST_TIME(sent.at)}（受け手の記録に出るのを待っている。まだ届いたとは言えない）` : '';
  E.state.dataset.hPhase = bytes > PROMPT_MAX_BYTES ? 'long' : sent && sent.error ? 'error' : phase;
  E.state.classList.toggle('h-compose-err', bytes > PROMPT_MAX_BYTES || !!(sent && sent.error) || phase === 'missing');
  if (asking && t.why) composeClose(false);   // the session lost its relay while the confirmation was open
}
/* sending / arrived / missing for a prompt sent (and taken by the server). */
function composePhase(sent) {
  if (sent.arrivedAt) return 'arrived';
  const now = Date.now(), sess = SESSIONS.find((x) => x.id === SESSION_OF[sent.id]);
  if (sess && sess.status === 'busy') sent.quietSince = 0;
  else if (!sent.quietSince) sent.quietSince = now;
  return now - sent.at > PROMPT_WAIT.notArrivedMs && sent.quietSince && now - sent.quietSince > PROMPT_WAIT.quietMs ? 'missing' : 'sending';
}
function composeAsk() {
  const E = composeEls(), id = HIST.compose._for, t = composeTarget(id), text = E.area.value, files = attachReady();
  if (t.why || (!text.trim() && !files.length) || attachBusy() || composeBytes(id, text) > PROMPT_MAX_BYTES || !E.confirm.hidden) return;
  E.to.textContent = `送り先: ${t.name}`;
  const listed = files.map((a) => `添付: ${a.name}（${attachSize(a.size)}）`).join('\n');
  const shown = text.length > 400 ? `${text.slice(0, 400)}…` : text;
  E.preview.textContent = [shown, listed].filter(Boolean).join('\n');
  E.confirm.hidden = false;
  E.box._askedAt = Date.now();
  composePaint();
  E.go.focus({ preventScroll: true });
}
function composeClose(focusBack) {
  const E = composeEls();
  E.confirm.hidden = true;
  composePaint();
  if (focusBack) E.area.focus({ preventScroll: true });
}
async function composeSend() {
  const E = composeEls(), id = HIST.compose._for, text = E.area.value, files = attachReady();
  if (composeTarget(id).why || (!text.trim() && !files.length)) return;
  E.go.disabled = true;
  const got = await SOURCE.sendPrompt(id, text, files.map((a) => a.id));
  E.go.disabled = false;
  composeClose(!got.ok);
  if (got.ok) {
    HIST.sent = { id, text, at: Date.now() }; E.area.value = '';
    for (const a of HIST.attach) attachKeepThumb(a);
    HIST.attach = [];
  } else HIST.sent = { id, text, at: Date.now(), error: got.error || `HTTP ${got.status}` };
  composePaint();
}
/* The prompt sent shows in the receiver's transcript as a channel item of jui-viz (sources/history.py: the CLI's own
   record, origin.kind "channel", measured 10-19 on a real receiver started with --channels plugin:jui-viz@jsonui),
   its text the text sent: 届いた. Our own POST proves only that it was sent; the same words typed by hand do not count. */
function composeArrived(items) {
  const sent = HIST.sent;
  if (!sent || sent.error || sent.arrivedAt || sent.id !== HIST.id || !Array.isArray(items)) return;
  const want = composeNorm(sent.text).slice(0, 120) || '添付:';   // only files: the server's first line
  const fresh = (x) => !(Number(x.at) < sent.at - 60000);   // an older item with the same words is not this one
  const ours = (x) => x.kind === 'channel' && /(^|:)jui-viz$/.test(String(x.server || ''));
  if (items.some((x) => ours(x) && fresh(x) && composeNorm(x.text).startsWith(want))) { sent.arrivedAt = Date.now(); composePaint(); }
}

/* ---------- pictures (2.3.4, requester 10-19: "画像ファイルが履歴にある場合はサムネイル表示とクリックで拡大表示") ----------
   An image item names a picture by its place (sources/history.py); the bytes are asked for one picture at a time
   (SOURCE.historyImage, POST /api/history-image under the prompt's checks) when its thumbnail comes into view, and
   kept as a blob URL only while this robot's tab is open. The browser scales the thumbnail. A press opens it large
   in a dialog: ← → for the others in this history, Esc / the backdrop / 閉じる close it and give the focus back. */
const histRefKey = (ref) => (ref.attach ? `a:${ref.attach.sessionId}:${ref.attach.id}` : `${ref.off}:${ref.n}`);   // a history picture, or an attached image
const histImgKey = (ref) => `${HIST.id}|${histRefKey(ref)}`;
function histImgsDrop() {
  for (const v of HIST.imgs.values()) v.then((g) => { if (g.url) URL.revokeObjectURL(g.url); });
  HIST.imgs.clear();
}
function histImgGet(ref) {
  const key = histImgKey(ref);
  if (!HIST.imgs.has(key)) {
    const id = HIST.id;
    const asked = ref.attach ? SOURCE.attachImage(ref.attach) : SOURCE.historyImage(id, ref);
    HIST.imgs.set(key, asked.then((got) => (got.ok ? { url: URL.createObjectURL(got.blob) }
      : { error: got.gone ? '消えました' : got.status === 413 ? '大きすぎて表示しない' : got.status === 415 ? '表示できない形式' : `画像を読めない（${got.status || got.error}）` })));
  }
  return HIST.imgs.get(key);
}
const histSeen = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { histSeen.unobserve(e.target); histThumbLoad(e.target); }
}, { rootMargin: '200px' }) : null;
function histThumbLoad(btn) {
  if (btn._loading) return;
  btn._loading = true;
  histImgGet(btn._ref).then((g) => {
    const img = btn.querySelector('img');
    if (g.url) {
      img.addEventListener('load', () => { const pane = histPane(); if (HIST.atEnd && pane && pane.contains(btn)) histToEnd(pane); }, { once: true });
      img.src = g.url; btn.classList.remove('h-thumb-wait');
    }
    else { btn.classList.add('h-thumb-bad'); btn.querySelector('.h-thumb-note').textContent = g.error; }
  });
}
function histThumb(ref) {
  const b = hNode('button', 'h-thumb h-thumb-wait');
  b.type = 'button';
  b._ref = ref;
  b.dataset.hImg = histRefKey(ref);
  b.setAttribute('aria-label', '画像を大きく表示');
  const img = hNode('img');
  img.alt = '履歴の画像';
  img.decoding = 'async';
  b.append(img, hNode('span', 'h-thumb-note', ''));
  b.addEventListener('click', () => histLightOpen(b));
  if (histSeen) histSeen.observe(b); else histThumbLoad(b);
  return b;
}
const LIGHT = { el: null, list: [], k: 0, opener: null, onKey: null };
function histLightShow() {
  const ref = LIGHT.list[LIGHT.k], img = LIGHT.el.querySelector('img'), note = LIGHT.el.querySelector('.h-light-note');
  LIGHT.el.querySelector('.h-light-count').textContent = `${LIGHT.k + 1} / ${LIGHT.list.length}`;
  LIGHT.el.querySelectorAll('[data-h-light-step]').forEach((b) => { b.disabled = LIGHT.list.length < 2; });
  img.removeAttribute('src'); note.textContent = '読み込み中…';
  const want = LIGHT.k;
  histImgGet(ref).then((g) => {
    if (!LIGHT.el || LIGHT.k !== want) return;
    if (g.url) { img.src = g.url; note.textContent = ''; } else note.textContent = g.error;
  });
}
function histLightOpen(btn) {
  histLightClose(false);
  const all = HIST.node ? [...HIST.node.querySelectorAll('.h-thumb')] : [btn];
  LIGHT.list = all.map((b) => b._ref);
  LIGHT.k = Math.max(0, all.indexOf(btn));
  LIGHT.opener = btn.dataset.hImg;
  const el = hNode('div', 'h-light');
  const box = hNode('div', 'h-light-box');
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'h-light-title'); box.tabIndex = -1;
  const head = hNode('div', 'h-light-head');
  const title = hNode('h3', '', '履歴の画像'); title.id = 'h-light-title';
  const prev = hNode('button', 'wb-btn', '‹ 前'); prev.type = 'button'; prev.dataset.hLightStep = '-1'; prev.setAttribute('aria-label', '前の画像（←）');
  const next = hNode('button', 'wb-btn', '次 ›'); next.type = 'button'; next.dataset.hLightStep = '1'; next.setAttribute('aria-label', '次の画像（→）');
  const close = hNode('button', 'wb-btn', '閉じる'); close.type = 'button'; close.dataset.hLightClose = '';
  head.append(title, hNode('span', 'h-light-count', ''), prev, next, close);
  const img = hNode('img'); img.alt = '履歴の画像（拡大）';
  box.append(head, img, hNode('p', 'h-light-note', ''));
  el.appendChild(box);
  document.body.appendChild(el);
  LIGHT.el = el;
  const step = (d) => { LIGHT.k = (LIGHT.k + d + LIGHT.list.length) % LIGHT.list.length; histLightShow(); };
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('[data-h-light-close]')) { histLightClose(true); return; }
    const s = e.target.closest('[data-h-light-step]');
    if (s) step(Number(s.dataset.hLightStep));
  });
  LIGHT.onKey = (e) => {   // first (capture): these keys belong to the dialog, not to the card or the board under it
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); histLightClose(true); return; }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); e.stopPropagation(); if (LIGHT.list.length > 1) step(e.key === 'ArrowRight' ? 1 : -1); return; }
    if (e.key !== 'Tab') return;
    const list = [...box.querySelectorAll('button:not(:disabled)')], first = list[0], last = list[list.length - 1];
    if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', LIGHT.onKey, true);
  histLightShow();
  close.focus();
}
function histLightClose(back) {
  if (!LIGHT.el) return;
  LIGHT.el.remove(); LIGHT.el = null;
  document.removeEventListener('keydown', LIGHT.onKey, true);
  if (!back) return;
  // the thumbnail that opened it (the list may have been rebuilt meanwhile: the same picture's new button)
  const again = HIST.node && [...HIST.node.querySelectorAll('.h-thumb')].find((b) => b.dataset.hImg === LIGHT.opener);
  if (again) again.focus({ preventScroll: true });
}

/* ---------- the wide history (2.3.4, requester 10-19: "チャットが狭いから見づらい 左にロボット一人分くらいの余裕を残して残りを
   チャットの表示にしてほしい"; "チャット広げた時はカメラの位置移動もしてね 選んでるボットが左の余白の部分に来るように") ----------
   広げる on the card's head (both tabs since 2.3.7, requester 10-20: "今の様子タブでも広げられるようにして、応答の履歴と共有で単純に
   タブ切り替えても広さが保持されればいい" — one state, HIST.wide with its kept histWidePref, for 今の様子 and 応答の履歴): the card covers everything right of histWideMargin(), the side
   panel too, and the camera flies (focusPose, 50-panel.js) so the robot stands in the middle of that margin; ← → keep
   it there for the next robot. 元の幅に戻す / Esc: the card's width and the view before. 900 px or narrower: the whole
   screen. The choice is kept in localStorage (readPref / writePref: a blocked storage only forgets it). */
const HIST_WIDE_PREF = 'hist-wide';
let histWidePref = readPref(HIST_WIDE_PREF, 'off') === 'on';   // read once: a blocked storage still keeps it for this page
function histWideMargin() {
  if (!HIST.wide) return 0;
  const w = window.innerWidth;
  return w <= 900 ? 0 : Math.round(Math.min(440, Math.max(320, w * 0.28)));
}
function histWideFly() {
  if (!has3D || !zoom.zoomed || !rbState.id || !robots.some((x) => x.def.id === rbState.id)) return;
  const pose = robotPose(rbState.id);
  flyTo(pose.p, pose.t, viewTarget, reduceMotion ? 0 : 0.6, null);
}
function histSetWide(on, remember = true) {
  on = !!on && !!rbState.id;
  if (remember) { histWidePref = on; writePref(HIST_WIDE_PREF, on ? 'on' : 'off'); }
  if (HIST.wide === on) { histWidePaint(); return; }
  HIST.wide = on;
  histWidePaint();
  histWideFly();
  const pane = histPane();
  if (pane && HIST.tab === 'history' && HIST.atEnd) histToEnd(pane);   // the newest stays in view across the change of width
}
function histWidePaint() {
  const m = histWideMargin();
  rbEl.classList.toggle('rb-wide', HIST.wide);
  rbEl.classList.toggle('rb-wide-full', HIST.wide && !m);
  rbEl.style.setProperty('--wide-left', `${m}px`);
  const b = rbEl.querySelector('[data-rb-wide]');
  if (b) {
    b.hidden = false;
    b.setAttribute('aria-pressed', String(HIST.wide));
    b.textContent = HIST.wide ? '元の幅に戻す' : '広げる';
    b.title = HIST.wide ? '元の幅に戻す（Esc）' : 'カードを画面いっぱいに広げる（今の様子・応答の履歴で同じ）';
  }
}
/* After every histSync: the card decides whether it is wide (the kept choice, the same for both tabs). */
function histWideSync(id) {
  const want = !!id && histWidePref;
  if (want !== HIST.wide) histSetWide(want, false);
  else histWidePaint();
}
rbEl.addEventListener('click', (e) => { if (e.target.closest('[data-rb-wide]')) histSetWide(!HIST.wide); });
window.addEventListener('resize', () => { if (HIST.wide) { histWidePaint(); histWideFly(); } });


/* A linked name: switch the card to that robot. Inside a summary: the fold does not toggle. */
document.addEventListener('click', (e) => {
  const b = e.target instanceof Element ? e.target.closest('[data-rb-hist] [data-h-go]') : null;
  if (!b) return;
  e.preventDefault();
  e.stopPropagation();
  goRobot(b.dataset.hGo);
});
// ---- web/js/56-server-room.js ----
/* ---------- the server room (ticket 2026-10-20-jui-viz-server-room, part B) ----------
   Requester 10-20: 「各リポジトリの部屋にサーバールームの扉を置く そこクリックで全体をサーバールームの3Dページに遷移させる。（3Dモデル以外の
   表示は全て消せるもの（ボード、ログだけにする） そこにはインフラの構成のモデルが表示され、ビジュアルで構成がわかる」; 「かなり大きい構成でも
   使えるようにズームの引き出来るようにしてね あと複数プロバイダを跨げるようにもして欲しい」; 「読み込みに時間かかりそうならサーバールーム
   クリックしたタイミングで処理走らせてアニメーションは壁についてるパネルにパスワード打ち込んでるように」; 「吹き出しでサーバー構成を読み込んで
   いますを出す」; 「サーバールームのjsonにエラーがあって読めない場合はパスワード入力失敗のアニメーションとエラーの吹き出し出して」.

   The door (40-scene.js) → srEnter: the model is read then and never before (SOURCE.infraDocs: the room's id and this
   press's seq; the boundary's §5.2 reply). While it reads the keypad fills with * (none moving under reduced motion)
   and a bubble says サーバー構成を読み込んでいます (reduced motion too). Read: 解錠 in green, the door swings, the server
   room opens — at once when it took under SR.fastMs. Not read ({ok: false}: broken JSON, the schema, a secret-shaped
   value, too big, no files…): the keypad turns red, the * go, it shakes, the bubble gives the boundary's short line
   (the file and what is wrong — never a value) and, on hover, the whole text; the room stays. Esc while it reads drops
   the press: a reply that comes later, for that seq, changes nothing.

   The server room: the whole page under one view (the 3D, a board and a log — each shown or hidden), back by its
   button or Esc. The model as the boundary gives it (groups with their parents, nodes in a group, edges between
   nodes), one environment at a time (an item with no environments is in all of them), the folded ones (fold: IAM,
   policies, alarms) out until asked for, the external ones on a strip in front of the room.
   - layout: every group a floor holding its child groups and its nodes, packed in rows (sizes bottom-up, places top-
     down), so 2,000 nodes still fit one view; a node is a cell.
   - shapes: one InstancedMesh per shape (category → shape, srShape), the colour the provider's; one InstancedMesh for
     all the floors; the cables two LineSegments (within a provider: solid; across providers: dashed magenta, higher).
   - far (a node smaller than SR.lod.far px on the page): the top groups are boxes, the cables bundled between them
     (one line per pair, its count in the board), the labels the boxes' only; near again past SR.lod.near px.
   - labels: a pool of SR.labels.max on the page, given each tenth of a second to the nearest things in view.
   - icons: where the room's settings give one (service → provider → category), its image on a plane above the node,
     read from the room by the server (SOURCE.infraIcon); otherwise the neutral shape.
   Measured for the ticket: the first draw, the frame time far and near, the memory (SR.stats). */
const SR = {
  phase: 'idle', project: null, seq: 0, t0: 0, until: 0, why: '', full: '', opener: null, model: null, view: null, log: [],
  fastMs: 300, starMs: 140, okMs: 700, failMs: 9000,
  lod: { far: 9, near: 13 }, labels: { max: 110, nodes: 80 }, stats: null,
  closed: new Set(), selected: null, selectedGroup: null, zoomStep: 1.4,
  // fewer lines (2.3.10, requester 10-20: 「線減らす工夫欲しいね」): all cables faint, the pressed and the pointed node's
  // drawn strong on a layer of their own; a switch for all (faint) / crossing ones only / the chosen node's only
  lines: 'all', hover: null, plainOpacity: 0.18, crossOpacity: 0.55,
  only: new Set(),   // the clouds chosen on the board's legend (2.3.10 item 3; empty: all)
};
const srEl = $('sr'), srBubbleEl = $('sr-bubble');
function srNow() { return performance.now(); }
function srCovers() { return SR.phase === 'open'; }   // 40-scene.js: the room's 3D is not drawn under the server room
function srLog(text) {
  SR.log.unshift({ at: Date.now(), text });
  SR.log.length = Math.min(SR.log.length, 200);
  if (!$('sr-log').hidden) srRenderLog();
}

/* ---- the door's press ---- */
async function srEnter(project, opener) {
  if (!project || ['loading', 'ok', 'open'].includes(SR.phase)) return;
  const seq = ++SR.seq;
  clearTimeout(SR.failTimer);
  Object.assign(SR, { phase: 'loading', project, t0: srNow(), why: '', full: '', opener: opener || null });
  srBubble('サーバー構成を読み込んでいます', 'info');
  srLog(`${(PROJECT[project] && PROJECT[project].name) || project}: 構成を読み込み始めた`);
  const got = typeof SOURCE.infraDocs === 'function' ? await SOURCE.infraDocs(project, seq)
    : { ok: false, seq, reason: 'unreadable', message: 'このページでは読めない', short: 'このページでは読めない' };
  if (seq !== SR.seq || SR.phase !== 'loading') return;   // Esc, or a newer press: this reply changes nothing
  if (!got || got.ok !== true) { srFail(got || {}); return; }
  const took = srNow() - SR.t0;
  SR.model = got; SR.phase = 'ok';
  SR.until = srNow() + (took < SR.fastMs ? 120 : SR.okMs);
  SR.took = Math.round(took); SR.waitMs = Math.round(SR.until - srNow());   // read under SR.fastMs: a flash, not the whole 解錠
  srBubble(null);
  srLog(`読み込んだ: ${got.files.length} ファイル、node ${got.nodes.length}・edge ${got.edges.length}（${got.readMs} ms）${got.problems && got.problems.length ? `、問題 ${got.problems.length} 件` : ''}`);
  setTimeout(() => { if (seq === SR.seq && SR.phase === 'ok') srShow(got); }, Math.max(0, SR.until - srNow()));
}
function srFail(got) {
  const short = String(got.short || got.message || '読めなかった');
  const lines = [String(got.message || '')];
  for (const p of (got.problems || []).slice(0, 30)) lines.push(`${p.file || ''}${p.line ? `:${p.line}` : ''} ${p.short || p.message || ''}`.trim());
  Object.assign(SR, { phase: 'failed', why: short, full: lines.filter(Boolean).join('\n'), until: srNow() + SR.failMs });
  srBubble(short, 'error', SR.full);
  // gone after SR.failMs by its own timer, wherever the view is (dd's verification D1, 10-20: it was cleared from the
  // keypad's tick, which runs only for the door in sight, and stayed on the floor view after a failure)
  clearTimeout(SR.failTimer);
  const seq = SR.seq;
  SR.failTimer = setTimeout(() => { if (SR.phase === 'failed' && SR.seq === seq) srIdle(); }, SR.failMs);
  srLog(`読めなかった: ${short}`);
}
function srIdle() {
  clearTimeout(SR.failTimer);
  SR.phase = 'idle';
  srBubble(null);
}
function srCancel() {
  if (SR.phase !== 'loading') return false;
  SR.seq += 1; SR.phase = 'idle';
  srBubble(null);
  srLog('読み込みをやめた（Esc）');
  return true;
}
/* What the keypad shows now (40-scene.js serverDoorTick, and the e2e hook): it only reads, it changes nothing. */
function srKeypad(project, nowSec) {
  void nowSec;
  if (project !== SR.project) return { state: 'idle', stars: 0, open: 0 };
  const t = srNow();
  if (SR.phase === 'loading') return { state: 'loading', stars: reduceMotion ? 4 : 1 + (Math.floor((t - SR.t0) / SR.starMs) % 8), open: 0 };
  if (SR.phase === 'ok') return { state: 'ok', stars: 8, open: 1 };
  if (SR.phase === 'failed') return { state: 'failed', stars: 0, open: 0, shake: t - (SR.until - SR.failMs) < 500 };
  return { state: 'idle', stars: 0, open: 0 };
}
/* The bubble over the keypad: shown while it reads and when it failed (the short line; the whole text on hover). */
function srBubble(text, kind = 'info', full = '') {
  if (!text) { srBubbleEl.hidden = true; srBubbleEl.dataset.kind = ''; return; }
  setText(srBubbleEl.querySelector('.sr-short'), text);
  setText(srBubbleEl.querySelector('.sr-full'), full || '');
  srBubbleEl.dataset.kind = kind;
  srBubbleEl.hidden = false;
  srBubblePlace();
}
function srBubblePlace() {
  if (srBubbleEl.hidden) return;
  // a failure is about one room's door: away from that room (the floor, another room) it goes at once (D1)
  const near = typeof srDoorNow === 'function' ? srDoorNow() : null;
  if (SR.phase === 'failed' && (!near || near.room !== SR.project)) { srIdle(); return; }
  const at = typeof serverDoorScreen === 'function' ? serverDoorScreen() : null;
  if (at) {   // kept on the page: centred over the keypad, its top and sides 16 px in at least
    const w = srBubbleEl.offsetWidth, h = srBubbleEl.offsetHeight, half = w / 2 + 16;
    const x = Math.min(Math.max(at[0], half), Math.max(half, window.innerWidth - half)), y = Math.max(at[1], h + 10 + 16);
    srBubbleEl.style.left = `${Math.round(x)}px`; srBubbleEl.style.top = `${Math.round(y)}px`; srBubbleEl.classList.remove('sr-bubble-free');
  }
  else srBubbleEl.classList.add('sr-bubble-free');   // the keypad out of sight: the bubble at the top of the page
  requestAnimationFrame(srBubblePlace);
}

/* ---- the server room's view ---- */
const SR_CELL = 1.8, SR_PAD = 0.6, SR_HEAD = 1.0;
const SR_SHAPES = {
  rack: () => new THREE.BoxGeometry(0.9, 1.5, 0.7), drum: () => new THREE.CylinderGeometry(0.5, 0.5, 1.1, 12),
  bucket: () => new THREE.CylinderGeometry(0.55, 0.4, 0.9, 12), belt: () => new THREE.BoxGeometry(1.3, 0.35, 0.6),
  globe: () => new THREE.SphereGeometry(0.55, 12, 8), gate: () => new THREE.ConeGeometry(0.6, 1.0, 4),
  puck: () => new THREE.CylinderGeometry(0.55, 0.55, 0.45, 12), small: () => new THREE.BoxGeometry(0.6, 0.6, 0.6),
  kiosk: () => new THREE.OctahedronGeometry(0.55),
};
function srShape(category) {
  const c = String(category || '');
  if (c.startsWith('compute.')) return 'rack';
  if (c.startsWith('database.')) return 'drum';
  if (c.startsWith('storage.')) return 'bucket';
  if (c === 'queue' || c === 'stream') return 'belt';
  if (c.startsWith('edge.')) return 'globe';
  if (c === 'load_balancer') return 'gate';
  if (c === 'cache') return 'puck';
  if (c === 'external.saas' || c === 'client') return 'kiosk';
  return 'small';
}
const SR_PALETTE = ['#f29a38', '#4f8ef7', '#3fb26b', '#e2574c', '#a26bd6', '#26a5b8', '#d4a72c', '#7d8a99', '#e06fa8', '#5c6bc0'];
/* The 3D's colours (2.3.10 item 2, requester 10-20: 「ダークでも背景が白なの嫌だね 背景は暗めにして欲しい」): in dark the
   background is near-black and every floor at least 3:1 against it; the light set is as before. */
const SR_PAL = {
  light: { bg: '#eef2f7', logical: '#c9b8e8', public: '#dfe7f2', private: '#9fb0c4', neutral: '#cfd6df', strip: 0xe9e2f5, plain: 0x5c6b7f, focus: 0x1d4ed8 },
  dark: { bg: '#10161f', logical: '#6b5b99', public: '#5d7088', private: '#566a83', neutral: '#5f6b7a', strip: 0x66588a, plain: 0x8193a8, focus: 0x7cb4ff },
};
function srProviderColor(p) {
  if (!p) return '#9aa4b2';
  let h = 0;
  for (const ch of String(p)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SR_PALETTE[h % SR_PALETTE.length];
}
const srVisible = (x, env) => !env || !Array.isArray(x.environments) || !x.environments.length || x.environments.includes(env);
function srEnvs(model) { return (model.environments || []).map((e) => (typeof e === 'string' ? { id: e, label: e } : { id: e.id, label: e.label || e.id })); }

/* Places every group and node (sizes bottom-up, places top-down); the external nodes on a strip in front. */
function srLayout(model, env, showFold, closed = new Set(), only = new Set()) {
  const groups = new Map();
  for (const g of model.groups || []) if (srVisible(g, env)) groups.set(g.id, { g, kids: [], nodes: [], level: 0 });
  const roots = [];
  for (const G of groups.values()) { const p = G.g.parent && groups.get(G.g.parent); (p ? p.kids : roots).push(G); }
  const loose = { g: { id: '', kind: 'logical', label: 'グループなし' }, kids: [], nodes: [], level: 0 }, ext = [];
  // clouds chosen on the board (2.3.10 item 3): only their nodes; one with no provider is out while any is chosen
  const nodes = (model.nodes || []).filter((n) => srVisible(n, env) && (showFold || !n.fold) && (!only.size || only.has(n.providerResolved || n.provider)));
  for (const n of nodes) {
    if (n.external || n.category === 'external.saas') { ext.push(n); continue; }
    const G = n.group && groups.get(n.group);
    (G ? G.nodes : loose.nodes).push(n);
  }
  if (loose.nodes.length) roots.push(loose);
  if (only.size) {   // a group with nothing left inside is not drawn while clouds are chosen
    const keep = (G) => { G.kids = G.kids.filter(keep); return G.nodes.length > 0 || G.kids.length > 0; };
    roots.splice(0, roots.length, ...roots.filter(keep));
  }
  const pack = (items) => {
    const area = items.reduce((a, it) => a + it.w * it.d, 0), wide = Math.max(SR_CELL, ...items.map((it) => it.w));
    const rowW = Math.max(wide, Math.sqrt(area) * 1.25);
    items.sort((a, b) => b.d - a.d || b.w - a.w);
    let x = 0, z = 0, rowD = 0, W = 0;
    for (const it of items) {
      if (x > 0 && x + it.w > rowW) { z += rowD + SR_PAD * 0.5; x = 0; rowD = 0; }
      it.x = x; it.z = z; x += it.w + SR_PAD * 0.5; rowD = Math.max(rowD, it.d); W = Math.max(W, x);
    }
    return [Math.max(W - SR_PAD * 0.5, SR_CELL), z + rowD];
  };
  const size = (G, level) => {
    G.level = level;
    if (G.g.id && closed.has(G.g.id)) {   // closed: one box the size of two cells, its insides not laid out
      G.closed = true; G.items = []; G.w = SR_CELL * 2 + 2 * SR_PAD; G.d = SR_CELL + SR_PAD + SR_HEAD;
      return;
    }
    const items = [...G.kids.map((k) => { size(k, level + 1); return { w: k.w, d: k.d, k }; }), ...G.nodes.map((n) => ({ w: SR_CELL, d: SR_CELL, n }))];
    const [W, D] = items.length ? pack(items) : [SR_CELL, SR_CELL * 0.5];
    G.items = items; G.w = W + 2 * SR_PAD; G.d = D + SR_PAD + SR_HEAD;
  };
  for (const G of roots) size(G, 0);
  const top = roots.map((G) => ({ w: G.w, d: G.d, k: G }));
  const [TW, TD] = top.length ? pack(top) : [0, 0];
  const pos = new Map(), floors = [], tops = [];
  const place = (G, x, z) => {
    G.x = x; G.z = z;
    floors.push(G);
    if (G.closed) {   // every node inside stands in at the box's middle: the cables end there
      const inside = (H) => { for (const n of H.nodes) pos.set(n.id, { x: x + G.w / 2, z: z + G.d / 2, y: 0.06 * (G.level + 1), n, root: null, hiddenIn: G }); H.kids.forEach(inside); };
      inside(G);
      return;
    }
    for (const it of G.items) {
      const ix = x + SR_PAD + it.x, iz = z + SR_HEAD + it.z;
      if (it.k) place(it.k, ix, iz);
      else pos.set(it.n.id, { x: ix + SR_CELL / 2, z: iz + SR_CELL / 2, y: 0.06 * (G.level + 1), n: it.n, root: null });
    }
  };
  for (const it of top) { place(it.k, it.x, it.z); tops.push(it.k); }
  const rootOf = (G) => G;   // filled below: every node's top group
  void rootOf;
  for (const R of tops) {
    const walk = (G) => { for (const n of G.nodes) { const p = pos.get(n.id); if (p) p.root = R; } for (const k of G.kids) walk(k); };
    walk(R);
  }
  ext.forEach((n, i) => pos.set(n.id, { x: i * SR_CELL * 1.3 + SR_CELL / 2, z: TD + 5, y: 0, n, root: null, external: true }));
  const width = Math.max(TW, ext.length * SR_CELL * 1.3), depth = TD + (ext.length ? 7 : 0);
  // an edge in this environment as the merge gave it (e.environments; none: all), both its ends laid out
  const edges = (model.edges || []).filter((e) => srVisible(e, env) && pos.has(e.from) && pos.has(e.to)
    && !(pos.get(e.from).hiddenIn && pos.get(e.from).hiddenIn === pos.get(e.to).hiddenIn));   // within one closed group: not drawn
  const shown = [...pos.values()].filter((p) => !p.hiddenIn);
  return { floors, tops, pos, ext, edges, nodes: shown.map((p) => p.n), hidden: pos.size - shown.length, closed: floors.filter((G) => G.closed), width, depth };
}

function srShow(model) {
  SR.phase = 'open';
  SR.model = model;
  showOverlay(srEl);
  setText($('sr-room'), (PROJECT[SR.project] && PROJECT[SR.project].name) || '');
  const envs = srEnvs(model);
  $('sr-env').innerHTML = envs.length ? envs.map((e) => `<option value="${esc(e.id)}">${esc(e.label)}</option>`).join('') : '<option value="">（環境の指定なし）</option>';
  $('sr-env').disabled = envs.length < 2;
  $('sr-fold').checked = false;
  SR.closed = new Set(); SR.selected = null; SR.selectedGroup = null; SR.hover = null; SR.only = new Set();
  $('sr-lines').value = SR.lines;
  srBuild();
  $('sr-back').focus({ preventScroll: true });
}
function srClose() {
  if (SR.phase !== 'open') return;
  SR.phase = 'idle';
  srDispose();
  hideOverlay(srEl);
  SR.seq += 1;
  srLog('部屋に戻った');
  if (SR.opener && SR.opener.focus) SR.opener.focus({ preventScroll: true });
}
function srDispose() {
  const V = SR.view;
  if (!V) return;
  cancelAnimationFrame(V.raf);
  V.ro.disconnect();
  V.controls.dispose();
  V.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { for (const m of [].concat(o.material)) { if (m.map) m.map.dispose(); m.dispose(); } } });
  V.renderer.dispose();
  for (const url of V.iconUrls) URL.revokeObjectURL(url);
  $('sr-labels').innerHTML = '';
  SR.view = null;
}
function srBuild() {
  const t0 = srNow();
  srDispose();
  const model = SR.model, env = $('sr-env').value || '', fold = $('sr-fold').checked;
  const L = srLayout(model, env, fold, SR.closed, SR.only);
  // a chosen or pointed node not drawn now (another environment, a cloud not chosen, folded) is let go (dd's verification)
  for (const k of ['selected', 'hover']) if (SR[k] && !(L.pos.has(SR[k]) && !L.pos.get(SR[k]).hiddenIn)) SR[k] = null;
  const cv = $('sr-canvas'), box = cv.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const dark = isDark(), PAL = dark ? SR_PAL.dark : SR_PAL.light;
  scene.background = new THREE.Color(PAL.bg);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(30, 60, 40); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
  const controls = new OrbitControls(camera, cv);
  Object.assign(controls, { enableDamping: !reduceMotion, dampingFactor: 0.12, screenSpacePanning: true, minDistance: 3, maxDistance: 4000, maxPolarAngle: Math.PI * 0.48 });
  const V = { renderer, scene, camera, controls, L, near: new THREE.Group(), far: new THREE.Group(), lod: 'near', pick: [], iconUrls: [], raf: 0,
    frames: [], labelAt: 0, labels: [], ro: null, env, fold, dark, floorColors: [] };
  V.far.visible = false;   // srLod only switches on a change: a view that opens near never showed the far boxes' level
  scene.add(V.near, V.far);
  // floors: one instanced box for all of them
  const floorMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, L.floors.length));
  const m4 = new THREE.Matrix4(), col = new THREE.Color(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), at = new THREE.Vector3();
  L.floors.forEach((G, i) => {
    const h = 0.05, y = 0.06 * G.level + h / 2;
    m4.compose(at.set(G.x + G.w / 2, y, G.z + G.d / 2), q, sc.set(G.w, h, G.d));
    floorMesh.setMatrixAt(i, m4);
    const g = G.g, base = g.kind === 'logical' ? PAL.logical : g.visibility === 'public' ? PAL.public : g.visibility === 'private' ? PAL.private : g.provider ? srProviderColor(g.provider) : PAL.neutral;
    col.set(base);
    if (!dark && g.provider && g.kind !== 'logical') col.lerp(new THREE.Color('#ffffff'), 0.55 - Math.min(G.level, 4) * 0.08);
    else if (dark && g.provider && g.kind !== 'logical' && !g.visibility) col.lerp(new THREE.Color(PAL.bg), 0.25);   // a provider's own floor, a little toward the ground
    floorMesh.setColorAt(i, col);
    V.floorColors.push(`#${col.getHexString()}`);
  });
  floorMesh.count = L.floors.length;
  floorMesh.userData.groups = L.floors.map((G) => G.g.id);
  V.near.add(floorMesh); V.pick.push(floorMesh);
  if (L.closed.length) {   // the closed groups: a box each, as tall as what it holds
    const cm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), L.closed.length);
    L.closed.forEach((G, i) => {
      const h = 0.6 + Math.log2(1 + srCountNodes(G)) * 0.35;
      m4.compose(at.set(G.x + G.w / 2, 0.06 * G.level + h / 2, G.z + SR_HEAD + (G.d - SR_HEAD) / 2), q, sc.set(G.w - SR_PAD, h, G.d - SR_HEAD - SR_PAD * 0.5));
      cm.setMatrixAt(i, m4);
      cm.setColorAt(i, col.set(G.g.kind === 'logical' ? '#b49be0' : srProviderColor(G.g.providerResolved || G.g.provider)));
    });
    cm.userData.groups = L.closed.map((G) => G.g.id);
    V.near.add(cm); V.pick.push(cm);
  }
  // nodes: one instanced mesh per shape
  const byShape = {};
  for (const p of L.pos.values()) if (!p.hiddenIn) (byShape[srShape(p.n.category)] = byShape[srShape(p.n.category)] || []).push(p);
  for (const [shape, list] of Object.entries(byShape)) {
    const mesh = new THREE.InstancedMesh(SR_SHAPES[shape](), new THREE.MeshLambertMaterial({ color: 0xffffff }), list.length);
    list.forEach((p, i) => {
      const s = p.n.count > 1 ? 1 + Math.min(Math.log2(p.n.count), 4) * 0.12 : 1;
      m4.compose(at.set(p.x, p.y + 0.75, p.z), q, sc.set(s, s, s));
      mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, col.set(srProviderColor(p.n.providerResolved || p.n.provider)));
    });
    mesh.userData.nodes = list.map((p) => p.n.id);
    V.near.add(mesh); V.pick.push(mesh);
  }
  // cables: within a provider solid, across providers dashed magenta and higher (requester: 跨いでいることが見て分かる)
  const plain = [], cross = [];
  for (const e of L.edges) {
    const a = L.pos.get(e.from), b = L.pos.get(e.to), crossing = !!e.crossProvider, y = crossing ? 2.6 : 1.7;
    (crossing ? cross : plain).push(a.x, y, a.z, b.x, y, b.z);
  }
  const lines = (arr, mat) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); const l = new THREE.LineSegments(g, mat); if (mat.isLineDashedMaterial) l.computeLineDistances(); return l; };
  V.plainLines = lines(plain, new THREE.LineBasicMaterial({ color: PAL.plain, transparent: true, opacity: SR.plainOpacity }));
  V.crossLines = lines(cross, new THREE.LineDashedMaterial({ color: 0xd63fb0, dashSize: 0.5, gapSize: 0.3, transparent: true, opacity: SR.crossOpacity }));
  // the strong layer: the pressed and the pointed node's cables (srFocusLines fills it)
  V.focusLines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: PAL.focus }));
  V.focusCross = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xd63fb0 }));
  V.focusLines.renderOrder = V.focusCross.renderOrder = 2;
  V.near.add(V.plainLines, V.crossLines, V.focusLines, V.focusCross);
  // far: the top groups as boxes, the cables bundled between them
  const tops = L.tops, topIndex = new Map(tops.map((G, i) => [G, i]));
  const boxMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, tops.length));
  tops.forEach((G, i) => {
    const n = srCountNodes(G), h = 0.8 + Math.log2(1 + n) * 0.6;
    G.boxH = h; G.nodeCount = n;
    m4.compose(at.set(G.x + G.w / 2, h / 2, G.z + G.d / 2), q, sc.set(G.w * 0.92, h, G.d * 0.92));
    boxMesh.setMatrixAt(i, m4);
    boxMesh.setColorAt(i, col.set(G.g.kind === 'logical' ? '#b49be0' : srProviderColor(G.g.provider)));
  });
  boxMesh.count = tops.length;
  V.far.add(boxMesh);
  const bundles = new Map();
  for (const e of L.edges) {
    const ra = L.pos.get(e.from).root, rb = L.pos.get(e.to).root;
    if (!ra || !rb || ra === rb) continue;
    const ia = topIndex.get(ra), ib = topIndex.get(rb), key = ia < ib ? `${ia}:${ib}` : `${ib}:${ia}`;
    const B = bundles.get(key) || { a: ra, b: rb, n: 0, cross: 0 };
    B.n += 1; if (e.crossProvider) B.cross += 1;
    bundles.set(key, B);
  }
  const bp = [], bc = [];
  for (const B of bundles.values()) {
    const ya = B.a.boxH + 0.3, yb = B.b.boxH + 0.3;
    (B.cross ? bc : bp).push(B.a.x + B.a.w / 2, ya, B.a.z + B.a.d / 2, B.b.x + B.b.w / 2, yb, B.b.z + B.b.d / 2);
  }
  V.bundles = [...bundles.values()];
  // the far view's bundles: as faint as the near cables, and the lines switch holds there too (dd's verification of item 1)
  V.farPlain = lines(bp, new THREE.LineBasicMaterial({ color: PAL.plain, transparent: true, opacity: SR.plainOpacity }));
  V.farCross = lines(bc, new THREE.LineDashedMaterial({ color: 0xd63fb0, dashSize: 1.2, gapSize: 0.7, transparent: true, opacity: SR.crossOpacity }));
  V.far.add(V.farPlain, V.farCross);
  // the external strip's sign
  if (L.ext.length) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(L.ext.length * SR_CELL * 1.3, 0.04, SR_CELL * 1.6), new THREE.MeshLambertMaterial({ color: PAL.strip }));
    strip.position.set(L.ext.length * SR_CELL * 1.3 / 2, 0.02, L.pos.get(L.ext[0].id).z);
    V.near.add(strip);
  }
  srIcons(V);
  // the labels: a fixed pool, given out each tenth of a second
  const holder = $('sr-labels');
  holder.innerHTML = '';
  for (let i = 0; i < SR.labels.max; i++) { const s = document.createElement('span'); s.className = 'sr-label'; s.hidden = true; holder.append(s); V.labels.push(s); }
  V.ro = new ResizeObserver(() => srResize(V)); V.ro.observe(box);
  srResize(V);
  SR.view = V;
  srLinesMode(V);
  srFocusLines(V);
  srFit(true);
  srCounts(L);
  cv.onpointerdown = (e) => { V.downAt = [e.clientX, e.clientY]; };
  cv.onpointermove = (e) => {   // the pointed node's cables, strong (at most every 60 ms)
    if (e.buttons || srNow() - (V.hoverAt || 0) < 60) return;
    V.hoverAt = srNow();
    const id = srNodeAt(V, e);
    if (id !== SR.hover) { SR.hover = id; srFocusLines(V); }
  };
  cv.onpointerleave = () => { if (SR.hover) { SR.hover = null; srFocusLines(V); } };
  cv.onpointerup = (e) => { if (V.downAt && Math.hypot(e.clientX - V.downAt[0], e.clientY - V.downAt[1]) < 5) srPick(e); V.downAt = null; };
  const loop = () => {
    V.raf = requestAnimationFrame(loop);
    const t = srNow();
    if (V.last) { V.frames.push(t - V.last); if (V.frames.length > 240) V.frames.shift(); }
    V.last = t;
    controls.update();
    srLod(V);
    if (t - V.labelAt > 100) { V.labelAt = t; srPlaceLabels(V); }
    renderer.render(scene, camera);
  };
  loop();
  SR.stats = { firstMs: Math.round(srNow() - t0), nodes: L.nodes.length, edges: L.edges.length, floors: L.floors.length };
  srLog(`描いた: node ${L.nodes.length}・edge ${L.edges.length}・床 ${L.floors.length}（${SR.stats.firstMs} ms）${env ? `、環境 ${env}` : ''}`);
}
function srCountNodes(G) { return G.nodes.length + G.kids.reduce((a, k) => a + srCountNodes(k), 0); }
function srResize(V) {
  const box = $('sr-canvas').parentElement, w = Math.max(1, box.clientWidth), h = Math.max(1, box.clientHeight);
  V.renderer.setSize(w, h, false); V.camera.aspect = w / h; V.camera.updateProjectionMatrix();
}
function srFit(instant) {
  const V = SR.view;
  if (!V) return;
  const L = V.L, cx = L.width / 2, cz = L.depth / 2, r = Math.max(6, Math.hypot(L.width, L.depth) / 2);
  const dist = r / Math.sin((V.camera.fov * Math.PI / 180) / 2) * 0.95;
  V.controls.target.set(cx, 0, cz);
  V.camera.position.set(cx, dist * 0.78, cz + dist * 0.62);
  V.camera.near = Math.max(0.1, dist / 500); V.camera.far = dist * 6; V.camera.updateProjectionMatrix();
  V.controls.update();
  void instant;
}
/* How big a node cell is on the page now (px): far below SR.lod.far, near again above SR.lod.near. */
function srCellPx(V) {
  const dist = V.camera.position.distanceTo(V.controls.target), h = V.renderer.domElement.clientHeight || 1;
  return SR_CELL / (2 * dist * Math.tan((V.camera.fov * Math.PI / 180) / 2)) * h;
}
function srLod(V) {
  const px = srCellPx(V);
  const want = V.lod === 'near' ? (px < SR.lod.far ? 'far' : 'near') : (px > SR.lod.near ? 'near' : 'far');
  if (want === V.lod) return;
  V.lod = want; V.near.visible = want === 'near'; V.far.visible = want === 'far';
  V.labelAt = 0;
}
function srPlaceLabels(V) {
  const cam = V.camera, w = V.renderer.domElement.clientWidth, h = V.renderer.domElement.clientHeight, v = new THREE.Vector3(), out = [];
  const consider = (x, y, z, text, kind, weight) => {
    v.set(x, y, z).project(cam);
    if (v.z < -1 || v.z > 1 || v.x < -1.05 || v.x > 1.05 || v.y < -1.05 || v.y > 1.05) return;
    out.push({ sx: (v.x + 1) / 2 * w, sy: (1 - v.y) / 2 * h, text, kind, d: cam.position.distanceToSquared(new THREE.Vector3(x, y, z)) * weight });
  };
  if (V.lod === 'far') {
    for (const G of V.L.tops) consider(G.x + G.w / 2, G.boxH + 0.8, G.z + G.d / 2, `${G.g.label || G.g.id} · ${G.nodeCount}`, 'group', 1);
  } else {
    for (const G of V.L.floors) if (G.g.id) consider(G.x + 0.6, 0.2 + G.level * 0.06, G.z + 0.5, G.g.label || G.g.id, 'group', 0.6);
    for (const p of V.L.pos.values()) if (!p.hiddenIn) consider(p.x, p.y + 1.9, p.z, `${p.n.label || p.n.id}${p.n.count > 1 ? ` ×${p.n.count}` : ''}`, p.external ? 'external' : 'node', 1);
  }
  out.sort((a, b) => a.d - b.d);
  const groups = out.filter((o) => o.kind === 'group').slice(0, SR.labels.max - SR.labels.nodes);
  const rest = out.filter((o) => o.kind !== 'group').slice(0, SR.labels.nodes);
  const placed = [], clear = (o) => {   // a label that would cover one already given out is left out (its width from its text)
    const wd = 12 + [...o.text].reduce((a, ch) => a + (ch.charCodeAt(0) > 0x2e7f ? 12 : 7), 0), b = [o.sx - wd / 2, o.sy - 20, o.sx + wd / 2, o.sy];
    if (placed.some((q) => b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1])) return false;
    placed.push(b); return true;
  };
  const shown = [...groups, ...rest].filter(clear).slice(0, SR.labels.max);
  V.labels.forEach((s, i) => {
    const o = shown[i];
    if (!o) { s.hidden = true; return; }
    s.hidden = false; s.dataset.kind = o.kind;
    if (s.textContent !== o.text) s.textContent = o.text;
    s.style.transform = `translate(${Math.round(o.sx)}px, ${Math.round(o.sy)}px) translate(-50%, -100%)`;
  });
  V.shownLabels = shown.length;
}
/* The room's icons: per node the strongest key the settings give (service → provider → category), an image plane above it. */
async function srIcons(V) {
  V.iconKeys = {};
  const icons = new Set(SR.model.icons ? Object.keys(SR.model.icons) : []);
  if (!icons.size || typeof SOURCE.infraIcon !== 'function') return;
  const byKey = {};
  for (const p of V.L.pos.values()) {
    if (p.hiddenIn) continue;
    const n = p.n, prov = n.providerResolved || n.provider;
    const key = [n.service && prov ? `service:${prov}/${n.service}` : null, prov ? `provider:${prov}` : null, `category:${n.category}`].find((k) => k && icons.has(k));
    if (key) { (byKey[key] = byKey[key] || []).push(p); V.iconKeys[n.id] = key; }
  }
  for (const [key, list] of Object.entries(byKey)) {
    const blob = await SOURCE.infraIcon(SR.project, key);
    if (!blob || SR.view !== V) continue;
    const url = URL.createObjectURL(blob);
    V.iconUrls.push(url);
    const tex = await new THREE.TextureLoader().loadAsync(url).catch(() => null);
    if (!tex || SR.view !== V) continue;
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }), list.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0));
    list.forEach((p, i) => { m4.compose(new THREE.Vector3(p.x, p.y + 2.1, p.z), q, new THREE.Vector3(1, 1, 1)); mesh.setMatrixAt(i, m4); });
    mesh.userData.icon = key;
    V.near.add(mesh);
    V.iconCount = (V.iconCount || 0) + list.length;
  }
}
function srHitAt(V, e) {
  const r = V.renderer.domElement.getBoundingClientRect(), ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), V.camera);
  const hit = ray.intersectObjects(V.pick, false)[0];
  return hit && hit.instanceId !== undefined ? { ud: hit.object.userData, i: hit.instanceId } : null;
}
function srNodeAt(V, e) {
  if (V.lod !== 'near') return null;
  const h = srHitAt(V, e);
  return h && h.ud.nodes ? h.ud.nodes[h.i] : null;
}
function srPick(e) {
  const V = SR.view;
  if (!V || V.lod !== 'near') return;
  const h = srHitAt(V, e);
  srSelect(h && h.ud.nodes ? h.ud.nodes[h.i] : null, h && h.ud.groups ? h.ud.groups[h.i] || null : null);
}
function srSelect(node, group = null) {
  SR.selected = node; SR.selectedGroup = node ? null : group;
  if (SR.view) srFocusLines(SR.view);
  srRenderBoard();
}
/* The strong layer: every cable of the pressed node and of the pointed one (both ends drawn). */
function srFocusLines(V) {
  const ids = new Set([SR.selected, SR.hover].filter(Boolean)), plain = [], cross = [];
  if (ids.size) {
    for (const e of V.L.edges) {
      if (!ids.has(e.from) && !ids.has(e.to)) continue;
      const a = V.L.pos.get(e.from), b = V.L.pos.get(e.to), y = e.crossProvider ? 2.62 : 1.72;
      (e.crossProvider ? cross : plain).push(a.x, y, a.z, b.x, y, b.z);
    }
  }
  for (const [layer, arr] of [[V.focusLines, plain], [V.focusCross, cross]]) {
    layer.geometry.dispose();
    layer.geometry = new THREE.BufferGeometry();
    layer.geometry.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  }
  V.focusCount = (plain.length + cross.length) / 6;
}
/* The lines switch: all (faint) / crossing ones only / the chosen node's only. */
function srLinesMode(V) {
  V.plainLines.visible = V.farPlain.visible = SR.lines === 'all';
  V.crossLines.visible = V.farCross.visible = SR.lines !== 'focus';
}
/* Moves in on a node or a group (its floor's middle, near enough to see what it holds). */
function srFocus(x, z, r) {
  const V = SR.view;
  if (!V) return;
  const dir = V.camera.position.clone().sub(V.controls.target).normalize(), dist = Math.max(6, r * 2.2);
  V.controls.target.set(x, 0, z);
  V.camera.position.copy(V.controls.target).addScaledVector(dir, dist);
  V.controls.update();
}
function srFocusSelected() {
  const V = SR.view;
  if (!V) return;
  const p = SR.selected && V.L.pos.get(SR.selected), G = SR.selectedGroup && V.L.floors.find((F) => F.g.id === SR.selectedGroup);
  if (p) srFocus(p.x, p.z, SR_CELL * 2);
  else if (G) srFocus(G.x + G.w / 2, G.z + G.d / 2, Math.hypot(G.w, G.d) / 2);
}
function srToggleGroup(id) {
  if (!id || !SR.view) return;
  const open = SR.closed.has(id);
  if (open) SR.closed.delete(id); else SR.closed.add(id);
  const G = SR.view.L.floors.find((F) => F.g.id === id);
  srLog(`${(G && (G.g.label || G.g.id)) || id} を${open ? '開いた' : '閉じた'}`);
  srBuild();
}
function srZoomBy(factor) {
  const V = SR.view;
  if (!V) return;
  const d = V.camera.position.clone().sub(V.controls.target).multiplyScalar(factor);
  if (d.length() < V.controls.minDistance || d.length() > V.controls.maxDistance) return;
  V.camera.position.copy(V.controls.target).add(d);
  V.controls.update();
}

/* ---- the board and the log ---- */
function srCounts(L) {
  SR.shown = { nodes: L.nodes.length, edges: L.edges.length, cross: L.edges.filter((e) => e.crossProvider).length, groups: L.floors.length,
    folded: (SR.model.nodes || []).filter((n) => n.fold).length, external: L.ext.length, closed: L.closed.length, inClosed: L.hidden };
  srRenderBoard();
}
function srRenderBoard() {
  const M = SR.model, S = SR.shown || {};
  if (!M) return;
  const provs = [...new Set((M.nodes || []).map((n) => n.providerResolved || n.provider).filter(Boolean))];
  const sel = SR.selected ? (M.nodes || []).find((n) => n.id === SR.selected) : null;
  const grp = !sel && SR.selectedGroup ? (M.groups || []).find((g) => g.id === SR.selectedGroup) : null;
  const inGroup = grp && SR.view ? SR.view.L.floors.find((F) => F.g.id === grp.id) : null;
  const edgesOf = sel ? (M.edges || []).filter((e) => e.from === sel.id || e.to === sel.id).slice(0, 20) : [];
  const probs = (M.problems || []).slice(0, 50);
  setHTML($('sr-board'), `<h3>構成</h3>
<p class="sr-meta">${esc(M.dir || '')} · ${esc(String((M.files || []).length))} ファイル</p>
<dl class="sr-counts"><dt>node</dt><dd data-sr-count="nodes">${esc(String(S.nodes ?? 0))}</dd><dt>edge</dt><dd data-sr-count="edges">${esc(String(S.edges ?? 0))}</dd><dt>provider を跨ぐ edge</dt><dd data-sr-count="cross">${esc(String(S.cross ?? 0))}</dd><dt>畳んだもの</dt><dd>${esc(String(S.folded ?? 0))}${$('sr-fold').checked ? '（出している）' : ''}</dd><dt>外部</dt><dd>${esc(String(S.external ?? 0))}</dd></dl>
<h3>凡例</h3><p class="sr-hint">クラウドを押すと、そのクラウドだけを表示します（複数を選べます）。${SR.only.size ? ` 絞り: ${esc([...SR.only].join(', '))}` : ''}</p>
<ul class="sr-legend">${provs.map((p) => `<li><button type="button" class="sr-prov" data-sr-prov="${esc(p)}" aria-pressed="${SR.only.has(p) ? 'true' : 'false'}"><span class="sr-chip" style="background:${esc(srProviderColor(p))}"></span>${esc(p)}</button></li>`).join('')}
<li><button type="button" class="sr-prov" data-sr-prov="" aria-pressed="${SR.only.size ? 'false' : 'true'}">全部</button></li>
<li><span class="sr-line"></span>同じ provider の中のつながり</li><li><span class="sr-line sr-line-cross"></span>provider を跨ぐつながり（破線・マゼンタ）</li></ul>
${sel ? `<h3>選んだもの</h3><dl class="sr-sel"><dt>id</dt><dd>${esc(sel.id)}</dd><dt>名前</dt><dd>${esc(sel.label || '')}</dd><dt>種類</dt><dd>${esc(sel.category)}</dd><dt>provider</dt><dd>${esc(sel.providerResolved || sel.provider || '')}${sel.service ? ` · ${esc(sel.service)}` : ''}</dd>${sel.count > 1 ? `<dt>台数</dt><dd>${esc(String(sel.count))}</dd>` : ''}</dl>
<p class="sr-acts"><button type="button" class="wb-btn" data-sr-act="focus">これに寄る</button></p>
<ul class="sr-edges">${edgesOf.map((e) => `<li>${esc(e.from)} → ${esc(e.to)}${e.protocol ? ` <small>${esc(e.protocol)}</small>` : ''}${e.crossProvider ? ' <b>跨ぐ</b>' : ''}</li>`).join('')}</ul>`
    : grp ? `<h3>選んだ group</h3><dl class="sr-sel"><dt>id</dt><dd>${esc(grp.id)}</dd><dt>名前</dt><dd>${esc(grp.label || '')}</dd><dt>種類</dt><dd>${esc(grp.kind || '')}</dd><dt>provider</dt><dd>${esc(grp.providerResolved || grp.provider || '')}</dd><dt>中の node</dt><dd>${esc(String(inGroup ? srCountNodes(inGroup) : 0))}</dd></dl>
<p class="sr-acts"><button type="button" class="wb-btn" data-sr-act="focus">これに寄る</button> <button type="button" class="wb-btn" data-sr-act="toggle" data-sr-group="${esc(grp.id)}">${SR.closed.has(grp.id) ? '開く' : '閉じる（箱 1 つに）'}</button></p>`
    : '<p class="sr-hint">形や床を押すと、ここに詳しく出ます（床なら、その group を閉じる・開く）</p>'}
${probs.length ? `<h3>問題 ${probs.length} 件</h3><ul class="sr-problems">${probs.map((p) => `<li title="${esc(p.message || '')}">${esc(p.short || p.message || '')}</li>`).join('')}</ul>` : ''}`);
}
function srRenderLog() {
  setHTML($('sr-log'), `<ol>${SR.log.map((l) => `<li><time>${esc(new Date(l.at).toTimeString().slice(0, 8))}</time> ${esc(l.text)}</li>`).join('')}</ol>`);
}
/* The theme changing while the server room is open (the OS's light and dark, or the page's own switch; dd's verification
   D3): the 3D is made again in the new colours, the camera where it was. */
function srRetheme() {
  const V = SR.view;
  if (SR.phase !== 'open' || !V || V.dark === isDark()) return;
  const pos = V.camera.position.clone(), target = V.controls.target.clone();
  srBuild();
  const W = SR.view;
  W.camera.position.copy(pos); W.controls.target.copy(target); W.controls.update();
  srLog(`色を${W.dark ? 'ダーク' : 'ライト'}に合わせた`);
}
if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', srRetheme);
new MutationObserver(srRetheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
$('sr-back').addEventListener('click', srClose);
$('sr-fit').addEventListener('click', () => srFit(false));
$('sr-zin').addEventListener('click', () => srZoomBy(1 / SR.zoomStep));
$('sr-lines').addEventListener('change', () => {
  SR.lines = $('sr-lines').value;
  srLog(`線: ${$('sr-lines').selectedOptions[0].textContent}`);
  if (SR.view) srLinesMode(SR.view);
});
$('sr-zout').addEventListener('click', () => srZoomBy(SR.zoomStep));
$('sr-board').addEventListener('click', (e) => {
  const pv = e.target.closest('[data-sr-prov]');
  if (pv) {   // a cloud on the legend: toggled; 全部 clears the choice
    const p = pv.dataset.srProv;
    if (!p) SR.only = new Set(); else if (SR.only.has(p)) SR.only.delete(p); else SR.only.add(p);
    srLog(SR.only.size ? `絞り: ${[...SR.only].join(', ')}` : '絞り: 全部');
    srBuild();
    return;
  }
  const b = e.target.closest('[data-sr-act]');
  if (!b) return;
  if (b.dataset.srAct === 'focus') srFocusSelected();
  else if (b.dataset.srAct === 'toggle') srToggleGroup(b.dataset.srGroup);
});
$('sr-env').addEventListener('change', () => { srLog(`環境を ${$('sr-env').value || '（なし）'} にした`); srBuild(); });
$('sr-fold').addEventListener('change', () => { srLog($('sr-fold').checked ? '細かいものを出した' : '細かいものを畳んだ'); srBuild(); });
for (const [btn, el] of [['sr-board-btn', 'sr-board'], ['sr-log-btn', 'sr-log']]) {
  $(btn).addEventListener('click', () => {
    const show = $(el).hidden;
    $(el).hidden = !show; $(btn).setAttribute('aria-pressed', String(show));
    if (el === 'sr-log' && show) srRenderLog();
    if (SR.view) srResize(SR.view);
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (SR.phase === 'loading') { e.preventDefault(); e.stopPropagation(); srCancel(); return; }
  if (SR.phase === 'open') { e.preventDefault(); e.stopPropagation(); srClose(); }
}, true);
// ---- web/js/57-fulltext.js ----
/* ---------- the whole text of a line cut to one (2.3.6, requester 10-19: "これテストのパスが見えないからホバーで全部表示されるようにしてほしい") ----------
   One component for every one-line ellipsis of the robot card and the side panel (the family: FULLTEXT_LINES; the table is
   in the ticket 2026-10-19-jui-viz-test-run-path-on-hover). A line that is cut (scrollWidth > clientWidth) shows a floating
   tag with its whole text, wrapped, when the pointer is over it or the keyboard focus reaches it; the tag's text can be
   selected and copied; it sits just left of the card or the panel (fulltextPlace, 10-20) and goes when the pointer or the focus
   leaves (the pointer: after the time to cross to the tag), or on Esc. A line that is not cut never gets it. Not the native title: slow, and the OS cuts a long one.
   Focus: a cut line that is plain text becomes focusable (tabindex 0) only while it is cut; a line inside a button or a
   summary (already focusable) shows through that control's focus. The control or the line points at the tag
   (aria-describedby) while the tag shows. */
const FULLTEXT_HOSTS = ['#rb', '#side', '#ticker-strip'];
/* The log strip (2.3.6) sits at the bottom of the screen, below the scene: its tag sits on the scene's bottom (fulltextPlace).
   Closed (2.3.4's log-strip), its lines are not drawn: never cut, never focusable. */
const FULLTEXT_LINES = [
  '.rb-run-file',                 // card · テスト実行: the test file / command (the request)
  '.rb-subs .act',                // card · サブエージェント: what each is doing
  '.h-head',                      // card · 応答の履歴: a folded item's head (in its summary)
  '.h-tool summary > b',          // card · 応答の履歴: a tool's name (in its summary)
  '#sessions .act',               // panel · セッション: a robot's act, the row's second line
  '#sessions .subs .who-btn > span:last-child',   // panel · セッション: a subagent's name (in its button)
  '.spec-row .nm',                // panel · spec の進み具合: the spec's name (in its button)
  '.pg-toggle small',             // panel · セッション: a project group's summary (in its button)
  '#ticker .what',                // the log strip: an event's text (2.3.6: a cross-session message was cut there)
  '#ticker .kind',                // the log strip: an event's kind
  '.talk-peer-name',                // card · トーク (2.3.6): the peer's name in the talk's header (in its button)
  '.talk-row-name',                  // card · トーク: a peer's name in the list of talks (in its button)
].join(', ');
const FULLTEXT = { el: null, anchor: null, owner: null, host: null, via: null, soon: 0 };
const fulltextCut = (el) => !!el && el.isConnected && el.scrollWidth > el.clientWidth + 1;
const fulltextControl = (el) => el.closest('button, summary, a[href]');   // already focusable: the line shows through it
function fulltextHost(el) { return FULLTEXT_HOSTS.map((s) => document.querySelector(s)).find((h) => h && h.contains(el)) || null; }
function fulltextEl() {
  if (FULLTEXT.el) return FULLTEXT.el;
  const el = document.createElement('div');
  el.id = 'fulltext'; el.className = 'fulltext'; el.setAttribute('role', 'tooltip'); el.hidden = true;
  el.addEventListener('pointerleave', (e) => { if (!(FULLTEXT.anchor && FULLTEXT.anchor.contains(e.relatedTarget))) fulltextHide(); });
  document.body.append(el);
  FULLTEXT.el = el;
  return el;
}
function fulltextShow(line, via) {
  const host = fulltextHost(line);
  if (!host || !fulltextCut(line)) return;
  const el = fulltextEl();
  if (FULLTEXT.anchor !== line) fulltextHide();
  el.textContent = line.textContent;
  el.hidden = false;
  const owner = fulltextControl(line) || line;
  owner.setAttribute('aria-describedby', 'fulltext');
  Object.assign(FULLTEXT, { anchor: line, owner, host, via });
  fulltextPlace();
}
/* Where the tag goes. 2.3.8 put it at the 3D's left edge (requester 10-20 morning: 「いやホバーで出る位置をもっと左にしてよ」 —
   beside its line it covered the card); that was far from the line (requester 10-20 afternoon: 「ホバーで横に出す件だけど、
   今度は遠すぎる ボードのすぐ横に出て欲しい」; ticket 2026-10-20-jui-viz-fulltext-float-next-to-the-card). The rule now:
     * the 3D left free: the scene's box, less the robot card when it is open (a side card: what is left of it; a bottom
       sheet, narrow: what is above it);
     * the board the tag stands beside (fulltextBoard): the card when it is open at the side (the wide card too), else, for
       a line of the side panel, the panel; the tag's right edge is FULLTEXT_GAP left of the board's left edge, never on
       the board; it may cover the 3D and a robot (requester 10-20: 「いいよ」);
     * no board (the log strip, a bottom sheet): at the left of the free box, FULLTEXT_PAD in (2.3.8); and when the tag does
       not fit left of the board, at that same left edge;
     * as wide as its text needs up to min(FULLTEXT_MAX_W, FULLTEXT_SHARE of the free box's width) (2.3.8: a long text
       keeps a readable width);
     * its top is level with the line, moved up or down to stay inside the free box (the log strip's line is below the
       scene: the tag sits on the scene's bottom, above the strip); taller than the free box, it scrolls inside. */
const FULLTEXT_PAD = 16, FULLTEXT_GAP = 8, FULLTEXT_MAX_W = 420, FULLTEXT_SHARE = 0.4;
function fulltextFree() {
  const sb = sceneEl.getBoundingClientRect();
  const f = { left: Math.max(sb.left, 0), top: Math.max(sb.top, 0), right: Math.min(sb.right, window.innerWidth), bottom: Math.min(sb.bottom, window.innerHeight) };
  const card = document.getElementById('rb');
  if (card && !card.hidden) {
    const cb = card.getBoundingClientRect();
    if (cb.left > f.left + (f.right - f.left) * 0.25) f.right = Math.min(f.right, cb.left);   // a side card
    else f.bottom = Math.min(f.bottom, cb.top);                                                 // a bottom sheet
  }
  return f;
}
function fulltextBoard(f) {
  const host = FULLTEXT.host;
  if (!host || host.id === 'ticker-strip') return null;
  const card = document.getElementById('rb');
  const box = card && !card.hidden ? card.getBoundingClientRect() : host.id === 'side' ? host.getBoundingClientRect() : null;
  return box && box.left >= f.right - 1 && box.left > f.left ? box : null;   // right of the free box (not a bottom sheet)
}
function fulltextPlace() {
  const { el, anchor } = FULLTEXT;
  if (!el || el.hidden || !anchor) return;
  const lb = anchor.getBoundingClientRect(), f = fulltextFree(), board = fulltextBoard(f);
  const w = Math.max(0, Math.min(FULLTEXT_MAX_W, (f.right - f.left) * FULLTEXT_SHARE));
  const h = Math.max(0, f.bottom - f.top - FULLTEXT_PAD * 2);
  el.style.maxWidth = `${Math.floor(w)}px`;
  el.style.maxHeight = `${Math.floor(h)}px`;
  el.style.left = '0px'; el.style.top = '0px';
  const r = el.getBoundingClientRect();
  const x = board ? Math.max(f.left + FULLTEXT_PAD, board.left - FULLTEXT_GAP - r.width) : f.left + FULLTEXT_PAD;
  const y = Math.max(f.top + FULLTEXT_PAD, Math.min(lb.top, f.bottom - FULLTEXT_PAD - r.height));
  el.style.left = `${Math.round(x)}px`; el.style.top = `${Math.round(y)}px`;
}
function fulltextHide() {
  if (FULLTEXT.owner) FULLTEXT.owner.removeAttribute('aria-describedby');
  if (FULLTEXT.el) FULLTEXT.el.hidden = true;
  Object.assign(FULLTEXT, { anchor: null, owner: null, host: null, via: null });
}
/* Plain cut lines take the focus while they are cut, and only then (re-checked when the card or the panel changes). */
function fulltextSync() {
  for (const host of FULLTEXT_HOSTS.map((s) => document.querySelector(s)).filter(Boolean)) {
    for (const line of host.querySelectorAll(FULLTEXT_LINES)) {
      if (fulltextControl(line)) continue;
      const cut = fulltextCut(line);
      if (cut && line.getAttribute('tabindex') !== '0') line.setAttribute('tabindex', '0');
      else if (!cut && line.hasAttribute('tabindex')) line.removeAttribute('tabindex');
    }
  }
  if (FULLTEXT.anchor && !FULLTEXT.anchor.isConnected) fulltextHide();   // the card was rebuilt under it
  else fulltextPlace();
}
const fulltextLineAt = (t) => (t && t.closest ? t.closest(FULLTEXT_LINES) : null);
document.addEventListener('pointerover', (e) => {
  const line = fulltextLineAt(e.target);
  if (line && fulltextHost(line) && fulltextCut(line)) fulltextShow(line, 'pointer');
});
document.addEventListener('pointerout', (e) => {
  if (FULLTEXT.via !== 'pointer' || !FULLTEXT.anchor) return;
  const to = e.relatedTarget;
  if (FULLTEXT.anchor.contains(e.target) && !(to && (FULLTEXT.anchor.contains(to) || FULLTEXT.el.contains(to)))) fulltextHideSoon();
});
/* The tag is away from its line (left of the card): the pointer crossing to it, to select its text, passes over the card
   first. It goes FULLTEXT_TRAVEL_MS after the pointer left the line, unless by then the pointer is on the tag
   or back on the line. */
const FULLTEXT_TRAVEL_MS = 700;
function fulltextHideSoon() {
  const anchor = FULLTEXT.anchor;
  clearTimeout(FULLTEXT.soon);
  FULLTEXT.soon = setTimeout(() => {
    if (FULLTEXT.anchor !== anchor || FULLTEXT.via !== 'pointer') return;
    if (FULLTEXT.el.matches(':hover') || (anchor.isConnected && anchor.matches(':hover'))) return;
    fulltextHide();
  }, FULLTEXT_TRAVEL_MS);
}
/* A press anywhere but the tag and its line, while it is crossing time: the pointer is not on its way to the tag. */
document.addEventListener('pointerdown', (e) => {
  if (FULLTEXT.via !== 'pointer' || !FULLTEXT.anchor || !FULLTEXT.el) return;
  if (FULLTEXT.el.contains(e.target) || FULLTEXT.anchor.contains(e.target)) return;
  fulltextHide();
}, true);
document.addEventListener('focusin', (e) => {
  const t = e.target;
  // a box focused by the mouse (the history pane takes the focus on a click) shows nothing: only a keyboard visit
  // to a box names its first cut line (10-20: the tag of an unrelated line popped up under the pointer and took the click)
  const viaKeys = !!(t.matches && t.matches(':focus-visible'));
  const line = t.matches && t.matches(FULLTEXT_LINES) ? t : viaKeys ? [...(t.querySelectorAll ? t.querySelectorAll(FULLTEXT_LINES) : [])].find(fulltextCut) : null;
  if (line && fulltextHost(line) && fulltextCut(line)) fulltextShow(line, 'focus');
  else if (FULLTEXT.via === 'focus') fulltextHide();
});
document.addEventListener('focusout', (e) => {
  if (FULLTEXT.via === 'focus' && FULLTEXT.owner && FULLTEXT.owner.contains(e.target) && !(e.relatedTarget && FULLTEXT.owner.contains(e.relatedTarget))) fulltextHide();
});
document.addEventListener('keydown', (e) => {   // first (capture): Esc closes the tag, not the card under it
  if (e.key !== 'Escape' || !FULLTEXT.el || FULLTEXT.el.hidden) return;
  e.preventDefault(); e.stopPropagation();
  fulltextHide();
}, true);
{
  let due = false;
  const later = () => { if (due) return; due = true; requestAnimationFrame(() => { due = false; fulltextSync(); }); };
  const mo = new MutationObserver(later), ro = new ResizeObserver(later);
  for (const host of FULLTEXT_HOSTS.map((s) => document.querySelector(s)).filter(Boolean)) {
    mo.observe(host, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class'] });
    ro.observe(host);
  }
  document.addEventListener('scroll', () => { if (FULLTEXT.anchor) fulltextPlace(); }, true);
  window.addEventListener('resize', later);
}
// ---- web/js/58-talk.js ----
/* ---------- トーク: a robot's SendMessage conversations, as a chat (2.3.6, requester 10-20) ----------
   「チャットアイコンをロボットのメニューに置いて、それ選んだらラインのトークっぽい画面でトークの一覧が表示される。トーク選ぶと詳細で
   トークが見れる。新しいメッセージ受信したら一覧では通知が出て詳細ではメッセージが表示される。」 and (00:54) 「トークの詳細でヘッダーに
   相手のbot名表示しってタップでそのbotに切り替えられるようにして。名前は一行で入らないなら省略で」.
   The rulings (TALK_CONTRACT.md): read only — no box, no button and no request that sends; no browser notification (the
   badge and the order of the list are the news); a talk whose peer ended goes when the server removes it.

   The wire is talk_contract.json (version 2): the page asks talk.open / talk.get / talk.seen / talk.close and hears
   talk.list / talk.messages / talk.update / talk.badges. Every request is built by talkFrame, which checks it against the
   contract's rules first and refuses (null, nothing sent) what would not conform; tests/test_viz_talk_ui_frames.py runs
   the block below under node and validates what it builds with talk_contract.validate, and pins these rules to the JSON.
   Text from a transcript goes in through textContent (histMarkdown: escaped Markdown), never innerHTML. */
/* talk-frames:begin */
const TALK_RULES = {
  agentId: '^[A-Za-z0-9_.:@-]+$', agentIdMax: 128,
  convId: '^t-[0-9a-f]{16}$',
  messageId: '^(m|u|r)-[A-Za-z0-9_.:@-]+$', messageIdMin: 3, messageIdMax: 200,
  pageMax: 100,
};
const TALK_FIELDS = {   // the keys each request may carry (required first), as the contract's requests
  'talk.open': { need: ['type', 'reqId', 'agentId'], may: [] },
  'talk.close': { need: ['type'], may: ['reqId'] },
  'talk.get': { need: ['type', 'reqId', 'agentId', 'convId'], may: ['before', 'limit'] },
  'talk.seen': { need: ['type', 'reqId', 'agentId', 'convId', 'upTo'], may: [] },
};
const talkIsInt = (v) => typeof v === 'number' && Number.isInteger(v);
const talkOkAgent = (v) => typeof v === 'string' && v.length >= 1 && v.length <= TALK_RULES.agentIdMax && new RegExp(TALK_RULES.agentId).test(v);
const talkOkConv = (v) => typeof v === 'string' && new RegExp(TALK_RULES.convId).test(v);
const talkOkMessage = (v) => typeof v === 'string' && v.length >= TALK_RULES.messageIdMin && v.length <= TALK_RULES.messageIdMax && new RegExp(TALK_RULES.messageId).test(v);
/* Every way a request breaks the contract (empty: it conforms). */
function talkCheck(f) {
  const spec = f && typeof f === 'object' ? TALK_FIELDS[f.type] : null;
  if (!spec) return ['not a talk request'];
  const out = [];
  for (const k of spec.need) if (!(k in f)) out.push(`missing ${k}`);
  for (const k of Object.keys(f)) if (!spec.need.includes(k) && !spec.may.includes(k)) out.push(`unexpected ${k}`);
  if ('reqId' in f && !(talkIsInt(f.reqId) || typeof f.reqId === 'string')) out.push('reqId');
  if ('agentId' in f && !talkOkAgent(f.agentId)) out.push('agentId');
  if ('convId' in f && !talkOkConv(f.convId)) out.push('convId');
  if ('before' in f && !talkOkMessage(f.before)) out.push('before');
  if ('limit' in f && !(talkIsInt(f.limit) && f.limit >= 1 && f.limit <= TALK_RULES.pageMax)) out.push('limit');
  if ('upTo' in f && !(talkIsInt(f.upTo) && f.upTo >= 0)) out.push('upTo');
  return out;
}
/* A request of `type` from `fields` (undefined fields left out), or null when it would not conform. */
function talkFrame(type, fields) {
  const f = { type };
  for (const [k, v] of Object.entries(fields || {})) if (v !== undefined) f[k] = v;
  return talkCheck(f).length ? null : f;
}
/* talk-frames:end */

const TALK_END_PX = 24;        // this close to the bottom counts as at the end (as the history's)
const TALK = {
  on: false,                   // the talk pane shows on the card (instead of its tabs)
  owner: null, agent: null,    // the card's robot (label) and its agentId
  opened: null,                // the agentId this socket has talk.open'd
  list: null, more: false, listError: '', listAt: 0,
  conv: null,                  // the talk shown in detail (convId), or null: the list
  want: null,                  // a talk to show once the card has switched to the peer (the header's press)
  msgs: new Map(),             // convId -> { items, more, busy, error, loaded }
  seenSent: new Map(),         // `${agent}|${convId}` -> upTo sent
  seenWant: new Map(),         // `${agent}|${convId}` -> the newest at seen on screen, not sent yet
  badges: {},                  // agentId -> unread (talk.badges; robots at 0 are not in it)
  sent: [], refused: [],       // the requests sent and refused, for the tests (the last 200)
  page: 30,                    // messages a talk.get asks for (≤ pageMax)
  seq: 0, node: null, nodes: new Map(), atEnd: true, top: 0, newer: false, note: '',
};
const talkNow = () => Date.now();
function talkTime(at, short) {
  if (!Number.isFinite(at)) return '';
  const d = new Date(at), n = new Date(talkNow());
  const hm = d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === n.toDateString()) return hm;
  return short ? `${d.getMonth() + 1}/${d.getDate()}` : `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}

/* ---------- requests ---------- */
function talkSend(type, fields) {
  const reqId = type === 'talk.close' ? undefined : `tk${++TALK.seq}`;
  const frame = talkFrame(type, { reqId, ...fields });
  if (!frame) { TALK.refused.push({ type, fields }); TALK.refused.splice(0, TALK.refused.length - 200); return Promise.resolve({ ok: false, error: 'refused' }); }
  TALK.sent.push(frame); TALK.sent.splice(0, TALK.sent.length - 200);
  return SOURCE.talkSend(frame);
}
/* The socket follows the card: the robot on the card is the one open (its list and its updates), none when it closes. */
function talkFollow(agent) {
  if (agent === TALK.opened) return;
  if (!agent) { if (TALK.opened) talkSend('talk.close', {}); TALK.opened = null; return; }
  TALK.opened = agent;
  TALK.list = null; TALK.listError = ''; TALK.more = false; TALK.msgs.clear(); TALK.nodes.clear();
  talkSend('talk.open', { agentId: agent }).then((got) => {
    if (TALK.opened !== agent || got.ok) return;
    TALK.listError = got.error === 'offline' ? 'サーバーにつながっていない（つながると読み直す）' : `トークを読めない（${got.error || '不明'}）`;
    talkRender();
  });
}
/* The socket closed or came back (live): the server forgot what was open, so it is opened again. */
function talkConn(state) {
  if (state === 'connected') { const a = TALK.opened; TALK.opened = null; if (a) { talkFollow(a); if (TALK.conv) talkLoad(TALK.conv, false); } }
  else if (TALK.opened && !TALK.list) { TALK.listError = 'サーバーにつながっていない（つながると読み直す）'; talkRender(); }
}
async function talkLoad(convId, older) {
  const agent = TALK.agent;
  if (!agent || !convId) return;
  const box = TALK.msgs.get(convId) || { items: [], more: false, busy: false, error: '', loaded: false };
  TALK.msgs.set(convId, box);
  if (box.busy || (older && (!box.more || !box.items.length))) return;
  box.busy = true; box.error = '';
  talkRender();
  const got = await talkSend('talk.get', { agentId: agent, convId, before: older ? box.items[0].id : undefined, limit: TALK.page });
  box.busy = false;
  if (TALK.agent !== agent || TALK.msgs.get(convId) !== box) return;
  if (!got.ok || !got.data || !Array.isArray(got.data.items)) {
    box.error = got.error === 'offline' ? 'サーバーにつながっていない（つながると読み直す）' : `メッセージを読めない（${got.error || '不明'}）`;
  } else {
    const pane = talkPane(), keep = older && pane ? pane.scrollHeight - pane.scrollTop : null;
    talkMerge(box, got.data.items);
    if (older || !box.loaded) box.more = !!got.data.more;
    box.loaded = true;
    talkRender();
    if (keep !== null && pane) { pane.scrollTop = pane.scrollHeight - keep; TALK.top = pane.scrollTop; }
    return;
  }
  talkRender();
}
const talkOkMsg = (m) => m && typeof m === 'object' && talkOkMessage(m.id) && Number.isFinite(m.at) && (m.dir === 'in' || m.dir === 'out') && typeof m.text === 'string';
function talkMerge(box, items) {
  const byId = new Map(box.items.map((m) => [m.id, m]));
  for (const m of items) if (talkOkMsg(m)) byId.set(m.id, m);
  box.items = [...byId.values()].sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/* ---------- what the server sends ---------- */
const talkOkConvRow = (c) => c && typeof c === 'object' && talkOkConv(c.id) && c.peer && typeof c.peer === 'object' && Number.isFinite(c.lastAt);
function talkSortList() { if (TALK.list) TALK.list.sort((a, b) => b.lastAt - a.lastAt || (a.id < b.id ? -1 : 1)); }
function talkReceive(f) {
  if (!f || typeof f !== 'object') return;
  if (f.type === 'talk.badges') {
    const counts = {};
    for (const [k, v] of Object.entries(f.counts && typeof f.counts === 'object' ? f.counts : {})) if (talkOkAgent(k) && talkIsInt(v) && v > 0) counts[k] = v;
    TALK.badges = counts;
    talkPaintButton();
    return;
  }
  if (f.agentId !== TALK.opened) return;   // another robot's (the socket moved on)
  if (f.type === 'talk.list') {
    TALK.list = (Array.isArray(f.items) ? f.items : []).filter(talkOkConvRow);
    TALK.more = !!f.more; TALK.listError = '';
    talkSortList();
    talkRender();
    return;
  }
  if (f.type !== 'talk.update' || !Array.isArray(f.ops)) return;
  let newHere = false;
  for (const op of f.ops) {
    if (!op || typeof op !== 'object') continue;
    if (op.op === 'conv' && talkOkConvRow(op.conv)) {
      if (!TALK.list) continue;
      const k = TALK.list.findIndex((c) => c.id === op.conv.id);
      if (k >= 0) TALK.list[k] = op.conv; else TALK.list.push(op.conv);
    } else if (op.op === 'message' && talkOkConv(op.convId) && talkOkMsg(op.message)) {
      const box = TALK.msgs.get(op.convId);
      if (box && box.loaded) {
        const had = box.items.some((m) => m.id === op.message.id);
        talkMerge(box, [op.message]);
        if (!had && op.convId === TALK.conv) newHere = true;
      }
    } else if (op.op === 'remove' && talkOkConv(op.convId)) {
      if (TALK.list) TALK.list = TALK.list.filter((c) => c.id !== op.convId);
      TALK.msgs.delete(op.convId);
      if (TALK.conv === op.convId) {
        TALK.conv = null;
        TALK.note = op.reason === 'owner-ended' ? 'このロボットのセッションが終わって 1 時間たったので、トークは消えた' : '相手のセッションが終わって 1 時間たったので、トークは消えた';
      }
    }
  }
  talkSortList();
  if (newHere && !TALK.atEnd) TALK.newer = true;
  talkRender();
}

/* ---------- the pane ---------- */
function talkPane() { return TALK.node ? TALK.node.querySelector('[data-tk-body]') : null; }
function talkBuildNode() {
  const root = hNode('section', 'tk');
  root.dataset.talk = '';
  root.setAttribute('aria-label', 'トーク');
  const head = hNode('div', 'talk-head'); head.dataset.tkHead = '';
  const body = hNode('div', 'talk-body'); body.dataset.tkBody = ''; body.tabIndex = 0;
  const newer = hNode('button', 'h-newer talk-newer', '新しいメッセージ ↓'); newer.type = 'button'; newer.dataset.tkNewer = ''; newer.hidden = true;
  const foot = hNode('p', 'talk-foot', '見るだけ（トークからは送れない）');
  root.append(head, body, newer, foot);
  body.addEventListener('scroll', () => talkRemember(body), { passive: true });
  root.addEventListener('click', talkClick);
  return root;
}
function talkRemember(pane) {
  if (!TALK.conv) return;
  TALK.top = pane.scrollTop;
  TALK.atEnd = pane.scrollHeight - pane.scrollTop - pane.clientHeight < TALK_END_PX;
  if (TALK.atEnd && TALK.newer) { TALK.newer = false; talkPaintNewer(); }
  const box = TALK.msgs.get(TALK.conv);
  if (box && box.more && !box.busy && pane.scrollTop < 40) talkLoad(TALK.conv, true);   // read up: the page before
}
function talkToEnd() {
  const pane = talkPane();
  if (!pane) return;
  TALK.atEnd = true; TALK.newer = false;
  pane.scrollTop = pane.scrollHeight;
  TALK.top = pane.scrollTop;
  talkPaintNewer();
}
function talkPaintNewer() { const b = TALK.node && TALK.node.querySelector('[data-tk-newer]'); if (b) b.hidden = !(TALK.newer && TALK.conv); }

function talkPeerMark(peer) {
  const label = SOURCE.talkLabel(peer.agentId);
  const span = hNode('span', 'talk-mark');
  span.setAttribute('aria-hidden', 'true');
  if (label && DEF[label]) {   // the robot's mark, as pill() draws it (built as nodes here)
    const role = DEF[label].role, mark = hNode('span', 'pill', label);
    mark.style.setProperty('--c', pillBg(role)); mark.style.setProperty('--t', pillInk(role));
    span.appendChild(mark);
  }
  else span.appendChild(hNode('span', `talk-kind talk-kind-${peer.kind}`, peer.kind === 'external' ? '外' : peer.kind === 'subagent' ? 'サブ' : '？'));
  return span;
}
const TALK_KIND = { session: 'セッション', subagent: 'サブエージェント', external: 'この機械の外の相手' };
function talkGoneText(peer) {
  if (peer.alive) return '';
  return Number.isFinite(peer.removeAt) ? `終了 · ${talkTime(peer.removeAt)} に消える` : '終了';
}
function talkHead() {
  const head = TALK.node.querySelector('[data-tk-head]');
  const conv = TALK.conv && TALK.list ? TALK.list.find((c) => c.id === TALK.conv) : null;
  const sig = JSON.stringify([TALK.owner, TALK.conv, conv && conv.peer, NAMES.rev]);
  if (head._sig === sig) return;
  head._sig = sig;
  const fk = head.contains(document.activeElement) ? document.activeElement.dataset.fk : undefined;
  const kids = [];
  if (!TALK.conv) {
    const back = hNode('button', 'wb-btn talk-back', '← カードに戻る'); back.type = 'button'; back.dataset.tkClose = ''; back.dataset.fk = 'talk-close';
    const title = hNode('h3', 'talk-title', 'トーク');
    kids.push(back, title);
  } else {
    const back = hNode('button', 'wb-btn talk-back', '← 一覧'); back.type = 'button'; back.dataset.tkBack = ''; back.dataset.fk = 'talk-back';
    back.setAttribute('aria-label', 'トークの一覧に戻る');
    kids.push(back);
    if (conv) {
      const p = conv.peer;
      // The peer's name, one line (cut with … : the whole name on hover and focus, 57-fulltext.js). Pressed: that robot.
      const who = p.agentId ? hNode('button', 'talk-peer') : hNode('span', 'talk-peer talk-peer-off');
      if (p.agentId) { who.type = 'button'; who.dataset.tkPeer = p.agentId; who.dataset.fk = 'talk-peer'; who.setAttribute('aria-label', `${p.name || '相手'} に切り替える`); }
      else who.title = 'この機械で見えない相手（切り替えられない）';
      who.append(talkPeerMark(p), hNode('span', 'talk-peer-name', p.name || '（名前なし）'));
      const sub = hNode('p', 'talk-peer-sub', [TALK_KIND[p.kind] || '', talkGoneText(p)].filter(Boolean).join(' · '));
      const box = hNode('div', 'talk-peer-box'); box.append(who, sub);
      kids.push(box);
    }
  }
  head.replaceChildren(...kids);
  if (fk !== undefined) { const again = head.querySelector(`[data-fk="${CSS.escape(fk)}"]`); if (again) again.focus({ preventScroll: true }); }
}
function talkRow(c) {
  const b = hNode('button', 'talk-row');
  b.type = 'button'; b.dataset.tkConv = c.id; b.dataset.fk = `talk-${c.id}`;
  if (!c.peer.alive) b.classList.add('talk-row-gone');
  const top = hNode('span', 'talk-row-top');
  top.append(hNode('span', 'talk-row-name', c.peer.name || '（名前なし）'), hNode('time', 'talk-row-at', talkTime(c.lastAt, true)));
  const bottom = hNode('span', 'talk-row-bottom');
  bottom.append(hNode('span', 'talk-row-pre', `${c.lastDir === 'out' ? '自分: ' : ''}${c.preview}`));
  if (c.unread > 0) { const u = hNode('span', 'talk-unread', c.unread > 99 ? '99+' : String(c.unread)); u.dataset.tkUnread = String(c.unread); bottom.append(u); }
  const text = hNode('span', 'talk-row-text'); text.append(top, bottom);
  const gone = talkGoneText(c.peer);
  if (gone) text.append(hNode('span', 'talk-row-gone-note', gone));
  b.append(talkPeerMark(c.peer), text);
  b.setAttribute('aria-label', `${c.peer.name}、${talkTime(c.lastAt)}、${c.unread ? `未読 ${c.unread}、` : ''}${c.preview}`);
  return b;
}
const TALK_STATE = { read: '既読', delivered: '届いた', sent: '送信済み', undelivered: '届かなかった' };
function talkMsgSig(m) { return JSON.stringify([m.id, m.state, m.readAt, m.deliveredAt, m.text, m.cut, m.merged, m.dir]); }
function talkMsgNode(m) {
  const n = hNode('div', `talk-msg talk-${m.dir === 'out' ? 'out' : 'in'}`);
  n.dataset.tkMsg = m.id;
  n._at = m.at; n._dir = m.dir;
  const bubble = hNode('div', 'talk-bubble');
  if (m.state === 'undelivered') bubble.classList.add('talk-undelivered');
  const text = hNode('div', 'talk-text talk-folded');
  text.dataset.tkText = '';
  text.appendChild(histMarkdown(m.text));
  const more = hNode('button', 'talk-more', '全文を表示'); more.type = 'button'; more.dataset.tkMore = ''; more.hidden = true;
  bubble.append(text, more);
  if (m.cut) bubble.appendChild(hNode('p', 'talk-note', '（長いので途中まで）'));
  if (m.merged) bubble.appendChild(hNode('p', 'talk-note', '（受け手は 2 通をまとめて受け取った）'));
  const meta = hNode('p', 'talk-meta');
  meta.appendChild(hNode('time', 'talk-at', talkTime(m.at)));
  if (m.dir === 'out') {
    const st = hNode('span', `talk-state talk-state-${m.state}`, m.state === 'read' && Number.isFinite(m.readAt) ? `既読 ${talkTime(m.readAt)}` : TALK_STATE[m.state] || '');
    st.dataset.tkState = m.state;
    if (m.state === 'undelivered') st.title = '相手に届かなかった（この機械にいない、または名前が解けなかった）';
    meta.appendChild(st);
  }
  if (m.via === 'subagent' || m.via === 'parent') meta.appendChild(hNode('span', 'talk-via', m.via === 'subagent' ? 'サブエージェントへ' : '親へ'));
  n.append(bubble, meta);
  return n;
}
/* A long text is folded to three lines (as the history's messages from other sessions); 全文を表示 or a press on the text
   opens it, and a press on the opened text folds it again — not while text is selected, not on a link or a control. */
function talkMeasure() {
  const pane = talkPane();
  if (!pane || !pane.offsetParent) return;
  for (const t of pane.querySelectorAll('[data-tk-text]')) {
    if (t._measured) continue;
    if (!t.clientHeight) continue;
    t._measured = true;
    const long = t.scrollHeight > t.clientHeight + 1;
    t._long = long;
    t.classList.toggle('talk-folded', long);
    t.classList.toggle('talk-foldable', long);
    const more = t.parentNode.querySelector('[data-tk-more]');
    if (more) more.hidden = !long;
  }
}
function talkFold(text, open) {
  const more = text.parentNode.querySelector('[data-tk-more]');
  text.classList.toggle('talk-folded', !open);
  if (more) { more.textContent = open ? 'たたむ' : '全文を表示'; more.setAttribute('aria-expanded', String(open)); }
  if (!open) {   // folded: its start stays in view
    const pane = talkPane(), msg = text.closest('.talk-msg');
    if (pane && msg && msg.getBoundingClientRect().top < pane.getBoundingClientRect().top) msg.scrollIntoView({ block: 'nearest' });
  }
}
function talkClick(e) {
  const t = e.target;
  if (t.closest('[data-tk-close]')) { talkShow(false); return; }
  if (t.closest('[data-tk-back]')) { TALK.conv = null; TALK.note = ''; talkRender(); const r = TALK.node.querySelector('[data-tk-conv]'); (r || TALK.node.querySelector('[data-tk-close]')).focus({ preventScroll: true }); return; }
  const row = t.closest('[data-tk-conv]');
  if (row) { talkOpenConv(row.dataset.tkConv); return; }
  const peer = t.closest('[data-tk-peer]');
  if (peer) { talkSwitch(peer.dataset.tkPeer); return; }
  if (t.closest('[data-tk-newer]')) { talkToEnd(); return; }
  if (t.closest('[data-tk-older]')) { talkLoad(TALK.conv, true); return; }
  const more = t.closest('[data-tk-more]');
  if (more) { const text = more.parentNode.querySelector('[data-tk-text]'); talkFold(text, text.classList.contains('talk-folded')); return; }
  const text = t.closest('[data-tk-text]');
  if (text && text._long) {
    if (t.closest('a, button, input, textarea, select, pre, .h-tablewrap')) return;   // its own action, or a box that scrolls
    const sel = window.getSelection && window.getSelection();
    if (sel && !sel.isCollapsed && text.contains(sel.anchorNode)) return;           // selecting text, not pressing
    talkFold(text, text.classList.contains('talk-folded'));
  }
}
function talkOpenConv(convId) {
  TALK.conv = convId; TALK.note = ''; TALK.atEnd = true; TALK.newer = false; TALK.nodes.clear();
  const box = TALK.msgs.get(convId);
  talkRender();
  if (!box || !box.loaded) talkLoad(convId, false);
  const back = TALK.node.querySelector('[data-tk-back]'); if (back) back.focus({ preventScroll: true });
}
/* The header's name pressed: the card switches to that robot, its talk open on this same conversation (a talk's id is
   the same seen from either side). A peer not on this page says so and stays. */
function talkSwitch(agentId) {
  const label = SOURCE.talkLabel(agentId);
  if (!label || !DEF[label]) { showToast('このロボットは今この画面にいない（切り替えられない）'); return; }
  if (label === TALK.owner) return;
  TALK.want = TALK.conv;
  openRobot(label);
}
function talkBody() {
  const pane = talkPane();
  if (!TALK.conv) {
    const sig = JSON.stringify(['list', TALK.list, TALK.listError, TALK.note, TALK.more]);
    if (pane._sig === sig) return;
    pane._sig = sig;
    const fk = pane.contains(document.activeElement) ? document.activeElement.dataset.fk : undefined;
    const kids = [];
    if (TALK.note) kids.push(hNode('p', 'talk-empty talk-gone-note', TALK.note));
    if (TALK.listError) kids.push(hNode('p', 'talk-empty talk-error', TALK.listError));
    else if (!TALK.list) kids.push(hNode('p', 'talk-empty', '読み込み中…'));
    else if (!TALK.list.length) kids.push(hNode('p', 'talk-empty', 'まだトークがない（このロボットが SendMessage で送った・受け取った会話がここに出る）'));
    else {
      const ul = hNode('ul', 'talk-list');
      for (const c of TALK.list) { const li = hNode('li'); li.appendChild(talkRow(c)); ul.appendChild(li); }
      kids.push(ul);
      if (TALK.more) kids.push(hNode('p', 'talk-empty', `新しい ${TALK.list.length} 件だけを表示`));
    }
    pane.replaceChildren(...kids);
    pane.scrollTop = 0;
    if (fk !== undefined) { const again = pane.querySelector(`[data-fk="${CSS.escape(fk)}"]`); if (again) again.focus({ preventScroll: true }); }
    return;
  }
  const box = TALK.msgs.get(TALK.conv) || { items: [], loaded: false, busy: true };
  const sig = JSON.stringify(['conv', TALK.conv, box.items.map(talkMsgSig), box.more, box.busy, box.error, box.loaded]);
  if (pane._sig === sig) return;
  pane._sig = sig;
  const keepTop = !TALK.atEnd && pane.firstChild ? talkAnchor(pane) : null;
  const kids = [];
  if (box.more) {
    const older = hNode('button', 'talk-older', box.busy ? '読み込み中…' : 'さらに前を読み込む'); older.type = 'button'; older.dataset.tkOlder = '';
    kids.push(older);
  }
  if (box.error) kids.push(hNode('p', 'talk-empty talk-error', box.error));
  if (!box.loaded && !box.error) kids.push(hNode('p', 'talk-empty', '読み込み中…'));
  else if (box.loaded && !box.items.length) kids.push(hNode('p', 'talk-empty', 'まだメッセージがない'));
  let day = '';
  const keep = new Map();
  for (const m of box.items) {
    const d = new Date(m.at).toDateString();
    if (d !== day) { day = d; const dt = new Date(m.at); kids.push(hNode('p', 'talk-day', `${dt.getMonth() + 1}月${dt.getDate()}日`)); }
    const ms = talkMsgSig(m), old = TALK.nodes.get(m.id);
    const node = old && old.sig === ms ? old.node : talkMsgNode(m);
    keep.set(m.id, { sig: ms, node });
    kids.push(node);
  }
  TALK.nodes = keep;
  pane.replaceChildren(...kids);
  talkObserve(pane);
  requestAnimationFrame(() => {
    talkMeasure();
    if (TALK.atEnd) talkToEnd();
    else if (keepTop) talkRestoreAnchor(pane, keepTop);
  });
  talkPaintNewer();
}
function talkAnchor(pane) {
  const top = pane.getBoundingClientRect().top;
  for (const n of pane.querySelectorAll('[data-tk-msg]')) if (n.getBoundingClientRect().bottom > top + 1) return { id: n.dataset.tkMsg, y: n.getBoundingClientRect().top - top };
  return null;
}
function talkRestoreAnchor(pane, a) {
  const n = [...pane.querySelectorAll('[data-tk-msg]')].find((x) => x.dataset.tkMsg === a.id);
  if (n) pane.scrollTop += n.getBoundingClientRect().top - pane.getBoundingClientRect().top - a.y;
  TALK.top = pane.scrollTop;
}

/* ---------- seen: what came in and was on screen, told to the server (talk.seen) ----------
   A message from the peer counts as seen when at least half of it has been in the pane while the talk shows and the
   tab is visible. The newest such time goes out as upTo, once per new value; the server recounts the unread and answers
   with a conv op and, when a total changed, talk.badges. */
const talkSeenIO = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting || !TALK.conv || !TALK.agent) continue;
    const n = e.target;
    if (n._dir !== 'in') continue;
    const k = `${TALK.agent}|${TALK.conv}`;
    if (!(n._at <= (TALK.seenWant.get(k) || -1))) TALK.seenWant.set(k, n._at);
  }
  talkSeenFlush();
}, { threshold: 0.5 }) : null;
let talkSeenRoot = null;
function talkObserve(pane) {
  if (!talkSeenIO) return;
  if (talkSeenRoot !== pane) talkSeenRoot = pane;
  talkSeenIO.disconnect();
  for (const n of pane.querySelectorAll('.talk-msg.talk-in')) talkSeenIO.observe(n);
}
function talkSeenFlush() {
  if (document.visibilityState !== 'visible' || !TALK.on || !TALK.conv || !TALK.agent) return;
  const k = `${TALK.agent}|${TALK.conv}`, want = TALK.seenWant.get(k);
  if (!Number.isFinite(want) || want <= (TALK.seenSent.get(k) || -1)) return;
  TALK.seenSent.set(k, want);
  talkSend('talk.seen', { agentId: TALK.agent, convId: TALK.conv, upTo: Math.max(0, Math.round(want)) });
}
document.addEventListener('visibilitychange', talkSeenFlush);

/* ---------- the card ---------- */
function talkRender() {
  if (!TALK.node) return;
  talkHead();
  talkBody();
  talkPaintButton();
}
/* The chat button's unread badge: talk.badges, the server's totals per robot. */
function talkPaintButton() {
  const b = rbEl.querySelector('[data-rb-talk]');
  if (!b) return;
  const n = (TALK.agent && TALK.badges[TALK.agent]) || 0;
  const badge = b.querySelector('[data-rb-talk-n]');
  const text = n > 99 ? '99+' : String(n);
  if (badge) { badge.hidden = !n; if (badge.textContent !== text) badge.textContent = text; }
  const label = n ? `トーク（未読 ${n}）` : 'トーク';
  if (b.getAttribute('aria-label') !== label) b.setAttribute('aria-label', label);
  if (b.getAttribute('aria-pressed') !== String(TALK.on)) b.setAttribute('aria-pressed', String(TALK.on));
}
function talkShow(on) {
  TALK.on = !!on && !!rbState.id;
  if (!TALK.on) { TALK.conv = null; TALK.note = ''; }
  talkSync();
  const again = rbEl.querySelector(TALK.on ? '[data-tk-close]' : '[data-rb-talk]');
  if (again) again.focus({ preventScroll: true });
}
/* After every renderRobot (and when the card closes): the socket follows the card's robot, and the pane takes the
   card's place below its head while it is on. */
function talkSync() {
  const robot = rbEl.hidden ? null : rbState.id;
  const agent = robot ? SOURCE.talkAgentId(robot) : null;
  if (robot !== TALK.owner) {
    TALK.owner = robot; TALK.agent = agent;
    TALK.conv = robot && TALK.want ? TALK.want : null;
    TALK.want = null; TALK.note = ''; TALK.atEnd = true; TALK.newer = false; TALK.nodes.clear();
    if (!robot) TALK.on = false;
    if (TALK.node) { const p = talkPane(); if (p) p._sig = ''; TALK.node.querySelector('[data-tk-head]')._sig = ''; }
  }
  TALK.agent = agent;
  talkFollow(agent);
  if (TALK.on && TALK.conv && TALK.agent && !(TALK.msgs.get(TALK.conv) || {}).loaded && !(TALK.msgs.get(TALK.conv) || {}).busy && !(TALK.msgs.get(TALK.conv) || {}).error) talkLoad(TALK.conv, false);
  rbEl.classList.toggle('rb-talking', TALK.on);
  if (TALK.on) {
    if (!TALK.node) TALK.node = talkBuildNode();
    if (TALK.node.parentNode !== rbEl) {
      const head = rbEl.querySelector('.rb-head');
      if (head) head.after(TALK.node); else rbEl.appendChild(TALK.node);
      const pane = talkPane();
      requestAnimationFrame(() => { talkMeasure(); if (TALK.atEnd) talkToEnd(); else pane.scrollTop = TALK.top; });
    }
    if (HIST.compose) HIST.compose.hidden = true;
    talkRender();
  } else if (TALK.node && TALK.node.parentNode) TALK.node.remove();
  // The card was rebuilt (50-panel.js keyed) with the focus in the talk pane, put back only now: the focus goes back too.
  const lost = rbEl._lostFk;
  rbEl._lostFk = undefined;
  const again = lost !== undefined && TALK.on && TALK.node ? TALK.node.querySelector(`[data-fk="${CSS.escape(lost)}"]`) : null;
  if (again) again.focus({ preventScroll: true });
  talkPaintButton();
}
rbEl.addEventListener('click', (e) => { if (e.target.closest('[data-rb-talk]') && rbState.id) talkShow(!TALK.on); });
// ---- web/js/60-log.js ----

/* ---------- full-screen event log ---------- */
let logSeq = 0;
const logItems = [];
const CAT_LABEL = { tool: 'ツール', spec: 'spec', test: 'テスト', task: 'タスク', session: '許可・停止' };
const kindCat = (k) => (/^(Read|Edit|Write|Bash|MCP)$/.test(k) ? 'tool' : k === 'spec 更新' ? 'spec' : /^(case|retry)/.test(k) ? 'test' : /^Task/.test(k) ? 'task' : 'session');
/* Live events carry their category (plan 04 §2); the demo's are read from the kind. */
const catOf = (e) => e.cat || kindCat(e.kind);
function payloadFor(e) {
  if (SOURCE.mode === 'live') return e.detail === undefined ? { kind: e.kind, text: e.what } : e.detail;
  const cat = kindCat(e.kind), sess = SESSION_OF[e.who];
  if (e.kind === 'PermissionRequest' && e.perm) return permRequestPayload(PERM_BY_ID[e.perm]);
  if (e.decision) return { source: 'エージェントビュー → Claude Code（PermissionRequest フックへの応答）', ...permResponse(PERM_BY_ID[e.perm], e.decision, e.reason) };
  if (cat === 'spec') { const [file, section] = e.what.split(' › '); return { source: 'ファイル監視（可視化サーバー）', event: 'change', path: `docs/screens/json/${file}`, section }; }
  if (cat === 'test') return { source: 'jsonui-test-runner（追加予定の進捗出力）', file: 'tests/screens/cart.test.json', case: e.what, status: e.kind === 'retry' ? 'retrying' : e.kind.includes('✗') ? 'failed' : 'passed' };
  const p = { hook_event_name: cat === 'tool' ? 'PreToolUse' : e.kind, session_id: SESSION_UUID[sess], cwd: CWD[sess] };
  if (AGENT_ID[e.who]) { p.agent_id = AGENT_ID[e.who]; p.agent_type = DEF[e.who].agent; }
  if (['Read', 'Edit', 'Write'].includes(e.kind)) { p.tool_name = e.kind; p.tool_input = { file_path: `${CWD[sess]}/${e.what}` }; }
  else if (e.kind === 'Bash') { p.tool_name = 'Bash'; p.tool_input = { command: e.what }; }
  else if (e.kind === 'MCP') { const [server, tool, ...rest] = e.what.split(' '); p.tool_name = `mcp__${server}__${tool}`; p.tool_input = { target: rest.join(' ') }; }
  else if (e.kind === 'PermissionRequest') { p.tool_name = 'Bash'; p.tool_input = { command: e.what.replace(/^Bash /, '') }; }
  else if (e.kind === 'PostToolUse') { p.tool_name = ['a5', 'f2'].includes(e.who) ? 'mcp__jui-tools__jui_verify' : 'Bash'; p.tool_response = { summary: e.what }; }
  else if (e.kind.startsWith('Task')) { const m = e.what.match(/^#(\d+) (.*)$/); p.task_id = m ? m[1] : ''; p.task_subject = m ? m[2] : e.what; }
  else if (e.kind === 'Stop' || e.kind === 'SubagentStop') p.last_assistant_message = e.what;
  return p;
}
const logState = { open: false, cats: new Set(Object.keys(CAT_LABEL)), hiddenRobots: new Set(), q: '', expanded: new Set(), shownTop: null, opener: null };
const logOverlay = $('log-overlay'), logRows = $('log-rows'), logBody = $('log-body');
$('log-cats').innerHTML = Object.entries(CAT_LABEL).map(([k, v]) => `<button type="button" class="fbtn" data-cat="${esc(k)}" aria-pressed="true">${esc(v)}</button>`).join('');
function toggleIn(set, key, btn) { if (set.has(key)) set.delete(key); else set.add(key); btn.setAttribute('aria-pressed', String(set.has(key))); }
$('log-cats').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (b) { toggleIn(logState.cats, b.dataset.cat, b); renderLog(true); } });
$('log-search').addEventListener('input', (e) => { logState.q = e.target.value.trim().toLowerCase(); renderLog(true); });
$('log-follow').addEventListener('change', () => renderLog(true));
$('log-more').addEventListener('click', () => { renderLog(true); logBody.scrollTop = 0; });
logRows.addEventListener('click', (e) => {
  const tr = e.target.closest('tr.ev');
  if (!tr) return;
  const key = tr.dataset.key;
  if (logState.expanded.has(key)) logState.expanded.delete(key); else logState.expanded.add(key);
  renderLog(true);
});
logRows.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr.ev')) { e.preventDefault(); e.target.click(); } });
function openLog(opener) { logState.open = true; logState.opener = opener; logOverlay.hidden = false; renderLog(true); $('log-close').focus(); }
function openLogFor(id, opener) {
  if (!inScope(projectOfRobot(id))) setProject(projectOfRobot(id), { camera: false });
  logState.hiddenRobots = new Set(ROBOT_DEFS.map((d) => d.id).filter((r) => r !== id));
  paintScopeButtons();
  openLog(opener);
}
function closeLog() { logState.open = false; logOverlay.hidden = true; if (logState.opener) logState.opener.focus(); }
$('btn-log').addEventListener('click', (e) => openLog(e.currentTarget));
/* The log strip can be closed (requester, 10-19): the strip goes, the scene and the panel take its height, and
   「ログを開く」 floats at the bottom right. Remembered in this browser (readPref / writePref: a blocked storage only
   forgets it). Closed, the strip still gets every event (renderTicker keeps writing it), so it opens on the latest. */
const LOG_STRIP = { open: true };
function placeStripOpen() {   // the panel's foot while the panel shows, else floating over the scene's corner
  const sideShown = !document.querySelector('.main').classList.contains('side-closed');
  $('side-foot').hidden = LOG_STRIP.open || !sideShown;
  $('btn-strip-open-float').hidden = LOG_STRIP.open || sideShown;
}
function setLogStrip(open, { save = true, focus = false } = {}) {
  LOG_STRIP.open = open;
  document.querySelector('.app').classList.toggle('log-closed', !open);
  placeStripOpen();
  for (const id of ['btn-strip-close', 'btn-strip-open', 'btn-strip-open-float']) $(id).setAttribute('aria-expanded', String(open));
  if (save) writePref('logStrip', open ? 'open' : 'closed');
  if (open) renderTicker();
  if (focus) (open ? $('btn-strip-close') : $('btn-strip-open').offsetParent ? $('btn-strip-open') : $('btn-strip-open-float')).focus();
}
$('btn-strip-close').addEventListener('click', () => setLogStrip(false, { focus: true }));
$('btn-strip-open').addEventListener('click', () => setLogStrip(true, { focus: true }));
$('btn-strip-open-float').addEventListener('click', () => setLogStrip(true, { focus: true }));
new MutationObserver(placeStripOpen).observe(document.querySelector('.main'), { attributes: true, attributeFilter: ['class'] });
setLogStrip(readPref('logStrip', 'open') !== 'closed', { save: false });
$('log-close').addEventListener('click', closeLog);
function renderLog(force) {
  if (!logState.open) return;
  const follow = $('log-follow').checked;
  const list = logItems.filter((e) => logState.cats.has(catOf(e)) && inScope(projectOfRobot(e.who)) && !logState.hiddenRobots.has(e.who) && (!logState.q || `${e.who} ${e.kind} ${e.what}`.toLowerCase().includes(logState.q)));
  $('log-count').textContent = `${list.length} 件（全 ${logItems.length} 件）`;
  setText($('log-title'), UI.project === 'all' ? 'イベントログ' : `イベントログ · ${PROJECT[UI.project].name}`);
  const more = $('log-more');
  if (!follow && !force && logState.shownTop !== null) {
    const newer = list.filter((e) => e.seq > logState.shownTop).length;
    more.hidden = newer === 0;
    more.textContent = `新着 ${newer} 件を表示`;
    return;
  }
  more.hidden = true;
  logState.shownTop = list.length ? list[0].seq : 0;
  const rowsHTML = list.slice(0, 400).map((e) => {
    const cat = catOf(e), d = DEF[e.who], open = logState.expanded.has(String(e.seq));
    const rowHTML = `<tr class="ev" tabindex="0" data-key="${e.seq}" aria-expanded="${open ? 'true' : 'false'}"><td class="time">${fmtClock(BASE_CLOCK + e.abs)}</td><td class="who">${pill(e.who, d.role)} ${esc(d.agent)}</td><td><span class="cat cat-${esc(cat)}">${esc(e.kind)}</span></td><td class="what">${esc(e.what)}</td></tr>`;
    const note = SOURCE.mode === 'live' ? 'サーバーが受けた入力（長いものは切り詰め）' : e.decision ? 'ビューで押した答えを Claude Code へ返す内容の例' : cat === 'spec' || cat === 'test' ? '可視化サーバーが作るイベントの例' : 'フック入力の例（項目名は実際と同じ。値はデモ）';
    return open ? `${rowHTML}<tr class="payload"><td colspan="4"><p>${esc(note)}</p><pre>${esc(JSON.stringify(payloadFor(e), null, 2))}</pre></td></tr>` : rowHTML;
  }).join('');
  setHTML(logRows, rowsHTML || '<tr><td colspan="4" class="log-empty">条件に合うイベントがありません</td></tr>');
  if (follow) logBody.scrollTop = 0;
}
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!popEl.hidden) { e.preventDefault(); closePop(); return; }
  if (logState.open) { e.preventDefault(); closeLog(); }
  else if (ds.open) { e.preventDefault(); closeDataDocs(); }   // the data server's sheet (2.3.5)
  else if (pr.open) { e.preventDefault(); closePrices(); }   // the 単価 sheet (2.3.6)
  else if (rbState.id && HIST.wide) { e.preventDefault(); histSetWide(false); }   // the wide history: back to the card's width first
  else if (rbState.id) { e.preventDefault(); closeRobot({ byHand: true }); }
  else if (wb.open) {
    e.preventDefault();
    if (narrowWb() && wbSideOpen) { wbSideOpen = false; applyWbSide(); } else closeWhiteboard();
  } else if (tb.open) { e.preventDefault(); if (tb.detail) closeTaskDetail(); else closeTaskBoard(); }
  else if (has3D && liveSolo() && !TOWER.on && !e.target.closest('input, textarea, select')) { e.preventDefault(); setProject('all'); }   // one room → the floor
});

// ---- web/js/70-main.js ----
/* ---------- controls and main loop ---------- */
// Demo: the script's clock, with play / speed. Live: the wall clock (the local time of day in seconds), no
// controls; the state comes from the server (25-net.js).
let simT = START_AT, prevSim = -0.001, playing = true, speed = 1, lastMs = performance.now(), lastPanel = -1e9, lastBoard = -1e9;
$('btn-play').addEventListener('click', (e) => { playing = !playing; e.currentTarget.textContent = playing ? '一時停止' : '再生'; e.currentTarget.setAttribute('aria-pressed', String(!playing)); });
$('btn-speed').addEventListener('click', (e) => { speed = speed === 1 ? 3 : 1; e.currentTarget.textContent = `速度 ×${speed}`; });

/* ?fps=1: frames per second in the corner, from the requestAnimationFrame intervals (plan 10 §7). */
const fpsMeter = new URLSearchParams(location.search).get('fps') === '1' ? { el: document.createElement('p'), n: 0, from: performance.now() } : null;
if (fpsMeter) { fpsMeter.el.className = 'fps-meter'; fpsMeter.el.setAttribute('aria-hidden', 'true'); document.body.append(fpsMeter.el); }

/* The real time between two frames drives what animates (a pose blending into the next, eases, the camera following),
   up to FRAME_DT_MAX: on a busy machine the page draws a frame every second or more, and a step capped at 0.05 s made
   all of it crawl (a 0.4 s pose blend took 8 frames however far apart; ticket 2026-10-19-jui-viz-walk-stretches-with-
   frame-gaps). Past 1 s everything that eases has arrived anyway; what steps physics (the vacuum's collisions, falling
   petals, smoke, the shredder's bits) keeps its own 0.1 s step. The demo's script clock keeps the 0.05 s step: it
   plays its script frame by frame and must not jump. */
const FRAME_DT_MAX = 1;
function frame(ms) {
  const rawDt = Math.max(0, (ms - lastMs) / 1000);
  const dt = Math.min(0.05, rawDt);
  lastMs = ms;
  if (SOURCE.mode === 'demo') {
    if (playing) simT += dt * speed;
    const t = ((simT % LOOP) + LOOP) % LOOP;
    emitEvents(prevSim, simT); prevSim = simT;
    latestModel = computeModel(t, Math.floor(simT / LOOP));
    VIZ_CLOCK.at = demoClockMs(t);   // the demo clock (5:00 → 23:00 a loop): the sky and b4's hours
    updateRobotStates(simT, t, latestModel.perms);
  } else {
    simT = secOfDay(Date.now());
    latestModel = computeModel();
  }
  if (has3D) {
    if (ms - lastBoard > 200 && !TOWER.on) { redrawBoards(latestModel, ms / 1000); lastBoard = ms; }   // the building hides the boards
    update3D(latestModel, ms / 1000, Math.min(FRAME_DT_MAX, rawDt));
    billsFrame(ms);   // 54-bills.js
  }
  if (ms - lastPanel > 250) {
    renderPanel(latestModel);
    renderTicker();
    renderWhiteboard(latestModel, false);
    renderTaskBoard(latestModel);
    renderRobot(latestModel);
    renderLog(false);
    pricesPanel();
    $('chip-clock').textContent = fmtClock(BASE_CLOCK + simT);
    if (SOURCE.mode === 'live') liveChrome();
    floorNavSync();
    if (SOURCE.mode === 'demo') { const el = $('demo-clock'); el.hidden = false; setText(el, `デモの時計 ${fmtClock(Math.floor(demoHour(latestModel.t) * 3600)).slice(0, 5)}（早回し）`); }
    lastPanel = ms;
  }
  if (fpsMeter) {
    fpsMeter.n += 1;
    if (ms - fpsMeter.from >= 1000) { fpsMeter.el.textContent = `${Math.round((fpsMeter.n * 1000) / (ms - fpsMeter.from))} fps`; fpsMeter.n = 0; fpsMeter.from = ms; }
  }
  requestAnimationFrame(frame);
}

/* ---------- live only: the connection chip, no-session and source-error notes (plan 07 §5) ---------- */
function liveChrome() {
  if (SOURCE.mode !== 'live') return;
  renderUsage(vizNow());   // the time to each reset counts down between slices
  const chip = document.querySelector('.chip.demo');
  if (chip) {
    const ok = NET.state === 'connected';
    setText(chip, ok ? '接続中' : NET.state === 'connecting' && !LIVE.connectedOnce ? '接続しています…' : '再接続中…');
    chip.dataset.conn = ok ? 'ok' : 'wait';
  }
  const empty = $('live-empty');
  if (empty) empty.hidden = !SOURCE.connected || SESSIONS.length > 0;
  const err = $('live-error');
  if (err) { err.hidden = !LIVE.serverError; setText(err, LIVE.serverError ? `取得元の故障: ${LIVE.serverError}` : ''); }
}
if (SOURCE.mode === 'live') {
  document.body.dataset.mode = 'live';
  const hookChip = document.querySelector('.chips .chip[title="フックの受け口"]');
  if (hookChip) hookChip.textContent = location.host;
  for (const id of ['btn-play', 'btn-speed']) $(id).hidden = true;   // demo only
  liveChrome();
}

if (SOURCE.mode === 'demo') updateRobotStates(simT, START_AT, latestModel.perms);
paintScopeButtons();
renderPanel(latestModel);
if (UI.project !== 'all' && SOURCE.mode === 'demo') focusProject(UI.project, true);
const redrawAll = () => { fontRedraws.forEach((fn) => fn()); if (has3D) redrawBoards(latestModel, 0, true); };
Promise.all([
  document.fonts.load(`40px ${FONT_DISPLAY}`, 'a0!仕様書ログインテスト実行タスクボード'),
  document.fonts.load(`700 40px ${FONT_MONO}`, '{ }$✓▶○⚠#'),
  document.fonts.load(`700 16px ${FONT_BODY}`, 'ログインカート購入する未着手待ち作業中完了'),
]).then(redrawAll, redrawAll);
requestAnimationFrame(frame);
if (SOURCE.mode === 'live') { LIVE.uiReady = true; netConnect(); }
