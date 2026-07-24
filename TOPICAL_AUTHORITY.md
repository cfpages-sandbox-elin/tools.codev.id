# Topical Authority — tools.codev.id

## Role and boundary

This domain is a knowledge and workflow-support property for the utility applications hosted in the Tools Directory. It should help users choose a tool, prepare inputs, protect data, understand settings, verify outputs, and combine utilities responsibly. It does not promise that every route, AI provider, integration, file type, browser, output, or current hosted service is available or compatible until the exact live workflow has been tested.

## Context used

- Homepage visible context: an authenticated **Tools Directory** with **Available Tools**, explicitly listing `KEYWORD2ARTICLE` and `URL2PDF`.
- The repository contains 229 tracked files and 43 HTML routes. Compact route review separates one directory homepage, 21 apparent tool surfaces, and 21 generated/sample documents, proposals, presentations, or CV artifacts.
- Representative tool titles include AI Article Generator & Spinner, Keyword to Article, Idea Engine, AI Website Generator, SpeedyIndex Tool, Business Data Extractor, PDF Tools, URL-to-PDF/Issuu, Print Pages, Simple Audio Tools, HTML-to-PPT, AI Slide Generator, Project Estimator, RJPP, SOP Management System, Goal Fulfillment Tracker, MotivateMe, Quran Categorizer, quiz, and roulette.
- Twelve serverless function files indicate supporting families for AI, browser/data fetching, sitemap fetching, scraping, sheets, indexing, Supabase, WordPress, Quran, PrintFriendly, and Google/browser integration.
- No sitemap or robots artifact is tracked; the deterministic HTML/function route inventory is therefore the sitemap-equivalent evidence.
- Tool capabilities, third-party services, AI models, APIs, storage behavior, quotas, privacy/security controls, supported formats, and compatibility are version-sensitive evidence gates. Articles must distinguish what the repository visibly exposes from what has been verified in a current live test.

## Ignored template noise

- Four `docs`, nine `proposal`, seven `slide`, and one `cv` HTML routes are generated/sample artifacts rather than independent editorial coverage.
- Implementation scripts, CSS, images, JSON state, tests/configuration, editor settings, logs, and generated project data were excluded.
- Sample/client document bodies and personal/project data were not analyzed or reused.
- Function implementation bodies were not treated as proof that a public endpoint is live, secure, unlimited, or compatible.

## Topical map

| Topic ID | Parent topic | Reader outcome | Boundary | Article target |
|---|---|---|---|---:|
| TLS-01 | Memilih tool dan menyusun workflow | Memilih utility yang tepat, menyiapkan uji kecil, dan mengurutkan pekerjaan tanpa kehilangan sumber. | Berfokus pada keputusan lintas tool; pengaturan spesifik dimiliki topik tool terkait dan akses homepage tetap pada directory route. | 6 |
| TLS-02 | Privasi, keamanan, dan penanganan data | Menilai data sensitif, izin sumber, link hasil, kredensial, dan risiko berbagi sebelum menggunakan tool. | Membahas hygiene dan tata kelola; bukan audit keamanan atau janji penyimpanan/retensi layanan. | 6 |
| TLS-03 | Kompatibilitas, format, browser, dan batas | Menguji file, halaman, browser, ukuran, timeout, serta dependency sebelum workflow besar. | Berfokus pada bukti kompatibilitas; langkah kreatif/teknis tiap tool dimiliki topik spesialis. | 6 |
| TLS-04 | AI Article Generator dan spinner | Menyiapkan brief, struktur, sumber, variasi, dan human review untuk artikel berbantuan AI. | Khusus route `article.html`; keyword-led generation dimiliki TLS-05 dan tidak menjanjikan orisinalitas/akurasi. | 6 |
| TLS-05 | Keyword-to-article dan konten SEO | Mengubah keyword menjadi intent, outline, draft, internal-link plan, dan pemeriksaan kualitas. | Khusus route `keyword2article.html`; ideasi awal dimiliki TLS-06 dan indexing dimiliki TLS-08. | 6 |
| TLS-06 | Idea Engine dan perencanaan konten | Mengembangkan, membandingkan, menyaring, dan memprioritaskan ide sebelum produksi. | Khusus route `ideas.html`; drafting artikel dimiliki TLS-04/TLS-05 dan hasil AI wajib direview. | 6 |
| TLS-07 | AI Website Generator | Menyusun requirement, struktur halaman, konten, aset, dan acceptance check untuk output website. | Khusus route `website.html`; tidak menjanjikan deployment, keamanan, aksesibilitas, atau production readiness. | 6 |
| TLS-08 | Indexing, sitemap, dan discovery URL | Menyiapkan URL, sitemap, status, batch, dan bukti submit/indexing secara terukur. | Khusus `indexer.html` dan fungsi sitemap/indexing; tidak menjanjikan crawl, index, ranking, atau dukungan provider. | 6 |
| TLS-09 | Ekstraksi web dan integrasi data | Menentukan sumber, field, izin, kualitas, mapping, dan output untuk browser/scrape/map/sheet/WordPress workflows. | Berfokus pada data acquisition/integration; tidak mengizinkan bypass akses dan PDF capture dimiliki TLS-10. | 6 |
| TLS-10 | PDF, URL capture, dan printing | Memilih merge/split/edit/extract/number/compress, URL-to-PDF, dan print workflow lalu memeriksa hasil. | Khusus `pdf.html`, `url2pdf.html`, dan `print.html`; presentasi dimiliki TLS-12 dan dokumen bisnis dimiliki TLS-13. | 6 |
| TLS-11 | Audio dan media sederhana | Menyiapkan input audio, memilih operasi, menjaga kualitas, dan memeriksa output. | Khusus `audio.html`; kemampuan/format aktual harus diuji dan tidak mencakup produksi media kompleks. | 6 |
| TLS-12 | Slide dan presentasi | Mengubah outline/HTML menjadi presentasi, menyusun deck, dan meninjau layout serta aset. | Khusus `slide.html` dan `html2ppt.html`; contoh `/slide` adalah artefak, bukan template yang boleh disalin. | 6 |
| TLS-13 | Proposal, RJPP, dan SOP | Menyusun struktur dokumen bisnis, kebutuhan bukti, review, versi, dan approval workflow. | Khusus `rjpp`, `sop`, dan proposal workflow; sample proposal routes bukan sumber fakta atau izin penggunaan. | 6 |
| TLS-14 | Estimasi proyek, tujuan, dan produktivitas | Memecah proyek, mengestimasi, melacak tujuan, dan memakai prompt motivasi sebagai alat refleksi. | Khusus `proyek`, `success`, dan `motivate`; bukan jaminan hasil, diagnosis, atau pengganti keputusan manajerial. | 6 |
| TLS-15 | Kategorisasi teks domain-spesifik | Menyiapkan taxonomy, contoh, confidence, review, dan provenance untuk klasifikasi teks seperti Quran Categorizer. | Khusus pola route `quran.html`; hasil tidak menjadi otoritas agama atau klasifikasi final tanpa ahli domain. | 6 |
| TLS-16 | Quiz, roulette, dan pengalaman interaktif | Merancang pertanyaan, opsi, fairness, feedback, aksesibilitas, dan pengujian pengalaman interaktif. | Khusus route quiz/roulette; tidak untuk keputusan berisiko, perjudian, penilaian resmi, atau randomisasi yang belum diuji. | 6 |

## Internal-link rule

Setiap artikel menaut ke hub topiknya, TLS-01 untuk pemilihan workflow, TLS-02 untuk data/izin, dan TLS-03 untuk compatibility bila relevan. Artikel AI menaut ke human review dan provenance; artikel integrasi menaut ke izin sumber serta validasi output; artikel dokumen menaut ke version/approval checks. Tautan ke tool hanya diberikan setelah pembaca memahami input, output, batas, dan cara memverifikasi hasil.

## First publication wave

Gelombang pertama terdiri dari 12 aset: `TLS-01-01`, `TLS-01-02`, `TLS-02-01`, `TLS-02-02`, `TLS-03-01`, `TLS-03-02`, `TLS-04-01`, `TLS-05-01`, `TLS-08-01`, `TLS-09-01`, `TLS-10-01`, dan `TLS-12-01`. Cluster ini membangun fondasi memilih tool, melindungi data, menguji compatibility, dan memverifikasi output sebelum mengarahkan pembaca ke workflow khusus.
