<div class="apex-readme">

<style>
.apex-readme{
  --ink:#080c12; --panel:#0e1520; --paper:#f2f0ea; --dim:#9aa2ac;
  --red:#ff4938; --cyan:#5ee7ff; --green:#9dff8a; --line:rgba(242,240,234,.14);
  --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  --sans:"Space Grotesk",ui-sans-serif,system-ui,sans-serif;
  color:var(--paper); font-family:var(--sans);
}
.apex-readme *{box-sizing:border-box}
.apex-hero{
  position:relative; overflow:hidden; padding:46px 34px 34px; margin-bottom:26px;
  border:1px solid var(--line); border-radius:8px;
  background:
    radial-gradient(900px 280px at 12% -10%,rgba(255,73,56,.28),transparent 62%),
    radial-gradient(700px 260px at 88% 0%,rgba(94,231,255,.2),transparent 60%),
    linear-gradient(160deg,#111a26,#070b11 70%);
  box-shadow:0 24px 80px rgba(0,0,0,.45);
}
.apex-hero:before{
  content:""; position:absolute; inset:0; pointer-events:none; opacity:.35;
  background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);
  background-size:36px 36px; mask-image:linear-gradient(to bottom,#000,transparent 78%);
  animation:apex-grid 18s linear infinite;
}
@keyframes apex-grid{to{background-position:36px 36px}}
.apex-hero:after{
  content:""; position:absolute; left:0; right:0; height:1px; top:0;
  background:linear-gradient(90deg,transparent,var(--red),var(--cyan),transparent);
  animation:apex-scanline 4s ease-in-out infinite alternate;
}
@keyframes apex-scanline{from{transform:translateX(-30%);opacity:.4}to{transform:translateX(30%);opacity:1}}
.apex-hero > *{position:relative;z-index:1}
.apex-kicker{
  display:inline-flex;align-items:center;gap:9px;padding:6px 11px;margin-bottom:20px;
  border:1px solid rgba(94,231,255,.35);border-radius:999px;
  font:600 10px/1 var(--mono);letter-spacing:.22em;color:var(--cyan);
  background:rgba(94,231,255,.06);
}
.apex-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 12px var(--green);animation:apex-pulse 1.3s ease-in-out infinite alternate}
@keyframes apex-pulse{to{opacity:.25;transform:scale(.72)}}
.apex-title{
  margin:0;font-size:clamp(38px,7.2vw,82px);line-height:.92;letter-spacing:-.06em;font-weight:700;
  background:linear-gradient(100deg,var(--paper) 12%,var(--red) 46%,var(--cyan) 78%,var(--paper));
  background-size:220% auto;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:apex-shine 7s linear infinite;
}
@keyframes apex-shine{to{background-position:220% center}}
.apex-sub{margin:18px 0 0;max-width:760px;font-size:clamp(14px,1.7vw,18px);line-height:1.65;color:#cdd2d8}
.apex-badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}
.apex-badges img{height:20px;transition:transform 180ms ease,filter 180ms ease}
.apex-badges img:hover{transform:translateY(-3px);filter:brightness(1.25)}

.apex-marquee{
  overflow:hidden;white-space:nowrap;margin:0 0 26px;padding:11px 0;
  border-top:1px solid var(--line);border-bottom:1px solid var(--line);
  background:rgba(14,21,32,.7);font:600 10px/1 var(--mono);letter-spacing:.24em;color:var(--dim);
}
.apex-marquee span{display:inline-block;padding-left:100%;animation:apex-marquee 26s linear infinite}
@keyframes apex-marquee{to{transform:translateX(-100%)}}

.apex-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(238px,1fr));gap:14px;margin:22px 0}
.apex-card{
  position:relative;overflow:hidden;padding:20px;min-height:162px;
  border:1px solid var(--line);border-radius:6px;background:linear-gradient(150deg,rgba(20,30,43,.95),rgba(8,12,18,.95));
  transition:transform 260ms cubic-bezier(.22,1,.36,1),border-color 260ms ease,box-shadow 260ms ease;
}
.apex-card:hover{transform:translateY(-7px);border-color:rgba(94,231,255,.55);box-shadow:0 18px 44px rgba(0,0,0,.5)}
.apex-card:after{content:"";position:absolute;right:-28px;bottom:-42px;width:120px;height:120px;border:1px solid rgba(94,231,255,.14);border-radius:50%;transition:transform 320ms ease}
.apex-card:hover:after{transform:scale(1.35)}
.apex-num{font:600 10px/1 var(--mono);letter-spacing:.22em;color:var(--red)}
.apex-card h3{margin:12px 0 8px;font-size:20px;letter-spacing:-.03em}
.apex-card p{margin:0;color:var(--dim);font-size:13px;line-height:1.6}

.apex-panel{margin:14px 0;border:1px solid var(--line);border-radius:6px;background:rgba(9,14,21,.9);overflow:hidden}
.apex-panel > summary{
  cursor:pointer;list-style:none;padding:17px 20px;font:600 12px/1 var(--mono);letter-spacing:.14em;
  display:flex;align-items:center;gap:12px;transition:background 180ms ease,color 180ms ease;
}
.apex-panel > summary::-webkit-details-marker{display:none}
.apex-panel > summary:before{content:"+";display:inline-grid;place-items:center;width:22px;height:22px;border:1px solid var(--line);border-radius:3px;color:var(--cyan);transition:transform 200ms ease}
.apex-panel[open] > summary{background:rgba(94,231,255,.06);color:var(--cyan)}
.apex-panel[open] > summary:before{content:"−";transform:rotate(180deg)}
.apex-panel-body{padding:4px 20px 20px;color:#c8cdd4;font-size:14px;line-height:1.7}
.apex-panel-body > :last-child{margin-bottom:0}

.apex-table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px}
.apex-table th,.apex-table td{padding:11px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
.apex-table th{font:600 9px/1 var(--mono);letter-spacing:.2em;color:var(--dim);text-transform:uppercase}
.apex-table tr{transition:background 160ms ease}
.apex-table tr:hover{background:rgba(94,231,255,.05)}
.apex-kbd{
  display:inline-block;min-width:26px;padding:3px 7px;margin:1px;border:1px solid rgba(242,240,234,.28);
  border-bottom-width:2px;border-radius:3px;font:500 10px/1.4 var(--mono);text-align:center;color:var(--paper);background:#0b1119;
}

.apex-bar{height:7px;margin:8px 0 18px;border:1px solid var(--line);background:#070b11;overflow:hidden}
.apex-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--cyan),var(--red));animation:apex-fill 2.4s ease-in-out infinite alternate}
@keyframes apex-fill{from{width:42%}to{width:100%}}
.apex-bar.red i{background:linear-gradient(90deg,var(--red),#ffb199)}

.apex-term{
  position:relative;padding:20px;border:1px solid var(--line);border-radius:6px;background:#070b11;
  font:12px/1.9 var(--mono);color:#d6dbe1;overflow:hidden;
}
.apex-term:before{content:"● ● ●";display:block;margin-bottom:12px;color:#ff5f56;letter-spacing:5px}
.apex-term .cmd{color:var(--green)}
.apex-term .out{color:var(--dim)}
.apex-caret:after{content:"▊";color:var(--cyan);animation:apex-blink 900ms steps(1) infinite}
@keyframes apex-blink{50%{opacity:0}}

.apex-flow{
  padding:18px;border:1px solid var(--line);border-radius:6px;background:#070b11;
  font:12px/1.75 var(--mono);color:#cbd1d8;overflow:auto;
}
.apex-flow b{color:var(--cyan);font-weight:500}
.apex-flow em{color:var(--red);font-style:normal}

.apex-timeline{position:relative;margin:18px 0 0 8px;padding-left:22px;border-left:1px solid var(--line)}
.apex-timeline div{position:relative;margin-bottom:20px}
.apex-timeline div:before{content:"";position:absolute;left:-28px;top:5px;width:9px;height:9px;border-radius:50%;background:var(--red);box-shadow:0 0 0 5px rgba(255,73,56,.12)}
.apex-timeline b{display:block;font-size:14px}
.apex-timeline span{font:10px/1.5 var(--mono);letter-spacing:.12em;color:var(--dim)}

.apex-foot{margin-top:34px;padding-top:18px;border-top:1px solid var(--line);font:10px/1.7 var(--mono);letter-spacing:.12em;color:var(--dim)}
@media (prefers-reduced-motion: reduce){
  .apex-readme *,.apex-readme *:before,.apex-readme *:after{animation:none!important;transition:none!important}
}
</style>

<section class="apex-hero">
  <div class="apex-kicker"><span class="apex-dot"></span> LIVE BUILD / 26 NOV 2026</div>
  <h1 class="apex-title">APEX<br>CIRCUIT 01</h1>
  <p class="apex-sub">Simulasi arcade 3D di browser. Tiga putaran, empat pembalap, satu garis finis. Sirkuit prosedural, AI yang membaca tikungan, <strong>NOS</strong> yang bisa kamu tahan, dan kamera <strong>cockpit POV</strong> yang menaruhmu di dalam mobil.</p>
  <div class="apex-badges">
    <img src="https://img.shields.io/badge/three.js-r160-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js r160">
    <img src="https://img.shields.io/badge/build-no%20bundler-ff4938?style=for-the-badge" alt="Tanpa bundler">
    <img src="https://img.shields.io/badge/license-assets%20procedural-5ee7ff?style=for-the-badge" alt="Aset prosedural">
    <img src="https://img.shields.io/badge/pages-live-9dff8a?style=for-the-badge" alt="GitHub Pages aktif">
  </div>
</section>

<div class="apex-marquee"><span>THREE.JS CDN &nbsp;·&nbsp; NOS BOOST &nbsp;·&nbsp; COCKPIT POV &nbsp;·&nbsp; PURE-PURSUIT AI &nbsp;·&nbsp; PROCEDURAL CIRCUIT &nbsp;·&nbsp; WEB AUDIO &nbsp;·&nbsp; TOUCH CONTROLS &nbsp;·&nbsp; ZERO UPLOAD &nbsp;·&nbsp; GITHUB PAGES &nbsp;·&nbsp;</span></div>

## Apa yang baru

<div class="apex-grid">
  <div class="apex-card"><span class="apex-num">01 / NOS</span><h3>Tahan. Melesat.</h3><p>Tahan <span class="apex-kbd">SHIFT</span> atau <span class="apex-kbd">F</span>. Meter 100 terkuras 32/detik, isi ulang 8,5/detik. Top speed naik 26 m/s, power ×2,15, FOV melebar, partikel biru keluar dari knalpot.</p></div>
  <div class="apex-card"><span class="apex-num">02 / POV</span><h3>Di dalam kokpit.</h3><p>Mode kamera ke-4: <strong>COCKPIT</strong>. Body mobil disembunyikan, dashboard + setir muncul, dan setir benar-benar mengikuti arah belok.</p></div>
  <div class="apex-card"><span class="apex-num">03 / AI</span><h3>Membaca tikungan.</h3><p>Tiga lawan memakai pure-pursuit dengan lookahead dinamis dan pengereman prediktif. NOS tidak diberikan ke AI — keunggulan ini milik pemain.</p></div>
  <div class="apex-card"><span class="apex-num">04 / LIVE</span><h3>Langsung jalan.</h3><p>Buka <code>index.html</code> langsung atau lewat server. Three.js r160 UMD dipakai supaya <code>file://</code> tidak kena blokir modul.</p></div>
</div>

## NOS — detail mekanik

<div class="apex-panel" open>
  <summary>BUKA PANEL / NOS SYSTEM</summary>
  <div class="apex-panel-body">
    <table class="apex-table">
      <tr><th>Parameter</th><th>Nilai</th><th>Efek</th></tr>
      <tr><td>Kapasitas</td><td><code>100</code></td><td>Penuh saat start dan setiap restart</td></tr>
      <tr><td>Drain</td><td><code>32 / detik</code></td><td>Habis dalam ≈3,1 detik jika terus ditahan</td></tr>
      <tr><td>Recharge</td><td><code>8,5 / detik</code></td><td>Penuh kembali dalam ≈11,8 detik</td></tr>
      <tr><td>Boost top speed</td><td><code>+26 m/s</code></td><td>≈216 km/h → ≈302 km/h</td></tr>
      <tr><td>Power multiplier</td><td><code>×2,15</code></td><td>Akselerasi jauh lebih agresif</td></tr>
      <tr><td>Syarat aktif</td><td><code>throttle &gt; 0</code></td><td>Tidak menyala saat mobil berhenti atau mundur</td></tr>
      <tr><td>Visual</td><td>FOV +9°, speed lines, flame biru</td><td>Dimatifkan otomatis saat <code>prefers-reduced-motion</code></td></tr>
      <tr><td>Audio</td><td>Oscillator boost + frequency sweep</td><td>Hanya aktif setelah user gesture pertama</td></tr>
    </table>
    <div class="apex-bar red"><i></i></div>
    <p><strong>Verifikasi deterministik:</strong> 0,5 detik NOS menguras 16 unit (100 → 84); 1 detik tanpa NOS mengisi 8,5 unit (82,91 → 91,41). Kecepatan setelah 0,5 detik: <code>30,8 m/s</code> dengan NOS vs <code>15,24 m/s</code> tanpa NOS.</p>
  </div>
</div>

## Kamera & POV

<div class="apex-panel">
  <summary>BUKA PANEL / 4 MODE KAMERA</summary>
  <div class="apex-panel-body">
    <p>Tekan <span class="apex-kbd">C</span> atau tombol <strong>CAM</strong> untuk berputar:</p>
    <table class="apex-table">
      <tr><th>Mode</th><th>Posisi</th><th>Rasa</th></tr>
      <tr><td><code>CHASE</code></td><td>Belakang + tinggi</td><td>Default, paling mudah membaca sirkuit</td></tr>
      <tr><td><code>HOOD</code></td><td>Atas kap mesin</td><td>Agresif, garis depan dekat aspal</td></tr>
      <tr><td><code>WIDE</code></td><td>Jauh di belakang</td><td>Survei seluruh tikungan</td></tr>
      <tr><td><code>COCKPIT</code></td><td>Kursi pembalap</td><td>POV dalam mobil + dashboard + setir dinamis</td></tr>
    </table>
    <p>Di mode cockpit, <code>player.mesh.visible = false</code> agar kamera tidak terjebak di dalam geometri mobil. Setir memakai CSS variable <code>--wheel-angle</code> dan mengikuti <code>input.steer × 26deg</code>.</p>
  </div>
</div>

## Kontrol

<div class="apex-panel" open>
  <summary>BUKA PANEL / KONTROL LENGKAP</summary>
  <div class="apex-panel-body">
    <table class="apex-table">
      <tr><th>Input</th><th>Aksi</th></tr>
      <tr><td><span class="apex-kbd">W</span> <span class="apex-kbd">↑</span></td><td>Gas</td></tr>
      <tr><td><span class="apex-kbd">S</span> <span class="apex-kbd">↓</span></td><td>Rem / mundur</td></tr>
      <tr><td><span class="apex-kbd">A</span> <span class="apex-kbd">D</span> / <span class="apex-kbd">←</span> <span class="apex-kbd">→</span></td><td>Belok kiri / kanan</td></tr>
      <tr><td><span class="apex-kbd">SPACE</span></td><td>Drift / rem tangan</td></tr>
      <tr><td><span class="apex-kbd">SHIFT</span> <span class="apex-kbd">F</span></td><td><strong>NOS — tahan</strong></td></tr>
      <tr><td><span class="apex-kbd">C</span></td><td>Ganti kamera, termasuk COCKPIT</td></tr>
      <tr><td><span class="apex-kbd">ESC</span> <span class="apex-kbd">P</span></td><td>Jeda / lanjut</td></tr>
      <tr><td><span class="apex-kbd">M</span></td><td>Bisukan suara</td></tr>
      <tr><td><span class="apex-kbd">R</span></td><td>Ulang balapan</td></tr>
      <tr><td>Tombol sentuh</td><td>‹ › · DRIFT · NOS · BRK · GAS muncul otomatis di layar kecil</td></tr>
    </table>
  </div>
</div>

## Jalankan

<div class="apex-term">
  <div><span class="cmd">$</span> cd apex-circuit</div>
  <div><span class="cmd">$</span> chmod +x run.sh &amp;&amp; ./run.sh</div>
  <div class="out">APEX Circuit 01 -&gt; http://localhost:4173</div>
  <div><span class="cmd">$</span> npm test <span class="apex-caret"></span></div>
  <div class="out">Semua pemeriksaan arah belok lulus. / Regresi NOS + POV lulus.</div>
</div>

<div class="apex-panel">
  <summary>BUKA PANEL / CARA LAIN</summary>
  <div class="apex-panel-body">
    <ul>
      <li><code>npm start</code> — server statis yang sama via script.</li>
      <li>Buka langsung <code>index.html</code> — berjalan karena Three.js dipakai sebagai build UMD, bukan ES module lokal.</li>
      <li>Butuh internet untuk CDN Three.js + Google Fonts. Font punya fallback sistem.</li>
    </ul>
  </div>
</div>

## Arsitektur runtime

<div class="apex-flow">
<b>CDN THREE</b> → init()<br>
&nbsp;&nbsp;├─ setupRenderer() &nbsp;<em>WebGL, tone mapping, shadow adaptif</em><br>
&nbsp;&nbsp;├─ buildTrack() &nbsp;<em>Catmull-Rom 900 sample → jalan, curb, barrier</em><br>
&nbsp;&nbsp;├─ buildEnvironment() &nbsp;<em>kota instanced, lampu, billboard</em><br>
&nbsp;&nbsp;├─ createCars() &nbsp;<em>4 mobil + state NOS</em><br>
&nbsp;&nbsp;└─ animate()<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ readPlayerInput() &nbsp;<em>WASD + SHIFT/F + touch</em><br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ updateCarPhysics() &nbsp;<em>grip, drift, NOS, tabrakan</em><br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ readAiInput() &nbsp;<em>pure pursuit + brake tikungan</em><br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ updateCamera() &nbsp;<em>4 mode + FOV kick + cockpit</em><br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ updateHud() &nbsp;<em>speed, lap, posisi, NOS meter</em><br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ audio.update() &nbsp;<em>engine + boost + impact</em>
</div>

## Verifikasi

<div class="apex-grid">
  <div class="apex-card"><span class="apex-num">CHECK 01</span><h3>Syntax & regresi</h3><p><code>node --check app.js</code> lolos. <code>npm test</code> menguji arah belok, NOS, POV, dan sinkronisasi visual.</p></div>
  <div class="apex-card"><span class="apex-num">CHECK 02</span><h3>Numerik NOS</h3><p>Drain 16/0,5 detik, recharge 8,5/detik, kecepatan boost 30,8 vs 15,24 m/s.</p></div>
  <div class="apex-card"><span class="apex-num">CHECK 03</span><h3>Responsive</h3><p>390 / 768 / 1440 px tanpa horizontal overflow. Enam tombol sentuh muat di 390 px.</p></div>
  <div class="apex-card"><span class="apex-num">CHECK 04</span><h3>Console</h3><p>0 error. Satu warning deprecation dari Three.js r160 UMD, tidak berdampak pada runtime.</p></div>
</div>

<div class="apex-timeline">
  <div><b>Base build</b><span>Sirkuit, fisika arcade, AI, HUD, audio, touch</span></div>
  <div><b>Steering fix</b><span>A=kiri, D=kanan, mesh yaw tersinkron, body-roll keluar tikungan</span></div>
  <div><b>NOS + POV</b><span>Boost meter, flame, boost audio, FOV kick, cockpit mode ke-4</span></div>
  <div><b>Publish</b><span>Repo GitHub + GitHub Pages aktif</span></div>
</div>

## Repo & deploy

**Repository:** [`Ikyletwar/apex-circuit-01`](https://github.com/Ikyletwar/apex-circuit-01)  
**Deskripsi:** APEX Circuit 01 — 3D arcade racing in the browser with NOS boost, cockpit POV, procedural circuit, pure-pursuit AI, and synthetic audio.  
**GitHub Pages:** <https://Ikyletwar.github.io/apex-circuit-01/>

<div class="apex-bar"><i></i></div>

<div class="apex-foot">
  APEX CIRCUIT 01 · THREE.JS R160 · MIT · FONT: SPACE GROTESK + IBM PLEX MONO (OFL) · ASET & AUDIO PROSEDURAL · TANPA UPLOAD · TANPA MUSIK BAWAAN
</div>

</div>
