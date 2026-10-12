# GitHub Actions Demo — Otomasi dari Push sampai Deploy

Repo ini bahan demo **DLI Live Sharing (Debug Life Indonesia)**, Jumat 16 Oktober 2026.
Untuk developer yang sudah paham Git/GitHub tapi belum pernah menulis workflow sendiri.
Ini bahan belajar, bukan layanan produksi.

## Apa yang ada di sini

Aplikasi Node.js kecil (kalkulator + endpoint `/health` dan `/add`) plus workflow GitHub Actions yang bertambah tiap tahap.

| Branch | Isi |
|--------|-----|
| `main` | Versi lengkap: CI matrix, deploy Pages, release, plus contoh bonus |
| `demo-1-ci` | CI pertama: lint + test di Node 20 |
| `demo-1-fail` | Sama seperti demo 1, tapi satu test sengaja gagal (run merah) |
| `demo-2-matrix-cache-secrets` | Matrix Node 18/20/22, cache npm, dan secret |
| `demo-3-deploy-release` | Deploy ke GitHub Pages + release otomatis saat tag `v*` |

Branch `demo-*` adalah snapshot tiap tahap. Sengaja dipisah supaya saat live bisa loncat ke tahap berikutnya kalau ada yang macet.

```bash
git switch demo-1-ci
git switch demo-2-matrix-cache-secrets
git switch demo-3-deploy-release
git switch main
```

Lihat perbedaan workflow demo 1 → 2:

```bash
git diff demo-1-ci demo-2-matrix-cache-secrets -- .github/workflows/ci.yml
```

## Cara menjalankan di komputer sendiri

Prasyarat: **Node.js 20** (atau 18+).

```bash
git clone https://github.com/debuglife-indonesia/github-actions-demo.git
cd github-actions-demo
npm ci
```

Jalankan tes dan lint:

```bash
npm test      # harus lulus (4 test)
npm run lint  # harus bersih
```

Jalankan server:

```bash
npm start
```

Di terminal lain:

```bash
curl http://localhost:3000/health
# → {"ok":true}

curl "http://localhost:3000/add?a=2&b=2"
# → {"result":4}
```

Tekan `Ctrl+C` di terminal server untuk menghentikannya.

## Demo 1 — CI pertama (`demo-1-ci`)

Setiap push ke `main` dan setiap pull request menjalankan lint lalu test.

Buka file: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

| Bagian | Artinya |
|--------|---------|
| `on` | Kapan workflow jalan: push ke `main` atau saat ada pull request |
| `permissions` | Izin yang diberikan ke job; di sini hanya `contents: read` |
| `concurrency` | Kalau ada push baru di branch yang sama, run lama dibatalkan |
| Langkah | checkout → setup Node 20 → `npm ci` → lint → test |

Setelah push, buka tab **Actions** di GitHub untuk melihat run hijau.

## Demo gagal (`demo-1-fail`)

Di branch ini, satu test berharap `add(2, 2)` sama dengan **5**. Itu disengaja supaya run-nya merah (❌).

Jangan di-merge. Tujuannya hanya menunjukkan bagaimana CI menangkap regresi.

Perbaikannya: kembalikan ekspektasi ke `4`, lalu push. Run berikutnya akan hijau (✅).

Ada pull request terbuka dari `demo-1-fail` → `demo-1-ci` supaya diff-nya terlihat jelas di layar.

## Demo 2 — matrix, cache, secret (`demo-2-matrix-cache-secrets`)

Masih file `ci.yml`, ditambah tiga hal:

1. **Matrix** — menjalankan tes yang sama di Node **18**, **20**, dan **22** sekaligus. Kalau satu versi gagal, kamu langsung tahu.
2. **Cache npm** — `actions/setup-node` dengan `cache: npm` menyimpan unduhan paket supaya `npm ci` tidak mulai dari nol setiap run.
3. **Secret** — nilai rahasia disimpan di Settings repo, tidak ditulis di file. Workflow memakai `DEMO_TOKEN` hanya untuk menampilkan **panjangnya**, tidak pernah mencetak nilainya.

Cara menyetel secret (lihat juga bagian [Cara menyalin setup](#cara-menyalin-setup) di bawah).

## Demo 3 — deploy dan release (`demo-3-deploy-release`)

Dua workflow baru:

### Deploy — [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

- Trigger: push ke `main`
- Job `test` jalan dulu
- Job `deploy` hanya jalan kalau tes lulus (`needs: test`)
- Deploy lewat environment **`production`** ke **GitHub Pages**
- Halaman menampilkan versi app dari `package.json`

Situs: https://debuglife-indonesia.github.io/github-actions-demo/

### Release — [`.github/workflows/release.yml`](.github/workflows/release.yml)

- Trigger: push tag yang cocok `v*` (contoh: `v1.0.0`)
- Membuat **GitHub Release** otomatis dengan catatan dari commit

Release: https://github.com/debuglife-indonesia/github-actions-demo/releases

## Bonus — composite action & reusable workflow (hanya di `main`)

Bagian ini **tidak didemokan** di sesi live. Ada supaya kamu bisa bandingkan dua cara merapikan workflow.

### Composite action

**Composite action** = potongan langkah yang disisipkan ke dalam satu job.

File: [`.github/actions/setup-node-npm/action.yml`](.github/actions/setup-node-npm/action.yml)

Dipakai di [`.github/workflows/ci-composite.yml`](.github/workflows/ci-composite.yml):

```yaml
- uses: ./.github/actions/setup-node-npm
  with:
    node-version: "20"
```

Dari repo lain (pin ke tag):

```yaml
uses: debuglife-indonesia/github-actions-demo/.github/actions/setup-node-npm@v1.0.0
```

### Reusable workflow

**Reusable workflow** = satu workflow utuh yang dipanggil workflow lain (`on: workflow_call`).

Definisi: [`.github/workflows/reusable-test.yml`](.github/workflows/reusable-test.yml)

Pemanggil: [`.github/workflows/ci-reusable.yml`](.github/workflows/ci-reusable.yml)

```yaml
jobs:
  call-test:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: "20"
```

| | Composite action | Reusable workflow |
|--|------------------|-------------------|
| Skala | Beberapa step di dalam job | Satu atau banyak job |
| Dipanggil dengan | `uses: ./path/action.yml` | `uses: ./path/workflow.yml` |
| Cocok untuk | Setup berulang (Node + npm ci) | Pipeline tes yang dipakai banyak repo |

## Cara menyalin setup

### Secret `DEMO_TOKEN`

1. Buka repo di GitHub → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `DEMO_TOKEN`
4. Value: isi apa saja yang bukan kredensial sungguhan (contoh: `demo-token-bukan-rahasia`)
5. Simpan

Lewat CLI:

```bash
gh secret set DEMO_TOKEN --body "demo-token-bukan-rahasia"
```

Workflow hanya mencetak panjang string itu. Kalau secret belum ada, step tetap lulus dan menulis bahwa secret belum disetel.

### Environment `production`

1. **Settings** → **Environments** → **New environment**
2. Nama: `production`
3. (Opsional) centang **Required reviewers** kalau ingin deploy menunggu persetujuan orang — bagus untuk menunjukkan approval gate, tapi di demo 20 menit biasanya dibiarkan tanpa reviewer supaya tidak menggantung

### Branch protection (rekomendasi)

Di `main`, wajibkan status check CI lulus sebelum merge:

1. **Settings** → **Branches** → **Add branch protection rule**
2. Branch name: `main`
3. Centang **Require status checks to pass before merging**
4. Pilih check dari workflow CI

Aturan ini **tidak diaktifkan** saat repo disusun, supaya push penyusunan tidak terblokir. Aktifkan setelah workflow sudah hijau.

### Pin action: `@v4` vs commit SHA

Di demo, action di-pin ke major version (`actions/checkout@v4`) supaya YAML pendek dan mudah dibaca di layar.

Untuk repo produksi, lebih aman pin ke **commit SHA** penuh, karena tag major bisa digeser oleh pemilik action:

```yaml
# contoh bentuknya (ganti dengan SHA yang kamu verifikasi)
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
```

## Struktur folder

```
.
├── .github/
│   ├── actions/setup-node-npm/action.yml   # composite (bonus, di main)
│   └── workflows/
│       ├── ci.yml                 # CI utama
│       ├── deploy.yml             # deploy Pages (demo 3+)
│       ├── release.yml            # release dari tag (demo 3+)
│       ├── ci-composite.yml       # contoh pakai composite (bonus)
│       ├── reusable-test.yml      # reusable workflow (bonus)
│       └── ci-reusable.yml        # pemanggil reusable (bonus)
├── src/
│   ├── calc.js
│   └── server.js
├── test/
│   └── calc.test.js
├── eslint.config.js
├── package.json
├── package-lock.json
└── README.md
```

## Lisensi

Bahan edukasi publik dari Debug Life Indonesia. Silakan fork dan ubah untuk belajar.
