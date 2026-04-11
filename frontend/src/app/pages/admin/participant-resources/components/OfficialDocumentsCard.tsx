/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */
import React from "react";
import { BookOpen, Upload } from "lucide-react";
import GoldCard from "../../../../../components/dashboard/GoldCard";
import type { ParticipantResources } from "../../../../../context/AppContext";
import type { DocumentConfig, ResourceDocumentField } from "./types";

type OfficialDocumentsCardProps = {
  form: ParticipantResources;
  documentConfigs: DocumentConfig[];
  inputStyle: React.CSSProperties;
  updateDocumentLink: (key: ResourceDocumentField, value: string) => void;
  updateDocumentFile: (key: ResourceDocumentField, file: File | null) => Promise<void>;
  clearDocumentFile: (key: ResourceDocumentField) => void;
  getDocumentSourceLabel: (document: ParticipantResources[ResourceDocumentField]) => string;
};

export default function OfficialDocumentsCard({
  form,
  documentConfigs,
  inputStyle,
  updateDocumentLink,
  updateDocumentFile,
  clearDocumentFile,
  getDocumentSourceLabel,
}: OfficialDocumentsCardProps) {
  return (
    <GoldCard glow>
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(212,175,55,0.12)", color: "#D4AF37" }}
        >
          <BookOpen size={16} />
        </div>
        <h3 style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
          Dokumen Resmi Peserta
        </h3>
      </div>

      <div
        className="mb-5 p-3 rounded-xl"
        style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}
      >
        <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Pilih salah satu saja untuk setiap dokumen: isi link atau pilih file dari laptop/PC admin. Jika keduanya diisi,
          dashboard peserta akan tetap memprioritaskan file upload.
        </p>
      </div>

      <div className="space-y-5">
        {documentConfigs.map((documentItem) => {
          const document = form[documentItem.key];
          return (
            <div
              key={documentItem.key}
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.12)" }}
            >
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h4 style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
                  {documentItem.label}
                </h4>
                <span
                  className="text-[11px] px-2 py-1 rounded-full"
                  style={{
                    background: "rgba(212,175,55,0.15)",
                    color: "#D4AF37",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  Sumber aktif: {getDocumentSourceLabel(document)}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs mb-1.5"
                    style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
                  >
                    Link Dokumen
                  </label>
                  <input
                    type="url"
                    value={document.linkUrl}
                    onChange={(event) => updateDocumentLink(documentItem.key, event.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs mb-1.5"
                    style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
                  >
                    File dari Laptop / PC
                  </label>
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
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(event) => void updateDocumentFile(documentItem.key, event.target.files?.[0] ?? null)}
                      />
                    </label>

                    {document.fileName ? (
                      <button
                        type="button"
                        onClick={() => clearDocumentFile(documentItem.key)}
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
                    className="text-xs mt-2"
                    style={{ color: document.fileName ? "#F5E6C8" : "#666", fontFamily: "var(--font-poppins)" }}
                  >
                    {document.fileName || "Belum ada file dipilih"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GoldCard>
  );
}

