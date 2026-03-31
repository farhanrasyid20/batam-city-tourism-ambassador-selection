"use client";

import React, { useEffect, useMemo, useState } from "react";
import NextImage from "next/image";
import { pdf } from "@react-pdf/renderer";
import { Download, FileText } from "lucide-react";
import { useApp } from "../../../../context/AppContext";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import type { StageStatus } from "../../../../data/mockData";
import ParticipantPdfDocument from "../components/ParticipantPdfDocument";
import {
  fetchParticipantBiodata,
  fetchParticipantDocuments,
  type ParticipantBiodata,
  type ParticipantDocumentMeta,
} from "../../../../lib/auth-api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import { API_BASE_URL, getReadableApiError } from "../../../../lib/api";

const statusLabel: Record<StageStatus, string> = {
  Pending: "Menunggu Verifikasi",
  Verified: "Lolos Administrasi",
  TechnicalMeeting: "Technical Meeting",
  Rejected: "Ditolak",
  Audition: "Audition",
  Top20: "Top 20",
  PreCamp: "Pra-Karantina",
  Camp: "Karantina",
  GrandFinal: "Grand Final",
  Winner: "Pemenang",
};

const API_ORIGIN = API_BASE_URL.replace(/\/api$/i, "");

function resolveAssetUrl(path?: string | null): string {
  const value = path?.trim();
  if (!value) return "/logo1.png";
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }
  return value.startsWith("/") ? `${API_ORIGIN}${value}` : `${API_ORIGIN}/${value}`;
}

function mapSelectionStatusToStage(selectionStatus?: string | null, accountStatus?: string): StageStatus {
  const allowed: StageStatus[] = [
    "Pending",
    "Verified",
    "TechnicalMeeting",
    "Rejected",
    "Audition",
    "Top20",
    "PreCamp",
    "Camp",
    "GrandFinal",
    "Winner",
  ];

  if (selectionStatus && allowed.includes(selectionStatus as StageStatus)) {
    return selectionStatus as StageStatus;
  }

  if ((accountStatus ?? "").toLowerCase() === "suspended") return "Rejected";
  return "Pending";
}

function buildEducationDisplayFromBiodata(data?: ParticipantBiodata | null): string {
  if (!data) return "-";
  const parts = [
    data.education_category?.trim(),
    data.education_institution?.trim(),
    data.education_degree?.trim(),
    data.education_major?.trim(),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" - ") : "-";
}

function toInstagramUsername(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "-";

  if (raw.includes("instagram.com")) {
    try {
      const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      const segment = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return segment.replace(/^@+/, "") || "-";
    } catch {
      // Fall through to plain cleanup.
    }
  }

  return raw.replace(/^@+/, "") || "-";
}

function getFrontendLogoUrl(): string {
  if (typeof window === "undefined") return "/logo1.png";
  return `${window.location.origin}/logo1.png`;
}

async function toDataUrlForPdf(source?: string | null): Promise<string> {
  const src = (source ?? "").trim();
  if (!src) return "";
  if (src.startsWith("data:")) return src;

  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    let response: Response;
    try {
      response = await fetch(src, { cache: "force-cache", signal: controller.signal });
    } finally {
      window.clearTimeout(timeout);
    }
    if (!response.ok) return src;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result ?? src));
      reader.onerror = () => reject(new Error("Failed to convert image to data URL"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return src;
  }
}

export default function ExportPDFPage() {
  const { currentParticipant, user } = useApp();
  const [printing, setPrinting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [loadingDbData, setLoadingDbData] = useState(false);
  const [dbError, setDbError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [previewFingerprint, setPreviewFingerprint] = useState("");
  const [previewFileName, setPreviewFileName] = useState("biodata-peserta.pdf");
  const [biodataFromDb, setBiodataFromDb] = useState<ParticipantBiodata | null>(null);
  const [documentsFromDb, setDocumentsFromDb] = useState<ParticipantDocumentMeta[]>([]);

  const participant = currentParticipant;

  useEffect(() => {
    const token = getParticipantAuthSession()?.token;
    if (!token) return;

    let cancelled = false;

    const syncExportData = async () => {
      setLoadingDbData(true);
      setDbError("");
      try {
        const biodataTask = fetchParticipantBiodata(token)
          .then((biodataRes) => {
            if (!cancelled) {
              setBiodataFromDb(biodataRes.data);
            }
          })
          .catch((error) => {
            if (!cancelled) {
              setDbError(getReadableApiError(error));
            }
          });

        const documentsTask = fetchParticipantDocuments(token)
          .then((documentsRes) => {
            if (!cancelled) {
              setDocumentsFromDb(documentsRes.data.documents ?? []);
            }
          })
          .catch((error) => {
            if (!cancelled) {
              setDbError((prev) => prev || getReadableApiError(error));
            }
          });

        await Promise.allSettled([biodataTask, documentsTask]);
      } finally {
        if (!cancelled) {
          setLoadingDbData(false);
        }
      }
    };

    void syncExportData();

    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveStageStatus: StageStatus = useMemo(() => {
    if (biodataFromDb) {
      return mapSelectionStatusToStage(biodataFromDb.selection_status, biodataFromDb.account_status);
    }
    return participant?.status ?? "Pending";
  }, [biodataFromDb, participant?.status]);

  const canPreviewForTechnicalMeeting = effectiveStageStatus === "TechnicalMeeting";
  const canDownloadPdf = Boolean(
    (participant || biodataFromDb) &&
      (canPreviewForTechnicalMeeting ||
        ["Verified", "Audition", "Top20", "PreCamp", "Camp", "GrandFinal", "Winner"].includes(
          effectiveStageStatus
        ))
  );

  const documentItems = useMemo(() => {
    if (documentsFromDb.length > 0) {
      return documentsFromDb
        .filter((doc) => doc.required)
        .map((doc) => ({
          label: doc.label,
          done: doc.status === "submitted" || doc.status === "verified",
        }));
    }

    return [
      { label: "KTP", done: Boolean(participant?.nationalId) },
      { label: "Foto Close Up", done: Boolean(participant?.photo) },
      { label: "Foto Full Body", done: Boolean(participant?.photo) },
      { label: "Formulir S-01", done: Boolean(participant?.education) },
      { label: "Formulir S-02", done: Boolean(participant?.instagram) },
      { label: "Formulir S-03", done: Boolean(participant?.phone) },
      { label: "Formulir S-04", done: Boolean(participant?.birthDate && participant?.birthPlace) },
    ];
  }, [documentsFromDb, participant]);

  const doneCount = documentItems.filter((item) => item.done).length;

  const educationDisplay = useMemo(() => {
    if (biodataFromDb) {
      return buildEducationDisplayFromBiodata(biodataFromDb);
    }

    const raw = participant?.education?.trim();
    if (!raw) return "-";
    const parts = raw.split(" - ").map((item) => item.trim()).filter(Boolean);
    if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
      parts.pop();
    }
    return parts.join(" - ");
  }, [
    biodataFromDb,
    participant?.education,
  ]);

  const printedDate = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  const previewPhoto = resolveAssetUrl(biodataFromDb?.photo ?? participant?.photo);
  const instagramUsername = toInstagramUsername(biodataFromDb?.instagram ?? participant?.instagram);
  const pendingExportFields = useMemo(() => {
    if (loadingDbData && !biodataFromDb) return [];
    if (!biodataFromDb) return ["Biodata backend belum termuat"];

    const pending: string[] = [];
    if (educationDisplay === "-") pending.push("Data Pendidikan");
    if (!(biodataFromDb.national_id ?? "").trim()) pending.push("NIK");
    if (!(biodataFromDb.birth_place ?? "").trim()) pending.push("Tempat Lahir");
    if (!(biodataFromDb.birth_date ?? "").trim()) pending.push("Tanggal Lahir");
    if (!biodataFromDb.height_cm) pending.push("Tinggi Badan");
    if (!(biodataFromDb.instagram ?? "").trim()) pending.push("Instagram");
    if (!(biodataFromDb.photo ?? "").trim()) pending.push("Foto Profil");
    return pending;
  }, [biodataFromDb, educationDisplay, loadingDbData]);
  const isExportDataReady = pendingExportFields.length === 0;
  const isActionLocked = loadingDbData || Boolean(dbError) || !isExportDataReady;
  const renderFingerprint = useMemo(
    () =>
      JSON.stringify({
        id: biodataFromDb?.id ?? participant?.id,
        number: biodataFromDb?.participant_number ?? participant?.number,
        auditionNumber: biodataFromDb?.audition_number ?? biodataFromDb?.participant_number ?? participant?.auditionNumber ?? participant?.number,
        participantCode: biodataFromDb?.participant_code ?? participant?.participantCode,
        name: biodataFromDb?.name ?? participant?.name,
        nationalId: biodataFromDb?.national_id ?? participant?.nationalId,
        birthPlace: biodataFromDb?.birth_place ?? participant?.birthPlace,
        birthDate: biodataFromDb?.birth_date ?? participant?.birthDate,
        height: biodataFromDb?.height_cm ?? participant?.heightCm,
        education: educationDisplay,
        instagram: instagramUsername,
        email: biodataFromDb?.email ?? participant?.email ?? user?.email,
        status: effectiveStageStatus,
        photo: biodataFromDb?.photo ?? participant?.photo,
        docs: documentItems.map((item) => `${item.label}:${item.done ? "1" : "0"}`).join("|"),
      }),
    [
      biodataFromDb?.id,
      participant?.id,
      biodataFromDb?.participant_number,
      participant?.number,
      biodataFromDb?.name,
      participant?.name,
      biodataFromDb?.national_id,
      participant?.nationalId,
      biodataFromDb?.birth_place,
      participant?.birthPlace,
      biodataFromDb?.birth_date,
      participant?.birthDate,
      biodataFromDb?.height_cm,
      participant?.heightCm,
      educationDisplay,
      instagramUsername,
      biodataFromDb?.email,
      participant?.email,
      user?.email,
      effectiveStageStatus,
      biodataFromDb?.photo,
      participant?.photo,
      documentItems,
    ]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const buildPdfBlob = async () => {
    const resolvedPhoto = resolveAssetUrl(biodataFromDb?.photo ?? participant?.photo);
    const auditionNumber = biodataFromDb?.audition_number ?? biodataFromDb?.participant_number ?? participant?.auditionNumber ?? participant?.number ?? "-";
    const participantCode = biodataFromDb?.participant_code ?? participant?.participantCode ?? "-";
    const participantName = biodataFromDb?.name ?? participant?.name ?? user?.name ?? "Peserta";
    const participantGender = biodataFromDb?.gender ?? participant?.gender ?? "Encik";
    const participantNationalId = biodataFromDb?.national_id ?? participant?.nationalId ?? "";
    const participantBirthPlace = biodataFromDb?.birth_place ?? participant?.birthPlace ?? "";
    const participantBirthDate = biodataFromDb?.birth_date ?? participant?.birthDate ?? "";
    const participantHeight = biodataFromDb?.height_cm ?? participant?.heightCm ?? 0;
    const participantInstagram = toInstagramUsername(
      biodataFromDb?.instagram ?? participant?.instagram
    );
    const participantPhone = biodataFromDb?.phone ?? participant?.phone ?? "";
    const participantEmail = biodataFromDb?.email ?? participant?.email ?? user?.email ?? "-";
    const participantStatus = effectiveStageStatus;

    const [logoSrcForPdf, profileSrcForPdf] = await Promise.all([
      toDataUrlForPdf(`/api/pdf-image?src=${encodeURIComponent(getFrontendLogoUrl())}`),
      toDataUrlForPdf(`/api/pdf-image?src=${encodeURIComponent(resolvedPhoto)}`),
    ]);

    const blob = await pdf(
      <ParticipantPdfDocument
        participant={{
          ...(participant ?? {
            id: `P_API_${biodataFromDb?.id ?? "0"}`,
            registeredAt: new Date().toISOString().slice(0, 10),
            scores: [],
          }),
          number: participantCode !== "-" ? participantCode : auditionNumber,
          auditionNumber,
          participantCode,
          name: participantName,
          gender: participantGender,
          nationalId: participantNationalId,
          birthPlace: participantBirthPlace,
          birthDate: participantBirthDate,
          heightCm: participantHeight,
          education: educationDisplay,
          instagram: participantInstagram,
          phone: participantPhone,
          email: participantEmail,
          status: participantStatus,
          photo: profileSrcForPdf || resolvedPhoto,
        }}
        printedDate={printedDate}
        educationDisplay={educationDisplay}
        documentItems={documentItems}
        doneCount={doneCount}
        statusLabel={statusLabel}
        logoSrc={logoSrcForPdf || getFrontendLogoUrl()}
      />
    ).toBlob();

    return {
      blob,
      participantNumber: auditionNumber,
    };
  };

  const handlePreviewPdf = async () => {
    if ((!participant && !biodataFromDb) || !canDownloadPdf || isActionLocked) return;
    if (previewUrl && previewFingerprint === renderFingerprint) {
      return;
    }
    setPreviewing(true);
    setPreviewError("");
    try {
      const { blob, participantNumber } = await buildPdfBlob();
      const nextUrl = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(nextUrl);
      setPreviewFingerprint(renderFingerprint);
      setPreviewFileName(`biodata-${participantNumber || "peserta"}.pdf`);
    } catch (error) {
      setPreviewError(getReadableApiError(error));
    } finally {
      setPreviewing(false);
    }
  };

  const handleGeneratePdf = async () => {
    if ((!participant && !biodataFromDb) || !canDownloadPdf || isActionLocked) return;

    if (previewUrl && previewFingerprint === renderFingerprint) {
      const link = document.createElement("a");
      link.href = previewUrl;
      link.download = previewFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    setPrinting(true);

    try {
      const { blob, participantNumber } = await buildPdfBlob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `biodata-${participantNumber || "peserta"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setPreviewFingerprint(renderFingerprint);
      setPreviewFileName(`biodata-${participantNumber || "peserta"}.pdf`);
      URL.revokeObjectURL(blobUrl);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1
            style={{
              fontFamily: "var(--font-cinzel)",
              color: "#C8A24D",
              fontSize: "1.5rem",
              fontWeight: 700,
            }}
          >
            Export PDF Biodata
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
          >
            Tinjau biodata peserta terlebih dahulu sebelum mengunduh PDF.
          </p>
          {loadingDbData ? (
            <p className="text-xs mt-1" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
              Menyinkronkan data export dari database...
            </p>
          ) : null}
          {dbError ? (
            <p className="text-xs mt-1" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>
              Gagal sinkron data DB: {dbError}
            </p>
          ) : null}
        </div>
        <GoldButton
          variant="primary"
          onClick={handlePreviewPdf}
          disabled={previewing || !participant || !canDownloadPdf || isActionLocked}
        >
          <Download size={16} />
          {previewing ? "Menyiapkan Preview..." : "Lihat Preview PDF"}
        </GoldButton>
      </div>

      <GoldCard className="mb-6">
        <div className="flex items-start gap-3">
          <FileText size={16} style={{ color: "#C8A24D", marginTop: 1 }} />
          <div>
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
            >
              Format PDF Biodata
            </p>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
            >
              PDF hanya bisa diunduh setelah peserta berhasil diverifikasi panitia.
              Dokumen yang dihasilkan hanya berisi ringkasan biodata peserta.
            </p>
          </div>
        </div>
      </GoldCard>

      {!canDownloadPdf ? (
        <GoldCard className="mb-6">
          <p className="text-sm" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
            PDF belum dapat diunduh. Status peserta harus sudah{" "}
            <strong style={{ color: "#C8A24D" }}>terverifikasi</strong>.
          </p>
        </GoldCard>
      ) : null}

      {!isExportDataReady ? (
        <GoldCard className="mb-6">
          <p className="text-sm" style={{ color: "#f59e0b", fontFamily: "var(--font-poppins)" }}>
            Perhatian: data export belum lengkap. Tombol preview/download dikunci sampai data sinkron.
          </p>
          <p className="text-xs mt-2" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
            Field pending: {pendingExportFields.join(", ")}.
          </p>
        </GoldCard>
      ) : null}

      {participant ? (
        <GoldCard glow className="mb-6">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#0F0F0F",
              border: "1px solid rgba(200,162,77,0.35)",
            }}
          >
            <div
              className="p-5"
              style={{
                background: "linear-gradient(135deg, #1A1A1A, #101010)",
                borderBottom: "1px solid rgba(200,162,77,0.25)",
              }}
            >
              <div className="flex items-center gap-4">
                <NextImage
                  src="/logo1.png"
                  alt="Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain"
                />
                <div className="flex-1 min-w-0">
                  <p style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
                    PEMILIHAN DUTA WISATA KOTA BATAM
                  </p>
                  <p className="text-xs" style={{ color: "#E7D3A0", fontFamily: "var(--font-cinzel)" }}>
                    ENCIK & PUAN - 2026
                  </p>
                  <p className="text-[11px]" style={{ color: "#8E8E8E", fontFamily: "var(--font-poppins)" }}>
                    Dinas Kebudayaan dan Pariwisata Kota Batam
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px]" style={{ color: "#8E8E8E", fontFamily: "var(--font-poppins)" }}>
                    No. Audisi
                  </p>
                  <p style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: "1rem" }}>
                    {biodataFromDb?.audition_number ?? biodataFromDb?.participant_number ?? participant.auditionNumber ?? participant.number ?? "-"}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: "#8E8E8E", fontFamily: "var(--font-poppins)" }}>
                    Participant Code
                  </p>
                  <p style={{ color: "#22c55e", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: "0.95rem" }}>
                    {biodataFromDb?.participant_code ?? participant.participantCode ?? "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid md:grid-cols-[120px_1fr] gap-5 mb-5">
                <div>
                  <NextImage
                    src={previewPhoto}
                    alt="Foto Peserta"
                    width={120}
                    height={145}
                    unoptimized
                    className="w-[120px] h-[145px] object-cover rounded-xl"
                    style={{ border: "2px solid rgba(200,162,77,0.45)" }}
                  />
                </div>

                <div>
                  <h2
                    className="mb-3"
                    style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", fontWeight: 700 }}
                  >
                    {biodataFromDb?.name ?? participant.name ?? user?.name ?? "Nama Peserta"}
                  </h2>

                  <div className="space-y-2">
                    {[
                      ["Kategori", participant.gender === "Encik" ? "ENCIK (Putra)" : "PUAN (Putri)"],
                      ["NIK", biodataFromDb?.national_id ?? participant.nationalId ?? "-"],
                      [
                        "TTL",
                        (biodataFromDb?.birth_date ?? participant.birthDate)
                          ? `${(biodataFromDb?.birth_place ?? participant.birthPlace) || "-"}, ${
                              biodataFromDb?.birth_date ?? participant.birthDate
                            }`
                          : "-",
                      ],
                      ["Tinggi Badan", (biodataFromDb?.height_cm ?? participant.heightCm) ? `${biodataFromDb?.height_cm ?? participant.heightCm} cm` : "-"],
                      ["Pendidikan", educationDisplay],
                      ["Instagram", instagramUsername],
                      ["Email", biodataFromDb?.email ?? participant.email ?? user?.email ?? "-"],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="grid grid-cols-[96px_12px_1fr] text-xs">
                        <span style={{ color: "#D9D9D9", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                          {label}
                        </span>
                        <span style={{ color: "#8E8E8E", fontFamily: "var(--font-poppins)" }}>:</span>
                        <span style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <p
                  className="mb-3 text-sm"
                  style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}
                >
                  STATUS BERKAS ({doneCount}/{documentItems.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {documentItems.map((item) => (
                    <span
                      key={item.label}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        border: `1px solid ${item.done ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.28)"}`,
                        background: item.done ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.06)",
                        color: item.done ? "#22c55e" : "#ef4444",
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      {item.done ? "✓" : "✕"} {item.label}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="rounded-xl p-4 flex items-center justify-between gap-4"
                style={{
                  background: "rgba(200,162,77,0.08)",
                  border: "1px solid rgba(200,162,77,0.25)",
                }}
              >
                <div>
                  <p className="text-[11px]" style={{ color: "#8E8E8E", fontFamily: "var(--font-poppins)" }}>
                    Status Seleksi Saat Ini
                  </p>
                  <p style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
                    {statusLabel[effectiveStageStatus] || "Menunggu Verifikasi"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px]" style={{ color: "#8E8E8E", fontFamily: "var(--font-poppins)" }}>
                    Dicetak pada
                  </p>
                  <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                    {printedDate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GoldCard>
      ) : null}

      {previewError ? (
        <GoldCard className="mb-6">
          <p className="text-xs" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>
            Gagal menyiapkan preview PDF: {previewError}
          </p>
        </GoldCard>
      ) : null}

      {previewUrl ? (
        <GoldCard glow>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
              Preview PDF Biodata
            </p>
            <div className="flex gap-2">
              <GoldButton variant="outline" onClick={handlePreviewPdf} disabled={previewing}>
                {previewing ? "Merefresh..." : "Refresh Preview"}
              </GoldButton>
              <GoldButton
                variant="primary"
                onClick={handleGeneratePdf}
                disabled={printing || isActionLocked}
              >
                {printing ? "Mengunduh..." : "Download PDF"}
              </GoldButton>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(200,162,77,0.25)" }}>
            <iframe
              src={previewUrl}
              title="Preview PDF Biodata Peserta"
              className="w-full"
              style={{ minHeight: 760, background: "#111" }}
            />
          </div>
        </GoldCard>
      ) : null}
    </div>
  );
}
