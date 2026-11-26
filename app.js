/* ============================================================
   APEX CIRCUIT 01 — game balapan 3D berbasis browser
   Mesin: Three.js via CDN. Aset: prosedural, tanpa berkas eksternal.
   ============================================================ */

const CONFIG = {
  laps: 3,
  roadHalf: 10,
  wallOffset: 3.2,
  sampleCount: 900,
  playerMaxSpeed: 60,
  aiBaseSpeed: 47,
  carRadius: 1.8,
  countdownFrom: 3.6,
  nosMax: 100,
  nosDrain: 32,
  nosRecharge: 8.5,
  nosBoost: 26,
  nosPower: 2.15,
  baseFov: 62,
  nosFovKick: 9,
};

const COLORS = {
  player: 0xff4938,
  ai: [0x5ee7ff, 0xf2c14e, 0x9dff8a],
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarseQuery = window.matchMedia('(pointer: coarse)');
const detectTouchCapable = () => coarseQuery.matches
  || (navigator.maxTouchPoints || 0) > 0
  || 'ontouchstart' in window;

const dom = {
  canvas: document.getElementById('scene'),
  bootError: document.getElementById('boot-error'),
  retry: document.getElementById('btn-retry'),
  start: document.getElementById('btn-start'),
  startOverlay: document.getElementById('start-overlay'),
  pauseOverlay: document.getElementById('pause-overlay'),
  resultOverlay: document.getElementById('result-overlay'),
  resume: document.getElementById('btn-resume'),
  restartPause: document.getElementById('btn-restart-pause'),
  restartResult: document.getElementById('btn-restart-result'),
  menu: document.getElementById('btn-menu'),
  btnCamera: document.getElementById('btn-camera'),
  btnTouch: document.getElementById('btn-touch'),
  touchLabel: document.getElementById('touch-label'),
  btnMute: document.getElementById('btn-mute'),
  muteLabel: document.getElementById('mute-label'),
  btnPause: document.getElementById('btn-pause'),
  hud: document.getElementById('race-hud'),
  hudLap: document.getElementById('hud-lap'),
  hudPos: document.getElementById('hud-pos'),
  hudTime: document.getElementById('hud-time'),
  hudBest: document.getElementById('hud-best'),
  lapFill: document.getElementById('lap-progress-fill'),
  countdown: document.getElementById('countdown'),
  countdownValue: document.getElementById('countdown-value'),
  countdownCaption: document.getElementById('countdown-caption'),
  toast: document.getElementById('toast'),
  speedometer: document.getElementById('speedometer'),
  speedNumber: document.getElementById('speed-number'),
  speedFill: document.getElementById('speed-fill'),
  gear: document.getElementById('gear-label'),
  drift: document.getElementById('drift-label'),
  nosMeter: document.getElementById('nos-meter'),
  nosFill: document.getElementById('nos-fill'),
  nosLabel: document.getElementById('nos-label'),
  cockpit: document.getElementById('cockpit'),
  steeringWheel: document.getElementById('steering-wheel'),
  minimapWrap: document.getElementById('minimap-wrap'),
  minimap: document.getElementById('minimap'),
  mapLap: document.getElementById('map-lap'),
  touch: document.getElementById('touch-controls'),
  speedLines: document.getElementById('speed-lines'),
  resultTitle: document.getElementById('result-title'),
  resultTime: document.getElementById('result-time'),
  resultBest: document.getElementById('result-best'),
  resultDrift: document.getElementById('result-drift'),
  resultTop: document.getElementById('result-top'),
  resultNos: document.getElementById('result-nos'),
};

const state = {
  phase: 'menu',
  phaseBeforePause: 'racing',
  countdown: CONFIG.countdownFrom,
  countdownLabel: '',
  raceTime: 0,
  bestLap: Infinity,
  cameraMode: 0,
  cameraModes: ['CHASE', 'HOOD', 'WIDE', 'COCKPIT'],
  shake: 0,
  nosWasActive: false,
  toastTimer: 0,
  collisionCooldown: 0,
  touchCapable: detectTouchCapable(),
  touchEnabled: detectTouchCapable(),
  touchUserHidden: false,
  lastFrame: performance.now(),
  menuAngle: 0,
};

const keys = new Set();
const touchInput = { left: false, right: false, throttle: false, brake: false, handbrake: false, nos: false };

let renderer, scene, camera, sunLight, sunTarget;
let smokePool, sparkPool, nosPool;
let cars = [];
let player = null;
let track = null;
let minimapCtx = null;
let minimapTransform = null;
let audio = null;

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpC = new THREE.Vector3();
const camDesired = new THREE.Vector3();
const camLook = new THREE.Vector3();
const camLookDesired = new THREE.Vector3();

/* ============================================================
   Utilitas
   ============================================================ */

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const mod = (n, m) => ((n % m) + m) % m;
// Basis lateral bernama `right` sebenarnya = up × forward = sisi kiri driver.
// Basis ini dipakai konsisten oleh grip, curb, grid, dan kamera; jangan diubah sebagian.
const lerp = (a, b, t) => a + (b - a) * t;
const headingFromTangent = (t) => Math.atan2(t.x, t.z);
const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const pad = (n) => String(n).padStart(2, '0');

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe - minutes * 60;
  return `${pad(minutes)}:${rest.toFixed(3).padStart(6, '0')}`;
}

function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(width, height, draw) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
  return tex;
}

function showToast(text, duration = 1300) {
  dom.toast.textContent = text;
  dom.toast.hidden = false;
  clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => { dom.toast.hidden = true; }, duration);
}

function hideAllOverlays() {
  dom.startOverlay.hidden = true;
  dom.pauseOverlay.hidden = true;
  dom.resultOverlay.hidden = true;
}

function haptic(pattern = 8) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (_) {
    /* Getar tidak tersedia di platform ini. */
  }
}

function syncTouchVisibility(forceActive) {
  const active = forceActive === undefined
    ? (state.phase === 'racing' || state.phase === 'countdown')
    : forceActive;
  dom.touch.hidden = !(active && state.touchEnabled && !state.touchUserHidden);
}

function updateTouchCapability() {
  state.touchCapable = detectTouchCapable();
  state.touchEnabled = state.touchCapable;
  if (!state.touchCapable) state.touchUserHidden = false;
  dom.btnTouch.hidden = !state.touchCapable;
  dom.touchLabel.textContent = state.touchUserHidden ? 'OFF' : 'ON';
  dom.btnTouch.setAttribute('aria-pressed', String(!state.touchUserHidden));
  dom.btnTouch.classList.toggle('is-active', !state.touchUserHidden);
  syncTouchVisibility();
}

function toggleTouchMode() {
  if (!state.touchCapable) return;
  state.touchUserHidden = !state.touchUserHidden;
  dom.touchLabel.textContent = state.touchUserHidden ? 'OFF' : 'ON';
  dom.btnTouch.setAttribute('aria-pressed', String(!state.touchUserHidden));
  dom.btnTouch.classList.toggle('is-active', !state.touchUserHidden);
  syncTouchVisibility();
  showToast(state.touchUserHidden ? 'KONTROL MOBILE / OFF' : 'KONTROL MOBILE / ON', 850);
  haptic(10);
}

function setHudVisible(visible) {
  dom.hud.hidden = !visible;
  dom.speedometer.hidden = !visible;
  dom.minimapWrap.hidden = !visible;
  syncTouchVisibility(visible);
}

/* ============================================================
   Audio sintetis — tanpa berkas audio eksternal
   ============================================================ */

class GameAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.engine = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.nosOsc = null;
    this.nosGain = null;
    this.nosFilter = null;
    this.muted = false;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);

      this.engine = this.ctx.createOscillator();
      this.engine.type = 'sawtooth';
      this.engine.frequency.value = 48;
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 320;
      this.engineFilter.Q.value = 3;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.0001;
      this.engine.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.master);
      this.engine.start();

      this.nosOsc = this.ctx.createOscillator();
      this.nosOsc.type = 'sawtooth';
      this.nosOsc.frequency.value = 150;
      this.nosFilter = this.ctx.createBiquadFilter();
      this.nosFilter.type = 'bandpass';
      this.nosFilter.frequency.value = 520;
      this.nosFilter.Q.value = 1.2;
      this.nosGain = this.ctx.createGain();
      this.nosGain.gain.value = 0.0001;
      this.nosOsc.connect(this.nosFilter);
      this.nosFilter.connect(this.nosGain);
      this.nosGain.connect(this.master);
      this.nosOsc.start();
    } catch (err) {
      this.ctx = null;
    }
  }

  update(speed, throttle, drifting, nosActive = false) {
    if (!this.ctx || !this.engine) return;
    const t = this.ctx.currentTime;
    const norm = clamp(speed / (CONFIG.playerMaxSpeed + CONFIG.nosBoost), 0, 1);
    this.engine.frequency.setTargetAtTime(48 + norm * 230 + throttle * 14, t, 0.06);
    this.engineFilter.frequency.setTargetAtTime(260 + norm * 1600 + (drifting ? 500 : 0), t, 0.08);
    const gain = state.phase === 'racing' ? 0.045 + norm * 0.075 + throttle * 0.018 : 0.012;
    this.engineGain.gain.setTargetAtTime(gain, t, 0.1);

    if (this.nosOsc && this.nosGain && this.nosFilter) {
      this.nosOsc.frequency.setTargetAtTime(150 + norm * 260, t, 0.05);
      this.nosFilter.frequency.setTargetAtTime(520 + norm * 1400, t, 0.05);
      const nosGain = nosActive && state.phase === 'racing' && !this.muted ? 0.026 : 0.0001;
      this.nosGain.gain.setTargetAtTime(nosGain, t, 0.05);
    }
  }

  boostCue() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(640, t + 0.3);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.075, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  beep(freq = 520, duration = 0.14) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.11, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  impact(strength = 1) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const length = Math.floor(this.ctx.sampleRate * 0.12);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    gain.gain.value = 0.16 * clamp(strength, 0.3, 1.4);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(t);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }
}

/* ============================================================
   Sistem partikel ringan
   ============================================================ */

class ParticlePool {
  constructor(count, color, size, opacity, gravity = -6, additive = false) {
    this.count = count;
    this.cursor = 0;
    this.gravity = gravity;
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.life = new Float32Array(count);
    for (let i = 0; i < count; i++) this.positions[i * 3 + 1] = -1000;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity,
      depthWrite: false,
      sizeAttenuation: true,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  spawn(pos, vel, life) {
    const i = this.cursor % this.count;
    this.cursor++;
    const p = i * 3;
    this.positions[p] = pos.x;
    this.positions[p + 1] = pos.y;
    this.positions[p + 2] = pos.z;
    this.velocities[p] = vel.x;
    this.velocities[p + 1] = vel.y;
    this.velocities[p + 2] = vel.z;
    this.life[i] = life;
  }

  update(dt) {
    let dirty = false;
    for (let i = 0; i < this.count; i++) {
      if (this.life[i] <= 0) continue;
      dirty = true;
      this.life[i] -= dt;
      const p = i * 3;
      this.velocities[p + 1] += this.gravity * dt;
      this.positions[p] += this.velocities[p] * dt;
      this.positions[p + 1] += this.velocities[p + 1] * dt;
      this.positions[p + 2] += this.velocities[p + 2] * dt;
      if (this.life[i] <= 0) this.positions[p + 1] = -1000;
    }
    if (dirty) this.points.geometry.attributes.position.needsUpdate = true;
  }
}

/* ============================================================
   Sirkuit prosedural
   ============================================================ */

function buildTrack() {
  const points = [
    [0, 0], [112, 2], [214, 52], [252, 142], [212, 224], [122, 252],
    [22, 230], [-70, 252], [-152, 210], [-192, 130], [-158, 48], [-80, 8],
  ].map(([x, z]) => new THREE.Vector3(x, 0, z));

  const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
  curve.arcLengthDivisions = 2000;
  curve.updateArcLengths();

  const N = CONFIG.sampleCount;
  const samples = [];
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const pos = curve.getPointAt(t);
    pos.y = 0;
    const tan = curve.getTangentAt(t);
    tan.y = 0;
    tan.normalize();
    const right = new THREE.Vector3(tan.z, 0, -tan.x);
    samples.push({ pos, tan, right });
  }

  const cumulative = new Float32Array(N + 1);
  const segLen = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    segLen[i] = samples[i].pos.distanceTo(samples[(i + 1) % N].pos);
    cumulative[i + 1] = cumulative[i] + segLen[i];
  }

  track = {
    curve,
    samples,
    cumulative,
    segLen,
    length: cumulative[N],
    count: N,
    bounds: { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
  };

  for (const s of samples) {
    track.bounds.minX = Math.min(track.bounds.minX, s.pos.x);
    track.bounds.maxX = Math.max(track.bounds.maxX, s.pos.x);
    track.bounds.minZ = Math.min(track.bounds.minZ, s.pos.z);
    track.bounds.maxZ = Math.max(track.bounds.maxZ, s.pos.z);
  }

  buildRoadMesh();
  buildCurbsAndBarriers();
  buildStartGantry();
  buildTrackProps();
}

function sampleAt(distance) {
  const L = track.length;
  const d = mod(distance, L);
  const { cumulative, segLen, samples, count } = track;
  let lo = 0;
  let hi = count;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid] <= d) lo = mid;
    else hi = mid;
  }
  const i = lo % count;
  const a = samples[i];
  const b = samples[(i + 1) % count];
  const segment = segLen[i] || 1;
  const t = clamp((d - cumulative[i]) / segment, 0, 1);
  const pos = a.pos.clone().lerp(b.pos, t);
  const tan = a.tan.clone().lerp(b.tan, t).normalize();
  const right = new THREE.Vector3(tan.z, 0, -tan.x);
  return { index: i, progress: d, pos, tan, right };
}

function nearestTrackFrame(pos, hint) {
  const { samples, count, cumulative, segLen, length } = track;
  let bestIndex = 0;
  let bestDist = Infinity;
  for (let k = -36; k <= 36; k++) {
    const i = mod(hint + k, count);
    const d = samples[i].pos.distanceToSquared(pos);
    if (d < bestDist) { bestDist = d; bestIndex = i; }
  }

  let result = {
    index: bestIndex,
    progress: cumulative[bestIndex],
    pos: samples[bestIndex].pos,
    tan: samples[bestIndex].tan,
    right: samples[bestIndex].right,
  };

  for (const j of [mod(bestIndex - 1, count), bestIndex]) {
    const a = samples[j];
    const b = samples[(j + 1) % count];
    tmpA.subVectors(b.pos, a.pos);
    tmpB.subVectors(pos, a.pos);
    const t = clamp(tmpB.dot(tmpA) / (tmpA.lengthSq() || 1), 0, 1);
    tmpC.copy(a.pos).addScaledVector(tmpA, t);
    const d = tmpC.distanceToSquared(pos);
    if (d < bestDist) {
      bestDist = d;
      const tan = a.tan.clone().lerp(b.tan, t).normalize();
      result = {
        index: j,
        progress: mod(cumulative[j] + t * segLen[j], length),
        pos: tmpC.clone(),
        tan,
        right: new THREE.Vector3(tan.z, 0, -tan.x),
      };
    }
  }
  return result;
}

function roadTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    const rand = seededRandom(1207);
    ctx.fillStyle = '#20262c';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 5200; i++) {
      const v = Math.floor(28 + rand() * 30);
      ctx.fillStyle = `rgba(${v},${v + 3},${v + 6},${0.12 + rand() * 0.2})`;
      ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
    }
    ctx.fillStyle = 'rgba(236,238,232,0.78)';
    ctx.fillRect(9, 0, 5, h);
    ctx.fillRect(w - 14, 0, 5, h);
    ctx.fillRect(w / 2 - 4, 12, 8, 92);
    ctx.fillRect(w / 2 - 4, 140, 8, 92);
    ctx.fillStyle = 'rgba(236,238,232,0.16)';
    ctx.fillRect(w * 0.25 - 2, 12, 3, 92);
    ctx.fillRect(w * 0.25 - 2, 140, 3, 92);
    ctx.fillRect(w * 0.75 - 2, 12, 3, 92);
    ctx.fillRect(w * 0.75 - 2, 140, 3, 92);
  });
}

function buildRoadMesh() {
  const tex = roadTexture();
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, track.length / 16);

  const positions = [];
  const uvs = [];
  const indices = [];
  const half = CONFIG.roadHalf;

  for (let i = 0; i <= track.count; i++) {
    const idx = i % track.count;
    const s = track.samples[idx];
    const d = i === track.count ? track.length : track.cumulative[i];
    const left = tmpA.copy(s.pos).addScaledVector(s.right, -half);
    const right = tmpB.copy(s.pos).addScaledVector(s.right, half);
    positions.push(left.x, 0.035, left.z, right.x, 0.035, right.z);
    uvs.push(0, d / track.length, 1, d / track.length);
  }

  for (let i = 0; i < track.count; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    indices.push(a, c, b, b, c, d);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.94,
    metalness: 0.02,
    color: 0xffffff,
  });
  const road = new THREE.Mesh(geometry, material);
  road.receiveShadow = true;
  scene.add(road);
}

function buildCurbsAndBarriers() {
  const dummy = new THREE.Object3D();
  const curbStep = 5;
  const curbCount = Math.ceil(track.length / curbStep) * 2;
  const curbGeo = new THREE.BoxGeometry(1.7, 0.18, curbStep * 0.92);
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0.05 });
  const curbs = new THREE.InstancedMesh(curbGeo, curbMat, curbCount);
  const red = new THREE.Color(0xe84032);
  const white = new THREE.Color(0xe9e7de);
  let ci = 0;
  for (let d = 0; d < track.length; d += curbStep) {
    const s = sampleAt(d);
    const color = Math.floor(d / curbStep) % 2 === 0 ? red : white;
    for (const side of [-1, 1]) {
      dummy.position.copy(s.pos).addScaledVector(s.right, side * (CONFIG.roadHalf + 0.85));
      dummy.position.y = 0.12;
      dummy.rotation.set(0, headingFromTangent(s.tan), 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      curbs.setMatrixAt(ci, dummy.matrix);
      curbs.setColorAt(ci, color);
      ci++;
    }
  }
  curbs.count = ci;
  curbs.instanceMatrix.needsUpdate = true;
  if (curbs.instanceColor) curbs.instanceColor.needsUpdate = true;
  curbs.receiveShadow = true;
  scene.add(curbs);

  const barrierStep = 9;
  const barrierCount = Math.ceil(track.length / barrierStep) * 2;
  const barrierGeo = new THREE.BoxGeometry(0.55, 1.25, barrierStep * 0.86);
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0x8d949b, roughness: 0.6, metalness: 0.35 });
  const barriers = new THREE.InstancedMesh(barrierGeo, barrierMat, barrierCount);
  const stripeGeo = new THREE.BoxGeometry(0.6, 0.12, barrierStep * 0.86);
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0x5ee7ff,
    emissive: 0x276b7a,
    emissiveIntensity: 0.7,
    roughness: 0.4,
  });
  const stripes = new THREE.InstancedMesh(stripeGeo, stripeMat, barrierCount);
  let bi = 0;
  for (let d = 0; d < track.length; d += barrierStep) {
    const s = sampleAt(d);
    for (const side of [-1, 1]) {
      dummy.position.copy(s.pos).addScaledVector(s.right, side * (CONFIG.roadHalf + CONFIG.wallOffset));
      dummy.position.y = 0.63;
      dummy.rotation.set(0, headingFromTangent(s.tan), 0);
      dummy.updateMatrix();
      barriers.setMatrixAt(bi, dummy.matrix);
      dummy.position.y = 1.2;
      dummy.updateMatrix();
      stripes.setMatrixAt(bi, dummy.matrix);
      bi++;
    }
  }
  barriers.count = bi;
  stripes.count = bi;
  barriers.instanceMatrix.needsUpdate = true;
  stripes.instanceMatrix.needsUpdate = true;
  barriers.castShadow = !reducedMotion;
  scene.add(barriers, stripes);
}

function buildStartGantry() {
  const s = sampleAt(0);
  const group = new THREE.Group();
  group.position.copy(s.pos);
  group.rotation.y = headingFromTangent(s.tan);

  const postMat = new THREE.MeshStandardMaterial({ color: 0x111820, metalness: 0.6, roughness: 0.4 });
  const postGeo = new THREE.BoxGeometry(0.8, 8.5, 0.8);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(side * (CONFIG.roadHalf + 2.2), 4.25, 0);
    post.castShadow = true;
    group.add(post);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.roadHalf * 2 + 7, 0.9, 1.2), postMat);
  beam.position.y = 8.2;
  group.add(beam);

  const checker = canvasTexture(512, 64, (ctx, w, h) => {
    const cell = 32;
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        ctx.fillStyle = ((x / cell + y / cell) % 2 === 0) ? '#f2f0ea' : '#0b1017';
        ctx.fillRect(x, y, cell, cell);
      }
    }
    ctx.fillStyle = 'rgba(255,73,56,0.92)';
    ctx.fillRect(0, 0, w, 6);
    ctx.fillRect(0, h - 6, w, 6);
  });
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.roadHalf * 2 + 5, 2.6),
    new THREE.MeshBasicMaterial({ map: checker, side: THREE.DoubleSide })
  );
  banner.position.set(0, 6.5, 0.7);
  group.add(banner);

  const labelTex = canvasTexture(1024, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ff4938';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#081018';
    ctx.font = '700 84px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START / FINISH', w / 2, h / 2 + 4);
  });
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.roadHalf * 2 + 5, 1.5),
    new THREE.MeshBasicMaterial({ map: labelTex, side: THREE.DoubleSide })
  );
  label.position.set(0, 9.5, 0.75);
  group.add(label);

  scene.add(group);
}

function billboardTexture(title, subtitle) {
  return canvasTexture(768, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0b111a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff4938';
    ctx.fillRect(0, 0, w, 14);
    ctx.fillRect(0, h - 14, w, 14);
    ctx.fillStyle = '#f2f0ea';
    ctx.font = '700 92px "Space Grotesk", sans-serif';
    ctx.fillText(title, 44, 136);
    ctx.fillStyle = '#5ee7ff';
    ctx.font = '500 38px "IBM Plex Mono", monospace';
    ctx.fillText(subtitle, 46, 196);
    ctx.strokeStyle = 'rgba(242,240,234,0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 28, w - 36, h - 56);
  });
}

function buildTrackProps() {
  const dummy = new THREE.Object3D();

  const poleGeo = new THREE.CylinderGeometry(0.16, 0.22, 9, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a323b, metalness: 0.7, roughness: 0.45 });
  const headGeo = new THREE.BoxGeometry(2.4, 0.28, 0.6);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xbfefff,
    emissive: 0x5ee7ff,
    emissiveIntensity: 1.6,
    roughness: 0.3,
  });
  const lampStep = 52;
  const lampCount = Math.ceil(track.length / lampStep) * 2;
  const poles = new THREE.InstancedMesh(poleGeo, poleMat, lampCount);
  const heads = new THREE.InstancedMesh(headGeo, headMat, lampCount);
  let li = 0;
  for (let d = 20; d < track.length; d += lampStep) {
    const s = sampleAt(d);
    for (const side of [-1, 1]) {
      dummy.position.copy(s.pos).addScaledVector(s.right, side * (CONFIG.roadHalf + 5.4));
      dummy.position.y = 4.5;
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      poles.setMatrixAt(li, dummy.matrix);
      dummy.position.y = 9;
      dummy.rotation.set(0, headingFromTangent(s.tan), 0);
      dummy.updateMatrix();
      heads.setMatrixAt(li, dummy.matrix);
      li++;
    }
  }
  poles.count = li;
  heads.count = li;
  poles.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  poles.castShadow = !reducedMotion;
  scene.add(poles, heads);

  const boards = [
    { d: 90, side: 1, title: 'APEX', sub: 'CIRCUIT 01 / NIGHT RUN' },
    { d: 300, side: -1, title: 'NO LIMIT', sub: 'DRIVE THE LINE' },
    { d: 520, side: 1, title: 'HOLD IT', sub: 'GRIP IS A CHOICE' },
    { d: 740, side: -1, title: 'GO AGAIN', sub: 'EVERY LAP COUNTS' },
  ];
  for (const b of boards) {
    const s = sampleAt(b.d);
    const group = new THREE.Group();
    group.position.copy(s.pos).addScaledVector(s.right, b.side * (CONFIG.roadHalf + 16));
    group.position.y = 8.5;
    group.lookAt(s.pos.x, 8.5, s.pos.z);
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 8),
      new THREE.MeshBasicMaterial({ map: billboardTexture(b.title, b.sub), side: THREE.DoubleSide })
    );
    group.add(panel);
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 9, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1c232c, metalness: 0.6, roughness: 0.5 })
    );
    const holder = new THREE.Group();
    holder.position.copy(group.position);
    holder.position.y = 4.5;
    leg.position.y = 0;
    holder.add(leg);
    scene.add(group, holder);
  }
}

/* ============================================================
   Lingkungan
   ============================================================ */

function buildEnvironment() {
  const groundTex = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0b1219';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(94,231,255,0.055)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= w; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }
  });
  groundTex.wrapS = THREE.RepeatWrapping;
  groundTex.wrapT = THREE.RepeatWrapping;
  groundTex.repeat.set(90, 90);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(3200, 3200),
    new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  const sunTex = canvasTexture(256, 256, (ctx, w, h) => {
    const grd = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,222,180,0.95)');
    grd.addColorStop(0.22, 'rgba(255,150,90,0.6)');
    grd.addColorStop(0.55, 'rgba(255,73,56,0.14)');
    grd.addColorStop(1, 'rgba(255,73,56,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  });
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sunTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.8,
  }));
  sun.position.set(-680, 190, -980);
  sun.scale.set(520, 520, 1);
  scene.add(sun);

  buildCity();
}

function buildCity() {
  const rand = seededRandom(4411);
  const candidates = [];
  const step = 48;
  const denseStep = 7;
  for (let x = -430; x <= 430; x += step) {
    for (let z = -430; z <= 430; z += step) {
      const px = x + (rand() - 0.5) * 16;
      const pz = z + (rand() - 0.5) * 16;
      const p = new THREE.Vector3(px, 0, pz);
      let minDist = Infinity;
      for (let i = 0; i < track.count; i += denseStep) {
        minDist = Math.min(minDist, p.distanceTo(track.samples[i].pos));
      }
      if (minDist < CONFIG.roadHalf + 34) continue;
      if (p.length() > 640) continue;
      const height = 16 + rand() * 74;
      candidates.push({ p, height, width: 14 + rand() * 18, depth: 14 + rand() * 18, tint: rand() });
    }
  }

  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0.22 });
  const buildings = new THREE.InstancedMesh(geo, mat, candidates.length);
  const roofGeo = new THREE.BoxGeometry(1, 0.35, 1);
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x9fd9e6,
    emissive: 0x245566,
    emissiveIntensity: 0.65,
    roughness: 0.4,
  });
  const roofs = new THREE.InstancedMesh(roofGeo, roofMat, candidates.length);
  const dummy = new THREE.Object3D();
  const base = new THREE.Color(0x141c26);
  const alt = new THREE.Color(0x1b2632);

  candidates.forEach((b, i) => {
    dummy.position.set(b.p.x, b.height / 2, b.p.z);
    dummy.rotation.set(0, rand() * 0.4 - 0.2, 0);
    dummy.scale.set(b.width, b.height, b.depth);
    dummy.updateMatrix();
    buildings.setMatrixAt(i, dummy.matrix);
    buildings.setColorAt(i, b.tint > 0.5 ? base : alt);

    dummy.position.set(b.p.x, b.height + 0.2, b.p.z);
    dummy.scale.set(b.width * 0.82, 1, b.depth * 0.82);
    dummy.updateMatrix();
    roofs.setMatrixAt(i, dummy.matrix);
  });
  buildings.instanceMatrix.needsUpdate = true;
  roofs.instanceMatrix.needsUpdate = true;
  if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;
  buildings.castShadow = !reducedMotion;
  buildings.receiveShadow = true;
  scene.add(buildings, roofs);
}

/* ============================================================
   Mobil
   ============================================================ */

function createCarMesh(color, isPlayer) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const paint = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.62,
    roughness: 0.3,
    emissive: new THREE.Color(color).multiplyScalar(isPlayer ? 0.09 : 0.04),
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0d141c, metalness: 0.4, roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x0b1c27, metalness: 0.3, roughness: 0.12 });
  const accent = new THREE.MeshStandardMaterial({
    color: isPlayer ? 0x5ee7ff : 0xe9e7de,
    emissive: isPlayer ? 0x1d6a7c : 0x222222,
    emissiveIntensity: 0.7,
    roughness: 0.4,
  });
  const lamp = new THREE.MeshStandardMaterial({
    color: 0xd8f7ff,
    emissive: 0x9fe8ff,
    emissiveIntensity: 1.5,
    roughness: 0.25,
  });
  const tail = new THREE.MeshStandardMaterial({
    color: 0xff5b4a,
    emissive: 0xd12618,
    emissiveIntensity: 1.5,
    roughness: 0.3,
  });

  const addBox = (w, h, d, x, y, z, mat, cast = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast && !reducedMotion;
    body.add(mesh);
    return mesh;
  };

  addBox(2.55, 0.32, 4.9, 0, 0.46, 0, dark);
  addBox(2.35, 0.62, 4.55, 0, 0.82, 0, paint);
  addBox(1.86, 0.68, 2.15, 0, 1.36, -0.28, glass);
  addBox(0.34, 0.035, 3.1, 0, 1.14, 0.58, accent, false);
  addBox(2.5, 0.11, 0.48, 0, 1.42, -2.1, dark);
  addBox(0.16, 0.55, 0.18, -0.95, 1.14, -2.08, dark);
  addBox(0.16, 0.55, 0.18, 0.95, 1.14, -2.08, dark);
  addBox(0.62, 0.16, 0.1, -0.78, 0.86, 2.3, lamp, false);
  addBox(0.62, 0.16, 0.1, 0.78, 0.86, 2.3, lamp, false);
  addBox(0.56, 0.14, 0.1, -0.82, 0.86, -2.3, tail, false);
  addBox(0.56, 0.14, 0.1, 0.82, 0.86, -2.3, tail, false);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 5.8),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: isPlayer ? 0.17 : 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.05;
  body.add(glow);

  const wheels = [];
  const frontPivots = [];
  const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 18);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x090d12, roughness: 0.9, metalness: 0.05 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xa8b0b8, metalness: 0.85, roughness: 0.32 });
  const rimGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.42, 12);
  rimGeo.rotateZ(Math.PI / 2);

  for (const z of [1.55, -1.55]) {
    for (const x of [-1.28, 1.28]) {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.55, z);
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.castShadow = !reducedMotion;
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheel.add(rim);
      pivot.add(wheel);
      root.add(pivot);
      wheels.push(wheel);
      if (z > 0) frontPivots.push(pivot);
    }
  }

  scene.add(root);
  return { root, body, wheels, frontPivots };
}

function createCars() {
  const entries = [
    { name: 'YOU', color: COLORS.player, isPlayer: true, skill: 1, lane: -3.4 },
    { name: 'VECTOR', color: COLORS.ai[0], isPlayer: false, skill: 0.97, lane: 3.4 },
    { name: 'SOLAR', color: COLORS.ai[1], isPlayer: false, skill: 0.93, lane: -3.4 },
    { name: 'MINT', color: COLORS.ai[2], isPlayer: false, skill: 0.9, lane: 3.4 },
  ];

  cars = entries.map((entry, index) => {
    const visual = createCarMesh(entry.color, entry.isPlayer);
    return {
      ...entry,
      index,
      mesh: visual.root,
      body: visual.body,
      wheels: visual.wheels,
      frontPivots: visual.frontPivots,
      vel: new THREE.Vector3(),
      heading: 0,
      input: { throttle: 0, brake: 0, steer: 0, handbrake: false, nos: false },
      nos: CONFIG.nosMax,
      nosActive: false,
      nosUsed: 0,
      trackIndex: 0,
      rawProgress: 0,
      totalProgress: 0,
      lap: 1,
      lapStart: 0,
      bestLap: Infinity,
      finished: false,
      finishAt: 0,
      rank: index + 1,
      wheelSpin: 0,
      lateral: 0,
      driftScore: 0,
      topSpeed: 0,
      smokeTimer: 0,
      frame: null,
    };
  });
  player = cars[0];
}

/* ============================================================
   Fisika arcade
   ============================================================ */

function readPlayerInput() {
  const p = player.input;
  p.throttle = (keys.has('KeyW') || keys.has('ArrowUp') || touchInput.throttle) ? 1 : 0;
  p.brake = (keys.has('KeyS') || keys.has('ArrowDown') || touchInput.brake) ? 1 : 0;
  // heading bertambah saat steer positif: positif = belok kiri, negatif = belok kanan.
  p.steer = ((keys.has('KeyA') || keys.has('ArrowLeft') || touchInput.left) ? 1 : 0)
    + ((keys.has('KeyD') || keys.has('ArrowRight') || touchInput.right) ? -1 : 0);
  p.handbrake = keys.has('Space') || touchInput.handbrake;
  p.nos = keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyF') || touchInput.nos;
}

function readAiInput(car) {
  const speed = Math.max(0, car.vel.dot(new THREE.Vector3(Math.sin(car.heading), 0, Math.cos(car.heading))));
  const look = 20 + speed * 0.6;
  const target = sampleAt(car.totalProgress + look);
  target.pos.addScaledVector(target.right, car.lane);
  const desired = headingFromTangent(target.pos.clone().sub(car.mesh.position).setY(0).normalize());
  car.input.steer = clamp(angleDelta(desired, car.heading) * 2.7, -1, 1);

  const a = sampleAt(car.totalProgress + look);
  const b = sampleAt(car.totalProgress + look + 34);
  const curvature = Math.abs(angleDelta(headingFromTangent(b.tan), headingFromTangent(a.tan)));
  const targetSpeed = clamp((54 - curvature * 165) * car.skill, 23, CONFIG.aiBaseSpeed + 9 * car.skill);
  car.input.handbrake = false;
  if (speed < targetSpeed - 1.5) {
    car.input.throttle = 1;
    car.input.brake = 0;
  } else if (speed > targetSpeed + 2) {
    car.input.throttle = 0;
    car.input.brake = 0.55;
  } else {
    car.input.throttle = 0.3;
    car.input.brake = 0;
  }
}

function updateCarPhysics(car, dt) {
  const oldForward = tmpA.set(Math.sin(car.heading), 0, Math.cos(car.heading));
  const oldRight = tmpB.set(Math.cos(car.heading), 0, -Math.sin(car.heading));
  let forwardSpeed = car.vel.dot(oldForward);
  let lateralSpeed = car.vel.dot(oldRight);

  const nosActive = car.isPlayer && car.input.nos && car.nos > 0
    && car.input.throttle > 0 && forwardSpeed > -0.5;
  car.nosActive = nosActive;
  if (car.isPlayer) {
    if (nosActive) {
      car.nos = Math.max(0, car.nos - CONFIG.nosDrain * dt);
      car.nosUsed += dt;
    } else {
      car.nos = Math.min(CONFIG.nosMax, car.nos + CONFIG.nosRecharge * dt);
    }
  }

  const offTrack = car.frame ? Math.abs(car.frame.pos.distanceTo(car.mesh.position)) > CONFIG.roadHalf * 0.92 : false;
  const lateralOffset = car.frame ? car.mesh.position.clone().sub(car.frame.pos).dot(car.frame.right) : 0;
  const onCurb = Math.abs(lateralOffset) > CONFIG.roadHalf - 0.6;
  const surfaceFactor = onCurb ? 0.66 : 1;
  const baseMaxSpeed = (car.isPlayer ? CONFIG.playerMaxSpeed : CONFIG.aiBaseSpeed + 9 * car.skill) * surfaceFactor;
  const maxSpeed = baseMaxSpeed + (nosActive ? CONFIG.nosBoost * surfaceFactor : 0);

  if (car.input.throttle > 0) {
    const power = (car.isPlayer ? 34 * (nosActive ? CONFIG.nosPower : 1) : 30 + 5 * car.skill) * car.input.throttle;
    const ratio = clamp(forwardSpeed / maxSpeed, 0, 1);
    forwardSpeed += power * (1 - ratio * 0.28) * dt;
  }
  if (car.input.brake > 0) {
    forwardSpeed -= (forwardSpeed > 0.6 ? 48 : 17) * car.input.brake * dt;
  }

  const drag = 0.14 * Math.abs(forwardSpeed) + 0.0042 * forwardSpeed * forwardSpeed;
  forwardSpeed -= Math.sign(forwardSpeed) * drag * dt;
  forwardSpeed = clamp(forwardSpeed, -14, maxSpeed);

  tmpC.copy(oldForward).multiplyScalar(forwardSpeed).addScaledVector(oldRight, lateralSpeed);
  car.vel.copy(tmpC);

  const speedFactor = clamp(Math.abs(forwardSpeed) / 13, 0, 1)
    * (1 - 0.3 * clamp(Math.abs(forwardSpeed) / maxSpeed, 0, 1));
  const direction = Math.sign(forwardSpeed) || 1;
  car.heading += car.input.steer * 1.95 * speedFactor * direction * dt;
  // Hidung mobil (local +Z) wajib mengikuti heading setiap frame, bukan hanya saat reset.
  car.mesh.rotation.y = car.heading;

  const newForward = tmpA.set(Math.sin(car.heading), 0, Math.cos(car.heading));
  const newRight = tmpB.set(Math.cos(car.heading), 0, -Math.sin(car.heading));
  forwardSpeed = car.vel.dot(newForward);
  lateralSpeed = car.vel.dot(newRight);
  const grip = car.input.handbrake ? 2.1 : (onCurb ? 5.4 : 10.8);
  lateralSpeed *= Math.exp(-grip * dt);
  lateralSpeed = clamp(lateralSpeed, -24, 24);
  car.lateral = lateralSpeed;
  car.vel.copy(newForward).multiplyScalar(forwardSpeed).addScaledVector(newRight, lateralSpeed);

  if (onCurb && forwardSpeed > maxSpeed * 0.9) {
    car.vel.multiplyScalar(1 - 1.4 * dt);
  }
  if (offTrack) car.vel.multiplyScalar(1 - 0.7 * dt);

  car.mesh.position.addScaledVector(car.vel, dt);
  car.mesh.position.y = 0;

  if (nosActive && forwardSpeed > 2 && nosPool) {
    const exhaust = car.mesh.position.clone().addScaledVector(newForward, -2.45);
    for (const side of [-0.46, 0.46]) {
      const p = exhaust.clone().addScaledVector(newRight, side);
      p.y = 0.68;
      const v = new THREE.Vector3(
        -newForward.x * 9 + (Math.random() - 0.5) * 2.2,
        0.45 + Math.random() * 0.8,
        -newForward.z * 9 + (Math.random() - 0.5) * 2.2
      );
      nosPool.spawn(p, v, 0.26 + Math.random() * 0.18);
    }
  }

  const speed = car.vel.length();
  car.topSpeed = Math.max(car.topSpeed, speed);
  car.wheelSpin += (forwardSpeed / 0.55) * dt;
  for (const wheel of car.wheels) wheel.rotation.x = car.wheelSpin;
  for (const pivot of car.frontPivots) pivot.rotation.y = car.input.steer * 0.42;

  // Miring keluar tikungan: steer positif (kiri) → top body ke local -X = sisi kanan driver.
  car.body.rotation.z = lerp(car.body.rotation.z, car.input.steer * 0.045 - lateralSpeed * 0.004, 1 - Math.exp(-dt * 8));
  car.body.rotation.x = lerp(car.body.rotation.x, car.input.throttle * 0.012 - car.input.brake * 0.022, 1 - Math.exp(-dt * 6));

  if (car.isPlayer && speed > 12 && Math.abs(lateralSpeed) > 5.5) {
    car.driftScore += Math.abs(lateralSpeed) * dt * 14;
    car.smokeTimer -= dt;
    if (car.smokeTimer <= 0) {
      car.smokeTimer = 0.045;
      for (const side of [-1, 1]) {
        const p = car.mesh.position.clone()
          .addScaledVector(newForward, -2.1)
          .addScaledVector(newRight, side * 1.15);
        p.y = 0.22;
        const v = new THREE.Vector3((Math.random() - 0.5) * 1.2, 1.3 + Math.random(), (Math.random() - 0.5) * 1.2);
        smokePool.spawn(p, v, 0.75 + Math.random() * 0.5);
      }
    }
  }
}

function constrainToTrack(car, frame, dt) {
  const lateral = tmpA.subVectors(car.mesh.position, frame.pos).dot(frame.right);
  const limit = CONFIG.roadHalf + CONFIG.wallOffset - 0.5;
  if (Math.abs(lateral) <= limit) return;

  const sign = Math.sign(lateral);
  car.mesh.position.addScaledVector(frame.right, (limit - Math.abs(lateral)) * sign);
  const outward = car.vel.dot(frame.right) * sign;
  if (outward > 0) car.vel.addScaledVector(frame.right, -outward * 0.92 * sign);
  car.vel.multiplyScalar(0.96);

  if (car.isPlayer && state.collisionCooldown <= 0) {
    state.collisionCooldown = 0.5;
    state.shake = Math.max(state.shake, 0.34);
    haptic([14, 28, 14]);
    audio.impact(clamp(outward / 12, 0.35, 1.2));
    showToast('BENTURAN / KECEPATAN TURUN', 950);
    for (let i = 0; i < 9; i++) {
      const p = car.mesh.position.clone().addScaledVector(frame.right, sign * 1.3);
      p.y = 0.5 + Math.random() * 0.5;
      const v = new THREE.Vector3(
        -frame.right.x * sign * (2 + Math.random() * 5) + (Math.random() - 0.5) * 3,
        2 + Math.random() * 4,
        -frame.right.z * sign * (2 + Math.random() * 5) + (Math.random() - 0.5) * 3
      );
      sparkPool.spawn(p, v, 0.35 + Math.random() * 0.25);
    }
  }
}

function resolveCarCollisions() {
  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i];
      const b = cars[j];
      tmpA.subVectors(b.mesh.position, a.mesh.position);
      tmpA.y = 0;
      const dist = tmpA.length();
      const minDist = CONFIG.carRadius * 1.85;
      if (dist <= 0.001 || dist >= minDist) continue;

      tmpA.multiplyScalar(1 / dist);
      const overlap = (minDist - dist) * 0.5;
      a.mesh.position.addScaledVector(tmpA, -overlap);
      b.mesh.position.addScaledVector(tmpA, overlap);
      const relative = a.vel.dot(tmpA) - b.vel.dot(tmpA);
      if (relative > 0) {
        const impulse = relative * 0.55;
        a.vel.addScaledVector(tmpA, -impulse);
        b.vel.addScaledVector(tmpA, impulse);
        if ((a.isPlayer || b.isPlayer) && relative > 7 && state.collisionCooldown <= 0) {
          state.collisionCooldown = 0.45;
          state.shake = Math.max(state.shake, 0.22);
          haptic(12);
          audio.impact(0.5);
          showToast('KONTAK / JAGA JARAK', 900);
        }
      }
    }
  }
}

function updateProgress(car) {
  const frame = nearestTrackFrame(car.mesh.position, car.trackIndex);
  car.trackIndex = frame.index;
  car.frame = frame;
  car.rawProgress = frame.progress;

  let delta = frame.progress - car.lastRaw;
  if (delta < -track.length / 2) delta += track.length;
  if (delta > track.length / 2) delta -= track.length;
  car.totalProgress = clamp(car.totalProgress + Math.max(delta, -0.35), -track.length, track.length * CONFIG.laps + 20);
  car.lastRaw = frame.progress;

  const completedLaps = Math.floor(Math.max(0, car.totalProgress) / track.length);
  if (completedLaps > car.lap - 1 && !car.finished) {
    const lapTime = state.raceTime - car.lapStart;
    car.bestLap = Math.min(car.bestLap, lapTime);
    if (car.isPlayer) {
      state.bestLap = Math.min(state.bestLap, lapTime);
      if (completedLaps < CONFIG.laps) showToast(`LAP ${completedLaps} / ${formatTime(lapTime)}`, 1500);
      audio.beep(760, 0.1);
    }
    car.lap = completedLaps + 1;
    car.lapStart = state.raceTime;
  }

  if (car.totalProgress >= track.length * CONFIG.laps && !car.finished) {
    car.finished = true;
    car.finishAt = state.raceTime;
    if (car.isPlayer) finishRace();
  }
}

function raceScore(car) {
  return car.finished
    ? track.length * CONFIG.laps + (10000 - car.finishAt)
    : car.totalProgress;
}

function updateRankings() {
  const sorted = [...cars].sort((a, b) => raceScore(b) - raceScore(a));
  sorted.forEach((car, i) => { car.rank = i + 1; });
}

/* ============================================================
   Alur balapan
   ============================================================ */

function resetRace() {
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    const d = track.length - 14 - i * 10;
    const s = sampleAt(d);
    const lateral = i % 2 === 0 ? -3.5 : 3.5;
    car.mesh.position.copy(s.pos).addScaledVector(s.right, lateral);
    car.mesh.position.y = 0;
    car.heading = headingFromTangent(s.tan);
    car.mesh.rotation.y = car.heading;
    car.vel.set(0, 0, 0);
    car.input.throttle = 0;
    car.input.brake = 0;
    car.input.steer = 0;
    car.input.handbrake = false;
    car.input.nos = false;
    car.nos = CONFIG.nosMax;
    car.nosActive = false;
    car.nosUsed = 0;
    car.trackIndex = s.index;
    car.frame = s;
    car.lastRaw = s.progress;
    car.rawProgress = s.progress;
    car.totalProgress = d - track.length;
    car.lap = 1;
    car.lapStart = 0;
    car.bestLap = Infinity;
    car.finished = false;
    car.finishAt = 0;
    car.rank = i + 1;
    car.wheelSpin = 0;
    car.lateral = 0;
    car.driftScore = 0;
    car.topSpeed = 0;
    car.body.rotation.set(0, 0, 0);
    for (const pivot of car.frontPivots) pivot.rotation.y = 0;
  }
  state.raceTime = 0;
  state.bestLap = Infinity;
  state.shake = 0;
  state.collisionCooldown = 0;
  state.nosWasActive = false;
  updateRankings();
  updateHud();
  updateCamera(0, true);
}

function startRace() {
  audio.init();
  hideAllOverlays();
  resetRace();
  setHudVisible(true);
  state.phase = 'countdown';
  state.countdown = CONFIG.countdownFrom;
  state.countdownLabel = '';
  dom.countdown.hidden = false;
  document.getElementById('btn-start').blur();
}

function pauseGame() {
  if (state.phase !== 'racing' && state.phase !== 'countdown') return;
  state.phaseBeforePause = state.phase;
  state.phase = 'paused';
  dom.pauseOverlay.hidden = false;
  dom.resume.focus();
  if (audio.ctx) audio.engineGain.gain.setTargetAtTime(0.008, audio.ctx.currentTime, 0.05);
}

function resumeGame() {
  if (state.phase !== 'paused') return;
  hideAllOverlays();
  state.phase = state.phaseBeforePause;
  syncTouchVisibility();
  dom.resume.blur();
}

function backToMenu() {
  state.phase = 'menu';
  hideAllOverlays();
  setHudVisible(false);
  dom.countdown.hidden = true;
  resetRace();
  dom.startOverlay.hidden = false;
  dom.start.focus();
}

function finishRace() {
  if (state.phase === 'finished') return;
  state.phase = 'finished';
  syncTouchVisibility();
  dom.countdown.hidden = true;
  updateRankings();
  dom.resultTitle.textContent = `Finis ke-${player.rank}.`;
  dom.resultTime.textContent = formatTime(state.raceTime);
  dom.resultBest.textContent = formatTime(state.bestLap);
  dom.resultDrift.textContent = Math.round(player.driftScore).toLocaleString('id-ID');
  dom.resultTop.textContent = `${Math.round(player.topSpeed * 3.6)} km/h`;
  dom.resultNos.textContent = `${player.nosUsed.toFixed(1)} dtk`;
  dom.resultOverlay.hidden = false;
  dom.restartResult.focus();
  audio.beep(980, 0.32);
  window.setTimeout(() => audio.beep(1320, 0.4), 160);
}

function updateCountdown(dt) {
  state.countdown -= dt;
  const t = state.countdown;
  const label = t > 2.6 ? '3' : t > 1.6 ? '2' : t > 0.6 ? '1' : 'GO!';
  if (label !== state.countdownLabel) {
    state.countdownLabel = label;
    dom.countdownValue.textContent = label;
    dom.countdownValue.classList.toggle('go', label === 'GO!');
    dom.countdownValue.classList.remove('pop');
    void dom.countdownValue.offsetWidth;
    dom.countdownValue.classList.add('pop');
    dom.countdownCaption.textContent = label === 'GO!' ? 'MAJU' : 'BERSIAP';
    audio.beep(label === 'GO!' ? 880 : 520, label === 'GO!' ? 0.24 : 0.13);
  }
  if (t <= -0.45) {
    dom.countdown.hidden = true;
    state.phase = 'racing';
    state.raceTime = 0;
    for (const car of cars) car.lapStart = 0;
  }
}

function updateRace(dt) {
  state.raceTime += dt;
  state.collisionCooldown = Math.max(0, state.collisionCooldown - dt);

  for (const car of cars) {
    if (car.isPlayer) readPlayerInput();
    else if (!car.finished) readAiInput(car);
    else { car.input.throttle = 0; car.input.brake = 0.4; car.input.steer = 0; }

    if (car.finished) {
      car.input.throttle = 0;
      car.input.brake = 0.5;
    }
    updateCarPhysics(car, dt);
    const frame = nearestTrackFrame(car.mesh.position, car.trackIndex);
    car.trackIndex = frame.index;
    constrainToTrack(car, frame, dt);
  }

  resolveCarCollisions();
  for (const car of cars) updateProgress(car);
  updateRankings();
}

/* ============================================================
   Kamera, HUD, minimap
   ============================================================ */

function updateCamera(dt, snap = false) {
  if (!camera) return;
  const p = player.mesh.position;
  const forward = tmpA.set(Math.sin(player.heading), 0, Math.cos(player.heading));
  const right = tmpB.set(Math.cos(player.heading), 0, -Math.sin(player.heading));

  if (state.phase === 'menu') {
    state.menuAngle += dt * 0.09;
    const center = sampleAt(56);
    const radius = 116;
    camDesired.set(
      center.pos.x + Math.sin(state.menuAngle) * radius,
      62,
      center.pos.z + Math.cos(state.menuAngle) * radius
    );
    camLookDesired.copy(center.pos).add(new THREE.Vector3(0, 8, 0));
  } else {
    const mode = state.cameraMode;
    if (mode === 1) {
      camDesired.copy(p).addScaledVector(forward, 1.7).addScaledVector(right, 0.35);
      camDesired.y = 2.15;
      camLookDesired.copy(p).addScaledVector(forward, 38);
      camLookDesired.y = 1.8;
    } else if (mode === 2) {
      camDesired.copy(p).addScaledVector(forward, -24).add(new THREE.Vector3(0, 13, 0));
      camLookDesired.copy(p).addScaledVector(forward, 16);
      camLookDesired.y = 2;
    } else if (mode === 3) {
      camDesired.copy(p).addScaledVector(forward, 0.2).addScaledVector(right, 0.42);
      camDesired.y = 1.46;
      camLookDesired.copy(p).addScaledVector(forward, 42).addScaledVector(right, 0.42);
      camLookDesired.y = 1.3;
    } else {
      camDesired.copy(p).addScaledVector(forward, -13.5).addScaledVector(right, 0.5);
      camDesired.y = 6.2;
      camLookDesired.copy(p).addScaledVector(forward, 16);
      camLookDesired.y = 2.4;
    }
  }

  if (snap || reducedMotion || dt === 0) {
    camera.position.copy(camDesired);
    camLook.copy(camLookDesired);
  } else {
    const f = 1 - Math.exp(-dt * 6.5);
    camera.position.lerp(camDesired, f);
    camLook.lerp(camLookDesired, f);
  }

  if (state.shake > 0.001 && !reducedMotion) {
    camera.position.x += (Math.random() - 0.5) * state.shake;
    camera.position.y += (Math.random() - 0.5) * state.shake * 0.6;
    camera.position.z += (Math.random() - 0.5) * state.shake;
    state.shake = Math.max(0, state.shake - dt * 1.8);
  }
  camera.lookAt(camLook);

  const cockpitMode = state.phase !== 'menu' && state.cameraMode === 3;
  player.mesh.visible = !cockpitMode;
  dom.cockpit.hidden = !cockpitMode;
  if (cockpitMode) {
    dom.steeringWheel.style.setProperty('--wheel-angle', `${player.input.steer * 26}deg`);
  }

  const targetFov = CONFIG.baseFov
    + (player.nosActive && state.phase === 'racing' && !reducedMotion ? CONFIG.nosFovKick : 0);
  if (Math.abs(camera.fov - targetFov) > 0.01) {
    camera.fov = lerp(camera.fov, targetFov, snap || reducedMotion ? 1 : 1 - Math.exp(-dt * 7));
    camera.updateProjectionMatrix();
  }

  if (sunLight) {
    sunLight.position.set(p.x + 130, 240, p.z - 90);
    sunTarget.position.set(p.x, 0, p.z);
    sunTarget.updateMatrixWorld();
  }
}

function updateHud() {
  const speedKmh = Math.round(player.vel.length() * 3.6);
  const lap = clamp(Math.floor(Math.max(0, player.totalProgress) / track.length) + 1, 1, CONFIG.laps);
  dom.speedNumber.textContent = String(speedKmh).padStart(3, '0');
  dom.speedFill.style.width = `${clamp(speedKmh / 320 * 100, 0, 100)}%`;
  dom.gear.textContent = `GEAR ${clamp(Math.floor(player.vel.length() / 10) + 1, 1, 8)}`;
  const nosPercent = clamp(player.nos / CONFIG.nosMax * 100, 0, 100);
  dom.nosFill.style.width = `${nosPercent}%`;
  dom.nosMeter.classList.toggle('is-active', player.nosActive);
  dom.nosMeter.classList.toggle('is-empty', player.nos < 1);
  dom.nosLabel.textContent = player.nosActive ? 'BOOST' : (player.nos < 1 ? 'CHARGE' : 'NOS');
  const drifting = Math.abs(player.lateral) > 5.5 && player.vel.length() > 12;
  dom.drift.textContent = drifting ? `DRIFT +${Math.round(player.driftScore)}` : 'GRIP';
  dom.drift.classList.toggle('is-drift', drifting);
  document.body.classList.toggle('is-fast', (speedKmh > 145 || player.nosActive) && !reducedMotion);
  if (!reducedMotion && speedKmh > 120) {
    const fastLines = clamp((speedKmh - 120) / 110, 0, 0.8);
    dom.speedLines.style.opacity = String(Math.max(fastLines, player.nosActive ? 0.68 : 0));
  } else {
    dom.speedLines.style.opacity = '0';
  }

  dom.hudLap.textContent = lap;
  dom.hudPos.textContent = player.rank;
  dom.hudTime.textContent = formatTime(state.raceTime);
  dom.hudBest.textContent = formatTime(state.bestLap);
  dom.mapLap.textContent = `LAP ${lap}`;
  dom.lapFill.style.width = `${mod(Math.max(0, player.totalProgress), track.length) / track.length * 100}%`;
}

function setupMinimap() {
  minimapCtx = dom.minimap.getContext('2d');
  const { minX, maxX, minZ, maxZ } = track.bounds;
  const size = dom.minimap.width;
  const pad = 16;
  const scale = Math.min((size - pad * 2) / (maxX - minX), (size - pad * 2) / (maxZ - minZ));
  minimapTransform = {
    scale,
    ox: pad + ((size - pad * 2) - (maxX - minX) * scale) / 2,
    oz: pad + ((size - pad * 2) - (maxZ - minZ) * scale) / 2,
    minX,
    minZ,
  };
}

function mapPoint(x, z) {
  return [
    (x - minimapTransform.minX) * minimapTransform.scale + minimapTransform.ox,
    (z - minimapTransform.minZ) * minimapTransform.scale + minimapTransform.oz,
  ];
}

function drawMinimap() {
  if (!minimapCtx || dom.minimapWrap.hidden) return;
  const ctx = minimapCtx;
  const size = dom.minimap.width;
  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  track.samples.forEach((s, i) => {
    const [x, y] = mapPoint(s.pos.x, s.pos.z);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(94,231,255,0.16)';
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(242,240,234,0.8)';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  const start = sampleAt(0);
  const [sx, sy] = mapPoint(start.pos.x, start.pos.z);
  ctx.fillStyle = '#ff4938';
  ctx.fillRect(sx - 3, sy - 3, 6, 6);

  for (const car of cars) {
    const [x, y] = mapPoint(car.mesh.position.x, car.mesh.position.z);
    ctx.beginPath();
    ctx.arc(x, y, car.isPlayer ? 5.2 : 3.6, 0, Math.PI * 2);
    ctx.fillStyle = car.isPlayer ? '#ffffff' : `#${new THREE.Color(car.color).getHexString()}`;
    ctx.fill();
    if (car.isPlayer) {
      ctx.beginPath();
      ctx.arc(x, y, 8.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,73,56,0.9)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

/* ============================================================
   Loop utama
   ============================================================ */

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - state.lastFrame) / 1000, 0.034);
  state.lastFrame = now;

  if (state.phase === 'countdown') updateCountdown(dt);
  if (state.phase === 'racing') updateRace(dt);

  if (state.phase !== 'paused') {
    smokePool.update(dt);
    sparkPool.update(dt);
    nosPool.update(dt);
  }

  updateCamera(dt);
  updateHud();
  drawMinimap();

  const speed = player.vel.length();
  if (player.nosActive && !state.nosWasActive) {
    audio.boostCue();
    haptic(8);
    if (!reducedMotion) state.shake = Math.max(state.shake, 0.16);
  }
  state.nosWasActive = player.nosActive;
  audio.update(speed, player.input.throttle, Math.abs(player.lateral) > 5.5, player.nosActive);

  renderer.render(scene, camera);
}

/* ============================================================
   Setup & event
   ============================================================ */

function setupRenderer() {
  const isSmall = window.innerWidth < 820;
  renderer = new THREE.WebGLRenderer({
    canvas: dom.canvas,
    antialias: !isSmall,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.4 : 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = !isSmall && !reducedMotion;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080c12);
  scene.fog = new THREE.FogExp2(0x080c12, 0.0019);

  camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 3600);
  camera.position.set(0, 60, -120);

  scene.add(new THREE.HemisphereLight(0x9fd8ff, 0x101820, 1.25));
  sunLight = new THREE.DirectionalLight(0xffe8cf, 2.25);
  sunLight.position.set(130, 240, -90);
  sunLight.castShadow = !isSmall && !reducedMotion;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.left = -120;
  sunLight.shadow.camera.right = 120;
  sunLight.shadow.camera.top = 120;
  sunLight.shadow.camera.bottom = -120;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 600;
  sunLight.shadow.bias = -0.0004;
  sunTarget = new THREE.Object3D();
  scene.add(sunLight, sunTarget);
  sunLight.target = sunTarget;
}

function onResize() {
  if (!renderer) return;
  const isSmall = window.innerWidth < 820;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.4 : 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  updateTouchCapability();
}

function bindEvents() {
  dom.start.addEventListener('click', startRace);
  dom.retry.addEventListener('click', () => window.location.reload());
  dom.resume.addEventListener('click', resumeGame);
  dom.restartPause.addEventListener('click', startRace);
  dom.restartResult.addEventListener('click', startRace);
  dom.menu.addEventListener('click', backToMenu);

  dom.btnCamera.addEventListener('click', cycleCamera);
  dom.btnMute.addEventListener('click', () => {
    audio.init();
    const muted = audio.toggleMute();
    dom.btnMute.setAttribute('aria-pressed', String(muted));
    dom.btnMute.setAttribute('aria-label', muted ? 'Aktifkan suara' : 'Bisukan suara');
    dom.muteLabel.textContent = muted ? 'MUTE' : 'SFX';
  });
  dom.btnPause.addEventListener('click', () => {
    if (state.phase === 'paused') resumeGame();
    else pauseGame();
  });

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (state.phase === 'racing' || state.phase === 'countdown')) pauseGame();
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code.startsWith('Arrow')) {
      if (state.phase !== 'menu') e.preventDefault();
    }
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (state.phase === 'paused') resumeGame();
      else pauseGame();
    }
    if (e.code === 'KeyC') cycleCamera();
    if (e.code === 'KeyT' && state.touchCapable) toggleTouchMode();
    if (e.code === 'KeyM') dom.btnMute.click();
    if (e.code === 'KeyR' && state.phase !== 'menu') startRace();
    if (e.code === 'Enter' && state.phase === 'menu' && e.target.tagName !== 'BUTTON') startRace();
  });
  document.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  for (const button of dom.touch.querySelectorAll('[data-control]')) {
    const control = button.dataset.control;
    const set = (value) => {
      touchInput[control] = value;
      button.classList.toggle('is-active', value);
    };
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      button.setPointerCapture?.(e.pointerId);
      set(true);
      haptic(8);
    });
    button.addEventListener('pointerup', () => set(false));
    button.addEventListener('pointercancel', () => set(false));
    button.addEventListener('pointerleave', () => set(false));
  }
}

function cycleCamera() {
  state.cameraMode = (state.cameraMode + 1) % state.cameraModes.length;
  dom.btnCamera.title = `Kamera: ${state.cameraModes[state.cameraMode]} (C)`;
  dom.btnCamera.setAttribute('aria-label', `Kamera ${state.cameraModes[state.cameraMode]}`);
  showToast(`KAMERA / ${state.cameraModes[state.cameraMode]}`, 900);
  updateCamera(0, true);
}

function init() {
  setupRenderer();
  buildTrack();
  buildEnvironment();
  createCars();
  smokePool = new ParticlePool(180, 0xb9c8cf, 2.6, 0.28, -1.2);
  sparkPool = new ParticlePool(120, 0xffa04d, 0.9, 0.9, -11, true);
  nosPool = new ParticlePool(140, 0x66e8ff, 0.75, 0.92, 2.2, true);
  audio = new GameAudio();
  setupMinimap();
  bindEvents();
  updateTouchCapability();
  resetRace();
  setHudVisible(false);
  dom.countdown.hidden = true;
  dom.bootError.hidden = true;
  window.__APEX_READY = true;
  window.__APEX_DEBUG = {
    state, keys, touchInput, cars, track, CONFIG,
    readPlayerInput, updateCarPhysics, updateCamera, cycleCamera,
    detectTouchCapable, updateTouchCapability, syncTouchVisibility, toggleTouchMode,
  };
  dom.start.focus({ preventScroll: true });
  requestAnimationFrame(animate);
}

try {
  init();
} catch (error) {
  console.error('APEX init failed', error);
  dom.bootError.hidden = false;
  window.__APEX_READY = true;
}
