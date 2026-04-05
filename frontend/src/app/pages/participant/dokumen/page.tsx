"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, CheckCircle, FileText } from "lucide-react";
import { useApp } from "../../../../context/AppContext";
import GoldCard from "../../../../components/dashboard/GoldCard";
import DocumentUploadCard from "../components/DocumentUploadCard";
import { API_BASE_URL, getReadableApiError } from "../../../../lib/api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import {
  fetchParticipantDocuments,
  uploadParticipantDocument,
  type ParticipantDocumentsResponse,
} from "../../../../lib/auth-api";
import {
  optionalDocuments,
  requiredDocuments,
  type DocumentItem,
  type UploadFileInfo,
} from "../components/documentUploadConfig";
import type { Participant } from "../../../../data/mockData";

const ParticipantGuidePanel = dynamic(() => import("../components/ParticipantGuidePanel"), {
  ssr: false,
  loading: () => (
    <GoldCard className="mb-6">
      <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
        Memuat panduan berkas...
      </p>
    </GoldCard>
  ),
});

export default function ParticipantDocumentsPage() {
  // Ambil data peserta aktif (fallback ke data pertama jika belum ada sesi aktif).
  const { currentParticipant, setCurrentParticipant, setParticipantList } = useApp();
  const participant = currentParticipant;

  // State lokal upload dokumen pada halaman ini.
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadFileInfo | null>>({});
  const [resubmittedKeys, setResubmittedKeys] = useState<string[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [isSyncingDocuments, setIsSyncingDocuments] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error">("success");
  const [serverDoneKeys, setServerDoneKeys] = useState<string[]>([]);
  const [serverDocumentState, setServerDocumentState] = useState<
    Record<string, { status: "submitted" | "verified" | "revision_required" | "missing"; note?: string }>
  >({});
  const apiOrigin = API_BASE_URL.replace(/\/api$/i, "");
  const toAssetUrl = useCallback((url?: string) => {
    if (!url) return undefined;
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("blob:") ||
      url.startsWith("data:")
    ) {
      return url;
    }
    return url.startsWith("/") ? `${apiOrigin}${url}` : `${apiOrigin}/${url}`;
  }, [apiOrigin]);
  const allDocuments: DocumentItem[] = [...requiredDocuments, ...optionalDocuments];
  const verificationIssues = participant?.verificationIssues ?? [];
  const revisionStorageKey = participant ? `participant-revision-uploads:${participant.id}` : "";
  const documentIssueMap = Object.entries(serverDocumentState).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value.status === "revision_required") {
      acc[key] = value.note ?? "Dokumen ini perlu diperbaiki sesuai arahan admin.";
    }
    return acc;
  }, verificationIssues.reduce<Record<string, string>>((acc, issue) => {
    acc[issue.target] = issue.message;
    return acc;
  }, {}));
  const revisedIssueCount = verificationIssues.filter((issue) => resubmittedKeys.includes(issue.target)).length;
  const allIssuesReuploaded = verificationIssues.length > 0 && revisedIssueCount === verificationIssues.length;

  const formatFileSize = (bytes: number) => {
    const sizeInKb = bytes / 1024;
    return sizeInKb >= 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${Math.round(sizeInKb)} KB`;
  };

  const syncParticipantDocumentState = useCallback((data: ParticipantDocumentsResponse["data"]) => {
    setServerDocumentState(
      data.documents.reduce<Record<string, { status: "submitted" | "verified" | "revision_required" | "missing"; note?: string }>>(
        (acc, doc) => {
          acc[doc.key] = {
            status:
              doc.status === "verified" || doc.status === "revision_required" || doc.status === "missing"
                ? doc.status
                : "submitted",
            note: doc.note ?? undefined,
          };
          return acc;
        },
        {}
      )
    );

    const normalizedDocs =
      data.documents?.map((doc) => ({
        key: doc.key,
        label: doc.label,
        status:
          doc.status === "verified" || doc.status === "revision_required" || doc.status === "missing"
            ? doc.status
            : ("submitted" as const),
        note: doc.note ?? undefined,
        url: toAssetUrl(doc.url) ?? undefined,
        mimeType: doc.mime_type ?? undefined,
        originalName: doc.original_name ?? undefined,
      })) ?? [];

    setServerDoneKeys(
      data.documents
        .filter((doc) => doc.status === "submitted" || doc.status === "verified")
        .map((doc) => doc.key)
    );

    setResubmittedKeys((prev) =>
      prev.filter((key) =>
        data.documents.some((doc) => doc.key === key && doc.status === "submitted")
      )
    );

    setUploadedFiles((prev) => {
      const fromServer: Record<string, UploadFileInfo | null> = {};
      for (const doc of data.documents) {
        fromServer[doc.key] = {
          name: doc.original_name ?? doc.label,
          size: doc.size_bytes ? formatFileSize(doc.size_bytes) : "-",
          preview: doc.mime_type?.startsWith("image/") ? toAssetUrl(doc.url) : undefined,
        };
      }
      return { ...prev, ...fromServer };
    });

    setCurrentParticipant((prev) => {
      if (!prev) return prev;
      const auditionNumber = data.audition_number ?? data.participant_number ?? prev.auditionNumber ?? prev.number;
      const participantCode = data.participant_code ?? prev.participantCode;
      return {
        ...prev,
        number: participantCode ?? auditionNumber ?? prev.number ?? "-",
        auditionNumber: auditionNumber ?? prev.auditionNumber ?? prev.number ?? "-",
        participantCode,
        documents: normalizedDocs,
        submittedToAdmin: data.submitted_to_admin,
        eliminatedInAudition: data.eliminated_in_audition ?? prev.eliminatedInAudition ?? false,
      };
    });
    setParticipantList((prev) =>
      prev.map((item) =>
        item.id === participant?.id
          ? ({
              ...item,
              number: data.participant_code ?? data.audition_number ?? data.participant_number ?? item.number ?? "-",
              auditionNumber: data.audition_number ?? data.participant_number ?? item.auditionNumber ?? item.number ?? "-",
              participantCode: data.participant_code ?? item.participantCode,
              documents: normalizedDocs,
              submittedToAdmin: data.submitted_to_admin,
              eliminatedInAudition: data.eliminated_in_audition ?? item.eliminatedInAudition ?? false,
            } as Participant)
          : item
      )
    );
  }, [participant?.id, setCurrentParticipant, setParticipantList, toAssetUrl]);

  useEffect(() => {
    const token = getParticipantAuthSession()?.token;
    if (!token) return;
    let cancelled = false;

    const loadDocuments = async () => {
      setIsSyncingDocuments(true);
      try {
        const response = await fetchParticipantDocuments(token);
        if (cancelled) return;
        syncParticipantDocumentState(response.data);
      } catch (error) {
        if (!cancelled) {
          setNoticeType("error");
          setNoticeMessage(`Gagal mengambil data dokumen: ${getReadableApiError(error)}`);
        }
      } finally {
        if (!cancelled) {
          setIsSyncingDocuments(false);
        }
      }
    };

    void loadDocuments();
    return () => {
      cancelled = true;
    };
  }, [participant?.id, syncParticipantDocumentState]);

  useEffect(() => {
    if (!revisionStorageKey || typeof window === "undefined") {
      setResubmittedKeys([]);
      return;
    }

    const saved = window.localStorage.getItem(revisionStorageKey);
    if (!saved) {
      setResubmittedKeys([]);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      const keys = Array.isArray(parsed) ? parsed : [];
      const stillWaitingKeys = keys.filter((key) => serverDocumentState[key]?.status === "submitted");
      setResubmittedKeys(stillWaitingKeys);
    } catch {
      setResubmittedKeys([]);
    }
  }, [revisionStorageKey, serverDocumentState]);

  // Menentukan status selesai per dokumen (gabungan data existing + upload lokal).
  const isDone = (key: string) =>
    Boolean(uploadedFiles[key]) || serverDoneKeys.includes(key);

  // Handler upload file per jenis dokumen.
  const handleFileChange = async (key: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const documentMeta = allDocuments.find((item) => item.key === key);
    const maxSizeMb = Number(documentMeta?.maxSize.replace(/[^\d.]/g, "") || "0");
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (maxSizeBytes > 0 && file.size > maxSizeBytes) {
      setNoticeType("error");
      setNoticeMessage(`Ukuran file terlalu besar. Maksimal ${documentMeta?.maxSize}.`);
      return;
    }

    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setNoticeType("error");
      setNoticeMessage("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    setUploadingKey(key);

    try {
      const response = await uploadParticipantDocument(token, key, file);
      syncParticipantDocumentState(response.data);
    } catch (error) {
      setNoticeType("error");
      setNoticeMessage(getReadableApiError(error));
      setUploadingKey(null);
      return;
    } finally {
      setUploadingKey(null);
    }

    if (documentIssueMap[key] && revisionStorageKey && typeof window !== "undefined") {
      setResubmittedKeys((prev) => {
        const next = prev.includes(key) ? prev : [...prev, key];
        window.localStorage.setItem(revisionStorageKey, JSON.stringify(next));
        return next;
      });
    }

    setNoticeType("success");
    setNoticeMessage(`Berkas ${file.name} berhasil diupload.`);
  };

  // Ringkasan progress upload dokumen wajib.
  const totalRequired = requiredDocuments.length;
  const completedRequired = requiredDocuments.filter((doc) => isDone(doc.key)).length;
  const uploadProgress = Math.round((completedRequired / totalRequired) * 100);

  // Auto close notifikasi toast upload.
  useEffect(() => {
    if (!noticeMessage) return;
    const timer = window.setTimeout(() => setNoticeMessage(""), 2800);
    return () => window.clearTimeout(timer);
  }, [noticeMessage]);

  return (
    <div className="w-full">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        {/* Header halaman upload dokumen */}
        <div>
          <h1
            style={{ fontFamily: "var(--font-cinzel)", color: "#C8A24D", fontSize: "1.5rem", fontWeight: 700 }}
          >
            Upload Berkas Persyaratan
          </h1>
          <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
            Unduh dulu dokumen resmi, ikuti tata cara, lalu upload berkas dengan format yang benar.
          </p>
          {isSyncingDocuments ? (
            <p className="text-xs mt-1" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
              Menyinkronkan dokumen dari backend...
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs mb-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
            Berkas Wajib
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: completedRequired === totalRequired ? "#22c55e" : "#C8A24D", fontFamily: "var(--font-cinzel)" }}
          >
            {completedRequired}/{totalRequired}
          </p>
        </div>
      </div>

      {/* Panduan lengkap sebelum peserta upload dokumen */}
      <ParticipantGuidePanel />

      {verificationIssues.length > 0 ? (
        <GoldCard className="mb-6">
          <div
            className="rounded-2xl p-4"
            style={{
              background: allIssuesReuploaded ? "rgba(245,208,111,0.08)" : "rgba(239,68,68,0.08)",
              border: allIssuesReuploaded
                ? "1px solid rgba(245,208,111,0.25)"
                : "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <div className="flex items-start gap-3">
              {allIssuesReuploaded ? (
                <CheckCircle size={18} style={{ color: "#F5D06F", marginTop: 2 }} />
              ) : (
                <AlertCircle size={18} style={{ color: "#ef4444", marginTop: 2 }} />
              )}
              <div className="flex-1">
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: allIssuesReuploaded ? "#F5D06F" : "#ef4444",
                    fontFamily: "var(--font-cinzel)",
                  }}
                >
                  {allIssuesReuploaded ? "Perbaikan Dokumen Sedang Diproses" : "Ada Berkas yang Perlu Revisi"}
                </p>
                <p
                  className="text-xs mt-1 leading-relaxed"
                  style={{
                    color: allIssuesReuploaded ? "#F5E6C8" : "#F2C3C3",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {allIssuesReuploaded
                    ? "Dokumen pengganti sudah Anda upload. Perbaikan sedang ditinjau kembali oleh panitia. Jika diminta, Anda tetap dapat mengganti file sekali lagi sebelum hasil verifikasi ulang keluar."
                    : "Panitia memberikan catatan pada beberapa berkas Anda. Silakan cek item yang bertanda Perlu Revisi lalu upload ulang dokumen yang diminta."}
                </p>
                <div className="mt-3 space-y-2">
                  {verificationIssues.map((issue, index) => (
                    <div
                      key={issue.id}
                      className="rounded-xl px-3 py-2"
                      style={{
                        background: "rgba(15,15,15,0.35)",
                        border: resubmittedKeys.includes(issue.target)
                          ? "1px solid rgba(245,208,111,0.18)"
                          : "1px solid rgba(239,68,68,0.16)",
                      }}
                    >
                      <p className="text-[11px] font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                        {index + 1}. {allDocuments.find((doc) => doc.key === issue.target)?.label ?? issue.target}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{
                          color: resubmittedKeys.includes(issue.target) ? "#F5E6C8" : "#F2C3C3",
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        {resubmittedKeys.includes(issue.target)
                          ? "Berkas pengganti sudah diupload dan sedang menunggu verifikasi ulang panitia."
                          : issue.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </GoldCard>
      ) : null}

      {/* Card progress upload dokumen wajib */}
      <GoldCard className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>
            Progress Upload Berkas Wajib
          </span>
          <span className="text-sm" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
            {uploadProgress}%
          </span>
        </div>
        <div className="h-3 rounded-full" style={{ background: "#2A2A2A" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${uploadProgress}%`,
              background:
                completedRequired === totalRequired
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : "linear-gradient(90deg, #F5D06F, #C8A24D)",
            }}
          />
        </div>
        {completedRequired === totalRequired ? (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#22c55e", fontFamily: "var(--font-poppins)" }}>
            <CheckCircle size={12} />
            Semua berkas wajib telah lengkap. Silakan tunggu verifikasi admin.
          </p>
        ) : null}
      </GoldCard>

      {/* Daftar dokumen wajib */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={16} style={{ color: "#ef4444" }} />
          <h2 className="text-sm font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
            BERKAS WAJIB
          </h2>
        </div>
        <div className="space-y-3">
          {requiredDocuments.map((item) => (
            <DocumentUploadCard
              key={item.key}
              item={item}
              done={isDone(item.key)}
              uploading={uploadingKey === item.key}
              uploaded={uploadedFiles[item.key]}
              revisionRequired={Boolean(documentIssueMap[item.key])}
              resubmitted={resubmittedKeys.includes(item.key)}
              reviewNote={serverDocumentState[item.key]?.note ?? documentIssueMap[item.key]}
              serverStatus={serverDocumentState[item.key]?.status}
              onFileChange={handleFileChange}
            />
          ))}
        </div>
      </div>

      {/* Daftar dokumen opsional */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} style={{ color: "#C8A24D" }} />
          <h2 className="text-sm font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
            BERKAS OPSIONAL
          </h2>
        </div>
        <div className="space-y-3">
          {optionalDocuments.map((item) => (
            <DocumentUploadCard
              key={item.key}
              item={item}
              done={isDone(item.key)}
              uploading={uploadingKey === item.key}
              uploaded={uploadedFiles[item.key]}
              revisionRequired={Boolean(documentIssueMap[item.key])}
              resubmitted={resubmittedKeys.includes(item.key)}
              reviewNote={serverDocumentState[item.key]?.note ?? documentIssueMap[item.key]}
              serverStatus={serverDocumentState[item.key]?.status}
              onFileChange={handleFileChange}
            />
          ))}
        </div>
      </div>

      {/* Toast notifikasi upload berhasil */}
      {noticeMessage ? (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-xl px-4 py-3 shadow-lg"
          style={{
            background: "rgba(17,17,17,0.95)",
            border:
              noticeType === "success"
                ? "1px solid rgba(34,197,94,0.55)"
                : "1px solid rgba(239,68,68,0.55)",
            backdropFilter: "blur(8px)",
          }}
        >
          <p
            className="text-sm"
            style={{
              color: noticeType === "success" ? "#22c55e" : "#ef4444",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {noticeMessage}
          </p>
        </div>
      ) : null}
    </div>
  );
}
