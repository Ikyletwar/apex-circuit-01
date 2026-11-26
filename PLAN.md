# PLAN — APEX CIRCUIT 01

## Tujuan

Game balapan 3D web-based yang langsung jalan, tanpa build step, tanpa backend, dan tanpa aset berbayar. Pemain membalap 3 putaran melawan 3 AI di sirkuit prosedural dengan fisika arcade, drift, tabrakan, HUD, minimap, kamera, dan audio sintetis.

## Keputusan teknis

| Area | Keputusan | Alasan |
|---|---|---|
| Stack | HTML + CSS + JavaScript klasik | Konsisten dengan proyek statis lain di workspace; tidak ada bundler; juga bisa dibuka lewat `file://` |
| Mesin 3D | Three.js r160 UMD via jsDelivr CDN | Build klasik (`three.min.js`) tidak memakai ES module, sehingga tidak kena blokir CORS saat dibuka dari `file://` |
| Aset | 100% prosedural via Canvas 2D + geometri Three.js | Tidak ada ketergantungan pada stok foto/tekstur eksternal; lisensi bersih, loading cepat |
| Font | Space Grotesk + IBM Plex Mono via Google Fonts CDN | Hierarki editorial, fallback sistem tersedia saat offline |
| Sirkuit | Catmull-Rom closed spline, 900 sampel | Satu sumber kebenaran untuk road mesh, curb, barrier, lampu, AI racing line, progress, checkpoint, dan minimap |
| Fisika | Arcade kustom: kecepatan maju + lateral grip + yaw | Ringan, responsif, mudah di-tuning; tidak butuh physics engine eksternal |
| AI | Pure pursuit + predictive corner braking | Mengikuti garis sirkuit dan melambat sebelum tikungan tanpa pathfinding mahal |
| Collision | Proyeksi lateral ke centerline + separasi antar mobil | Murah, stabil, dan selaras dengan geometri sirkuit |
| Audio | Web Audio API: oscillator engine, beep, noise impact | Tanpa file audio; hanya aktif setelah user gesture |
| Responsive | DPR cap, opsi shadow per device, touch controls | Aman di mobile tanpa mengorbankan desktop |
| Aksesibilitas | Semantic HTML, focus state, ARIA labels, reduced-motion | Kontrol k keyboard dan sentuh tetap bisa dipakai |

## Arsitektur

```text
index.html    Struktur UI, overlay, HUD, kontrol, CDN script
styles.css    Sistem desain dark editorial + responsive + reduced-motion
app.js        Inisialisasi, sirkuit, environment, mobil, fisika, AI, kamera, HUD, audio
run.sh        Server statis lokal
```

Alur runtime:

```text
CDN THREE -> init()
  -> setupRenderer()
  -> buildTrack()      [spline, road, curb, barrier, gantry, billboard]
  -> buildEnvironment()[ground, city, sun]
  -> createCars()
  -> ParticlePool smoke + spark
  -> bindEvents()
  -> resetRace()
  -> requestAnimationFrame(animate)

animate():
  countdown/race -> physics -> collision -> progress/lap/rank
  -> camera -> HUD -> minimap -> audio -> render
```

## Mekanik yang diimplementasikan

- Gas, rem, mundur, belok, drift dengan grip berubah.
- Kecepatan maksimum turun saat melewati curb / area luar sirkuit.
- Tabrakan pembatas dengan koreksi posisi, pengurangan kecepatan, spark, shake, dan suara.
- Tabrakan antar mobil dengan separasi + impulse.
- 3 putaran, pencatatan lap terbaik, urutan posisi real-time, layar hasil.
- 4 mode kamera: chase, hood, wide, cockpit/POV dengan dashboard dan setir dinamis.
- NOS: tahan Shift/F/touch, meter 100, drain 32/dtk, recharge 8,5/dtk, +26 m/s top speed, power ×2,15, FOV kick, flame biru, audio boost.
- Countdown 3-2-1-GO, pause/resume, restart, kembali ke menu.
- Minimap dengan posisi semua mobil.
- Kontrol sentuh auto-detect: hanya perangkat dengan `pointer: coarse`, `maxTouchPoints > 0`, atau `ontouchstart`. PC tidak menampilkan HUD tombol mobile; HP/tablet menampilkan tombol saat countdown/racing, dengan toggle `MOBILE` + shortcut `T` dan haptic `navigator.vibrate()`.
- Reduced-motion: matikan speed lines, shake, dan transisi.

## Verifikasi yang direncanakan

1. `node --check app.js` — 0 syntax error.
2. HTTP 200 untuk `index.html`, `styles.css`, `app.js`, dan CDN Three.js.
3. Browser: tidak ada console error, overlay start tampil, klik start memulai countdown.
4. Simulasi input keyboard: speed bertambah, posisi berubah, lap/progress bergerak.
5. Screenshot desktop / tablet / mobile: tidak ada overflow, HUD terbaca, kontrol sentuh muncul di mobile.
6. Uji `file://` dan `http://` — keduanya memuat mesin 3D.
