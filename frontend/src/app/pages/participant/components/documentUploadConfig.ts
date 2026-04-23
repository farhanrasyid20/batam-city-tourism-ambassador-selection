// Tipe data file upload untuk ditampilkan di kartu dokumen.
export type UploadFileInfo = {
  name: string;
  size: string;
  preview?: string;
};

// Jenis ikon yang digunakan per item dokumen.
export type DocumentIconType = "file" | "image";

// Konfigurasi item dokumen upload.
export type DocumentItem = {
  key: string;
  label: string;
  required: boolean;
  accept: string;
  maxSize: string;
  description: string;
  icon: DocumentIconType;
  templatePath?: string;
  templateLabel?: string;
};

// Daftar dokumen WAJIB yang harus diupload peserta.
/**
 * Konfigurasi daftar dokumen wajib peserta.
 */
export const requiredDocuments: DocumentItem[] = [
  {
    key: "identityCard",
    label: "KTP / SIM / Paspor / Kartu Pelajar",
    required: true,
    accept: "image/*,.pdf",
    maxSize: "5 MB",
    description: "Dokumen identitas resmi yang masih berlaku.",
    icon: "file",
  },
  {
    key: "closeUpPhoto",
    label: "Foto Close Up 4R",
    required: true,
    accept: "image/*",
    maxSize: "3 MB",
    description:
      "Latar putih polos. Putra/Putri: atasan formal hitam, bawahan hitam, sepatu hitam. Hijab hitam untuk peserta berhijab.",
    icon: "image",
  },
  {
    key: "fullBodyPhoto",
    label: "Foto Full Body 4R",
    required: true,
    accept: "image/*",
    maxSize: "3 MB",
    description:
      "Latar putih polos. Putra: sepatu pantofel hitam. Putri: heels hitam.",
    icon: "image",
  },
];

// Daftar dokumen OPSIONAL (bisa menyusul).
/**
 * Konfigurasi daftar dokumen opsional peserta.
 */
export const optionalDocuments: DocumentItem[] = [
  {
    key: "formS01",
    label: "Formulir S-01",
    required: false,
    accept: "image/*,.pdf",
    maxSize: "5 MB",
    description: "Formulir pendaftaran resmi yang sudah diisi dan ditandatangani.",
    icon: "file",
    templatePath: "/participant-resources/S-01-Formulir-Pendaftaran-Encik-Puan-Batam-2026.pdf",
    templateLabel: "Unduh Form S-01",
  },
  {
    key: "formS02",
    label: "Formulir S-02",
    required: false,
    accept: "image/*,.pdf",
    maxSize: "5 MB",
    description: "Surat izin orang tua/wali yang sudah ditandatangani.",
    icon: "file",
    templatePath: "/participant-resources/S-02-Surat-Izin-Orang-Tua-Encik-Puan-Batam-2026.pdf",
    templateLabel: "Unduh Form S-02",
  },
  {
    key: "formS03",
    label: "Formulir S-03",
    required: false,
    accept: "image/*,.pdf",
    maxSize: "5 MB",
    description: "Surat pernyataan bersedia menjadi Duta Wisata.",
    icon: "file",
    templatePath: "/participant-resources/S-03-Pernyataan-Bersedia-Menjadi-Duta-Wisata-2026.pdf",
    templateLabel: "Unduh Form S-03",
  },
  {
    key: "formS04",
    label: "Formulir S-04",
    required: false,
    accept: "image/*,.pdf",
    maxSize: "5 MB",
    description: "Surat kesanggupan mengikuti seluruh rangkaian kegiatan.",
    icon: "file",
    templatePath: "/participant-resources/S-04-Kesanggupan-Mengikuti-Rangkaian-Kegiatan-2026.pdf",
    templateLabel: "Unduh Form S-04",
  },
  {
    key: "certificate",
    label: "Sertifikat / Piagam Prestasi",
    required: false,
    accept: "image/*,.pdf",
    maxSize: "5 MB",
    description: "Boleh lebih dari satu file, gabungkan ke PDF jika perlu.",
    icon: "file",
  },
];

// Daftar resource yang bisa diunduh peserta.
/**
 * Daftar tautan unduhan resource pendukung pendaftaran.
 */
export const resourceDownloads = [
  {
    title: "Buku Panduan Duta Wisata 2026",
    href: "/participant-resources/Buku-Panduan-Duta-Wisata-2026.pdf",
    note: "Wajib dibaca sebelum isi biodata dan upload berkas.",
  },
  {
    title: "Form S-01",
    href: "/participant-resources/S-01-Formulir-Pendaftaran-Encik-Puan-Batam-2026.pdf",
    note: "Formulir pendaftaran peserta.",
  },
  {
    title: "Form S-02",
    href: "/participant-resources/S-02-Surat-Izin-Orang-Tua-Encik-Puan-Batam-2026.pdf",
    note: "Surat izin orang tua / wali.",
  },
  {
    title: "Form S-03",
    href: "/participant-resources/S-03-Pernyataan-Bersedia-Menjadi-Duta-Wisata-2026.pdf",
    note: "Surat pernyataan bersedia.",
  },
  {
    title: "Form S-04",
    href: "/participant-resources/S-04-Kesanggupan-Mengikuti-Rangkaian-Kegiatan-2026.pdf",
    note: "Surat kesanggupan ikut seluruh tahapan.",
  },
  {
    title: "Template Twibbon 2026",
    href: "/participant-resources/twibbon-duwis-2026.png",
    note: "Upload ke Instagram + mention dan hashtag resmi.",
  },
];

// Hashtag resmi untuk publikasi twibbon.
/**
 * Hashtag resmi publikasi peserta.
 */
export const hashtags = [
  "#encikpuanbatam",
  "#dutawisatakotabatam",
  "#pemilihandutawisatakotabatam2026",
];

// Link resmi panitia (panduan, berkas, grup WA).
/**
 * Kumpulan tautan kanal resmi penyelenggara.
 */
export const officialLinks = {
  guide: "https://bit.ly/BukuPanduanDuwis2026",
  forms: "https://bit.ly/berkas-duwis-2026",
  waGroup: "https://bit.ly/PesertaDUWIS2026",
};
