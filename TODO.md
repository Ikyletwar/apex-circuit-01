# TODO — APEX CIRCUIT 01

Status per 26 November 2026.

## Selesai

- [x] Eksplorasi workspace dan konvensi proyek statis existing.
- [x] Cek ketersediaan tool: `node`, `python3`, `curl`; verifikasi CDN Three.js dan Google Fonts.
- [x] Buat struktur folder `apex-circuit/`.
- [x] Tulis `PLAN.md` dan daftar tugas ini.
- [x] `index.html`: canvas, HUD, minimap, speedometer, countdown, overlay start/pause/result, kontrol sentuh, fallback error.
- [x] `styles.css`: sistem desain dark editorial, state hover/focus/active, responsive 390/820/1440, reduced-motion.
- [x] `app.js`: renderer Three.js, lighting, fog, tone mapping.
- [x] Sirkuit prosedural: spline tertutup, road mesh UV, curb merah-putih, barrier, lampu, papan iklan, gantry start/finish.
- [x] Environment: ground grid, kota instanced, sprite matahari.
- [x] Mobil: body, kaca, spoiler, lampu, underglow, 4 roda dengan steer visual.
- [x] Fisika arcade: throttle, brake, reverse, steering, lateral grip, handbrake drift, drag, curb penalty.
- [x] Collision: pembatas sirkuit dan antar mobil.
- [x] Progress berbasis proyeksi centerline, wrap deteksi putaran, best lap, ranking.
- [x] AI pure pursuit dengan lookahead dan pengereman tikungan.
- [x] Kamera chase / hood / wide + shake + reduced-motion.
- [x] HUD, speedometer, minimap, toast, countdown.
- [x] Audio sintetis: engine, beep countdown/lap, impact, mute.
- [x] Input keyboard dan pointer/touch.
- [x] Alur start → countdown → race → pause → result → restart/menu.
- [x] `run.sh` dan `package.json` untuk menjalankan server lokal.
- [x] `node --check app.js`.

## Verifikasi selesai

- [x] Buka lewat `http://localhost:4173` — HTTP 200 untuk HTML/CSS/JS, `window.__APEX_READY = true`, 0 console error.
- [x] Klik `MULAI BALAPAN` — countdown → racing; input `W` menaikkan speed 134 → 184 km/h, throttle 0 → 1, dan speed turun saat input dilepas.
- [x] Pause/resume, ganti kamera (chase → hood → wide), mute toggle, dan layar hasil berhasil diuji.
- [x] Breakpoint 390 / 768 / 1440 px — tidak ada horizontal overflow; overlay dan kontrol sentuh tampil sesuai breakpoint.
- [x] Buka lewat `file://` — Three.js UMD termuat, boot error tidak muncul.
- [x] Satu warning deprecation dari Three.js r160 UMD (`build/three.min.js`); bukan error dan tidak mengganggu runtime.

## Catatan verifikasi

| Pengujian | Hasil |
|---|---|
| `node --check app.js` | Lulus |
| `curl` HTTP untuk `/`, `/styles.css`, `/app.js` | 200 / 200 / 200 |
| Console browser HTTP | 0 error, 1 warning deprecation Three.js |
| `file://` index.html | ready, boot error tersembunyi |
| Mobile 390×844 | overflow false, touch controls tampil setelah start |
| Tablet 768×1024 | overflow false, layout overlay pas |
| Desktop 1440×900 | overflow false, canvas 1440×900 |
| Input gas | throttle 0→1, speed 134→184 km/h |
| Input dilepas | throttle 1→0, speed 184→141 km/h |
| Pause → resume | phase `paused` → `countdown` |
| Camera cycle | mode 0 → 2, aria-label `Kamera WIDE` |
| Finish | overlay hasil tampil, posisi dan waktu terisi |

## Fitur lanjutan (selesai)

- [x] NOS: input Shift/F/touch, meter, drain/recharge, boost speed/power, FOV, partikel, audio.
- [x] Mode kamera ke-4 `COCKPIT` / POV + dashboard dan setir dinamis.
- [x] Speedometer skala 320 km/h, gear sampai 8, meter NOS, hasil NOS used.
- [x] README interaktif dengan animasi CSS, panel `<details>`, marquee, timeline, dan badge.
- [x] Guard regresi NOS + POV di `tests/steer.test.js`.
- [ ] Push ke GitHub repo `Ikyletwar/apex-circuit-01`.
- [ ] Aktifkan GitHub Pages di branch `main` path `/`.

## Tidak direncanakan

- Upload/publish ke hosting pihak ketiga.
- Musik latar (user harus menyediakan berkas jika ingin musik).
- Physics engine eksternal atau aset 3D pihak ketiga.
- Mode multiplayer / leaderboard online.
