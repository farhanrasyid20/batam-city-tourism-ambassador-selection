import type { FaqItem as BackendFaqItem } from "../lib/auth-api";

/**
 * Alias tipe FAQ dari kontrak backend agar konsisten dipakai di frontend.
 */
export type FAQItem = BackendFaqItem;

/**
 * Data FAQ fallback lokal.
 * Digunakan saat data FAQ dari backend belum tersedia/terjadi kegagalan fetch.
 */
export const faqItems: FAQItem[] = [
  {
    id: "faq-1",
    category: "Pendaftaran",
    question: "Bagaimana cara mendaftar sebagai peserta?",
    answer:
      "Silakan klik tombol Daftar, buat akun, lalu lengkapi biodata dan unggah berkas yang diminta.",
  },
  {
    id: "faq-2",
    category: "Berkas",
    question: "Berkas apa saja yang wajib diunggah?",
    answer:
      "Umumnya: KTP, foto close up, foto full body, serta form S-01 s/d S-04 (sesuai panduan).",
  },
  {
    id: "faq-3",
    category: "Tahapan",
    question: "Apakah sistem voting tersedia di website?",
    answer:
      "Tidak. Halaman Vote hanya menampilkan finalis dan tombol untuk menuju Instagram peserta.",
  },
  {
    id: "faq-4",
    category: "Akun",
    question: "Saya lupa password, bagaimana?",
    answer:
      "Untuk tahap frontend saat ini belum ada reset password. Nanti akan dibuat saat backend aktif.",
  },
  {
    id: "faq-5",
    category: "Penilaian",
    question: "Apakah peserta bisa melihat nilai juri?",
    answer:
      "Untuk menjaga objektivitas, peserta tidak bisa melihat nilai detail juri. Admin yang mengelola rekap.",
  },
  {
    id: "faq-6",
    category: "Pendaftaran",
    question: "Apakah pendaftaran dipungut biaya?",
    answer:
      "Tidak. Pendaftaran peserta tidak dipungut biaya. Hati-hati terhadap oknum yang mengatasnamakan panitia.",
  },
  {
    id: "faq-7",
    category: "Pendaftaran",
    question: "Batas usia peserta berapa tahun?",
    answer:
      "Batas usia mengikuti ketentuan resmi panitia pada pengumuman pendaftaran tahun berjalan.",
  },
  {
    id: "faq-8",
    category: "Pendaftaran",
    question: "Bolehkah peserta dari luar Batam mendaftar?",
    answer:
      "Peserta wajib memenuhi domisili sesuai syarat resmi panitia. Cek pengumuman untuk detail ketentuan domisili.",
  },
  {
    id: "faq-9",
    category: "Berkas",
    question: "Format file yang diterima apa saja?",
    answer:
      "Umumnya menerima JPG/PNG untuk foto dan PDF untuk dokumen. Ukuran file mengikuti batas upload di form.",
  },
  {
    id: "faq-10",
    category: "Berkas",
    question: "Jika berkas salah upload, apakah bisa diganti?",
    answer:
      "Bisa selama periode pendaftaran masih dibuka. Setelah ditutup, perubahan berkas mengikuti kebijakan panitia.",
  },
  {
    id: "faq-11",
    category: "Berkas",
    question: "Apakah foto harus formal?",
    answer:
      "Ya, dianjurkan menggunakan foto formal dan jelas agar memudahkan proses verifikasi administrasi.",
  },
  {
    id: "faq-12",
    category: "Tahapan",
    question: "Bagaimana alur seleksi setelah lolos administrasi?",
    answer:
      "Peserta akan mengikuti audisi, pra-karantina, karantina, lalu grand final sesuai jadwal resmi.",
  },
  {
    id: "faq-13",
    category: "Tahapan",
    question: "Apakah technical meeting wajib hadir?",
    answer:
      "Wajib bagi peserta yang lolos tahap awal, karena berisi arahan teknis, aturan, dan pembagian jadwal.",
  },
  {
    id: "faq-14",
    category: "Tahapan",
    question: "Apa yang dinilai saat audisi?",
    answer:
      "Aspek umum meliputi wawasan pariwisata, komunikasi, kepribadian, serta potensi representasi daerah.",
  },
  {
    id: "faq-15",
    category: "Akun",
    question: "Bagaimana jika email sudah pernah dipakai?",
    answer:
      "Gunakan menu login jika akun sudah ada, atau pakai email lain yang belum terdaftar untuk registrasi baru.",
  },
  {
    id: "faq-16",
    category: "Akun",
    question: "Apakah satu peserta boleh punya lebih dari satu akun?",
    answer:
      "Tidak disarankan. Satu peserta sebaiknya hanya menggunakan satu akun agar data tetap valid dan sinkron.",
  },
  {
    id: "faq-17",
    category: "Akun",
    question: "Kenapa saya tidak menerima OTP verifikasi?",
    answer:
      "Periksa folder spam/promosi, pastikan email benar, lalu coba kirim ulang OTP setelah beberapa saat.",
  },
  {
    id: "faq-18",
    category: "Penilaian",
    question: "Siapa yang menentukan pemenang utama?",
    answer:
      "Pemenang utama ditentukan berdasarkan hasil penjurian resmi, bukan berdasarkan jumlah vote publik.",
  },
  {
    id: "faq-19",
    category: "Penilaian",
    question: "Apa beda vote favorit dan penilaian juri?",
    answer:
      "Vote favorit digunakan untuk kategori favorit publik, sedangkan penilaian juri menentukan juara utama.",
  },
  {
    id: "faq-20",
    category: "Penilaian",
    question: "Apakah hasil penjurian dapat diganggu gugat?",
    answer:
      "Keputusan dewan juri dan panitia bersifat final sesuai ketentuan resmi penyelenggaraan.",
  },
];
