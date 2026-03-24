import React from "react";
import Image from "next/image";
import { ImagePlus, Save, X } from "lucide-react";
import GoldCard from "../../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../../components/ui/GoldButton";
import { categories } from "./config";
import TinyMceEditor from "./TinyMceEditor";
import type { NewsFormState } from "./types";

type NewsFormCardProps = {
  editId: string | null;
  form: NewsFormState;
  formError: string;
  isSaving: boolean;
  inputStyle: React.CSSProperties;
  setForm: React.Dispatch<React.SetStateAction<NewsFormState>>;
  handleCoverImageChange: (file: File | null) => Promise<void>;
  handleSave: () => void;
  resetForm: () => void;
};

export default function NewsFormCard({
  editId,
  form,
  formError,
  isSaving,
  inputStyle,
  setForm,
  handleCoverImageChange,
  handleSave,
  resetForm,
}: NewsFormCardProps) {
  return (
    <GoldCard glow className="mb-6">
      <h3
        className="text-sm font-bold mb-5 pb-3"
        style={{
          color: "#D4AF37",
          fontFamily: "var(--font-cinzel)",
          borderBottom: "1px solid rgba(212,175,55,0.15)",
        }}
      >
        {editId ? "Edit Berita" : "Berita Baru"}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
            Judul Berita *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Masukkan judul berita..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
              Tanggal
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
              Kategori
            </label>
            <select
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1.5" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
            Background Berita
          </label>
          <div
            className="rounded-2xl overflow-hidden mb-3"
            style={{ border: "1px solid rgba(212,175,55,0.2)", background: "#101010", height: 170 }}
          >
            {form.coverImage ? (
              <Image src={form.coverImage} alt="Preview background berita" width={1200} height={680} className="w-full h-full object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                Belum ada background
              </div>
            )}
          </div>
          <label
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer"
            style={{
              background: "rgba(212,175,55,0.12)",
              border: "1px solid rgba(212,175,55,0.28)",
              color: "#D4AF37",
              fontFamily: "var(--font-poppins)",
            }}
          >
            <ImagePlus size={12} />
            Pilih Gambar Background
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleCoverImageChange(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div>
          <label className="block text-xs mb-1.5" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
            Konten / Isi Berita *
          </label>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(212,175,55,0.25)", background: "#111" }}
          >
            <TinyMceEditor
              value={form.contentHtml}
              onChange={(nextValue) => setForm((prev) => ({ ...prev, contentHtml: nextValue }))}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
            Gunakan heading, font family, ukuran huruf, alignment, list, dan gambar langsung di editor. Format lama seperti /gambar1 atau blok image manual tidak dipakai lagi.
          </p>
        </div>

        {formError ? (
          <p className="text-xs" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>
            {formError}
          </p>
        ) : null}
      </div>

      <div className="flex gap-3 mt-5">
        <GoldButton variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
          <Save size={14} />
          {isSaving ? "Menyimpan..." : "Simpan"}
        </GoldButton>
        <GoldButton variant="outline" size="sm" onClick={resetForm}>
          <X size={14} />
          Batal
        </GoldButton>
      </div>
    </GoldCard>
  );
}

