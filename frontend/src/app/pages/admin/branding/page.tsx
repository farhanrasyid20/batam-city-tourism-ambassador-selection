"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { getReadableApiError } from "../../../../lib/api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import {
  defaultSiteBrandingContent,
  resolveBrandingAssetUrl,
  saveSiteBrandingContent,
  useSiteBrandingContent,
  type SiteBrandingContent,
} from "../../../../lib/site-branding-content";

const inputStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid rgba(212,175,55,0.25)",
  color: "#F5E6C8",
  fontFamily: "var(--font-poppins)",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-xs mb-1.5"
      style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
    >
      {children}
    </label>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
}

function ImagePickerField({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const inputId = useMemo(() => `branding-${title.toLowerCase().replace(/\s+/g, "-")}`, [title]);
  const isDataImage = value.trim().startsWith("data:image/");
  const visibleValue = useMemo(() => {
    if (!value.trim()) return "";
    if (isDataImage) return "Data gambar tersimpan dari upload.";

    const clean = value.split("?")[0];
    const normalized = clean.endsWith("/") ? clean.slice(0, -1) : clean;
    const fileName = normalized.split("/").pop();
    return fileName && fileName.length > 0 ? fileName : value;
  }, [isDataImage, value]);

  return (
    <div>
      <FieldLabel>{title}</FieldLabel>
      <div className="grid md:grid-cols-[1fr_140px] gap-3">
        <input
          value={visibleValue}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={inputStyle}
          placeholder="Belum ada file"
          readOnly
        />
        <label
          htmlFor={inputId}
          className="rounded-xl px-3 py-3 text-xs inline-flex items-center justify-center gap-2"
          style={{
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.2)",
            color: "#D4AF37",
            fontFamily: "var(--font-poppins)",
            cursor: "pointer",
          }}
        >
          <ImagePlus size={14} />
          Pilih Gambar
        </label>
      </div>

      {isDataImage ? (
        <p className="mt-2 text-[11px]" style={{ color: "#A6A6A6", fontFamily: "var(--font-poppins)" }}>
          Nilai gambar disimpan sebagai data upload. Klik tombol pilih gambar lagi untuk ganti.
        </p>
      ) : null}

      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const next = await readFileAsDataUrl(file);
          onChange(next);
          event.target.value = "";
        }}
      />

      {value ? (
        <div
          className="mt-3 rounded-2xl p-3 flex items-center justify-center overflow-hidden"
          style={{ border: "1px solid rgba(212,175,55,0.2)", background: "rgba(0,0,0,0.22)", minHeight: 92 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolveBrandingAssetUrl(value)} alt={title} className="max-h-20 max-w-full object-contain" />
        </div>
      ) : null}
    </div>
  );
}

export default function AdminBrandingPage() {
  const branding = useSiteBrandingContent();
  const [form, setForm] = useState<SiteBrandingContent>(defaultSiteBrandingContent);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setForm(branding);
  }, [branding]);

  const updateField = (key: keyof SiteBrandingContent, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (notice) setNotice(null);
  };

  const handleSave = async () => {
    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setNotice({ type: "error", text: "Sesi login tidak ditemukan." });
      return;
    }

    try {
      await saveSiteBrandingContent(
        {
          ...form,
          themeColor: "#C8A24D",
        },
        token
      );
      setNotice({ type: "success", text: "Branding & identitas berhasil diperbarui." });
    } catch (error) {
      const rawMessage = getReadableApiError(error);
      const safeMessage = rawMessage.length > 180 ? `${rawMessage.slice(0, 180)}...` : rawMessage;
      setNotice({ type: "error", text: safeMessage });
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
          Branding & Identitas
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Kelola logo, favicon, dan nama situs agar konsisten di seluruh halaman.
        </p>
      </div>

      <GoldCard glow>
        <div className="grid xl:grid-cols-2 gap-6">
          <ImagePickerField title="Logo Utama" value={form.logoMain} onChange={(next) => updateField("logoMain", next)} />
          <ImagePickerField title="Logo Loader" value={form.logoLoader} onChange={(next) => updateField("logoLoader", next)} />
          <ImagePickerField title="Favicon" value={form.favicon} onChange={(next) => updateField("favicon", next)} />

          <div>
            <FieldLabel>Nama Situs Baris 1</FieldLabel>
            <input
              value={form.siteNameLine1}
              onChange={(event) => updateField("siteNameLine1", event.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <FieldLabel>Nama Situs Baris 2</FieldLabel>
            <input
              value={form.siteNameLine2}
              onChange={(event) => updateField("siteNameLine2", event.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div className="xl:col-span-2">
            <FieldLabel>Deskripsi Footer</FieldLabel>
            <textarea
              value={form.footerDescription}
              onChange={(event) => updateField("footerDescription", event.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none min-h-[84px]"
              style={inputStyle}
            />
          </div>

          <div>
            <FieldLabel>Nama Instansi Kontak</FieldLabel>
            <input
              value={form.contactOrganization}
              onChange={(event) => updateField("contactOrganization", event.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <FieldLabel>Alamat Kontak</FieldLabel>
            <input
              value={form.contactAddress}
              onChange={(event) => updateField("contactAddress", event.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <FieldLabel>Telepon Kontak</FieldLabel>
            <input
              value={form.contactPhone}
              onChange={(event) => updateField("contactPhone", event.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <FieldLabel>Email Kontak</FieldLabel>
            <input
              value={form.contactEmail}
              onChange={(event) => updateField("contactEmail", event.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <FieldLabel>Username Instagram</FieldLabel>
            <input
              value={form.contactInstagram}
              onChange={(event) => updateField("contactInstagram", event.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <FieldLabel>Link Instagram</FieldLabel>
            <input
              value={form.contactInstagramUrl}
              onChange={(event) => updateField("contactInstagramUrl", event.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>

        </div>

        <div className="flex items-center gap-3 mt-6">
          <GoldButton variant="primary" size="sm" onClick={handleSave}>
            <Save size={14} />
            Simpan Perubahan
          </GoldButton>
          {notice ? (
            <p
              className="text-xs break-words"
              style={{
                color: notice.type === "success" ? "#22c55e" : "#ef4444",
                fontFamily: "var(--font-poppins)",
              }}
            >
              {notice.text}
            </p>
          ) : null}
        </div>
      </GoldCard>
    </div>
  );
}
