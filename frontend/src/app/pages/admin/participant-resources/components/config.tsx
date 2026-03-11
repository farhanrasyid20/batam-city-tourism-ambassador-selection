import React from "react";
import { ImageIcon, Megaphone, MessageCircle } from "lucide-react";
import type { DocumentConfig, TextSectionConfig } from "./types";

export const documentConfigs: DocumentConfig[] = [
  { key: "guideDocument", label: "Buku Panduan" },
  { key: "submissionDocument", label: "Berkas Online" },
  { key: "formS1Document", label: "Form S-1" },
  { key: "formS2Document", label: "Form S-2" },
  { key: "formS3Document", label: "Form S-3" },
  { key: "formS4Document", label: "Form S-4" },
];

export const textSections: TextSectionConfig[] = [
  {
    title: "Panduan Hardcopy dan Foto",
    icon: <ImageIcon size={16} />,
    fields: [
      {
        key: "hardcopyGuide",
        label: "Panduan Tata Cara Pengisian Berkas Hardcopy",
        placeholder: "Jelaskan aturan hardcopy yang wajib diikuti peserta...",
        type: "textarea",
      },
      {
        key: "closeUpPhotoGuide",
        label: "Panduan Foto Close Up",
        placeholder: "Jelaskan ketentuan close up...",
        type: "textarea",
      },
      {
        key: "fullBodyPhotoGuide",
        label: "Panduan Foto Full Body",
        placeholder: "Jelaskan ketentuan full body...",
        type: "textarea",
      },
    ],
  },
  {
    title: "Twibbon dan Publikasi",
    icon: <Megaphone size={16} />,
    fields: [
      { key: "twibbonOpenLink", label: "Buka Link Twibbon", placeholder: "https://...", type: "url" },
      {
        key: "postingInstruction",
        label: "Instruksi Posting",
        placeholder: "Wajib posting twibbon di Instagram dan mention akun resmi...",
        type: "textarea",
      },
      {
        key: "instagramMentions",
        label: "Akun Instagram yang Harus Di-mention",
        placeholder: "@dutawisatakotabatam, @batamtourism.official",
        type: "text",
      },
      {
        key: "hashtagList",
        label: "Hashtag Resmi",
        placeholder: "#encikpuanbatam",
        type: "textarea",
      },
    ],
  },
  {
    title: "Komunikasi Peserta",
    icon: <MessageCircle size={16} />,
    fields: [
      { key: "whatsappGroupLink", label: "Join Group WhatsApp Peserta", placeholder: "https://chat.whatsapp.com/...", type: "url" },
      {
        key: "additionalNote",
        label: "Catatan Tambahan",
        placeholder: "Tambahkan catatan penting lain untuk peserta jika diperlukan...",
        type: "textarea",
      },
    ],
  },
];
