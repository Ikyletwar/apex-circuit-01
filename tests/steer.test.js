'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

function assert(condition, message) {
  if (!condition) throw new Error(`GAGAL: ${message}`);
  console.log(`OK: ${message}`);
}

function sourceHas(pattern, message) {
  assert(pattern.test(source), message);
}

function sourceLacks(pattern, message) {
  assert(!pattern.test(source), message);
}

console.log('APEX Circuit — regresi arah belok');
console.log('');

/* ---------- 1. Guard against source-level regressions ---------- */

sourceHas(
  /KeyA'\)\s*\|\|\s*keys\.has\('ArrowLeft'\)\s*\|\|\s*touchInput\.left\)\s*\?\s*1\s*:\s*0/,
  'A / ArrowLeft / touch left memetakan steer = +1 (kiri)'
);
sourceHas(
  /KeyD'\)\s*\|\|\s*keys\.has\('ArrowRight'\)\s*\|\|\s*touchInput\.right\)\s*\?\s*-1\s*:\s*0/,
  'D / ArrowRight / touch right memetakan steer = -1 (kanan)'
);
sourceHas(
  /car\.heading \+= car\.input\.steer \* 1\.95 \* speedFactor \* direction \* dt;[\s\S]{0,220}car\.mesh\.rotation\.y = car\.heading;/,
  'rotasi mesh disinkronkan dengan heading setiap frame'
);
sourceHas(
  /car\.body\.rotation\.z = lerp\(car\.body\.rotation\.z, car\.input\.steer \* 0\.045 - lateralSpeed \* 0\.004/,
  'body roll miring ke luar tikungan'
);
sourceHas(
  /car\.input\.steer = clamp\(angleDelta\(desired, car\.heading\) \* 2\.7, -1, 1\);/,
  'AI pure pursuit tidak mengubah tanda steering'
);
sourceHas(
  /pivot\.rotation\.y = car\.input\.steer \* 0\.42/,
  'roda depan mengikuti tanda steer'
);

console.log('');

console.log('Regresi fitur NOS + POV');
console.log('');

sourceHas(
  /ShiftLeft'\) \|\| keys\.has\('ShiftRight'\) \|\| keys\.has\('KeyF'\) \|\| touchInput\.nos/,
  'NOS aktif dari Shift, F, atau tombol sentuh'
);
sourceHas(
  /nosDrain: 32[\s\S]{0,240}nosRecharge: 8\.5[\s\S]{0,240}nosBoost: 26/,
  'konfigurasi NOS: drain 32, recharge 8.5, boost 26'
);
sourceHas(
  /const maxSpeed = baseMaxSpeed \+ \(nosActive \? CONFIG\.nosBoost \* surfaceFactor : 0\)/,
  'NOS menaikkan batas kecepatan'
);
sourceHas(
  /cameraModes: \['CHASE', 'HOOD', 'WIDE', 'COCKPIT'\]/,
  'mode kamera COCKPIT tersedia'
);
sourceHas(
  /player\.mesh\.visible = !cockpitMode;[\s\S]{0,120}dom\.cockpit\.hidden = !cockpitMode;/,
  'mobil disembunyikan dan dashboard POV tampil di mode cockpit'
);
sourceHas(
  /dom\.steeringWheel\.style\.setProperty\('--wheel-angle'/,
  'setir POV mengikuti steer'
);

console.log('');
console.log('Regresi kontrol mobile auto-detect');
console.log('');

sourceHas(
  /coarseQuery\.matches\s*\|\|[\s\S]{0,120}navigator\.maxTouchPoints[\s\S]{0,120}'ontouchstart' in window/,
  'deteksi mobile memakai pointer coarse, maxTouchPoints, dan ontouchstart'
);
sourceLacks(
  /touchEnabled\s*=\s*\(?window\.matchMedia\('\(pointer: coarse\)'\)\.matches\s*\|\|\s*isSmall/,
  'tidak ada deteksi mobile berbasis lebar viewport PC'
);
sourceHas(
  /dom\.btnTouch\.hidden = !state\.touchCapable/,
  'tombol toggle mobile hanya tampil pada perangkat touch'
);
sourceHas(
  /dom\.touch\.hidden = !\(active && state\.touchEnabled && !state\.touchUserHidden\)/,
  'HUD tombol mobile tampil saat racing/countdown dan tidak disembunyikan user'
);
sourceHas(
  /haptic\(\[14, 28, 14\]\)/,
  'feedback getar pada tabrakan pembatas'
);
sourceHas(
  /haptic\(8\);[\s\S]{0,120}state\.shake/,
  'feedback getar pada awal NOS'
);

console.log('');

/* ---------- 2. Numerik: reproduksi updateCarPhysics ---------- */

function simulate(steer) {
  const dt = 1 / 120;
  const steps = 60;
  let h = 0;
  let vf = 20;
  let vl = 0;
  let x = 0;
  let z = 0;

  for (let i = 0; i < steps; i++) {
    const f = { x: Math.sin(h), z: Math.cos(h) };
    const r = { x: Math.cos(h), z: -Math.sin(h) };

    const drag = 0.14 * Math.abs(vf) + 0.0042 * vf * vf;
    vf -= Math.sign(vf) * drag * dt;
    vf = clamp(vf, -14, 60);

    let vx = f.x * vf + r.x * vl;
    let vz = f.z * vf + r.z * vl;

    const speedFactor = clamp(Math.abs(vf) / 13, 0, 1)
      * (1 - 0.3 * clamp(Math.abs(vf) / 60, 0, 1));
    const direction = Math.sign(vf) || 1;
    h += steer * 1.95 * speedFactor * direction * dt;

    const nf = { x: Math.sin(h), z: Math.cos(h) };
    const nr = { x: Math.cos(h), z: -Math.sin(h) };
    let nvf = vx * nf.x + vz * nf.z;
    let nvl = vx * nr.x + vz * nr.z;
    nvl *= Math.exp(-10.8 * dt);
    nvl = clamp(nvl, -24, 24);
    vx = nf.x * nvf + nr.x * nvl;
    vz = nf.z * nvf + nr.z * nvl;

    x += vx * dt;
    z += vz * dt;
    vf = nvf;
    vl = nvl;
  }

  return { h, x, z, meshY: h };
}

const left = simulate(1);
const right = simulate(-1);

console.log(`A (kiri): heading=${left.h.toFixed(3)} rad, pos=(${left.x.toFixed(3)}, ${left.z.toFixed(3)})`);
console.log(`D (kanan): heading=${right.h.toFixed(3)} rad, pos=(${right.x.toFixed(3)}, ${right.z.toFixed(3)})`);
console.log('');

assert(left.h > 0.85 && left.h < 0.92, 'A menghasilkan heading positif ≈ +0,887 rad');
assert(right.h < -0.85 && right.h > -0.92, 'D menghasilkan heading negatif ≈ -0,887 rad');
assert(left.x > 2.5, 'A bergerak ke +X = kiri driver pada heading awal 0');
assert(right.x < -2.5, 'D bergerak ke -X = kanan driver pada heading awal 0');
assert(near(left.h + right.h, 0, 1e-6), 'heading A dan D simetris');
assert(near(left.x + right.x, 0, 1e-6), 'posisi X A dan D simetris');
assert(near(left.meshY, left.h) && near(right.meshY, right.h), 'visual mesh mengikuti heading');

console.log('');
console.log('Semua pemeriksaan arah belok lulus.');
