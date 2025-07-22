// File: sier-data-meeting-point.js
// Berisi data mentah hasil riset benchmark kompetitor coworking space di Surabaya.

const meetingPointCompetitorsData = [
  {
    name: "GoWork",
    location: "MNC Tower Surabaya & Sinar Mas Land Plaza",
    productsAndCapacity: `- Meeting Room: 4 - 20+ orang\n- Private Office: 1 - 50+ orang\n- Hot Desk: 1 orang\n- Virtual Office: N/A`,
    productsAndArea: `- Meeting Room: Estimasi 8 m² - 50+ m²\n- Private Office: Mulai dari 5-8 m² (1-2 orang) hingga 150+ m²\n- Hot Desk: Estimasi 1.2m x 0.6m per meja\n- Virtual Office: N/A`,
    productsAndPrice: `- Meeting Room: Mulai Rp230.000/jam.\n- Private Office: Estimasi mulai Rp5.000.000 - Rp15.000.000+/bulan (tergantung kapasitas & lokasi premium).\n- Hot Desk: Rp1.250.000/bulan.\n- Virtual Office: Mulai Rp300.000-an/bulan.`,
    includedFacilities: `- WiFi\n- kopi & teh\n- air mineral gratis\n- TV/Proyektor\n- papan tulis\n- akses ke lounge`,
    uniqueSellingPoints: `- Layanan cetak & pindai\n- lokasi di gedung perkantoran premium.`,
    website: "gowork.id",
    history: `Didirikan pada tahun 2016, GoWork merupakan salah satu pemain terbesar di Indonesia. Mereka didirikan untuk menjawab kebutuhan akan ruang kerja yang fleksibel, inspiratif, dan kolaboratif seiring dengan berkembangnya ekonomi digital dan jumlah startup di Indonesia. Ekspansi mereka ke Surabaya menunjukkan visi untuk menjangkau kota-kota besar dengan ekosistem bisnis yang dinamis.`
  },
  {
    name: "SUB Co",
    location: "Jl. Darmo Harapan 1, Tanjungsari",
    productsAndCapacity: `- Meeting Room: 6, 8, 10 orang\n- Hot Desk: 1 orang\n- Dedicated Desk: 1 orang\n- Private Office: 2 - 6 orang`,
    productsAndArea: `- Meeting Room: Estimasi 12 m², 16 m², 20 m²\n- Hot Desk: Estimasi 1.2m x 0.6m per meja\n- Dedicated Desk: Estimasi 1.2m x 0.6m per meja\n- Private Office: Mulai dari 8 m² (2 orang) hingga 20 m²`,
    productsAndPrice: `- Meeting Room: Rp90.000 - Rp150.000/jam.\n- Hot Desk: Rp50.000/3 jam, Rp90.000/hari.\n- Dedicated Desk: Rp1.500.000/bulan.\n- Private Office: Mulai Rp4.000.000/bulan (2 orang).`,
    includedFacilities: `- WiFi\n- Smart TV/Proyektor\n- papan tulis\n- kopi & teh gratis`,
    uniqueSellingPoints: `Dikenal sebagai pelopor dengan komunitas yang aktif.`,
    website: "sub.co.id",
    history: `Didirikan sekitar tahun 2015 oleh Fajar Arisaputra, SUB Co dikenal sebagai salah satu perintis coworking space di Surabaya. Pendiriannya didasari oleh keinginan untuk menciptakan sebuah "rumah" bagi para kreator, freelancer, dan startup di Surabaya untuk bekerja, berkolaborasi, dan bertumbuh bersama. Nama "SUB" sendiri merupakan representasi dari kode kota Surabaya.`
  },
  {
    name: "Koridor (Diskominfo)",
    location: "Gedung Siola, Jl. Tunjungan",
    productsAndCapacity: `- Meeting Room: Sekitar 8 - 12 orang\n- Coworking Area (Hot Desk): Kapasitas puluhan orang (area terbuka)`,
    productsAndArea: `- Meeting Room: Estimasi 15 m² - 25 m²\n- Coworking Area (Hot Desk): Area umum > 150 m²`,
    productsAndPrice: `- Meeting Room: Gratis.\n- Coworking Area (Hot Desk): Gratis.\nSemua layanan gratis, namun memerlukan pendaftaran dan persetujuan.`,
    includedFacilities: `- WiFi\n- layar TV\n- papan tulis\n- AC`,
    uniqueSellingPoints: `- Fasilitas pemerintah di lokasi sangat strategis\n- pusat acara komunitas startup.`,
    website: "koridor.surabaya.go.id",
    history: `Diinisiasi dan diresmikan oleh Pemerintah Kota Surabaya di bawah kepemimpinan Walikota Tri Rismaharini sekitar tahun 2018. Tempat ini didirikan dengan tujuan menyediakan fasilitas gratis bagi anak-anak muda dan startup Surabaya untuk berkreasi, berinovasi, dan mengembangkan bisnis digital. Lokasinya di Gedung Siola, sebuah bangunan cagar budaya, merupakan upaya revitalisasi pusat kota.`
  },
  {
    name: "vOffice",
    location: "Intiland Tower & Trillium Office",
    productsAndCapacity: `- Meeting Room: 4 - 12 orang\n- Private Office (Serviced Office): 1 - 10 orang\n- Virtual Office: N/A`,
    productsAndArea: `- Meeting Room: Estimasi 8 m² - 25 m²\n- Private Office (Serviced Office): Mulai dari 6 m² (1 orang) hingga 35 m²\n- Virtual Office: N/A`,
    productsAndPrice: `- Meeting Room: Estimasi Rp200.000 - Rp400.000/jam.\n- Private Office: Estimasi mulai Rp4.000.000 - Rp8.000.000+/bulan.\n- Virtual Office: Paket mulai Rp4.680.000/tahun (sekitar Rp390.000/bulan).`,
    includedFacilities: `- WiFi\n- proyektor/TV\n- papan tulis\n- air mineral\n- kopi & teh\n- alat tulis`,
    uniqueSellingPoints: `Terintegrasi dengan layanan kantor virtual (virtual office).`,
    website: "voffice.co.id",
    history: `vOffice adalah bagian dari jaringan penyedia layanan kantor yang lebih besar dan sudah beroperasi di beberapa negara. Mereka masuk ke Indonesia untuk memenuhi permintaan akan serviced office dan virtual office yang efisien dan terjangkau. Pendiriannya didasari oleh tren kerja jarak jauh dan kebutuhan perusahaan untuk memiliki alamat bisnis yang prestisius tanpa harus menyewa kantor fisik yang mahal.`
  },
  {
    name: "Regus",
    location: "Pakuwon Centre, Graha Bukopin, Jl. Biliton",
    productsAndCapacity: `- Meeting Room: 2 - 20+ orang\n- Private Office: 1 - 100+ orang\n- Coworking Membership (Hot Desk): 1 orang\n- Virtual Office: N/A`,
    productsAndArea: `- Meeting Room: Estimasi 6 m² - 50+ m²\n- Private Office: Mulai dari 5 m² (1 orang) hingga 300+ m²\n- Coworking Membership (Hot Desk): Estimasi 1.2m x 0.6m per meja\n- Virtual Office: N/A`,
    productsAndPrice: `- Meeting Room: Estimasi mulai Rp250.000 - Rp500.000+/jam.\n- Private Office: Estimasi mulai Rp5.000.000 - Rp12.000.000+/bulan (standar korporat).\n- Coworking Membership (Hot Desk): Mulai Rp990.000/bulan.\n- Virtual Office: Mulai Rp519.000/bulan.`,
    includedFacilities: `- WiFi kelas bisnis\n- papan tulis\n- proyektor\n- dukungan tim di lokasi`,
    uniqueSellingPoints: `- Jaringan global dengan standar korporat\n- lokasi di pusat bisnis.`,
    website: "regus.co.id",
    history: `Regus adalah merek global yang didirikan pada tahun 1989 di Brussels, Belgia, oleh Mark Dixon. Idenya muncul saat Dixon menyadari banyak profesional yang harus bekerja di tempat yang tidak efisien seperti kafe saat bepergian. Regus didirikan untuk menyediakan ruang kerja profesional yang fleksibel di seluruh dunia. Kehadirannya di Surabaya adalah bagian dari strategi ekspansi global mereka untuk hadir di setiap pusat bisnis utama.`
  },
  {
    name: "C2O Library & Collabtive",
    location: "Jl. Dr. Cipto No. 22",
    productsAndCapacity: `- Coworking/Ruang Diskusi: 2 - 8 orang (area semi-privat)`,
    productsAndArea: `- Coworking/Ruang Diskusi: Estimasi 6 m² - 15 m² (area semi-privat)`,
    productsAndPrice: `- Coworking/Ruang Diskusi: Berbasis donasi sukarela atau sewa terjangkau (estimasi di bawah Rp50.000/sesi).`,
    includedFacilities: `- WiFi\n- buku-buku`,
    uniqueSellingPoints: `Suasana unik dan homey karena terintegrasi dengan perpustakaan.`,
    website: "c2o-library.net",
    history: `Didirikan oleh Kathleen Azali, C2O (dibaca: ce-tu-o) bermula dari sebuah perpustakaan pribadi yang dibuka untuk umum pada tahun 2008. Tempat ini berevolusi menjadi ruang kolaboratif karena melihat adanya kebutuhan ruang bagi komunitas dan individu untuk berkumpul, belajar, dan bekerja. Ini adalah proyek independen yang didasari oleh kecintaan pada literasi dan keinginan membangun ruang publik yang inklusif.`
  },
  {
    name: "Urban Office",
    location: "Jl. Dr. Ir. H. Soekarno, Rungkut",
    productsAndCapacity: `- Meeting Room: 6 - 10 orang\n- Event Space: Hingga 30 orang\n- Private Office: 2 - 6 orang`,
    productsAndArea: `- Meeting Room: Estimasi 12 m² - 20 m²\n- Event Space: Estimasi 40 m² - 60 m²\n- Private Office: Mulai dari 8 m² (2 orang) hingga 20 m²`,
    productsAndPrice: `- Meeting Room: Mulai Rp55.000/pax (paket 4 jam).\n- Event Space: Mulai Rp2.000.000 (setengah hari).\n- Private Office: Mulai Rp3.000.000/bulan.`,
    includedFacilities: `- Proyektor\n- WiFi\n- AC\n- perabotan lengkap\n- air mineral gratis`,
    uniqueSellingPoints: `- Tersedia kafe & lounge\n- lokasi dekat beberapa universitas.`,
    website: "urbanoffice.id",
    history: `Didirikan untuk menyediakan ruang kerja yang nyaman dan produktif dengan harga yang terjangkau, terutama menargetkan mahasiswa, freelancer, dan startup. Lokasinya yang strategis di dekat beberapa kampus besar seperti UPN dan UIN Surabaya menunjukkan fokus pasar mereka pada komunitas akademik dan para perintis muda.`
  },
  {
    name: "Revio Space",
    location: "Jl. Kaliwaron, Gubeng",
    productsAndCapacity: `- Meeting Room: 3 - 5 orang\n- Hot Desk: 1 orang\n- Private Office: 2 - 4 orang`,
    productsAndArea: `- Meeting Room: Estimasi 6 m² - 10 m²\n- Hot Desk: Estimasi 1.2m x 0.6m per meja\n- Private Office: Mulai dari 8 m² (2 orang) hingga 12 m²`,
    productsAndPrice: `- Meeting Room: Rp75.000/jam.\n- Hot Desk: Rp10.000/jam, Rp35.000/hari.\n- Private Office: Mulai Rp2.000.000/bulan.`,
    includedFacilities: `- Fasilitas meeting standar\n- WiFi cepat`,
    uniqueSellingPoints: `Salah satu opsi dengan harga per jam paling terjangkau.`,
    website: "reviospace.com",
    history: `Informasi spesifik mengenai histori pendiriannya cukup terbatas. Namun, dari model bisnisnya, Revio Space tampaknya didirikan untuk menangkap segmen pasar yang sangat sensitif terhadap harga. Dengan menawarkan tarif per jam yang sangat kompetitif, mereka hadir sebagai solusi bagi pelajar, mahasiswa, dan pekerja lepas yang butuh tempat kerja sementara dengan bujet minimal.`
  },
  {
    name: "Satu Atap",
    location: "Jl. Pacar No. 2, Genteng",
    productsAndCapacity: `- Hot Desk (Area Kerja): 1 orang per meja (total kapasitas puluhan)`,
    productsAndArea: `- Hot Desk (Area Kerja): Estimasi 1.2m x 0.6m per meja`,
    productsAndPrice: `- Hot Desk (per orang): Mulai Rp15.000/jam (sering ada paket dengan F&B).\nFokus utama pada sewa per jam per orang di area kafe, bukan produk kantor terstruktur.`,
    includedFacilities: `- Air mineral\n- teh & kopi\n- makanan ringan`,
    uniqueSellingPoints: `- Suasana nyaman dan instagramable\n- memiliki food station.`,
    website: "Instagram: @satuatapsby",
    history: `Didirikan dengan konsep yang lebih dari sekadar tempat kerja. Dari namanya, "Satu Atap" menyiratkan sebuah tempat yang menyatukan berbagai kebutuhan: bekerja, makan, dan berkomunitas. Latar belakangnya adalah untuk menciptakan ruang dengan suasana yang nyaman, homey, dan estetis (instagramable) untuk menarik segmen anak muda dan pekerja kreatif.`
  },
  {
    name: "Visma",
    location: "Jl. Tegalsari No. 35, Tegalsari",
    productsAndCapacity: `- Hot Desk (Area Kerja): 1 orang per meja (total kapasitas belasan)`,
    productsAndArea: `- Hot Desk (Area Kerja): Estimasi 1.2m x 0.6m per meja`,
    productsAndPrice: `- Hot Desk (per orang): Sekitar Rp35.000 - Rp50.000/2 jam.\nModel bisnis lebih mirip kafe yang ramah untuk bekerja daripada coworking space formal.`,
    includedFacilities: `- Fasilitas meeting standar\n- WiFi\n- AC`,
    uniqueSellingPoints: `- Konsep unik gabungan coworking\n- coffee shop\n- dan galeri seni.`,
    website: "Instagram: @visma.sub",
    history: `Visma didirikan dengan visi untuk mengintegrasikan tiga elemen: kerja, seni, dan kopi. Tempat ini lahir dari keinginan untuk menciptakan sebuah ruang yang tidak hanya fungsional untuk bekerja, tetapi juga bisa memberikan inspirasi melalui galeri seni dan kenyamanan melalui coffee shop. Ini adalah jawaban bagi mereka yang mencari pengalaman kerja yang berbeda dan lebih kaya secara budaya.`
  },
  {
    name: "Paco Coworking Space",
    location: "Jl. Taman Bungkul No. 25, Wonokromo",
    productsAndCapacity: `- Meeting Room: 10 & 25 orang\n- Hot Desk: 1 orang`,
    productsAndArea: `- Meeting Room: Estimasi 20 m² & 40 m²\n- Hot Desk: Estimasi 1.2m x 0.6m per meja`,
    productsAndPrice: `- Meeting Room: Rp100.000 - Rp150.000/jam.\n- Hot Desk: Rp20.000/jam, Rp50.000/hari.`,
    includedFacilities: `- Internet\n- air mineral\n- meja fleksibel`,
    uniqueSellingPoints: `- Terintegrasi dengan kafe\n- lokasi strategis dekat Taman Bungkul.`,
    website: "Instagram: @pacocoworking.sby",
    history: `Paco (Panggonan Kolaborasi) didirikan untuk memanfaatkan lokasi strategisnya di dekat Taman Bungkul, salah satu ikon dan pusat aktivitas warga Surabaya. Pendiriannya bertujuan untuk menyediakan "panggonan" (tempat) yang mudah dijangkau bagi siapa saja yang membutuhkan ruang untuk bekerja atau berkolaborasi, dengan dukungan fasilitas kafe yang terintegrasi.`
  },
  {
    name: "TIFAhub",
    location: "Graha Bukopin Surabaya, Jl. Panglima Sudirman",
    productsAndCapacity: `- Meeting Room: 4 - 15 orang\n- Private Office: 2 - 10 orang\n- Dedicated Desk: 1 orang\n- Virtual Office: N/A`,
    productsAndArea: `- Meeting Room: Estimasi 8 m² - 30 m²\n- Private Office: Mulai dari 8 m² (2 orang) hingga 35 m²\n- Dedicated Desk: Estimasi 1.2m x 0.6m per meja\n- Virtual Office: N/A`,
    productsAndPrice: `- Meeting Room: Estimasi mulai Rp150.000 - Rp300.000/jam.\n- Private Office: Estimasi mulai Rp4.500.000 - Rp9.000.000+/bulan.\n- Dedicated Desk: Estimasi mulai Rp1.500.000 - Rp2.000.000/bulan.\n- Virtual Office: Estimasi mulai Rp400.000 - Rp600.000/bulan.`,
    includedFacilities: `- Kopi & teh gratis\n- WiFi cepat\n- lingkungan tenang`,
    uniqueSellingPoints: `- Lokasi di pusat bisnis\n- dekat pusat hiburan dan kantor pemerintah.`,
    website: "tifahub.id",
    history: `Didirikan oleh PT Tifa Asri Indonesia, TIFAhub merupakan bagian dari diversifikasi bisnis perusahaan properti. Kehadirannya di Graha Bukopin, sebuah gedung perkantoran di pusat kota, menunjukkan bahwa ia didirikan untuk melayani segmen korporat dan profesional yang membutuhkan fleksibilitas ruang kerja namun tetap dengan citra dan fasilitas yang profesional di lokasi premium.`
  },
  {
    name: "Spazio",
    location: "Jl. Mayjend. Jonosewojo No.KAV. 3",
    productsAndCapacity: `- Meeting Room: 4 - 12 orang\n- Serviced Office (Private Office): 2 - 15 orang\n- Virtual Office: N/A`,
    productsAndArea: `- Meeting Room: Estimasi 8 m² - 25 m²\n- Serviced Office (Private Office): Mulai dari 8 m² (2 orang) hingga 50 m²\n- Virtual Office: N/A`,
    productsAndPrice: `- Meeting Room: Mulai Rp100.000/jam.\n- Serviced Office (Private Office): Estimasi mulai Rp4.000.000 - Rp8.000.000+/bulan.\n- Virtual Office: Estimasi mulai Rp400.000 - Rp700.000/bulan.`,
    includedFacilities: `- Proyektor\n- layar\n- WiFi\n- air mineral\n- papan tulis`,
    uniqueSellingPoints: `- Berada di kompleks komersial\n- desain modern & profesional.`,
    website: "spazio.co.id",
    history: `Spazio dikembangkan oleh Intiland Development Tbk sebagai bagian dari sebuah superblok yang mengintegrasikan perkantoran, ritel, dan hiburan. Coworking space di dalamnya didirikan sebagai fasilitas pelengkap untuk mendukung ekosistem bisnis di area tersebut. Tujuannya adalah menyediakan solusi ruang kerja modern bagi para penyewa gedung dan masyarakat umum di kawasan Surabaya Barat.`
  },
  {
    name: "Kolega",
    location: "Graha Anugerah, Jl. Raya Rungkut Industri",
    productsAndCapacity: `- Meeting Room: 4 - 12 orang\n- Private Office: 2 - 8 orang\n- Dedicated Desk: 1 orang\n- Hot Desk: 1 orang`,
    productsAndArea: `- Meeting Room: Estimasi 8 m² - 25 m²\n- Private Office: Mulai dari 8 m² (2 orang) hingga 25 m²\n- Dedicated Desk: Estimasi 1.2m x 0.6m per meja\n- Hot Desk: Estimasi 1.2m x 0.6m per meja`,
    productsAndPrice: `- Meeting Room: Mulai Rp75.000/jam.\n- Private Office: Estimasi mulai Rp3.500.000 - Rp7.000.000+/bulan.\n- Dedicated Desk: Mulai Rp1.250.000/bulan.\n- Hot Desk: Mulai Rp100.000/hari.`,
    includedFacilities: `- WiFi\n- papan tulis\n- air mineral\n- teh & kopi gratis`,
    uniqueSellingPoints: `Lokasi strategis di kawasan industri SIER.`,
    website: "kolega.co",
    history: `Didirikan di Jakarta, Kolega berekspansi ke Surabaya dengan tujuan membangun jaringan dan komunitas bisnis di berbagai kota. Mereka didirikan untuk menyediakan ruang kerja yang mendukung kolaborasi dan produktivitas. Pemilihan lokasi di kawasan industri Rungkut (SIER) merupakan langkah strategis untuk melayani perusahaan dan profesional yang beraktivitas di salah satu pusat industri terbesar di Surabaya.`
  },
  {
    name: "Omah Wani",
    location: "Jl. Jambangan Kebon Agung No. 22",
    productsAndCapacity: `- Meeting Room: Sekitar 8 - 10 orang\n- Coworking Area: Kapasitas belasan hingga puluhan orang`,
    productsAndArea: `- Meeting Room: Estimasi 15 m² - 20 m²\n- Coworking Area: Area umum > 50 m²`,
    productsAndPrice: `- Coworking Area & Meeting Room: Harga sangat terjangkau, berbasis komunitas. \nEstimasi di bawah Rp50.000/sesi atau per hari.`,
    includedFacilities: `- WiFi\n- proyektor\n- papan tulis\n- area parkir`,
    uniqueSellingPoints: `- Dikelola oleh komunitas suporter (Bonek)\n- nilai komunitas kuat.`,
    website: "Instagram: @omahwanisby",
    history: `Ini adalah inisiatif unik yang didirikan oleh komunitas suporter Persebaya, Bonek. "Omah Wani" (Rumah Berani) didirikan bukan hanya sebagai coworking space, tetapi juga sebagai basis atau markas untuk kegiatan kreatif dan produktif para suporter. Tujuannya adalah untuk mengubah citra suporter dan menyediakan wadah positif bagi anggotanya untuk berkarya dan berwirausaha.`
  },
  {
    name: "The Startup Connect",
    location: "Jl. Raya Darmo Permai III",
    productsAndCapacity: `- Private Office: 2 - 8 orang\n- Coworking Desk: 1 orang`,
    productsAndArea: `- Private Office: Mulai dari 8 m² (2 orang) hingga 25 m²\n- Coworking Desk: Estimasi 1.2m x 0.6m per meja`,
    productsAndPrice: `- Private Office: Estimasi mulai Rp3.500.000 - Rp7.000.000+/bulan (harga bisa dipaketkan dengan program inkubasi).\n- Coworking Desk: Seringkali untuk anggota program inkubasi, estimasi sewa murni Rp1.000.000 - Rp1.500.000/bulan.`,
    includedFacilities: `- WiFi cepat\n- fasilitas standar\n- pantry`,
    uniqueSellingPoints: `- Fokus pada ekosistem startup\n- sering mengadakan acara networking.`,
    website: "thestartupconnect.id",
    history: `Didirikan dengan fokus yang sangat spesifik: membangun dan mendukung ekosistem startup. Latar belakang pendiriannya adalah untuk menjadi lebih dari sekadar penyedia ruang, melainkan sebuah hub yang menghubungkan para pendiri startup dengan mentor, investor, dan talenta. Mereka sering mengadakan program inkubasi dan akselerasi sebagai bagian dari misi utamanya.`
  }
];