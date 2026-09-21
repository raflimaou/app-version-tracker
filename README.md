# Pantauan Rilis

Dashboard untuk memantau versi aplikasi (Android & iOS terpisah), mencatat bug, checklist testing fitur, dan rencana update berikutnya. Data disimpan di Firebase Firestore secara real-time, jadi seluruh tim melihat data yang sama — tidak login, langsung akses dashboard.

## 1. Setup Firebase (sekali saja)

1. Buka [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → ikuti langkahnya (boleh matikan Google Analytics, tidak perlu)
2. Di dashboard project, klik ikon **`</>`** (Web) untuk menambah web app → kasih nama bebas → **Register app**
3. Firebase akan menampilkan objek `firebaseConfig` seperti ini:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "xxx.firebaseapp.com",
     projectId: "xxx",
     storageBucket: "xxx.appspot.com",
     messagingSenderId: "...",
     appId: "...",
   };
   ```
   Salin nilai-nilainya ke file **`src/firebase.js`** di project ini, gantikan yang bertuliskan `GANTI...`
4. Di menu sebelah kiri Firebase Console, buka **Build → Firestore Database** → **Create database** → pilih lokasi (misal `asia-southeast2` / Jakarta) → mode **production**
5. Buka tab **Rules**, ganti isinya jadi:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /apptracker/shared {
         allow read, write: if true;
       }
     }
   }
   ```
   lalu **Publish**.

   ⚠️ **Catatan keamanan:** karena aplikasi ini tanpa login, rule di atas membuat data bisa dibaca *dan ditulis* siapa saja yang tahu alamat project-nya (config Firebase memang selalu ada di kode frontend, tidak bisa disembunyikan). Untuk tim kecil/internal ini biasanya cukup aman karena project ID-nya acak dan tidak dipublikasikan, tapi kalau datanya sensitif, pertimbangkan tambah Firebase Authentication nanti.

## 2. Jalankan di komputer (opsional, buat coba dulu)

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` di browser. Kalau `src/firebase.js` sudah diisi config yang benar, data langsung tersimpan ke Firestore.

## 3. Upload ke GitHub

```bash
git init
git add .
git commit -m "Pantauan Rilis"
git branch -M main
git remote add origin https://github.com/raflimaou/app-version-tracker.git
git push -u origin main
```

Ganti `raflimaou` kalau kamu push dari akun/org GitHub lain.

## 4. Base path

`vite.config.js` sudah diset ke `base: "/app-version-tracker/"`, sesuai nama repo ini. Kalau nanti nama repo-nya diganti, sesuaikan juga nilai `base` ini — kalau tidak cocok, halaman jadi blank saat di-deploy.

## 5. Aktifkan GitHub Pages

1. Buka repo di GitHub → **Settings** → **Pages**
2. Di bagian **Build and deployment → Source**, pilih **GitHub Actions**
3. Push perubahan ke branch `main` (workflow di `.github/workflows/deploy.yml` otomatis build & deploy)
4. Tunggu 1-2 menit, cek tab **Actions** sampai statusnya centang hijau
5. Situs tersedia di:
   ```
   https://raflimaou.github.io/app-version-tracker/
   ```

Setiap `git push` ke `main`, situs otomatis ter-update.

## Bagikan ke tim

Cukup bagikan link GitHub Pages di atas ke tim kamu. Karena datanya sekarang di Firestore (bukan localStorage lagi), semua orang yang buka link itu melihat data yang sama, dan perubahan yang salah satu buat langsung muncul di layar yang lain tanpa refresh.

## Catatan

- Kalau ada tulisan merah "Tidak bisa terhubung ke database" di aplikasinya, cek lagi isian `src/firebase.js` dan status Firestore Rules di langkah 1.
- Data tidak lagi tersimpan per-browser — semua device yang buka link yang sama akan melihat/mengubah data yang sama.
