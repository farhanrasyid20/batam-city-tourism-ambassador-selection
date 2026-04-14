/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */
import React from "react";
import { Upload } from "lucide-react";
import GoldCard from "../../../../../components/dashboard/GoldCard";
import type { ParticipantResources } from "../../../../../context/AppContext";
import { resolveApiAssetUrl } from "../../../../../lib/api";
import type {
  ResourceDocumentField,
  ResourceImageField,
  ResourceTextField,
  TextSectionConfig,
} from "./types";

type TextSectionCardProps = {
  form: ParticipantResources;
  section: TextSectionConfig;
  inputStyle: React.CSSProperties;
  updateTextField: (key: ResourceTextField, value: string) => void;
  updateDocumentFile: (key: ResourceDocumentField, file: File | null) => Promise<void>;
  clearDocumentFile: (key: ResourceDocumentField) => void;
  updateSingleImage: (key: ResourceImageField, file: File | null, fallbackCaption: string) => Promise<void>;
  clearSingleImage: (key: ResourceImageField, fallbackCaption: string) => void;
};

function resolveResourcePreviewImage(value?: string | null): string {
  const normalized = (value ?? "").trim();
  if (!normalized) return "";
  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }
  if (normalized.startsWith("/storage/") || normalized.startsWith("storage/")) {
    return resolveApiAssetUrl(normalized) ?? normalized;
  }
  return normalized;
}

export default function TextSectionCard({
  form,
  section,
  inputStyle,
  updateTextField,
  updateDocumentFile,
  clearDocumentFile,
  updateSingleImage,
  clearSingleImage,
}: TextSectionCardProps) {
  const twibbonThumbnailPreview = resolveResourcePreviewImage(form.twibbonThumbnail.imageUrl);
  const whatsappThumbnailPreview = resolveResourcePreviewImage(form.whatsappThumbnail.imageUrl);

  return (
    <GoldCard glow>
      <div className="flex items-center gap-2 mb-5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(212,175,55,0.12)", color: "#D4AF37" }}
        >
          {section.icon}
        </div>
        <h3 style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
          {section.title}
        </h3>
      </div>

      <div
        className={
          section.title === "Twibbon dan Publikasi" || section.title === "Komunikasi Peserta"
            ? "grid md:grid-cols-[1.15fr_0.85fr] gap-4 items-start"
            : ""
        }
      >
        <div
          className={
            section.title === "Komunikasi Peserta"
              ? "grid gap-4"
              : section.title === "Twibbon dan Publikasi"
                ? "grid gap-4"
                : "grid md:grid-cols-2 gap-4"
          }
        >
          {section.title === "Twibbon dan Publikasi" ? (
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.12)" }}
            >
              <label
                className="block text-xs mb-1.5"
                style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
              >
                File Twibbon (PDF / Gambar)
              </label>
              <p className="text-[11px] mb-3" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                Unggah file twibbon jika peserta perlu mengunduh file langsung dari dashboard.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <label
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer"
                  style={{
                    background: "rgba(212,175,55,0.12)",
                    border: "1px solid rgba(212,175,55,0.28)",
                    color: "#D4AF37",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  <Upload size={12} />
                  Choose File
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(event) => void updateDocumentFile("twibbonDocument", event.target.files?.[0] ?? null)}
                  />
                </label>
                {form.twibbonDocument.fileName ? (
                  <button
                    type="button"
                    onClick={() => clearDocumentFile("twibbonDocument")}
                    className="px-3 py-2 rounded-xl text-xs"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444",
                      fontFamily: "var(--font-poppins)",
                      cursor: "pointer",
                    }}
                  >
                    Hapus File
                  </button>
                ) : null}
              </div>
              <p
                className="text-xs mt-3"
                style={{ color: form.twibbonDocument.fileName ? "#F5E6C8" : "#666", fontFamily: "var(--font-poppins)" }}
              >
                {form.twibbonDocument.fileName || "Belum ada file dipilih"}
              </p>
            </div>
          ) : null}

          {section.fields.map((field) => (
            <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
              <label
                className="block text-xs mb-1.5"
                style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
              >
                {field.label}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  value={form[field.key]}
                  onChange={(event) => updateTextField(field.key, event.target.value)}
                  rows={field.key === "hashtagList" ? 4 : 3}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-y"
                  style={inputStyle}
                />
              ) : (
                <input
                  type={field.type ?? "text"}
                  value={form[field.key]}
                  onChange={(event) => updateTextField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              )}
            </div>
          ))}
        </div>

        {section.title === "Twibbon dan Publikasi" ? (
          <div className="p-4 rounded-2xl h-fit" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.12)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
              Thumbnail Twibbon
            </p>
            <div
              className="rounded-xl overflow-hidden mb-3"
              style={{ border: "1px solid rgba(212,175,55,0.15)", background: "#101010", minHeight: 160 }}
            >
              {twibbonThumbnailPreview ? (
                <img src={twibbonThumbnailPreview} alt="Thumbnail Twibbon" className="w-full h-40 object-cover" />
              ) : (
                <div className="h-40 flex items-center justify-center text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                  Belum ada thumbnail
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <label
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer"
                style={{
                  background: "rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.28)",
                  color: "#D4AF37",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                <Upload size={12} />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void updateSingleImage("twibbonThumbnail", event.target.files?.[0] ?? null, "Thumbnail Twibbon")}
                />
              </label>
              {form.twibbonThumbnail.imageUrl ? (
                <button
                  type="button"
                  onClick={() => clearSingleImage("twibbonThumbnail", "Thumbnail Twibbon")}
                  className="px-3 py-2 rounded-xl text-xs"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#ef4444",
                    fontFamily: "var(--font-poppins)",
                    cursor: "pointer",
                  }}
                >
                  Hapus Gambar
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {section.title === "Komunikasi Peserta" ? (
          <div className="p-4 rounded-2xl h-fit" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.12)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
              Thumbnail Grup WhatsApp
            </p>
            <div
              className="rounded-xl overflow-hidden mb-3"
              style={{ border: "1px solid rgba(212,175,55,0.15)", background: "#101010", minHeight: 160 }}
            >
              {whatsappThumbnailPreview ? (
                <img src={whatsappThumbnailPreview} alt="Thumbnail Grup WhatsApp" className="w-full h-40 object-cover" />
              ) : (
                <div className="h-40 flex items-center justify-center text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                  Belum ada thumbnail
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <label
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer"
                style={{
                  background: "rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.28)",
                  color: "#D4AF37",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                <Upload size={12} />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void updateSingleImage("whatsappThumbnail", event.target.files?.[0] ?? null, "Thumbnail Grup WhatsApp")}
                />
              </label>
              {form.whatsappThumbnail.imageUrl ? (
                <button
                  type="button"
                  onClick={() => clearSingleImage("whatsappThumbnail", "Thumbnail Grup WhatsApp")}
                  className="px-3 py-2 rounded-xl text-xs"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#ef4444",
                    fontFamily: "var(--font-poppins)",
                    cursor: "pointer",
                  }}
                >
                  Hapus Gambar
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </GoldCard>
  );
}

