# Pantauan Rilis

Dashboard untuk memantau versi aplikasi (Android & iOS terpisah), mencatat bug, checklist testing fitur, dan rencana update berikutnya. Data tersimpan otomatis di browser (localStorage) per perangkat, tanpa login.

## 1. Jalankan di komputer (opsional, buat coba dulu)

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` di browser.

## 2. Upload ke GitHub

```bash
git init
git add .
git commit -m "Pantauan Rilis"
git branch -M main
git remote add origin https://github.com/raflimaou/app-version-tracker.git
git push -u origin main
```

Ganti `raflimaou` kalau kamu push dari akun/org GitHub lain.

## 3. Base path

`vite.config.js` sudah diset ke `base: "/app-version-tracker/"`, sesuai nama repo ini. Kalau nanti nama repo-nya diganti, sesuaikan juga nilai `base` ini — kalau tidak cocok, halaman jadi blank/CSS tidak muncul saat di-deploy.

## 4. Aktifkan GitHub Pages

1. Buka repo di GitHub → **Settings** → **Pages**
2. Di bagian **Build and deployment → Source**, pilih **GitHub Actions**
3. Push perubahan ke branch `main` (workflow di `.github/workflows/deploy.yml` akan otomatis build dan deploy)
4. Tunggu 1-2 menit, cek tab **Actions** sampai statusnya centang hijau
5. Situs akan tersedia di:

```
https://raflimaou.github.io/app-version-tracker/
```

Setiap kali kamu `git push` ke `main`, situs otomatis ter-update.

## Catatan

- Data disimpan di localStorage browser, jadi tiap perangkat/browser datanya terpisah sendiri-sendiri (bukan sinkron antar perangkat).
- Kalau mau buka lewat HP juga, cukup buka URL GitHub Pages-nya lewat browser HP.
