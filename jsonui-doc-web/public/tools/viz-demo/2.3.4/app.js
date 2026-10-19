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
  main: { name: 'メイン', color: '#ff7a3d' },
  define: { name: 'define', color: '#7d5cff' },
  ground: { name: 'ground', color: '#b07a52' },
  implement: { name: 'implement', color: '#2f80ed' },
  navigation: { name: 'navigation', color: '#10a693' },
  test: { name: 'test', color: '#3fae4a' },
  debug: { name: 'debug', color: '#f0b400' },
  other: { name: 'その他', color: '#8a9bb0' },
};
const COL = {
  shell: '#e8ecf3', limb: '#394150', screen: '#0f1830', eye: '#a6fbff',
  band: '#fffdf7', bandInk: '#d62839', wood: '#c99f73', woodDark: '#9e7752',
  laptop: '#c9d0db', phone: '#1f2532',
};
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
function drawFace(ctx, mode) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);
  rr(ctx, 3, 3, W - 6, H - 6, 34); ctx.fillStyle = COL.screen; ctx.fill();
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
  }
  ctx.lineWidth = 6; ctx.beginPath();
  if (mode === 'happy') ctx.arc(cx, 86, 14, Math.PI * 0.1, Math.PI * 0.9);
  else if (mode === 'wide') ctx.arc(cx, 98, 7, 0, Math.PI * 2);
  else if (mode === 'focus') { ctx.moveTo(cx - 9, 97); ctx.lineTo(cx + 9, 97); }
  else ctx.arc(cx, 86, 10, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  ctx.restore();
  if (mode === 'tired') {                                  // bags under the eyes
    ctx.strokeStyle = 'rgba(170, 120, 255, 0.85)'; ctx.lineWidth = 4;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + side * dx, ey + 26, 15, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
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
  const accent = ROLES[r.role].color;
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
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'; ctx.font = `700 11px ${FONT_MONO}`; ctx.fillText('9:41', sx + 12, sy + 17); ctx.fillRect(sx + sw - 32, sy + 8, 18, 9);
  ctx.fillStyle = '#ffffff'; ctx.font = `700 19px ${FONT_BODY}`; ctx.fillText('ログイン', sx + 14, sy + 50);
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
  ctx.fillStyle = '#ffffff'; ctx.font = `700 15px ${FONT_BODY}`; ctx.textAlign = 'center'; ctx.fillText('ログイン', sx + sw / 2, by + 26);
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
    confetti: ['#d62839', '#ffb020', '#35d07f', '#2f80ed', '#7d5cff', '#ff7a3d'].map((c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })),
  };
}

/* ---------- the robot ---------- */
function faceToward(obj, target) {
  const m = new THREE.Matrix4().lookAt(target, obj.position, UP);
  obj.quaternion.setFromRotationMatrix(m);
}
function createRobot({ label = 'a0', role = 'main', state = 'idle', seed = 0, furnished = false }) {
  const g = S.geo, m = S.mat;
  const r = { label, role, state, prev: state, blend: 1, seed, props: {}, faceMode: '', nextBlink: 1 + (seed % 2), blinkEnd: 0, termAt: 0, phoneAt: 0,
    tired: false, needDrink: false, drinks: 0, gesture: null, hand: null, heavy: false, sweat: null };
  r.furnished = furnished;
  r.accent = toon(ROLES[role].color);
  r.lampMat = new THREE.MeshBasicMaterial({ color: LAMP.idle });
  r.logoCanvas = makeCanvas(96, 64);
  r.logoTex = texFrom(r.logoCanvas);
  r.logoMat = new THREE.MeshBasicMaterial({ map: r.logoTex, transparent: true });
  r.root = new THREE.Group();

  r.hips = new THREE.Group(); r.hips.position.y = HIPS_Y; r.root.add(r.hips);
  const pelvis = new THREE.Mesh(g.pelvis, m.limb); pelvis.position.y = 0.03; r.hips.add(pelvis);
  const leg = (x) => {
    const pivot = new THREE.Group(); pivot.position.set(x, 0, 0); r.hips.add(pivot);
    const shin = new THREE.Mesh(g.leg, m.limb); shin.position.y = -0.15; pivot.add(shin);
    const foot = new THREE.Mesh(g.foot, r.accent); foot.position.set(0, -0.31, 0.04); pivot.add(foot);
    return pivot;
  };
  r.legL = leg(0.17); r.legR = leg(-0.17);

  r.torso = new THREE.Group(); r.hips.add(r.torso);
  const body = new THREE.Mesh(g.torso, m.shell); body.position.y = 0.32; r.torso.add(body);
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
    const upper = new THREE.Mesh(g.arm, m.limb); upper.position.y = -0.18; pivot.add(upper);
    const hand = new THREE.Mesh(g.hand, m.shell); hand.position.y = -0.38; pivot.add(hand);
    return pivot;
  };
  r.armL = arm(0.42); r.armR = arm(-0.42);
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
    case 'background': {   // at its desk, watching the screen while the work runs in the background
      const look = reduceMotion ? 0 : Math.sin(s * 0.35);
      p.torsoX = 0.04; p.headX = 0.22 + look * 0.02; p.headY = look * 0.06; p.hipsY = reduceMotion ? 0 : Math.sin(s * 1.4) * 0.006;
      p.aLx = -0.85; p.aLz = -0.28; p.aRx = -0.85; p.aRz = 0.28;   // hands resting on the desk
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
  const heavy = r.heavy && HEAVY_OK.has(r.state);
  const a = poseFor(r.prev, s), b = heavy ? poseFor('typing', s * 2.4) : poseFor(r.state, s);   // heavy: fast typing
  sweatUpdate(r, s, heavy);
  const p = {};
  for (const k in b) p[k] = a[k] + (b[k] - a[k]) * e;
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
  if (mode === 'normal' || mode === 'focus' || mode === 'tired') {
    if (s > r.nextBlink) { r.blinkEnd = s + 0.12; r.nextBlink = s + 2.4 + Math.random() * 3.2; }
    if (s < r.blinkEnd) mode = 'blink';
  }
  if (mode !== r.faceMode) { drawFace(r.faceCtx, mode); r.faceTex.needsUpdate = true; r.faceMode = mode; }

  for (const key in r.props) {
    const pr = r.props[key];
    const k = key === r.state ? e : (key === r.prev && r.prev !== r.state ? 1 - e : 0);
    pr.group.visible = k > 0.02;
    if (!pr.group.visible) continue;
    for (const child of pr.group.children) {
      const base = child.userData.base || (child.userData.base = child.scale.clone());
      child.scale.copy(base).multiplyScalar(Math.max(0.001, k));
    }
    if (pr.update) pr.update(s);
  }
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
const ROLE_INK = { debug: '#2a2000' };
/* A session's name (/rename, `claude -n`; 10-19): the server's title, one line, at most NAME_MAX characters. Panels and
   cards show all of it next to the two-letter mark; the tag over the robot shows it alone, cut at its end with "…". */
const NAME_MAX = 80;
const sessionName = (t) => (typeof t === 'string' ? t.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX) : '');
const NAMES = { rev: 0 };   // bumped when a robot's name changes: the panels' keys carry it
const pill = (label, role) => `<span class="pill" style="--c:${ROLES[role].color};--t:${ROLE_INK[role] || '#ffffff'}">${esc(label)}</span>`;
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
  { id: 'shop', name: 'shop-app/', path: '~/work/shop-app', x0: -9.6, x1: 2.6, z0: -5.0, z1: 4.2, floor: '--floor-a', back: 3.9, left: 3.9 },
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
const demoHeavy = (id, t) => id === DEMO_BEATS.heavy[2] && t >= DEMO_BEATS.heavy[0] && t < DEMO_BEATS.heavy[1];
function robotCondition(id) {
  const t = latestModel ? latestModel.t : 0;
  return { tired: demoTired(id), hours: (vizNow() - demoDayMs()) / 3600000 - DEMO_BEATS.tired.since,
    heavy: demoHeavy(id, t) ? { reasons: ['tokens'], tokensPerMin: 3200 } : null };
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
  setWeather() { return Promise.resolve({ ok: false, error: 'demo' }); },   // the demo asks nobody about the weather
};
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
    rr(ctx, px, py, g.pillW, g.pillH, g.pillH / 2); ctx.fillStyle = ROLES[role].color; ctx.fill();
    ctx.fillStyle = ROLE_INK[role] || '#ffffff'; ctx.font = `700 ${g.pillFont}px ${FONT_MONO}`; ctx.textAlign = 'center'; ctx.fillText(s.by, px + g.pillW / 2, py + g.pillH * 0.72); ctx.textAlign = 'left';
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
        rr(ctx, nx + nw - 50, ny + 11, 40, 20, 10); ctx.fillStyle = ROLES[role].color; ctx.fill();
        ctx.fillStyle = ROLE_INK[role] || '#ffffff'; ctx.font = `700 13px ${FONT_MONO}`; ctx.textAlign = 'center'; ctx.fillText(task.owner, nx + nw - 30, ny + 26); ctx.textAlign = 'left';
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
  const accent = ROLES[r.role].color;
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
  ctx.fillStyle = '#ffffff'; ctx.font = `700 11px ${FONT_MONO}`; ctx.fillText('9:41', sx + 12, sy + 16);
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
  ctx.fillStyle = '#ffffff'; ctx.font = `700 14px ${FONT_BODY}`; ctx.textAlign = 'center'; ctx.fillText('購入する', sx + sw / 2, byBtn + 23);
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
    const tag = addTag('', `${pill(d.id, d.role)}<span class="nm"></span><span></span>`);
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
    const hit = ray.intersectObjects([boardMesh, kbMesh, trayGroup, ...PBOARDS.map((pb) => pb.mesh), ...robots.map((R) => R.robot.root)], true)[0];
    if (!hit) return null;
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
    else if (h.kind === 'tasks') { fit(h.project); openTaskBoard(canvas, undefined, h.project); }
    else if (h.kind === 'spec') { fit(SPECS[h.i].project); openWhiteboard(h.i, canvas); }
    else { fit(h.project); openWhiteboard(-1, canvas, h.project); }
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (ev.buttons || (zoom.zoomed && !rbState.id)) return;
    const h = hitAt(ev);
    canvas.style.cursor = h ? 'pointer' : '';
    canvas.title = h && (h.kind === 'floor' || h.kind === 'room') ? h.title : '';
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
  const robot = createRobot({ label: d.id, role: d.role, state: 'idle', seed: i * 1.7, furnished: true });
  robot.drawPhone = drawLivePhone;
  // a robot that comes in walks from the corridor through the doors (requester, 10-18)
  const route = d.enter ? liveRoute(null, d.room) : [];
  const start = route.length ? route[0] : d.pos || [0, 0];
  robot.root.position.set(start[0], 0, start[1]); robot.root.rotation.y = d.ry || 0;
  robot.root.userData.robotId = d.id;
  scene.add(robot.root);
  const tag = addTag('', `${pill(d.id, d.role)}<span class="nm"></span><span></span>`);
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
function liveWalk(R, dt, nowMs) {
  const root = R.robot.root, d = R.def;
  // Leaving is a state, not a layout change: start the "done, then out of the door" here.
  if (LIVE.leaving[d.id]) { if (!R.exitAt && !R.out) R.exitAt = nowMs + 2500; }
  else if (R.exitAt && !R.out) R.exitAt = 0;   // it came back before walking out
  if (R.exitAt && nowMs >= R.exitAt && !R.path.length && !R.out) {
    R.path = liveRoute(roomAtPoint([root.position.x, root.position.z]), null);   // out to the corridor
    R.out = true;
  }
  if (R.out && !R.path.length) { SOURCE.robotGone(d.id); return 'gone'; }
  const next = R.path[0];
  if (!next && R.play) {                                          // at the play spot: no desk, facing the partner
    if (R.robot.desk) R.robot.desk.visible = false;
    R.play.phase = 'playing';
    const q = R.play.partner.robot.root.position, ry = Math.atan2(q.x - root.position.x, q.z - root.position.z) + (R.play.turn || 0);
    root.rotation.y += (ry - root.rotation.y) * Math.min(1, dt * (R.play.turn !== undefined ? 12 : 6));   // highfive: turns to slap
    return 'playing';
  }
  if (!next && R.brk) return brkAt(R, dt);                        // at the smoking booth or the vending machine (10-19)
  if (!next && R.shred) {                                         // at the shredder: no desk, facing it
    if (R.robot.desk) R.robot.desk.visible = false;
    const P = PROPS.shredder, ry = P ? Math.atan2(P.x - root.position.x, P.z - root.position.z) : Math.PI;
    root.rotation.y += (ry - root.rotation.y) * Math.min(1, dt * 6);
    return 'shredding';
  }
  if (!next && R.git && R.git.phase === 'at') {                  // at the box (2.3.4): no desk of its own, facing the box
    if (R.robot.desk) R.robot.desk.visible = false;
    const q = R.git.desk, ry = Math.atan2(q[0] - root.position.x, q[1] - root.position.z);
    root.rotation.y += (ry - root.rotation.y) * Math.min(1, dt * 6);
    return 'gitbox';
  }
  if (!next && R.playBack) R.playBack = false;                    // back at its desk
  if (!next) {
    if (R.robot.desk) R.robot.desk.visible = !d.standing;
    if (Math.abs(root.rotation.y - (d.ry || 0)) > 1e-3) root.rotation.y += ((d.ry || 0) - root.rotation.y) * Math.min(1, dt * 6);
    return 'still';
  }
  const dx = next[0] - root.position.x, dz = next[1] - root.position.z, dist = Math.hypot(dx, dz);
  const step = WALK_SPEED * (SOURCE.replaySpeed > 1 ? Math.min(4, SOURCE.replaySpeed) : 1) * dt;
  if (R.robot.desk) R.robot.desk.visible = false;
  if (dist <= step || dist < 1e-3) { root.position.x = next[0]; root.position.z = next[1]; R.path.shift(); }
  else { root.position.x += (dx / dist) * step; root.position.z += (dz / dist) * step; root.rotation.y = Math.atan2(dx, dz); }
  return 'walking';
}
/* Coffee and meals, now and then (requester, 10-18): once a second each robot that is idle or at work may start
   one (probability SNACK.p, a seeded generator so a test can repeat it), while at most SNACK.share of the robots
   (at least one) are at it. Never while waiting, thinking or done (startGesture refuses), none under reduced motion. */
const SNACK = { seed: 20261018, p: 1 / 90, share: 0.15, next: 0, rng: null };
function snackRandom(seed = SNACK.seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function snackTick(t) {
  if (reduceMotion || t < SNACK.next) return;
  SNACK.next = t + 1;
  if (!SNACK.rng) SNACK.rng = snackRandom();
  const here = robots.filter((R) => !LIVE.leaving[R.def.id]);
  const cap = Math.max(1, Math.floor(here.length * SNACK.share));
  let busy = here.filter((R) => R.robot.gesture && R.robot.gesture.kind !== 'drink').length;
  for (const R of here) {
    if (busy >= cap) break;
    if (R.robot.gesture || !GESTURE_OK.has(R.robot.state)) continue;
    if (SNACK.rng() < SNACK.p && startGesture(R.robot, SNACK.rng() < 0.5 ? 'coffee' : 'meal', t)) busy += 1;
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
    const at = left.filter((R) => R.play.phase === 'playing');
    if (at.length === left.length && left.length >= 2 && !G.t0) {   // all there: the game's clock starts now
      G.t0 = nowSec; G.until = nowSec + G.len;
      left.forEach((R, i) => { R.robot.play = { kind: G.kind, t0: nowSec, side: i, seed: G.seed }; });
    }
    const end = left.length < 2 ? `alone (${why || 'partner stopped'})` : G.t0 && nowSec >= G.until ? 'done'
      : !G.t0 && nowSec >= G.walkUntil ? 'walk too long' : null;
    if (end) { playLog(G, end, nowSec); G.players = left; playEnd(G); continue; }
    if (G.t0) playMove(G, left, nowSec);
  }
  if (reduceMotion || nowSec < PLAY.next) return;
  PLAY.next = nowSec + 1;
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
    if (PLAY.rng() >= PLAY.p) continue;
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
  SOLO.next = nowSec + 1;
  const byRoom = {};
  for (const R of robots) {
    const st = robotState[R.def.id];
    if (st && playIdle(R, st, now)) (byRoom[R.def.room] = byRoom[R.def.room] || []).push(R);
  }
  for (const [room, idle] of Object.entries(byRoom)) {
    // with two or more a game comes first; one left over (or alone) may nap or eat
    if (idle.length !== 1) continue;
    const R = idle[0];
    if ((R.restUntil || 0) > nowSec || PLAY.rng() >= SOLO.p) continue;
    const kind = SOLO.kinds[Math.floor(PLAY.rng() * SOLO.kinds.length)], len = SOLO.minSec + PLAY.rng() * (SOLO.maxSec - SOLO.minSec);
    R.solo = { kind, room, t0: nowSec, until: nowSec + len, since: robotState[R.def.id].since };
    R.robot.solo = { kind, t0: nowSec };
    R.restUntil = nowSec + len + PLAY.restMinSec + PLAY.rng() * (PLAY.restMaxSec - PLAY.restMinSec);
  }
}
function liveUpdateRobots(nowSec, dt) {
  if (SOURCE.layoutRev !== LIVE3D.rev) liveSync();
  liveLinks(latestModel, nowSec);
  const nowMs = performance.now();
  // Walking uses the real time between frames (up to 1 s), not the animation's capped step: a slow frame rate
  // must not slow the walk down.
  const walkDt = LIVE3D.lastWalk ? Math.min(1, (nowMs - LIVE3D.lastWalk) / 1000) : 0;
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
    setRobotTired(R.robot, R.def.kind === 'main' && isTired(sinceOf(R.def.id), now));
    R.robot.heavy = heavyOf(R.def.id);   // fast typing and sweat while it works (the robot decides when)
    shredTick(R, st, nowSec);
    const how = liveWalk(R, walkDt, nowMs);
    if (how === 'gone') continue;
    if (how === 'shredding') shredAt(R, nowSec);
    const playing = !!(R.play || R.playBack || R.brk || R.shred);
    R.robot.lampState = playing || R.git ? st.state : null;   // to, at and back from play, a break, the shredder or the box: the real state's lamp
    const vis = R.git ? gitLook(R) : how === 'walking' ? (playing ? 'stroll' : 'carry') : how === 'playing' || how === 'shredding' ? 'idle' : st.state;
    if (vis !== R.robot.state) setRobotState(R.robot, vis);
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
  propsTick(nowSec, dt);
  shredBits(nowSec, dt);
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
  box.hidden = !solo || !has3D || TOWER.on || zoom.zoomed;
  if (solo) setText(document.getElementById('room-solo-name'), PROJECT[solo].name);
}
/* ---------- the room up close: a water server, a robot vacuum and a wooden floor (requester, 10-18) ----------
   Only in the one-room view (room-solo) and only while that room has 10 robots or fewer; built when it is wanted and
   disposed as soon as it is not (back to the floor, the building, an 11th robot). The floor's own material is swapped
   for a toon material with a canvas plank texture (512 px, repeated; no image, no light, no shadow) and put back.
   2.3.3 (requester, 10-19): a glass smoking booth and a vending machine come with them, on the same rule (the one-room
   view, PROPS.max robots or fewer); robots on a break walk to them (BRK below). Where the three stand: propsPlace. */
const PROPS = { max: 10, room: null, geo: null, dark: null, group: null, server: null, vac: null, woodMat: null, woodTex: null, floorMat: null,
  boxes: [], boxesAt: 0, rng: null, seed: 20261020, speed: 0.45, radius: 0.64, serverScale: 1.9,   // the robots' scale (they stand about 1 m)
  place: null, booth: null, vend: null, fan: null, smoke: [], shredder: null, bits: [], gitDesk: null, gitFill: null };
const PROPS_EMPTY = { room: null, geo: null, dark: null, group: null, server: null, vac: null, woodMat: null, woodTex: null, floorMat: null, boxes: [], boxesAt: 0,
  place: null, booth: null, vend: null, fan: null, smoke: [], shredder: null, bits: [], gitDesk: null, gitFill: null };
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
  const s = PROPS.server.position;
  const half = 0.42 * PROPS.serverScale;
  PROPS.boxes.push([s.x - half, s.x + half, s.z - half, s.z + half]);
  const P = PROPS.place;   // the booth and the machine with the spot in front of it (10-19), the box's desk (2.3.4)
  PROPS.boxes.push([P.booth.x0, P.booth.x1, P.booth.z0, P.booth.z1], [P.vend.x0, P.vend.x1, P.vend.z0, P.vend.spot[1] + 0.3], P.git.rect);
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
function gitTick(nowSec) {
  for (const R of robots) {
    const st = robotState[R.def.id] || { state: 'idle' }, trip = st.git;
    if (R.git) {
      // stop at once: a call, waiting (a question or a permission), an instruction or another trip, leaving
      const why = R.robot.call ? 'call' : st.state === 'waiting' ? 'waiting' : !trip || trip.stopped ? 'cleared' : trip.id !== R.git.trip.id ? 'replaced'
        : LIVE.leaving[R.def.id] ? 'leaving' : R.def.room === R.git.room && gitLaid(R) !== R.git.laid ? 'relaid' : PROPS.room !== R.def.room ? 'props' : null;   // props: the box went away (the floor, a bigger room)
      if (why) gitStop(R, why, nowSec);
      if (!R.git) continue;   // relaid: at its new desk already
      if (R.git.phase === 'going' && !R.path.length) { R.git.phase = 'at'; R.git.until = nowSec + GITBOX.atSec; }
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
  if (PROPS.room && (want !== PROPS.room || LIVE3D.rooms[PROPS.room].geo !== PROPS.geo || isDark() !== PROPS.dark)) propsClear();
  if (!want) return;
  if (!PROPS.room) propsBuild(want);
  propsBoxes(nowSec, false);
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
  return { booth, server, vend, backDoor, git: gitDeskSpot(r), shredder: shredderSpot(r) };   // the git box's desk (2.3.4, GITBOX) and the shredder (10-19)   // the git box's desk (2.3.4, GITBOX)
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
function brkAt(R, dt) {
  const B = R.brk, root = R.robot.root;
  if (R.robot.desk) R.robot.desk.visible = false;
  if (B.phase === 'going') B.phase = 'at';
  // bought: it turns round to the room with the can (its back hid the can and the machine's panel from the usual view)
  const ry = B.kind === 'vend' && R.robot.brkHandKind === 'vend' ? 0 : B.spot[2];
  const turn = ((ry - root.rotation.y) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;   // the short way round
  root.rotation.y += turn * Math.min(1, dt * 6);
  return 'playing';
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
    if (B.phase === 'at' && !B.t0) { B.t0 = nowSec; B.until = nowSec + B.len; R.robot.brk = { kind: B.kind, t0: nowSec, buySec: BRK.buySec }; }
  }
  brkSmoke(nowSec);
  if (reduceMotion || nowSec < BRK.next) return;
  BRK.next = nowSec + 1;
  const room = PROPS.room;
  if (!room || !PROPS.place || robots.some((R) => R.def.room === room && R.def.standing)) return;
  const here = robots.filter((R) => R.def.room === room);
  for (const R of here) {
    const st = robotState[R.def.id];
    if (!st || !playIdle(R, st, now) || (R.restUntil || 0) > nowSec) continue;
    for (const kind of BRK.kinds) {
      const on = here.filter((x) => x.brk && x.brk.kind === kind);
      if (on.length >= brkCap(kind)) continue;
      if (BRK.rng() >= (kind === 'smoke' && on.length ? BRK.joinP : BRK.p[kind])) continue;
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
function liveHit(ray) {
  const solo = liveSolo(), rooms = Object.entries(LIVE3D.rooms).filter(([id]) => !solo || id === solo).map(([, R]) => R);
  const targets = [...rooms.flatMap((R) => [R.pb.mesh, R.kb.mesh, ...(R.tb ? [R.tb.mesh] : [])]), ...robots.filter((R) => R.robot.root.visible).map((R) => R.robot.root)];
  const hit = ray.intersectObjects(targets, true)[0];
  if (!hit) {
    // a room's floor picks the room (the floor view only)
    const f = solo ? null : ray.intersectObjects(rooms.map((R) => R.floor), false)[0];
    const id = f && Object.keys(LIVE3D.rooms).find((k) => LIVE3D.rooms[k].floor === f.object);
    return id ? { kind: 'room', project: id, title: `${PROJECT[id].name} を選ぶ` } : null;
  }
  let o = hit.object;
  while (o && o.userData.robotId === undefined && o.parent) o = o.parent;
  if (o && o.userData.robotId !== undefined) return { kind: 'robot', id: o.userData.robotId };
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
  ctx.fillStyle = ROLES[r.role].color; ctx.fillRect(24, 24, 192, 46);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff'; ctx.font = `700 15px ${FONT_BODY}`; ctx.fillText('テスト実行', 36, 54);
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
function placeRobotTags() {
  const t0 = performance.now(), W = canvas.clientWidth, H = canvas.clientHeight, list = [];
  for (const R of robots) {
    tagNdc.copy(R.robot.root.position).add(TAG_UP);
    if (R.robot.rps && R.robot.rps.visible) tagNdc.y += TAGS.rpsLift;
    tagNdc.project(camera);
    const hidden = tagNdc.z > 1 || tagNdc.z < -1 || !R.robot.root.visible || R.tag.hidden;
    const text = R.tag.textContent;
    if (!hidden && (!R.tagSize || R.tagSize.text !== text || t0 - R.tagSize.at > TAGS.measureMs)) R.tagSize = { text, at: t0, w: R.tag.offsetWidth, h: R.tag.offsetHeight };
    list.push({ R, hidden, x: ((tagNdc.x + 1) / 2) * W, y: ((1 - tagNdc.y) / 2) * H, z: tagNdc.z });
  }
  const placed = [];
  for (const it of list.filter((q) => !q.hidden).sort((a, b) => a.z - b.z)) {   // nearest first: it keeps its spot
    const { w, h } = it.R.tagSize, x0 = it.x - w / 2, x1 = it.x + w / 2;
    let bottom = it.y;
    for (let pass = 0; pass < TAGS.maxPasses; pass++) {
      const hit = placed.find((p) => x0 < p.x1 && p.x0 < x1 && bottom - h < p.y1 && p.y0 < bottom);
      if (!hit) break;
      bottom = hit.y0 - TAGS.gap;   // just above the one it crossed
    }
    placed.push({ x0, x1, y0: bottom - h, y1: bottom });
    it.target = it.y - bottom;
  }
  for (const it of list) {   // the writes
    const el = it.R.tag;
    if (it.hidden) { el.style.visibility = 'hidden'; it.R.tagDy = 0; continue; }
    el.style.visibility = 'visible';
    const dy = it.R.tagDy === undefined ? it.target : it.R.tagDy + (it.target - it.R.tagDy) * TAGS.ease;
    it.R.tagDy = Math.abs(dy - it.target) < 0.5 ? it.target : dy;
    el.style.transform = `translate(${it.x.toFixed(1)}px, ${(it.y - it.R.tagDy).toFixed(1)}px) translate(-50%, -100%)`;
  }
  const ms = performance.now() - t0, S0 = TAGS.stats;
  S0.n = list.length; S0.frames++; S0.sumMs += ms; S0.maxMs = Math.max(S0.maxMs, ms);
}
const HEAD_UP = new THREE.Vector3(0, 2.2, 0);
const TAG_UP = new THREE.Vector3(0, 2.62, 0);
function robotPoint(id, up) { const R = robots.find((x) => x.def.id === id); return R.robot.root.position.clone().add(up); }

function update3D(model, nowSec, dt) {
  if (SOURCE.mode === 'live') { liveUpdateRobots(nowSec, dt); liveSoloSync(); }
  else {
    demoDirector(model, nowSec);
    for (const R of robots) {
      const st = robotState[R.def.id];
      setRobotTired(R.robot, demoTired(R.def.id));
      R.robot.heavy = demoHeavy(R.def.id, model.t);
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
    if (!camTween && zoom.zoomed) { const pose = robotPose(rbState.id); camera.position.lerp(pose.p, 0.08); viewTarget.lerp(pose.t, 0.08); }
  }
  stepTween(performance.now());
  if (camTween || zoom.zoomed) camera.lookAt(viewTarget); else controls.update();
  renderer.render(scene, camera);
  if (TOWER.on) { towerSync(); towerAnimate(nowSec, dt); }
  skySync();
  tagsEl.hidden = zoom.zoomed || TOWER.on;
  placeRobotTags();
  for (const rt of roomTags) { placeTag(rt.el, rt.p); rt.el.classList.toggle('on', UI.project === rt.id); }
  if (trayTag) placeTag(trayTag.el, trayTag.p);   // the demo's document tray
}
// ---- web/js/50-panel.js ----

/* ---------- side panel ---------- */
const $ = (id) => document.getElementById(id);
const setHTML = (el, html) => { if (el._html !== html) { el.innerHTML = html; el._html = html; } };
const setText = (el, text) => { if (el && el.textContent !== text) el.textContent = text; };
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
  else if (t.hasAttribute('data-rb-close')) closeRobot();
  else if (t.hasAttribute('data-set-all')) setProject('all');
});
$('chip-perm').addEventListener('click', (e) => openTaskBoard(e.currentTarget));

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
function setProject(id, { camera: moveCamera = true } = {}) {
  if (!(id === 'all' || PROJECT[id]) || UI.project === id) return;
  UI.project = id; writePref('project', id);
  if (wb.open && wb.idx >= 0 && !inScope(SPECS[wb.idx].project)) wb.idx = -1;
  if (tb.detail && !tb.detail.startsWith('perm:') && !inScope(PROJECT_OF[tb.detail.split('#')[0]])) tb.detail = null;
  if (SOURCE.mode === 'live' && has3D) liveShowFloorOf(id);   // a room on another floor: go there first
  if (SOURCE.mode === 'live') liveRelayout();                // one room at a time: the room picked, wider (or the floor again)
  if (moveCamera) focusProject(id);
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
  : q.released ? 'ターミナルに返しました' : q.waitEnded ? 'ブラウザで答えられる時間が過ぎました（だれも操作しないまま待ちが終わった）'
    : 'このセッションは答えの中継を待っていません');
function questionHTML(q) {
  const open = q.status === 'pending' && q.hookWaiting && !q.tooLongToShow;
  const closed = q.status === 'pending' && !open;
  const got = q.sentAnswers || q.gotAnswers || null;
  const itemsHTML = q.questions.map((x, i) => {
    const type = x.multiSelect ? 'checkbox' : 'radio', name = `qa-${q.id}-${i}`;
    const optsHTML = x.options.map((o, k) => `<label class="qopt"><input type="${esc(type)}" name="${esc(name)}" data-qi="${i}" data-qk="${k}"${open ? '' : ' disabled'}><span class="qlabel">${esc(o.label)}</span>${o.description ? `<span class="qdesc">${esc(o.description)}</span>` : ''}${o.preview ? `<pre class="qprev">${esc(o.preview)}</pre>` : ''}</label>`).join('');
    const otherHTML = `<label class="qopt qother"><input type="${esc(type)}" name="${esc(name)}" data-qi="${i}" data-qk="other"${open ? '' : ' disabled'}><span class="qlabel">その他（自由記述）</span><input type="text" class="qother-text" data-qi="${i}" aria-label="${esc(x.question)} への自由記述" maxlength="2000"${open ? '' : ' disabled'}></label>`;
    const answeredHTML = got && got[x.question] !== undefined ? `<p class="qgot">答え: <b>${esc(got[x.question])}</b></p>` : '';
    // answered or over: the question and its answer only
    const choicesHTML = q.status === 'pending' ? `${optsHTML}${otherHTML}` : '';
    return `<fieldset class="qq"><legend>${x.header ? `<span class="qhead">${esc(x.header)}</span>` : ''}<span class="qtext">${esc(x.question)}</span>${x.multiSelect ? '<span class="qmulti">複数選べる</span>' : ''}</legend>${choicesHTML}${answeredHTML}</fieldset>`;
  }).join('');
  // While the hook waits the terminal shows no question (measured 10-18): the time left, and the way to the terminal.
  const footHTML = open ? `<div class="qfoot"><button type="button" class="pa pa-allow" data-qsend="${esc(q.id)}" data-fk="qs-${esc(q.id)}" disabled>答えを送る</button><button type="button" class="pa pa-deny" data-qrelease="${esc(q.id)}" data-fk="qr-${esc(q.id)}">ターミナルで答える</button></div><p class="qnote">待っている間はターミナルに質問が出ない · <span data-quntil="${esc(q.id)}"></span>（操作すると延びる）</p>`
    : closed ? '' : `<p class="qnote qdone">${esc(qState(q))}</p>`;
  const whyHTML = closed ? `<p class="qnote qwhy" role="note">${esc(qWhy(q))}。ターミナルで答えてください（ここでは選べません）</p>` : '';
  return `<article class="qcard${open ? ' q-open' : ''}${closed ? ' q-closed' : ''}" data-qcard="${esc(q.id)}"><header class="qwho">${pill(q.who, DEF[q.who].role)}<span>${esc(DEF[q.who].agent)}</span><span class="pc-wait" data-since="${q.at}"></span></header>${whyHTML}${itemsHTML}${footHTML}</article>`;
}
function renderQuestions() {
  const now = Date.now();
  const shown = QUESTIONS.filter((q) => inScope(projectOfRobot(q.who)) && (q.status === 'pending' || q.status === 'sent' || now - (q.doneAt || 0) < Q_SHOW_MS));
  const waiting = QUESTIONS.filter((q) => q.status === 'pending').length;
  const chip = $('chip-ask');
  chip.hidden = waiting === 0;
  setText(chip, `質問 ${waiting}`);
  $('questions-sec').hidden = shown.length === 0;
  keyed($('questions'), JSON.stringify([NAMES.rev, ...shown.map((q) => [q.id, q.status, q.hookWaiting, q.tooLongToShow, q.waitEnded, q.released, q.sentAnswers, q.gotAnswers])]), () => shown.map((q) => questionHTML(q)).join(''));
  for (const el of $('questions').querySelectorAll('[data-quntil]')) {   // the countdown, in place (inputs keep their state)
    const q = QUESTIONS.find((x) => x.id === el.dataset.quntil);
    setText(el, q && q.waitUntil ? `あと ${Math.max(0, Math.ceil((q.waitUntil - now) / 1000))} 秒でターミナルに戻す` : '');
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
$('questions').addEventListener('input', (e) => {
  const card = e.target.closest('[data-qcard]');
  const q = card && QUESTIONS.find((x) => x.id === card.dataset.qcard);
  if (!q) return;
  // typing a free answer picks その他
  if (e.target.classList.contains('qother-text') && e.target.value) { const box = e.target.parentElement.querySelector('input[data-qk="other"]'); if (box) box.checked = true; }
  const send = card.querySelector('[data-qsend]');
  if (send) send.disabled = !questionPicks(card, q).complete;
  if (send) holdQuestion(q.id);   // someone is answering: the hook waits a little longer
});
$('questions').addEventListener('click', (e) => {
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
});
$('chip-ask').addEventListener('click', () => { const sec = $('questions-sec'); sec.scrollIntoView({ block: 'start' }); const first = sec.querySelector('input:not([disabled])'); if (first) first.focus({ preventScroll: true }); });

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
function zoomBack() {
  if (has3D && zoom.returnPose) {
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
const wb = { open: false, idx: -1, lastActive: null, q: '', app: 'all' };
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
  if (tb.open) { tb.open = false; tb.detail = null; hideOverlay(tbEl); }
  if (rbState.id) closeRobot(true);
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
  if (!wb.open) return;
  wb.open = false;
  hideOverlay(wbEl);
  zoomBack();
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

const SWATCHES = '<span><i class="sw sw-writing"></i>書き込み中</span><span><i class="sw sw-written"></i>記入済み</span><span><i class="sw sw-impl"></i>実装済み</span><span><i class="sw sw-tested"></i>テスト済み</span><span><i class="sw sw-empty"></i>未記入</span>';
/* The explanation of 「spec の進み具合」 (2.3.4, requester 10-19: "specの進み具合の説明をボードから消してその代わりに？
   ボタンおいて押したらモーダルで説明出して", for the panel and the overview alike: "同じで"). It used to sit under the
   panel's heading and over the overview's cards; now both places have a 「?」 next to the heading and both open this
   one dialog, built from this one source (the two can no longer say different things). */
const SPEC_HELP_HTML = `<p>spec ファイルの書き込みをファイル監視で追い、今どのセクションが実装・テストされているかを relatedFiles から割り出す。</p>
<p>バーは左から 概要・構造・状態・データ・操作・遷移・分岐 の 7 区分。色は次のとおり。</p>
<p class="seg-legend sh-legend">${SWATCHES}</p>
<p>右のパネルでは行を押すとホワイトボードに寄ってその spec を開く。「ボードで全部見る」の一覧では、カードを押すとその spec を開く。</p>`;
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
function wfElement([type, id, desc], state) {
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
  return `<div class="wf s-${esc(state)}"><span class="wf-id">${esc(id)}</span>${shapeHTML}</div>`;
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
  const li = (m, key, innerHTML) => `<li class="rw ${esc(m[2])}"${actAttr(m[2], key)}><span class="mk ${esc(m[1])}">${esc(m[0])}</span><span>${innerHTML}</span></li>`;
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
      const rowsHTML = items.map(([[type, id, desc], i, m]) => li(m, `c${i}`, `<span class="tp">${esc(TYPE_JA[type] || type)}</span> <span class="id">${esc(id)}</span> <span class="desc">${esc(desc)}</span>`)).join('');
      const byId = new Map(items.map((x) => [x[0][1], x]));
      const wfHTML = d.layoutChildren.filter((id) => byId.has(id)).map((id) => {
        const [c, , m] = byId.get(id);
        const state = writing ? (m[2] === 'is-new' ? 'writing' : 'defined') : !s.implPhase ? 'defined' : m[1] === 'm-done' ? 'done' : m[1] === 'm-doing' ? 'doing' : 'todo';
        return wfElement(c, state);
      }).join('');
      return `<div class="st-grid"><div class="wf-phone" role="img" aria-label="${esc((d.components[0] || [])[1] || '')} の中に並ぶ部品の配置図">${wfHTML}</div><ul class="rows">${rowsHTML}</ul></div>${moreHTML}`;
    },
    (w, writing) => {
      const rowsHTML = pick(2, d.uiVariables, reveal(d.uiVariables.length, w), writing).map(([[name, type, init], i, m]) => tr(m, `v${i}`, `<td class="mono">${esc(name)}</td><td class="mono">${esc(type)}</td><td class="mono">${esc(init)}</td>`)).join('');
      const evHTML = !writing || w >= 0.6 ? `<p class="sub-h">イベント</p><ul class="rows">${d.eventHandlers.map(([name, desc]) => `<li class="rw"><span class="mk"></span><span><span class="id">${esc(name)}</span> <span class="desc">${esc(desc)}</span></span></li>`).join('')}</ul>` : '';
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
      return `<div class="flow"><div class="fbox"><p class="fb-h">ViewModel</p><ul class="rows">${methodsHTML}</ul>${varsHTML}</div>${reposHTML}${apisHTML}</div>`;
    },
    (w, writing) => `<ul class="rows">${pick(4, d.userActions, reveal(d.userActions.length, w), writing).map(([[a, p], i, m]) => li(m, `a${i}`, `${esc(a)}<span class="to">→</span><code>${esc(p)}</code>`)).join('')}</ul>`,
    (w, writing) => `<ul class="rows">${pick(5, d.transitions, reveal(d.transitions.length, w), writing).map(([[trig, dest], i, m]) => li(m, `t${i}`, `${esc(trig)}<span class="to">→</span><span class="scr" title="${esc(dest)}">${esc(SCREEN_JA[dest] || dest)}</span>`)).join('')}</ul>`,
    (w, writing) => {
      const rowsHTML = pick(6, d.branches, reveal(d.branches.length, w), writing).map(([[method, when, then], i, m]) => tr(m, `b${i}`, `<td class="mono">${esc(method)}</td><td>${esc(when)}</td><td>${esc(then)}</td>`)).join('');
      const sheetNoteHTML = s.id === 'cart' && model.t >= 18 ? `<p class="sc-note">tests/screens/cart.test.json の 8 ケースと 1 対 1（${T.passed}/8 通過）</p>` : '';
      return `<table class="vt"><thead><tr><th><span class="sr">状態</span></th><th>メソッド</th><th>条件</th><th>結果</th></tr></thead><tbody>${rowsHTML}</tbody></table>${sheetNoteHTML}`;
    },
    () => `<ul class="files">${s.related.map(([type, path, exists], i) => {
      const now = i === s.relatedNow && s.by;
      return `<li class="${now ? 'now' : ''}"><span class="bdg">${esc(type)}</span><code>${esc(path)}</code>${exists === false ? '<span class="desc">まだ無い</span>' : ''}${now ? `<span class="editing">${pill(s.by, DEF[s.by].role)} ${s.status.kind === 'test' ? '実行中' : '編集中'}</span>` : ''}</li>`;
    }).join('')}</ul>`,
  ];
  const sheetHTML = SHEET.map(([k, title, key, wide]) => {
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
const tbEl = $('tb'), kanbanEl = $('kanban'), stripEl = $('perm-strip'), detailEl = $('tb-detail');
const tb = { open: false, detail: null, board: null };
$('tb-lanes').addEventListener('change', (e) => { UI.lanes = e.target.checked; writePref('lanes', UI.lanes ? 'on' : 'off'); renderTaskBoard(latestModel); });
function openTaskBoard(opener, detail, board) {
  if (detail !== undefined) tb.detail = detail;
  if (board !== undefined) tb.board = board;
  if (detail && !detail.startsWith('perm:') && !inScope(PROJECT_OF[detail.split('#')[0]])) setProject(PROJECT_OF[detail.split('#')[0]], { camera: false });
  if (detail && detail.startsWith('perm:') && !inScope(projectOfRobot(PERM_BY_ID[detail.slice(5)].who))) setProject(projectOfRobot(PERM_BY_ID[detail.slice(5)].who), { camera: false });
  if (wb.open) { wb.open = false; hideOverlay(wbEl); }
  if (rbState.id) closeRobot(true);
  if (tb.open) { renderTaskBoard(latestModel); if (detail) $('tbd-close').focus({ preventScroll: true }); return; }
  tb.open = true;
  zoomTo(taskPose(tb.board), opener, () => {
    if (!tb.open) return;
    showOverlay(tbEl);
    renderTaskBoard(latestModel);
    $(tb.detail ? 'tbd-close' : 'tb-close').focus({ preventScroll: true });
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
  if (!tb.open) return;
  tb.open = false; tb.detail = null;
  hideOverlay(tbEl);
  zoomBack();
}
$('tb-close').addEventListener('click', closeTaskBoard);
const COL_HINT = { todo: '担当が決まれば始められる', wait: '先に終わるタスクがある', doing: 'ロボットが今やっている', done: '' };
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const paintSince = (root, t, word) => root.querySelectorAll('[data-since]').forEach((el) => setText(el, `${word} ${mmss(Math.max(0, t - Number(el.dataset.since)))}`));
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
  stripEl.hidden = !pend.length && !alwaysRules.size && !elsewhere;
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
function focusPose(R, az, el, dist) {
  const dir = focusDir(az, el), wide = sceneEl.clientWidth > 900;
  const right = new THREE.Vector3().crossVectors(dir.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();
  const viewH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), viewW = viewH * camera.aspect;
  const t = R.robot.root.position.clone().add(new THREE.Vector3(0, 1.15, 0));
  // Wide: the card covers the right of the scene, so the robot sits left of centre. Narrow: the card is a
  // bottom sheet, so the robot sits high.
  // The wide 応答の履歴 (2.3.4, 55-history.js): the card leaves only histWideMargin() on the left, and the robot sits in its middle.
  const margin = typeof histWideMargin === 'function' ? histWideMargin() : 0;
  if (wide && margin) t.add(right.multiplyScalar(((sceneEl.clientWidth - margin) / 2 / sceneEl.clientWidth) * viewW));
  else if (wide) t.add(right.multiplyScalar((Math.min(420, sceneEl.clientWidth - 28) / 2 / sceneEl.clientWidth) * viewW));
  else t.y -= viewH * 0.2;
  return { p: t.clone().add(dir.multiplyScalar(dist)), t };
}
const shownChain = (o) => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };
const ofRobot = (o) => { for (let x = o; x; x = x.parent) if (x.userData && x.userData.robotId !== undefined) return true; return false; };
/* The meshes (walls, boards, furniture — not robots, not the selection ring) between the robot's sample points and p. */
function focusBlockers(R, p) {
  const out = new Set();
  for (const y of FOCUS_SAMPLES) {
    const from = R.robot.root.position.clone().add(new THREE.Vector3(0, y, 0)), dir = p.clone().sub(from), len = dir.length();
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
  if (wb.open) { wb.open = false; hideOverlay(wbEl); }
  if (tb.open) { tb.open = false; tb.detail = null; hideOverlay(tbEl); }
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
function closeRobot(keepZoom) {
  if (!rbState.id) return;
  rbState.id = null;
  hideOverlay(rbEl);
  histSync();
  FOCUS.id = null;      // the next robot opened chooses its view afresh
  focusFadeSync();      // everything faint gets its own material back
  if (!keepZoom) zoomBack();
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
  const next = list[i < 0 ? 0 : (i + dir + list.length) % list.length];
  if (next === rbState.id) return;
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
    return `<div class="rb-head" style="--c:${ROLES[d.role].color}"><span class="rb-badge" aria-hidden="true">${esc(id)}</span><div><h2 class="rb-name" id="rb-title">${esc(isMain ? d.title || `${id} のメインセッション` : d.agent)}</h2><p class="rb-sub">${esc(isMain ? `${d.title ? `${id} のメインセッション · ${d.head}` : d.agent} · ${room}` : `${ROLE_JA[d.role]} · ${sess} セッションのサブエージェント · ${room}`)}</p></div><div class="rb-side"><button type="button" class="wb-btn rb-clock" data-rb-clock data-fk="rb-clock" aria-haspopup="dialog" aria-describedby="rb-clock-why">退勤…</button><div class="rb-nav"><button type="button" class="rb-step" data-rb-step="-1" data-fk="rb-prev" aria-label="前のロボット（←）" title="前のロボット（←）">‹</button><button type="button" class="rb-step" data-rb-step="1" data-fk="rb-next" aria-label="次のロボット（→）" title="次のロボット（→）">›</button><button type="button" class="wb-btn" id="rb-close" data-rb-close data-fk="rb-close">← 3D に戻る</button></div></div><p class="rb-clock-why" id="rb-clock-why" data-rb-clock-why hidden></p></div>
<div class="rb-tabs"><button type="button" class="wb-btn rb-wide-btn" data-rb-wide data-fk="rb-wide" aria-pressed="false" hidden>広げる</button><div class="rb-tablist" role="tablist" aria-label="表示"><button type="button" role="tab" data-rb-tab="now" data-fk="rb-tab-now" aria-selected="true">今の様子</button><button type="button" role="tab" data-rb-tab="history" data-fk="rb-tab-history" aria-selected="false">応答の履歴</button></div></div>
<div class="rb-body rb-hist" data-rb-hist hidden aria-label="応答の履歴" tabindex="0"></div>
<div class="rb-body" tabindex="0" aria-label="今の様子">
<section class="rb-sec" aria-labelledby="rb-h-now"><h3 id="rb-h-now">今やっていること</h3><div class="rb-now"><p class="rb-state"><span class="rb-lamp" data-rb-lamp></span><b data-rb-state></b><span class="rb-since">ランプ: <span data-rb-lampname></span></span></p><p class="rb-act" data-rb-act></p><p class="rb-git" data-rb-git hidden title="Claude のセッションが Bash で撃った git push / pull だけが見える（自分のターミナル、エディタの git、GitHub での merge は見えない）"></p><p class="rb-cond" data-rb-cond></p>${spec ? `<p class="rb-spec"><button type="button" class="link-btn" data-spec-open="${specIdx}" data-fk="rb-spec">${esc(spec.name)}（${esc(spec.screen)}）の spec</button> <span data-rb-specnow></span></p><span class="rb-segs" style="--c:${ROLES[d.role].color}">${SEGS}</span>` : ''}${(SOURCE.mode === 'demo' && id === 'a2') ? '<p class="rb-test" data-rb-test></p><div class="prog" data-rb-prog role="img"><span class="p"></span><span class="r"></span></div>' : ''}</div></section>
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
  atEnd: true, top: 0, newer: false, marker: null, compose: null, sent: null, wide: false, imgs: new Map(), box: null };

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
function histFolded(cls, title, body, open) {
  const d = hNode('details', cls);
  if (open) d.open = true;
  const s = hNode('summary');
  for (const part of title) s.appendChild(part);
  d.appendChild(s);
  for (const b of body) if (b) d.appendChild(b);
  return d;
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
    n.appendChild(hNode('p', 'h-plain', item.text));
    const cut = histCutNote(item); if (cut) n.appendChild(cut);
    return n;
  }
  if (item.kind === 'peer') {
    return histFolded('h-item h-peer', [hNode('b', '', `${item.from} から`), hNode('span', 'h-head', String(item.text).split('\n').find((l) => l.trim()) || ''), at],
      [hNode('p', 'h-plain', item.text), histCutNote(item)], false);
  }
  if (item.kind === 'harness') {
    return histFolded('h-item h-harness', [hNode('b', '', item.label), hNode('span', 'h-head', 'ハーネスが入れた文'), at],
      [hNode('p', 'h-plain', item.text), histCutNote(item)], false);
  }
  if (item.kind === 'tool') {
    const first = String(item.in || '').split('\n')[0];
    const title = [hNode('b', 'h-tname', item.name), hNode('span', 'h-head', item.description || first)];
    if (item.error) title.push(hNode('span', 'h-err', 'エラー'));
    if (item.out === undefined) title.push(hNode('span', 'h-run', '結果待ち'));
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
const composeBytes = (label, text) => new TextEncoder().encode(JSON.stringify({ sessionId: SESSION_UUID[label] || '', text })).length;
const RELAY_HOW_TEXT = RELAY_HOW.replace(/<[^>]+>/g, '');   // the same how-to as on a permission card, as plain text
const composeNorm = (t) => String(t || '').split(/\s+/).join(' ').trim();
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
function composeBuild() {
  const box = hNode('div', 'h-compose');
  box.dataset.hCompose = '';
  const why = hNode('p', 'h-compose-why'); why.dataset.hWhy = '';
  const area = hNode('textarea', 'h-compose-text');
  area.rows = 3;
  area.dataset.hText = '';
  area.dataset.fk = 'rb-prompt';
  area.setAttribute('aria-label', 'このセッションへのプロンプト');
  area.placeholder = 'このセッションへのプロンプト（Enter は改行。送信は ボタン か Ctrl/⌘+Enter）';
  const row = hNode('div', 'h-compose-row');
  const state = hNode('span', 'h-compose-state'); state.dataset.hState = ''; state.setAttribute('aria-live', 'polite');
  const send = hNode('button', 'wb-btn h-compose-send', '送信…'); send.type = 'button'; send.dataset.hSend = ''; send.dataset.fk = 'rb-prompt-send';
  row.append(state, send);
  const confirm = hNode('div', 'h-confirm'); confirm.dataset.hConfirm = ''; confirm.hidden = true;
  confirm.setAttribute('role', 'group'); confirm.setAttribute('aria-label', '送信の確認');
  const to = hNode('p', 'h-confirm-to'); to.dataset.hTo = '';
  const preview = hNode('p', 'h-confirm-text'); preview.dataset.hPreview = '';
  const acts = hNode('div', 'h-confirm-acts');
  const go = hNode('button', 'wb-btn h-confirm-go', 'このセッションへ送る'); go.type = 'button'; go.dataset.hGo = '';
  const back = hNode('button', 'wb-btn', 'やめる'); back.type = 'button'; back.dataset.hBack = '';
  acts.append(go, back);
  confirm.append(to, preview, acts);
  box.append(why, area, row, confirm);
  area.addEventListener('input', () => composePaint());
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
  return { box: b, why: q('h-why'), area: q('h-text'), state: q('h-state'), send: q('h-send'), confirm: q('h-confirm'), to: q('h-to'), preview: q('h-preview'), go: q('h-go') };
}
/* After every histSync: the box under the history pane of the card shown, and its state. */
function composePlace(pane, id) {
  if (!HIST.compose) HIST.compose = composeBuild();
  const { box } = composeEls();
  if (HIST.compose._for !== id) {   // another robot: nothing typed for the last one goes to this one
    HIST.compose._for = id;
    composeEls().area.value = '';
    composeClose(false);
  }
  if (pane && box.previousElementSibling !== pane) pane.after(box);
  box.hidden = !pane || HIST.tab !== 'history';
  // The card was rebuilt (50-panel.js, keyed) while the box had the focus, and the box is put back only now: refocus.
  const lost = rbEl._lostFk;
  rbEl._lostFk = undefined;
  const again = lost !== undefined && !box.hidden ? box.querySelector('[data-fk="' + CSS.escape(lost) + '"]') : null;
  if (again) again.focus({ preventScroll: true });
  composePaint();
}
function composePaint() {
  if (!HIST.compose) return;
  const E = composeEls(), id = HIST.compose._for, t = composeTarget(id);
  const asking = !E.confirm.hidden;
  E.why.textContent = t.why || t.note || '';
  E.why.hidden = !(t.why || t.note);
  E.why.classList.toggle('h-compose-note', !t.why && !!t.note);
  E.area.disabled = !!t.why;
  E.area.readOnly = asking;
  const text = E.area.value, bytes = text.trim() ? composeBytes(id, text) : 0;
  E.send.disabled = !!t.why || !text.trim() || bytes > PROMPT_MAX_BYTES || asking;
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
  const E = composeEls(), id = HIST.compose._for, t = composeTarget(id), text = E.area.value;
  if (t.why || !text.trim() || composeBytes(id, text) > PROMPT_MAX_BYTES || !E.confirm.hidden) return;
  E.to.textContent = `送り先: ${t.name}`;
  E.preview.textContent = text.length > 400 ? `${text.slice(0, 400)}…` : text;
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
  const E = composeEls(), id = HIST.compose._for, text = E.area.value;
  if (composeTarget(id).why || !text.trim()) return;
  E.go.disabled = true;
  const got = await SOURCE.sendPrompt(id, text);
  E.go.disabled = false;
  composeClose(!got.ok);
  if (got.ok) { HIST.sent = { id, text, at: Date.now() }; E.area.value = ''; }
  else HIST.sent = { id, text, at: Date.now(), error: got.error || `HTTP ${got.status}` };
  composePaint();
}
/* The prompt sent shows in the receiver's transcript as a channel item of jui-viz (sources/history.py: the CLI's own
   record, origin.kind "channel", measured 10-19 on a real receiver started with --channels plugin:jui-viz@jsonui),
   its text the text sent: 届いた. Our own POST proves only that it was sent; the same words typed by hand do not count. */
function composeArrived(items) {
  const sent = HIST.sent;
  if (!sent || sent.error || sent.arrivedAt || sent.id !== HIST.id || !Array.isArray(items)) return;
  const want = composeNorm(sent.text).slice(0, 120);
  const fresh = (x) => !(Number(x.at) < sent.at - 60000);   // an older item with the same words is not this one
  const ours = (x) => x.kind === 'channel' && /(^|:)jui-viz$/.test(String(x.server || ''));
  if (items.some((x) => ours(x) && fresh(x) && composeNorm(x.text).startsWith(want))) { sent.arrivedAt = Date.now(); composePaint(); }
}

/* ---------- pictures (2.3.4, requester 10-19: "画像ファイルが履歴にある場合はサムネイル表示とクリックで拡大表示") ----------
   An image item names a picture by its place (sources/history.py); the bytes are asked for one picture at a time
   (SOURCE.historyImage, POST /api/history-image under the prompt's checks) when its thumbnail comes into view, and
   kept as a blob URL only while this robot's tab is open. The browser scales the thumbnail. A press opens it large
   in a dialog: ← → for the others in this history, Esc / the backdrop / 閉じる close it and give the focus back. */
const histImgKey = (ref) => `${HIST.id}|${ref.off}|${ref.n}`;
function histImgsDrop() {
  for (const v of HIST.imgs.values()) v.then((g) => { if (g.url) URL.revokeObjectURL(g.url); });
  HIST.imgs.clear();
}
function histImgGet(ref) {
  const key = histImgKey(ref);
  if (!HIST.imgs.has(key)) {
    const id = HIST.id;
    HIST.imgs.set(key, SOURCE.historyImage(id, ref).then((got) => (got.ok ? { url: URL.createObjectURL(got.blob) }
      : { error: got.status === 413 ? '大きすぎて表示しない' : got.status === 415 ? '表示できない形式' : `画像を読めない（${got.status || got.error}）` })));
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
  b.dataset.hImg = `${ref.off}:${ref.n}`;
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
   広げる on the card's head (the 応答の履歴 tab only): the card covers everything right of histWideMargin(), the side
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
  on = !!on && HIST.tab === 'history' && !!rbState.id;
  if (remember) { histWidePref = on; writePref(HIST_WIDE_PREF, on ? 'on' : 'off'); }
  if (HIST.wide === on) { histWidePaint(); return; }
  HIST.wide = on;
  histWidePaint();
  histWideFly();
  const pane = histPane();
  if (pane && HIST.atEnd) histToEnd(pane);   // the newest stays in view across the change of width
}
function histWidePaint() {
  const m = histWideMargin();
  rbEl.classList.toggle('rb-wide', HIST.wide);
  rbEl.classList.toggle('rb-wide-full', HIST.wide && !m);
  rbEl.style.setProperty('--wide-left', `${m}px`);
  rbEl.style.setProperty('--wide-top', `${HIST.wide && m ? Math.round(sceneEl.getBoundingClientRect().top) : 0}px`);
  const b = rbEl.querySelector('[data-rb-wide]');
  if (b) {
    b.hidden = HIST.tab !== 'history';
    b.setAttribute('aria-pressed', String(HIST.wide));
    b.textContent = HIST.wide ? '元の幅に戻す' : '広げる';
    b.title = HIST.wide ? '元の幅に戻す（Esc）' : '応答の履歴を画面いっぱいに広げる';
  }
}
/* After every histSync: the tab and the card decide whether it is wide (the kept choice applies to the history tab). */
function histWideSync(id) {
  const want = !!id && HIST.tab === 'history' && histWidePref;
  if (want !== HIST.wide) histSetWide(want, false);
  else histWidePaint();
}
rbEl.addEventListener('click', (e) => { if (e.target.closest('[data-rb-wide]')) histSetWide(!HIST.wide); });
window.addEventListener('resize', () => { if (HIST.wide) { histWidePaint(); histWideFly(); } });

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
  else if (rbState.id && HIST.wide) { e.preventDefault(); histSetWide(false); }   // the wide history: back to the card's width first
  else if (rbState.id) { e.preventDefault(); closeRobot(); }
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

function frame(ms) {
  const dt = Math.min(0.05, Math.max(0, (ms - lastMs) / 1000));
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
    update3D(latestModel, ms / 1000, dt);
  }
  if (ms - lastPanel > 250) {
    renderPanel(latestModel);
    renderTicker();
    renderWhiteboard(latestModel, false);
    renderTaskBoard(latestModel);
    renderRobot(latestModel);
    renderLog(false);
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
