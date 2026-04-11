"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React, { useRef, useState } from "react";
import { Eye, ImagePlus, Plus, Trash2, X } from "lucide-react";
import type { LandingPartnerItem } from "../../../../../lib/landing-page-content";

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

type PartnershipEditorProps = {
  partners: LandingPartnerItem[];
  onChange: (partners: LandingPartnerItem[]) => void;
};

export default function PartnershipEditor({ partners, onChange }: PartnershipEditorProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [previewPartner, setPreviewPartner] = useState<LandingPartnerItem | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updatePartner = (index: number, patch: Partial<LandingPartnerItem>) => {
    onChange(partners.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const removePartner = (index: number) => {
    onChange(partners.filter((_, itemIndex) => itemIndex !== index));
    setActiveMenuId(null);
  };

  const addPartner = () => {
    onChange([
      ...partners,
      {
        id: `partner-${Date.now()}`,
        alt: "",
        src: "",
      },
    ]);
  };

  const handlePartnerPhotoChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      updatePartner(index, { src: result });
      setActiveMenuId(null);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-xs" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
          Klik area logo untuk melihat gambar, mengganti foto sponsor, atau menghapus partner.
        </p>
        <button
          type="button"
          onClick={addPartner}
          className="px-3 py-2 rounded-xl text-xs flex items-center gap-1 shrink-0"
          style={{
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.2)",
            color: "#D4AF37",
            fontFamily: "var(--font-poppins)",
            cursor: "pointer",
          }}
        >
          <Plus size={12} />
          Tambah Partner
        </button>
      </div>

      <div className="space-y-4">
        {partners.map((partner, index) => (
          <div
            key={partner.id}
            className="rounded-2xl p-4"
            style={{
              border: "1px solid rgba(212,175,55,0.18)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-4 items-start">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenuId((prev) => (prev === partner.id ? null : partner.id))}
                  className="h-28 w-full rounded-xl overflow-hidden flex items-center justify-center group"
                  style={{
                    border: "1px dashed rgba(212,175,55,0.25)",
                    background: "rgba(0,0,0,0.18)",
                    cursor: "pointer",
                  }}
                >
                  {partner.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={partner.src} alt={partner.alt || "Preview partner"} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-center px-3" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                      Klik untuk pilih logo
                    </span>
                  )}
                  <span
                    className="absolute inset-0 flex items-end justify-center pb-2 text-[10px] transition-opacity opacity-0 group-hover:opacity-100"
                    style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.72))", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                  >
                    Klik logo
                  </span>
                </button>

                {activeMenuId === partner.id ? (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-44 rounded-xl p-2 z-20"
                    style={{ background: "#141414", border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 18px 36px rgba(0,0,0,0.35)" }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewPartner(partner);
                        setActiveMenuId(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                      style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)", background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      <Eye size={13} />
                      Lihat Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[partner.id]?.click()}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                      style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      <ImagePlus size={13} />
                      Pilih Foto Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => removePartner(index)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                      style={{ color: "#f87171", fontFamily: "var(--font-poppins)", background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      <Trash2 size={13} />
                      Hapus Partner
                    </button>
                  </div>
                ) : null}

                <input
                  ref={(node) => {
                    fileInputRefs.current[partner.id] = node;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handlePartnerPhotoChange(index, event)}
                />
              </div>

              <div>
                <FieldLabel>Nama Partner / Alt Text</FieldLabel>
                <input
                  value={partner.alt}
                  onChange={(event) => updatePartner(index, { alt: event.target.value })}
                  placeholder="Contoh: Dinas Pariwisata Kota Batam"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewPartner ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)" }}
          onClick={() => setPreviewPartner(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl p-5"
            style={{ background: "#141414", border: "1px solid rgba(212,175,55,0.2)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPartner(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#F5E6C8", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
            <p className="text-sm mb-4 pr-10" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
              {previewPartner.alt || "Preview partner"}
            </p>
            <div className="overflow-hidden rounded-2xl flex items-center justify-center p-4" style={{ border: "1px solid rgba(212,175,55,0.2)", minHeight: 240 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewPartner.src} alt={previewPartner.alt || "Preview partner"} className="max-h-[320px] max-w-full object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

