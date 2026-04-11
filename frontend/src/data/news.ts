// =============================================
// TYPES & INTERFACES (ENGLISH KEYS)
// =============================================

/**
 * Tipe gender peserta yang dipakai lintas modul data.
 */
export type Gender = "Encik" | "Puan";

export type StageStatus =
  | "Pending"
  | "Verified"
  | "Rejected"
  | "Audition"
  | "Top20"
  | "PreCamp"
  | "Camp"
  | "GrandFinal"
  | "Winner";

export type ScheduleStatus = "active" | "upcoming" | "done";

export type CriteriaKey =
  | "tourismKnowledge"
  | "publicSpeaking"
  | "leadership"
  | "workProgram"
  | "english";

export interface CriteriaItem {
  key: CriteriaKey;
  label: string; // UI label boleh Indonesia
  weight: number;
}

export interface WinnerCategory {
  title: string;
  description: string;
}

export type NewsBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "quote"; text: string; author?: string }
  | { type: "list"; items: string[] }
  | { type: "image"; src: string; alt?: string; caption?: string };

export interface NewsItem {
  id: string;
  title: string;
  image: string;     // cover
  date: string;      // yyyy-mm-dd
  category: string;

  // short preview for card list
  excerpt: string;

  // LONG article content
  body: NewsBlock[];
}

export interface Score {
  tourismKnowledge: number;
  publicSpeaking: number;
  leadership: number;
  workProgram: number;
  english: number;
}

export interface ParticipantScore {
  judgeId: string;
  judgeName: string;
  stage: string;
  score: Score;
  submittedAt: string; // ISO datetime
}

export interface Participant {
  id: string;
  number: string; // ex: ECK-001
  name: string;
  gender: Gender;

  nationalId: string; // NIK
  birthPlace: string;
  birthDate: string; // yyyy-mm-dd
  heightCm: number;

  education: string;
  instagram: string;
  phone: string;
  email: string;

  photo: string;
  status: StageStatus;
  submittedToAdmin?: boolean;
  rejectionReason?: string;
  agreementNoAgency?: "yes" | "no";
  agencyName?: string;
  agreementParentPermission?: "yes" | "no";
  agreementAllStages?: "yes" | "no";
  motivationStatement?: string;
  contributionIdea?: string;
  publicSpeakingExperience?: string;
  registeredAt: string; // yyyy-mm-dd
  scores: ParticipantScore[];
  likes?: number;
}

export interface Judge {
  id: string;
  name: string;
  email?: string;
  title: string;
  organization: string;
  stages: string[];
  avatar: string;
}

export interface ScheduleItem {
  activity: string;
  date: string;
  status: ScheduleStatus;
}

export interface ScoreRecord {
  id: string;
  participantId: string;
  participantName: string;
  judgeId: string;
  judgeName: string;
  stage: string;
  score: Score;
  totalScore: number;
  submittedAt: string;
}

// =============================================
// CONSTANTS
// =============================================

const malePhoto =
  "https://images.unsplash.com/photo-1648448942225-7aa06c7e8f79?w=400&q=80";
const femalePhoto =
  "https://images.unsplash.com/photo-1642629428997-422b3181aedd?w=400&q=80";

/**
 * Urutan tahapan seleksi utama.
 */
export const stages = ["Audition", "Pre-Camp", "Camp", "Grand Final"];

/**
 * Daftar kriteria penilaian default beserta bobotnya.
 */
export const criteriaList: CriteriaItem[] = [
  {
    key: "tourismKnowledge",
    label: "Pengetahuan Pariwisata & Kebudayaan",
    weight: 25,
  },
  { key: "publicSpeaking", label: "Public Speaking & Kepribadian", weight: 25 },
  { key: "leadership", label: "Jiwa Kepemimpinan & Kemitraan", weight: 20 },
  { key: "workProgram", label: "Program Kerja", weight: 15 },
  { key: "english", label: "Bahasa Inggris (Aktif & Pasif)", weight: 15 },
];

export const schedule: ScheduleItem[] = [
  { activity: "Online Registration", date: "1 Februari – 1 April 2026", status: "active" },
  { activity: "Technical Meeting", date: "2 April 2026", status: "upcoming" },
  { activity: "Audition", date: "4 April 2026", status: "upcoming" },
  { activity: "Pre-Camp", date: "6 – 17 April 2026", status: "upcoming" },
  { activity: "Camp", date: "22 – 24 April 2026", status: "upcoming" },
  { activity: "Grand Final", date: "25 April 2026", status: "upcoming" },
];

export const winnerCategories: WinnerCategory[] = [
  {
    title: "Encik Duta Wisata Kota Batam 2026",
    description:
      "Peserta putra terbaik dengan nilai tertinggi dari seluruh tahapan seleksi hingga Grand Final.",
  },
  {
    title: "Puan Duta Wisata Kota Batam 2026",
    description:
      "Peserta putri terbaik dengan nilai tertinggi dari seluruh tahapan seleksi hingga Grand Final.",
  },
  {
    title: "1st Runner Up Encik",
    description:
      "Runner Up putra terbaik dalam Pemilihan Duta Wisata Kota Batam 2026.",
  },
  {
    title: "1st Runner Up Puan",
    description:
      "Runner Up putri terbaik dalam Pemilihan Duta Wisata Kota Batam 2026.",
  },
  {
    title: "Duta Favorit Encik",
    description:
      "Encik dengan dukungan Instagram terbanyak dari masyarakat Kota Batam.",
  },
  {
    title: "Duta Favorit Puan",
    description:
      "Puan dengan dukungan Instagram terbanyak dari masyarakat Kota Batam.",
  },
];

export const statusLabelsId: Record<StageStatus, string> = {
  Pending: "Menunggu Verifikasi",
  Verified: "Terverifikasi",
  Rejected: "Ditolak",
  Audition: "Lolos Administrasi – Audisi",
  Top20: "Top 20",
  PreCamp: "Pra-Karantina",
  Camp: "Karantina",
  GrandFinal: "Grand Final",
  Winner: "Juara",
};

export const statusColors: Record<StageStatus, string> = {
  Pending: "#6B7280",
  Verified: "#3B82F6",
  Rejected: "#EF4444",
  Audition: "#8B5CF6",
  Top20: "#C8A24D",
  PreCamp: "#F59E0B",
  Camp: "#10B981",
  GrandFinal: "#C8A24D",
  Winner: "#C8A24D",
};

// =============================================
// MOCK NEWS (ENGLISH KEYS)
// =============================================

export const mockNews: NewsItem[] = [
  {
    id: "n001",
    title: "Pendaftaran Duta Wisata Batam 2026 Resmi Dibuka",
    image:
      "https://images.unsplash.com/photo-1562428580-33e2cc141402?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600&q=80",
    date: "2026-02-01",
    category: "Pengumuman",
    excerpt:
      "Disbudpar Batam resmi membuka pendaftaran Encik & Puan Duta Wisata 2026 secara online mulai 1 Februari hingga 1 April 2026.",
    body: [
      {
        type: "paragraph",
        text:
          "BATAM — Dinas Kebudayaan dan Pariwisata (Disbudpar) Kota Batam resmi membuka pendaftaran Pemilihan Encik & Puan Duta Wisata Kota Batam 2026. Pendaftaran dilakukan secara online melalui platform resmi panitia.",
      },
      {
        type: "paragraph",
        text:
          "Program ini ditujukan untuk menjaring generasi muda Batam yang siap menjadi representasi pariwisata daerah, baik di tingkat nasional maupun internasional. Peserta akan melewati tahapan seleksi administrasi, audisi, pra-karantina, karantina, hingga grand final.",
      },
      { type: "heading", text: "Jadwal Pendaftaran" },
      {
        type: "list",
        items: [
          "Pendaftaran online: 1 Februari – 1 April 2026",
          "Technical meeting: 2 April 2026",
          "Audisi: 4 April 2026",
          "Pra-karantina: 6 – 17 April 2026",
          "Karantina: 22 – 24 April 2026",
          "Grand final: 25 April 2026",
        ],
      },
      {
        type: "quote",
        text:
          "Kami ingin duta yang bukan hanya berpenampilan baik, tetapi juga punya wawasan dan kemampuan komunikasi yang kuat untuk mempromosikan Batam.",
        author: "Panitia Pemilihan Duta Wisata Batam 2026",
      },
      {
        type: "paragraph",
        text:
          "Panitia mengimbau calon peserta menyiapkan berkas administrasi sesuai ketentuan. Informasi lengkap termasuk persyaratan dan panduan teknis akan diumumkan melalui kanal resmi.",
      },
      {
        type: "image",
        src:
          "https://images.unsplash.com/photo-1523240795612-9a054b0db644?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600&q=80",
        alt: "Ilustrasi pendaftaran online",
        caption: "Pendaftaran dilakukan melalui platform digital resmi.",
      },
      {
        type: "paragraph",
        text:
          "Dengan adanya platform digital, proses seleksi diharapkan lebih transparan, terdokumentasi, dan mudah dipantau oleh panitia maupun peserta.",
      },
    ],
  },
  {
    id: "n002",
    title: "Technical Meeting Peserta Digelar Secara Hybrid",
    image:
      "https://images.unsplash.com/photo-1515169067868-5387ec356754?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600&q=80",
    date: "2026-02-10",
    category: "Kegiatan",
    excerpt:
      "Panitia menggelar technical meeting hybrid untuk membahas aturan seleksi, dress code, dan mekanisme penilaian awal.",
    body: [
      {
        type: "paragraph",
        text:
          "Technical meeting resmi dilaksanakan untuk seluruh calon peserta yang lolos verifikasi administrasi. Agenda ini membahas alur seleksi dari audisi hingga grand final.",
      },
      {
        type: "list",
        items: [
          "Briefing ketentuan tahap audisi",
          "Simulasi registrasi ulang",
          "Penjelasan rubrik penilaian",
        ],
      },
      {
        type: "quote",
        text:
          "Peserta diharapkan memahami seluruh aturan agar kompetisi berjalan adil, tertib, dan profesional.",
        author: "Koordinator Acara",
      },
    ],
  },
  {
    id: "n003",
    title: "Roadshow Promosi Pariwisata Batam Dimulai",
    image:
      "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600&q=80",
    date: "2026-02-18",
    category: "Publikasi",
    excerpt:
      "Finalis melakukan roadshow ke sekolah dan kampus untuk kampanye sadar wisata serta promosi destinasi unggulan Batam.",
    body: [
      {
        type: "paragraph",
        text:
          "Program roadshow menjadi bagian dari pembekalan komunikasi publik bagi para finalis. Kegiatan fokus pada edukasi pariwisata dan budaya lokal.",
      },
      {
        type: "heading",
        text: "Fokus Materi Roadshow",
      },
      {
        type: "list",
        items: [
          "Sapta Pesona dan etika wisata",
          "Destinasi prioritas Kota Batam",
          "Peran generasi muda sebagai promotor wisata",
        ],
      },
    ],
  },
  {
    id: "n004",
    title: "Top 20 Finalis Diumumkan Panitia",
    image:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600&q=80",
    date: "2026-03-01",
    category: "Pengumuman",
    excerpt:
      "Panitia menetapkan Top 20 finalis berdasarkan hasil audisi, tes wawasan pariwisata, dan public speaking.",
    body: [
      {
        type: "paragraph",
        text:
          "Setelah melalui seleksi ketat, dewan juri resmi menetapkan Top 20 finalis Encik dan Puan Duta Wisata Kota Batam 2026.",
      },
      {
        type: "paragraph",
        text:
          "Penilaian dilakukan berdasarkan kombinasi wawancara, presentasi singkat, penguasaan materi kepariwisataan, serta etika panggung.",
      },
      {
        type: "image",
        src:
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600&q=80",
        alt: "Suasana pengumuman finalis",
        caption: "Panitia mengumumkan Top 20 finalis secara terbuka.",
      },
    ],
  },
  {
    id: "n005",
    title: "Pra-Karantina Fokus pada Leadership dan Branding",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600&q=80",
    date: "2026-03-14",
    category: "Pelatihan",
    excerpt:
      "Sesi pra-karantina menekankan pembentukan karakter, kepemimpinan, serta personal branding finalis di media digital.",
    body: [
      {
        type: "heading",
        text: "Materi Inti Pra-Karantina",
      },
      {
        type: "list",
        items: [
          "Leadership and teamwork",
          "Public speaking untuk event resmi",
          "Personal branding di media sosial",
        ],
      },
      {
        type: "quote",
        text:
          "Duta wisata harus mampu menjadi teladan, komunikatif, dan konsisten membawa citra positif daerah.",
        author: "Narasumber Pembekalan",
      },
    ],
  },
  {
    id: "n006",
    title: "Malam Grand Final Siap Digelar April 2026",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600&q=80",
    date: "2026-03-25",
    category: "Agenda",
    excerpt:
      "Panitia memastikan seluruh persiapan grand final berjalan sesuai jadwal dengan konsep pertunjukan budaya modern.",
    body: [
      {
        type: "paragraph",
        text:
          "Malam grand final akan menampilkan kolaborasi seni budaya, sesi tanya jawab juri, serta penetapan pemenang kategori utama dan favorit.",
      },
      {
        type: "paragraph",
        text:
          "Masyarakat dapat mendukung finalis favorit melalui kanal media sosial resmi dengan tetap menjaga etika digital.",
      },
      {
        type: "list",
        items: [
          "Gladi bersih finalis",
          "Parade busana daerah",
          "Pengumuman pemenang utama",
        ],
      },
    ],
  },
  {
    id: "n007",
    title: "Kolaborasi UMKM Lokal di Area Grand Final",
    image:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600&q=80",
    date: "2026-03-30",
    category: "Ekonomi Kreatif",
    excerpt:
      "Panitia menghadirkan booth UMKM kuliner dan kriya untuk mendukung promosi ekonomi kreatif Kota Batam selama grand final.",
    body: [
      {
        type: "paragraph",
        text:
          "Kegiatan grand final juga menjadi ruang promosi bagi pelaku UMKM lokal melalui pameran produk kuliner, kriya, dan fesyen daerah.",
      },
      {
        type: "quote",
        text:
          "Duta wisata tidak hanya mempromosikan destinasi, tetapi juga produk ekonomi kreatif masyarakat.",
        author: "Dinas Kebudayaan dan Pariwisata",
      },
      {
        type: "image",
        src:
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600&q=80",
        alt: "Booth UMKM pada event pariwisata",
        caption: "UMKM lokal dilibatkan untuk memperkuat ekosistem pariwisata.",
      },
    ],
  },
];

// =============================================
// MOCK PARTICIPANTS (NEW FORMAT)
// =============================================

export const mockParticipants: Participant[] = [
  // Encik
  {
    id: "P001",
    number: "ECK-001",
    name: "Muhammad Rizki Pratama",
    gender: "Encik",
    nationalId: "3171010101020001",
    birthPlace: "Batam",
    birthDate: "2002-01-01",
    heightCm: 178,
    education: "Mahasiswa S1 – Universitas Batam",
    instagram: "@rizki_pratama",
    phone: "081234567001",
    email: "rizki.pratama@email.com",
    photo: malePhoto,
    status: "GrandFinal",
    registeredAt: "2026-02-10",
    scores: [],
    likes: 2540,
  },
  {
    id: "P002",
    number: "ECK-002",
    name: "Andrean Saputra",
    gender: "Encik",
    nationalId: "3171010101020002",
    birthPlace: "Batam",
    birthDate: "2003-05-15",
    heightCm: 176,
    education: "Mahasiswa S1 – Politeknik Negeri Batam",
    instagram: "@andrean_saputra",
    phone: "081234567002",
    email: "andrean@email.com",
    photo: malePhoto,
    status: "GrandFinal",
    registeredAt: "2026-02-11",
    scores: [],
    likes: 2120,
  },

  // Puan
  {
    id: "P011",
    number: "PUA-001",
    name: "Siti Nurhaliza Putri",
    gender: "Puan",
    nationalId: "3171010101020011",
    birthPlace: "Batam",
    birthDate: "2002-02-14",
    heightCm: 167,
    education: "Mahasiswi S1 – Universitas Batam",
    instagram: "@siti_nurhaliza",
    phone: "081234567011",
    email: "siti@email.com",
    photo: femalePhoto,
    status: "GrandFinal",
    registeredAt: "2026-02-10",
    scores: [],
    likes: 3120,
  },
  {
    id: "P003",
    number: "ECK-003",
    name: "Fajar Maulana",
    gender: "Encik",
    nationalId: "3171010101020003",
    birthPlace: "Batam",
    birthDate: "2002-08-11",
    heightCm: 179,
    education: "Mahasiswa S1 - Universitas Internasional Batam",
    instagram: "@fajarmaulana_",
    phone: "081234567003",
    email: "fajar.maulana@email.com",
    photo: malePhoto,
    status: "GrandFinal",
    registeredAt: "2026-02-11",
    scores: [],
    likes: 2980,
  },
  {
    id: "P004",
    number: "ECK-004",
    name: "Rafi Akbar",
    gender: "Encik",
    nationalId: "3171010101020004",
    birthPlace: "Batam",
    birthDate: "2001-12-09",
    heightCm: 181,
    education: "Mahasiswa S1 - Politeknik Negeri Batam",
    instagram: "@rafiakbar.id",
    phone: "081234567004",
    email: "rafi.akbar@email.com",
    photo: malePhoto,
    status: "GrandFinal",
    registeredAt: "2026-02-12",
    scores: [],
    likes: 2760,
  },
  {
    id: "P005",
    number: "ECK-005",
    name: "Dimas Pranata",
    gender: "Encik",
    nationalId: "3171010101020005",
    birthPlace: "Batam",
    birthDate: "2003-01-28",
    heightCm: 177,
    education: "Mahasiswa S1 - Universitas Putera Batam",
    instagram: "@dimaspranata",
    phone: "081234567005",
    email: "dimas.pranata@email.com",
    photo: malePhoto,
    status: "GrandFinal",
    registeredAt: "2026-02-13",
    scores: [],
    likes: 2410,
  },
  {
    id: "P012",
    number: "PUA-002",
    name: "Alya Maharani",
    gender: "Puan",
    nationalId: "3171010101020012",
    birthPlace: "Batam",
    birthDate: "2002-06-20",
    heightCm: 169,
    education: "Mahasiswi S1 - Universitas Maritim Raja Ali Haji",
    instagram: "@alyamaharani",
    phone: "081234567012",
    email: "alya.maharani@email.com",
    photo: femalePhoto,
    status: "GrandFinal",
    registeredAt: "2026-02-10",
    scores: [],
    likes: 3350,
  },
  {
    id: "P013",
    number: "PUA-003",
    name: "Nabila Safitri",
    gender: "Puan",
    nationalId: "3171010101020013",
    birthPlace: "Batam",
    birthDate: "2001-10-03",
    heightCm: 168,
    education: "Mahasiswi S1 - Universitas Batam",
    instagram: "@nabilasafitri_",
    phone: "081234567013",
    email: "nabila.safitri@email.com",
    photo: femalePhoto,
    status: "GrandFinal",
    registeredAt: "2026-02-12",
    scores: [],
    likes: 3190,
  },
  {
    id: "P014",
    number: "PUA-004",
    name: "Syifa Ramadhani",
    gender: "Puan",
    nationalId: "3171010101020014",
    birthPlace: "Batam",
    birthDate: "2002-04-08",
    heightCm: 166,
    education: "Mahasiswi S1 - Politeknik Negeri Batam",
    instagram: "@syifaramadhanii",
    phone: "081234567014",
    email: "syifa.ramadhani@email.com",
    photo: femalePhoto,
    status: "GrandFinal",
    registeredAt: "2026-02-13",
    scores: [],
    likes: 2870,
  },
  {
    id: "P015",
    number: "PUA-005",
    name: "Keisya Novita",
    gender: "Puan",
    nationalId: "3171010101020015",
    birthPlace: "Batam",
    birthDate: "2003-03-25",
    heightCm: 170,
    education: "Mahasiswi S1 - Universitas Internasional Batam",
    instagram: "@keisyanovita",
    phone: "081234567015",
    email: "keisya.novita@email.com",
    photo: femalePhoto,
    status: "GrandFinal",
    registeredAt: "2026-02-14",
    scores: [],
    likes: 2640,
  },
  {
    id: "P016",
    number: "PUA-006",
    name: "Intan Permata",
    gender: "Puan",
    nationalId: "3171010101020016",
    birthPlace: "Batam",
    birthDate: "2002-11-16",
    heightCm: 168,
    education: "Mahasiswi S1 - Universitas Putera Batam",
    instagram: "@intanpermata_",
    phone: "081234567016",
    email: "intan.permata@email.com",
    photo: femalePhoto,
    status: "Winner",
    registeredAt: "2026-02-15",
    scores: [],
    likes: 3520,
  },
  {
    id: "P006",
    number: "ECK-006",
    name: "Reza Saputra",
    gender: "Encik",
    nationalId: "3171010101020006",
    birthPlace: "Batam",
    birthDate: "2002-09-05",
    heightCm: 180,
    education: "Mahasiswa S1 - Universitas Batam",
    instagram: "@rezasaputra.id",
    phone: "081234567006",
    email: "reza.saputra@email.com",
    photo: malePhoto,
    status: "Winner",
    registeredAt: "2026-02-10",
    scores: [],
    likes: 3410,
  },

  // Pending
  {
    id: "P021",
    number: "ECK-021",
    name: "Ahmad Fauzi",
    gender: "Encik",
    nationalId: "3171010101020021",
    birthPlace: "Batam",
    birthDate: "2002-03-15",
    heightCm: 176,
    education: "Mahasiswa S1 – Universitas Batam",
    instagram: "@ahmad_fauzi",
    phone: "081234567021",
    email: "ahmfauzi@email.com",
    photo: malePhoto,
    status: "Pending",
    registeredAt: "2026-02-20",
    scores: [],
    likes: 0,
  },
];

// =============================================
// MOCK JUDGES (ENGLISH KEYS)
// =============================================

export const mockJudges: Judge[] = [
  {
    id: "J001",
    name: "Dr. Hj. Siti Rahayu, M.Par",
    email: "juri1@dutawisatabatam.id",
    title: "Kepala Dinas Kebudayaan & Pariwisata",
    organization: "Pemko Batam",
    stages: ["Audition", "Pre-Camp"],
    avatar: femalePhoto,
  },
  {
    id: "J002",
    name: "Bpk. Hendri Kusuma, S.Par",
    email: "juri2@dutawisatabatam.id",
    title: "Akademisi Pariwisata",
    organization: "Politeknik Negeri Batam",
    stages: ["Audition", "Camp"],
    avatar: malePhoto,
  },
  {
    id: "J003",
    name: "Ibu Dewi Sartika, M.M",
    email: "juri3@dutawisatabatam.id",
    title: "Praktisi Event Organizer",
    organization: "PT. Batam Event Pro",
    stages: ["Pre-Camp", "Grand Final"],
    avatar: femalePhoto,
  },
];

// =============================================
// MOCK SCORE MAP (OPTIONAL, LIKE FIGMA VERSION)
// =============================================

export const mockStageScores: Record<
  string,
  Record<string, { stage: string; scores: Score[] }>
> = {
  P001: {
    Audition: {
      stage: "Audition",
      scores: [
        {
          tourismKnowledge: 88,
          publicSpeaking: 85,
          leadership: 82,
          workProgram: 80,
          english: 87,
        },
      ],
    },
    "Pre-Camp": {
      stage: "Pre-Camp",
      scores: [
        {
          tourismKnowledge: 90,
          publicSpeaking: 88,
          leadership: 85,
          workProgram: 83,
          english: 89,
        },
      ],
    },
    Camp: {
      stage: "Camp",
      scores: [
        {
          tourismKnowledge: 92,
          publicSpeaking: 91,
          leadership: 88,
          workProgram: 86,
          english: 90,
        },
      ],
    },
  },
};

// =============================================
// MOCK SCORE RECORDS (FLAT LIST FOR CONTEXT)
// =============================================

export const mockScoreRecords: ScoreRecord[] = [
  {
    id: "sr001",
    participantId: "P001",
    participantName: "Muhammad Rizki Pratama",
    judgeId: "J001",
    judgeName: "Dr. Hj. Siti Rahayu, M.Par",
    stage: "Pre-Camp",
    score: {
      tourismKnowledge: 88,
      publicSpeaking: 85,
      leadership: 82,
      workProgram: 80,
      english: 87,
    },
    totalScore: 84.85,
    submittedAt: "2026-04-07T10:30:00",
  },
  {
    id: "sr002",
    participantId: "P011",
    participantName: "Siti Nurhaliza Putri",
    judgeId: "J001",
    judgeName: "Dr. Hj. Siti Rahayu, M.Par",
    stage: "Pre-Camp",
    score: {
      tourismKnowledge: 90,
      publicSpeaking: 92,
      leadership: 88,
      workProgram: 85,
      english: 89,
    },
    totalScore: 89.2,
    submittedAt: "2026-04-07T11:00:00",
  },
];

// alias for AppContext earlier (if you want scoreList as ScoreRecord[])
export const mockScores = mockScoreRecords;

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Menghitung total skor berbobot berdasarkan kriteria aktif.
 */
export function calcTotalScore(score: Score): number {
  let total = 0;

  for (const c of criteriaList) {
    const value = score[c.key];
    total += (value * c.weight) / 100;
  }

  return Math.round(total * 100) / 100;
}

/**
 * Menghitung rata-rata skor peserta pada stage tertentu.
 * Jika belum ada data skor, fungsi mengembalikan nilai fallback simulasi.
 */
export function getAverageScore(participantId: string, stage: string): number {
  const stageScores = mockStageScores[participantId]?.[stage]?.scores ?? [];
  if (stageScores.length === 0) return Math.floor(Math.random() * 20 + 75);

  const totals = stageScores.map((s) => calcTotalScore(s));
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  return Math.round(avg * 100) / 100;
}

