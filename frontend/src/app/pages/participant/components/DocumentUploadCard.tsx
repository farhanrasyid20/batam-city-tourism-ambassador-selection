"use client";

import React from "react";
import Link from "next/link";
import NextImage from "next/image";
import { AlertCircle, CheckCircle, FileText, Image as ImageIcon, Upload } from "lucide-react";
import type { DocumentItem, UploadFileInfo } from "./documentUploadConfig";

type DocumentUploadCardProps = {
  item: DocumentItem;
  done: boolean;
  uploading: boolean;
  uploaded?: UploadFileInfo | null;
  revisionRequired?: boolean;
  resubmitted?: boolean;
  reviewNote?: string;
  serverStatus?: "submitted" | "verified" | "revision_required" | "missing";
  onFileChange: (key: string, event: React.ChangeEvent<HTMLInputElement>) => void;
};

/**
 * Kartu upload dokumen tunggal dengan status, validasi ukuran/format,
 * serta aksi lihat/unduh file yang telah diunggah.
 */
export default function DocumentUploadCard({
  item,
  done,
  uploading,
  uploaded,
  revisionRequired = false,
  resubmitted = false,
  reviewNote,
  serverStatus,
  onFileChange,
}: DocumentUploadCardProps) {
  // Ikon menyesuaikan tipe dokumen (file umum atau image).
  const icon = item.icon === "image" ? <ImageIcon size={20} /> : <FileText size={20} />;
  const isVerified = serverStatus === "verified";
  const isRevisionState =
    serverStatus === "revision_required" || (!serverStatus && revisionRequired);
  const pendingReview =
    serverStatus === "submitted" && (resubmitted || isRevisionState);
  const cardBorder = pendingReview
    ? "rgba(245,208,111,0.4)"
    : isRevisionState
    ? "rgba(239,68,68,0.4)"
    : done
    ? "rgba(34,197,94,0.35)"
    : item.required
    ? "rgba(239,68,68,0.25)"
    : "rgba(200,162,77,0.2)";
  const iconBackground = pendingReview
    ? "rgba(245,208,111,0.14)"
    : isRevisionState
    ? "rgba(239,68,68,0.14)"
    : done
    ? "rgba(34,197,94,0.15)"
    : item.required
    ? "rgba(239,68,68,0.1)"
    : "rgba(200,162,77,0.1)";
  const iconColor = pendingReview
    ? "#F5D06F"
    : isRevisionState
    ? "#ef4444"
    : done
    ? "#22c55e"
    : item.required
    ? "#ef4444"
    : "#C8A24D";
  const badgeBackground = pendingReview
    ? "rgba(245,208,111,0.14)"
    : isRevisionState
    ? "rgba(239,68,68,0.14)"
    : item.required
    ? "rgba(239,68,68,0.1)"
    : "rgba(200,162,77,0.1)";
  const badgeColor = pendingReview ? "#F5D06F" : isRevisionState ? "#ef4444" : item.required ? "#ef4444" : "#C8A24D";
  const actionBackground = pendingReview
    ? "rgba(245,208,111,0.1)"
    : isRevisionState
    ? "rgba(239,68,68,0.1)"
    : done
    ? "rgba(34,197,94,0.1)"
    : "linear-gradient(135deg, rgba(245,208,111,0.15), rgba(200,162,77,0.15))";
  const actionBorder = pendingReview
    ? "1px solid rgba(245,208,111,0.3)"
    : isRevisionState
    ? "1px solid rgba(239,68,68,0.3)"
    : done
    ? "1px solid rgba(34,197,94,0.3)"
    : "1px solid rgba(200,162,77,0.3)";
  const actionColor = pendingReview ? "#F5D06F" : isRevisionState ? "#ef4444" : done ? "#22c55e" : "#C8A24D";

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "#1A1A1A",
        border: `1px solid ${cardBorder}`,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: iconBackground,
            color: iconColor,
          }}
        >
          {pendingReview ? <Upload size={20} /> : isRevisionState ? <AlertCircle size={20} /> : done ? <CheckCircle size={20} /> : item.required ? <AlertCircle size={20} /> : icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Informasi utama dokumen: nama, deskripsi, format, dan template unduh */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
              {item.label}
            </h4>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: badgeBackground,
                color: badgeColor,
                fontFamily: "var(--font-poppins)",
              }}
            >
              {pendingReview
                ? "Menunggu Verifikasi Ulang"
                : isVerified
                ? "Terverifikasi"
                : isRevisionState
                ? "Perlu Revisi"
                : item.required
                ? "Wajib"
                : "Opsional"}
            </span>
          </div>

          <p className="text-xs mb-2" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
            {item.description}
          </p>
          <p className="text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
            Format: {item.accept} | Maks: {item.maxSize}
          </p>

          {pendingReview || (isRevisionState && reviewNote) ? (
            <div
              className="mt-3 rounded-xl px-3 py-2"
              style={{
                background: pendingReview ? "rgba(245,208,111,0.08)" : "rgba(239,68,68,0.08)",
                border: pendingReview ? "1px solid rgba(245,208,111,0.2)" : "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <p className="text-[11px] font-semibold" style={{ color: pendingReview ? "#F5D06F" : "#ef4444", fontFamily: "var(--font-poppins)" }}>
                {pendingReview ? "Sedang Diverifikasi Ulang" : "Catatan Admin"}
              </p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: pendingReview ? "#F5E6C8" : "#F2C3C3", fontFamily: "var(--font-poppins)" }}>
                {pendingReview
                  ? "File pengganti sudah diupload. Mohon tunggu pengecekan ulang dari admin panitia."
                  : reviewNote ?? "Silakan cek catatan admin untuk dokumen ini."}
              </p>
            </div>
          ) : null}

          {isVerified && !reviewNote ? (
            <p className="text-xs mt-2" style={{ color: "#22c55e", fontFamily: "var(--font-poppins)" }}>
              Dokumen sudah diverifikasi admin.
            </p>
          ) : null}

          {item.templatePath ? (
            <Link
              href={item.templatePath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs underline"
              style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
            >
              <FileText size={12} /> {item.templateLabel ?? "Unduh template"}
            </Link>
          ) : null}

          {/* Preview file yang baru diupload pada sesi saat ini */}
          {done && uploaded ? (
            <div className="mt-3 flex items-center gap-3">
              {uploaded.preview ? (
                <NextImage
                  src={uploaded.preview}
                  alt="Preview dokumen"
                  width={40}
                  height={40}
                  unoptimized
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : null}
              <div>
                <p className="text-xs font-medium truncate max-w-48" style={{ color: pendingReview ? "#F5D06F" : "#22c55e", fontFamily: "var(--font-poppins)" }}>
                  {uploaded.name}
                </p>
                <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                  {uploaded.size}
                </p>
              </div>
            </div>
          ) : null}

          {/* Kondisi sudah pernah terupload (dari data yang sudah tersimpan) */}
          {done && !uploaded ? (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={12} style={{ color: "#22c55e" }} />
                <span className="text-xs" style={{ color: "#22c55e", fontFamily: "var(--font-poppins)" }}>
                  Berkas sebelumnya sudah terupload
                </span>
              </div>
              {isRevisionState ? (
                <div className="flex items-center gap-2">
                  <AlertCircle size={12} style={{ color: "#ef4444" }} />
                  <span className="text-xs" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>
                    Admin meminta upload ulang berkas ini
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          {/* Tombol upload/re-upload dokumen */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept={item.accept}
              className="hidden"
              onChange={(event) => onFileChange(item.key, event)}
              disabled={uploading}
            />
            <div
              className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
              style={{
                background: actionBackground,
                border: actionBorder,
                color: actionColor,
                fontFamily: "var(--font-poppins)",
                cursor: uploading ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? (
                <>
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  Upload...
                </>
              ) : done ? (
                <>
                  {pendingReview ? <Upload size={12} /> : isRevisionState ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                  {pendingReview ? "Sedang Diproses" : isRevisionState ? "Upload Ulang" : "Re-upload"}
                </>
              ) : (
                <>
                  <Upload size={12} />
                  Upload
                </>
              )}
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

