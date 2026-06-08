"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Search, Filter, Eye, Instagram, FileCheck2, ClipboardList, MessageSquareMore, ImagePlus, X, ExternalLink, FileSpreadsheet, FileText } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { useApp } from "../../../../context/AppContext";
import { API_BASE_URL, getReadableApiError, resolveApiAssetUrl } from "../../../../lib/api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import { updateParticipantProfilePhoto } from "../../../../lib/auth-api";
import {
  getParticipantSelectionStage,
  getParticipantVerificationStatus,
  selectionStageLabels,
  verificationStatusLabels,
  type Participant,
  type ParticipantDocumentItem,
  type SelectionStageKey,
  type VerificationStatus,
} from "../../../../data/mockData";

type StageFilterValue = "all" | SelectionStageKey;
type VerificationFilterValue = "all" | VerificationStatus;
type GenderFilterValue = "all" | "Encik" | "Puan";

type AdminParticipantDocument = ParticipantDocumentItem & {
  original_name?: string | null;
};

type ParticipantExtended = Participant & {
  nickname?: string | null;
  fullName?: string | null;
  shirt_size?: string | null;
  shirtSize?: string | null;
  shoe_size?: string | null;
  shoeSize?: string | null;
  pants_size?: string | null;
  pantsSize?: string | null;
  weight_kg?: string | number | null;
  weightKg?: string | number | null;
  chest_circumference_cm?: string | number | null;
  chestCircumferenceCm?: string | number | null;
  waist_circumference_cm?: string | number | null;
  waistCircumferenceCm?: string | number | null;
  hip_circumference_cm?: string | number | null;
  hipCircumferenceCm?: string | number | null;
  documents?: AdminParticipantDocument[];
};

function getAdminDocuments(participant: Participant): AdminParticipantDocument[] {
  return (participant.documents ?? []) as AdminParticipantDocument[];
}

function getAdminParticipantVerificationStatus(participant: ParticipantExtended): VerificationStatus {
  const currentStatus = getParticipantVerificationStatus(participant);
  if (currentStatus === "Rejected") return currentStatus;

  const needsRevision = participant.documents?.some((document) => document.status === "revision_required");
  return needsRevision ? "NeedsRevision" : currentStatus;
}

function hasUploadedDocument(document: AdminParticipantDocument) {
  const url = (document.url ?? "").trim();
  const originalName = (document.original_name ?? document.originalName ?? "").trim();
  return Boolean(url || originalName);
}

function isMissingFieldValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "" ||
    normalized === "-" ||
    normalized === "- kg" ||
    normalized === "- cm" ||
    normalized === "0 cm"
  );
}

function getBiodataFieldBadge(isVerifiedByAdmin: boolean, value: string) {
  const missing = isMissingFieldValue(value);

  if (missing && isVerifiedByAdmin) {
    return {
      label: "Belum diisi peserta",
      bg: "rgba(239,68,68,0.14)",
      color: "#ef4444",
    };
  }

  if (missing) {
    return {
      label: "Menunggu data peserta",
      bg: "rgba(245,158,11,0.16)",
      color: "#f59e0b",
    };
  }

  if (isVerifiedByAdmin) {
    return {
      label: "Terverifikasi admin",
      bg: "rgba(34,197,94,0.14)",
      color: "#22c55e",
    };
  }

  return {
    label: "Data diisi peserta",
    bg: "rgba(59,130,246,0.14)",
    color: "#60a5fa",
  };
}

function getDocumentBadgeMeta(
  document: AdminParticipantDocument,
  isParticipantVerifiedByAdmin: boolean
) {
  const isUploaded = hasUploadedDocument(document);
  if (!isUploaded || document.status === "missing") {
    return {
      label: "Belum ada",
      bg: "rgba(239,68,68,0.14)",
      color: "#ef4444",
    };
  }
  if (document.status === "revision_required") {
    return {
      label: "Perlu revisi",
      bg: "rgba(249,115,22,0.14)",
      color: "#f97316",
    };
  }
  if (document.status === "verified") {
    return {
      label: "Terverifikasi Admin",
      bg: "rgba(34,197,94,0.14)",
      color: "#22c55e",
    };
  }
  if (isParticipantVerifiedByAdmin && document.status === "submitted") {
    return {
      label: "Terverifikasi Admin",
      bg: "rgba(34,197,94,0.14)",
      color: "#22c55e",
    };
  }
  return {
    label: "Tersubmit Peserta",
    bg: "rgba(245,158,11,0.16)",
    color: "#f59e0b",
  };
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function extractNickname(participant: ParticipantExtended): string {
  const explicitNickname = (participant.nickname ?? "").trim();
  if (explicitNickname) return toTitleCase(explicitNickname);

  const cleanName = (participant.name ?? "")
    .replace(/^(encik|puan)\s+/i, "")
    .trim();
  const firstWord = cleanName.split(/\s+/)[0] ?? "";
  return toTitleCase(firstWord || "Peserta");
}

function getParticipantDisplayName(participant: ParticipantExtended): string {
  return `${participant.gender} ${extractNickname(participant)}`.trim();
}

function getParticipantFullName(participant: ParticipantExtended): string {
  const fullName = (participant.fullName ?? "").trim();
  if (fullName) return toTitleCase(fullName);
  return toTitleCase((participant.name ?? "").trim());
}

function firstFilled(...values: Array<string | number | null | undefined>) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "-";
}

function resolveParticipantPhoto(photo?: string | null) {
  const value = (photo ?? "").trim();
  if (!value) return "/default-avatar.svg";
  if (value.startsWith("data:image")) return value;
  if (value.includes("/default-avatar.svg")) return "/default-avatar.svg";
  return resolveApiAssetUrl(value) ?? "/default-avatar.svg";
}

function normalizePhotoForPdf(photo?: string | null) {
  const value = (photo ?? "").trim();
  if (!value) return "";
  if (value.startsWith("data:image")) return value;
  if (value.includes("/default-avatar.svg")) return "/default-avatar.svg";
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      return url.pathname.startsWith("/storage/") ? url.pathname : value;
    } catch {
      return value;
    }
  }
  return value;
}

function extractDigits(value: string): number {
  const match = value.match(/(\d{1,4})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]);
}

function getDisplayNumber(participant: Participant) {
  const status = participant.status;
  const auditionStages = ["Verified", "TechnicalMeeting", "Audition", "Rejected"];
  if (auditionStages.includes(status)) {
    return (participant.auditionNumber ?? "").trim() || participant.number;
  }
  return (participant.participantCode ?? "").trim() || participant.number;
}

function parseParticipantUserId(participantId: string): number | null {
  const apiIdMatch = participantId.match(/^P_API_(\d+)$/);
  if (apiIdMatch) {
    const parsed = Number(apiIdMatch[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Number(participantId);
  return Number.isFinite(parsed) ? parsed : null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => reject(new Error("Gagal membaca file foto."));
    reader.readAsDataURL(file);
  });
}

const stageFilterOptions: Array<{ value: StageFilterValue; label: string }> = [
  { value: "all", label: "Semua Tahap" },
  { value: "Verification", label: selectionStageLabels.Verification },
  { value: "Technical Meeting", label: selectionStageLabels["Technical Meeting"] },
  { value: "Audition", label: selectionStageLabels.Audition },
  { value: "Pre Camp", label: selectionStageLabels["Pre Camp"] },
  { value: "Camp", label: selectionStageLabels.Camp },
  { value: "Grand Final", label: selectionStageLabels["Grand Final"] },
  { value: "Final Result", label: selectionStageLabels["Final Result"] },
];

const verificationFilterOptions: Array<{ value: VerificationFilterValue; label: string }> = [
  { value: "all", label: "Semua Verifikasi" },
  { value: "Pending", label: verificationStatusLabels.Pending },
  { value: "NeedsRevision", label: verificationStatusLabels.NeedsRevision },
  { value: "Verified", label: verificationStatusLabels.Verified },
  { value: "Rejected", label: verificationStatusLabels.Rejected },
];

export default function AdminParticipantsPage() {
  const { participantList, setParticipantList, voteCandidateList } = useApp();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilterValue>("all");
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilterValue>("all");
  const [genderFilter, setGenderFilter] = useState<GenderFilterValue>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [participantPhotoMenuOpen, setParticipantPhotoMenuOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ src: string; name: string } | null>(null);
  const participantPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [isUpdatingParticipantPhoto, setIsUpdatingParticipantPhoto] = useState(false);
  const [photoUpdateNotice, setPhotoUpdateNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const voteCandidateByParticipantId = useMemo(
    () => new Map(voteCandidateList.map((item) => [item.participantId, item] as const)),
    [voteCandidateList]
  );

  const voteCandidateByNumber = useMemo(
    () => new Map(voteCandidateList.map((item) => [item.number, item] as const)),
    [voteCandidateList]
  );

  const resolveVoteCandidate = (participant: Participant) => {
    return (
      voteCandidateByParticipantId.get(participant.id) ||
      voteCandidateByParticipantId.get(`P_API_${participant.id}`) ||
      voteCandidateByNumber.get((participant.participantCode ?? participant.number ?? "").trim())
    );
  };

  const resolveParticipantPhotoWithVote = (participant: Participant) => {
    return resolveParticipantPhoto(participant.photo);
  };

  const resolveInstagramWithVote = (participant: Participant) => {
    if ((participant.instagram ?? "").trim()) return participant.instagram;
    const candidate = resolveVoteCandidate(participant);
    return candidate?.instagramHandle ?? "";
  };

  const filteredParticipants = useMemo(() => {
    const filtered = participantList.filter((participant) => {
      const normalizedSearch = searchKeyword.toLowerCase();
      const selectionStage = getParticipantSelectionStage(participant);
      const verificationStatus = getAdminParticipantVerificationStatus(participant as ParticipantExtended);
      const matchSearch =
        getParticipantDisplayName(participant as ParticipantExtended).toLowerCase().includes(normalizedSearch) ||
        participant.name.toLowerCase().includes(normalizedSearch) ||
        participant.number.toLowerCase().includes(normalizedSearch) ||
        participant.email.toLowerCase().includes(normalizedSearch);
      const matchStage =
        stageFilter === "all" ||
        selectionStage === stageFilter ||
        (stageFilter === "Grand Final" && selectionStage === "Final Result");
      const matchVerification = verificationFilter === "all" || verificationStatus === verificationFilter;
      const matchGender = genderFilter === "all" || participant.gender === genderFilter;
      return matchSearch && matchStage && matchVerification && matchGender;
    });

    return filtered.sort((a, b) => {
      const aCode = getDisplayNumber(a);
      const bCode = getDisplayNumber(b);
      const aNum = extractDigits(aCode);
      const bNum = extractDigits(bCode);
      if (aNum !== bNum) return aNum - bNum;
      return a.name.localeCompare(b.name);
    });
  }, [genderFilter, participantList, searchKeyword, stageFilter, verificationFilter]);

  const selectedParticipant = selectedId
    ? participantList.find((participant) => participant.id === selectedId) ?? null
    : null;

  useEffect(() => {
    setPhotoUpdateNotice(null);
  }, [selectedId]);

  const handleParticipantPhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedParticipant) return;

    if (!file.type.startsWith("image/")) {
      setPhotoUpdateNotice({ type: "error", message: "File harus berupa gambar (JPG/PNG/WEBP)." });
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoUpdateNotice({ type: "error", message: "Ukuran foto maksimal 5 MB." });
      event.target.value = "";
      return;
    }

    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setPhotoUpdateNotice({ type: "error", message: "Sesi login tidak ditemukan. Silakan login ulang." });
      event.target.value = "";
      return;
    }

    const participantUserId = parseParticipantUserId(selectedParticipant.id);
    if (!participantUserId) {
      setPhotoUpdateNotice({ type: "error", message: "ID peserta tidak valid." });
      event.target.value = "";
      return;
    }

    setIsUpdatingParticipantPhoto(true);
    setPhotoUpdateNotice(null);
    try {
      const photoDataUrl = await readFileAsDataUrl(file);
      if (!photoDataUrl) {
        throw new Error("File foto tidak dapat diproses.");
      }

      const response = await updateParticipantProfilePhoto(token, participantUserId, {
        photo: photoDataUrl,
      });
      const persistedPhoto = (response.data.photo ?? "").trim() || photoDataUrl;

      setParticipantList((prev) =>
        prev.map((participant) =>
          participant.id === selectedParticipant.id ? { ...participant, photo: persistedPhoto } : participant
        )
      );
      setParticipantPhotoMenuOpen(false);
      setPhotoUpdateNotice({
        type: "success",
        message: "Foto profil peserta berhasil diperbarui.",
      });
    } catch (error) {
      setPhotoUpdateNotice({
        type: "error",
        message: getReadableApiError(error),
      });
    } finally {
      setIsUpdatingParticipantPhoto(false);
    }

    event.target.value = "";
  };

  const getDocumentSummary = (participant: Participant) => {
    const documents = getAdminDocuments(participant);
    const revisionCount = documents.filter((item) => item.status === "revision_required").length;

    return {
      total: documents.length,
      revisionCount,
      readyCount: documents.filter((item) =>
        hasUploadedDocument(item) && (item.status === "submitted" || item.status === "verified")
      ).length,
    };
  };

  const getReviewSummary = (participant: Participant) => {
    const reviewItems = participant.reviewItems ?? [];
    return {
      revisionCount: reviewItems.filter((item) => item.status === "revision_required").length,
      okCount: reviewItems.filter((item) => item.status === "ok").length,
    };
  };

  const documentLabels: Record<string, string> = {
    identityCard: "KTP / SIM / Paspor / Kartu Pelajar",
    closeUpPhoto: "Foto Close Up 4R",
    fullBodyPhoto: "Foto Full Body 4R",
    formS01: "Formulir S-01",
    formS02: "Formulir S-02",
    formS03: "Formulir S-03",
    formS04: "Formulir S-04",
  };

  const getDocumentMeta = (
    participant: ParticipantExtended,
    key: keyof typeof documentLabels,
    isParticipantVerifiedByAdmin: boolean
  ) => {
    const document = getAdminDocuments(participant).find((item) => item.key === key);
    if (!document) {
      return {
        statusLabel: "Belum ada",
        fileName: "-",
        url: "-",
      };
    }

    const statusLabel =
      document.status === "verified"
        ? "Terverifikasi"
        : document.status === "revision_required"
          ? "Perlu revisi"
          : isParticipantVerifiedByAdmin && document.status === "submitted"
            ? "Terverifikasi"
          : document.status === "submitted"
            ? "Tersubmit"
            : "Belum ada";

    return {
      statusLabel,
      fileName: (document.original_name ?? document.originalName ?? "-").trim() || "-",
      url: (document.url ?? "").trim() || "-",
    };
  };

  const buildExportRow = (participant: Participant, index: number) => {
    const extended = participant as ParticipantExtended;
    const verificationStatus = getAdminParticipantVerificationStatus(participant as ParticipantExtended);
    const isParticipantVerifiedByAdmin = verificationStatus === "Verified";
    const selectionStage = getParticipantSelectionStage(participant);
    const isEliminated = Boolean(participant.eliminatedInAudition);
    const stageLabel = isEliminated ? "Tereliminasi (Audisi)" : selectionStageLabels[selectionStage];
    const verificationLabel =
      isEliminated && verificationStatus === "Rejected" ? "Tereliminasi" : verificationStatusLabels[verificationStatus];
    const identityCard = getDocumentMeta(extended, "identityCard", isParticipantVerifiedByAdmin);
    const closeUpPhoto = getDocumentMeta(extended, "closeUpPhoto", isParticipantVerifiedByAdmin);
    const fullBodyPhoto = getDocumentMeta(extended, "fullBodyPhoto", isParticipantVerifiedByAdmin);
    const formS01 = getDocumentMeta(extended, "formS01", isParticipantVerifiedByAdmin);
    const formS02 = getDocumentMeta(extended, "formS02", isParticipantVerifiedByAdmin);
    const formS03 = getDocumentMeta(extended, "formS03", isParticipantVerifiedByAdmin);
    const formS04 = getDocumentMeta(extended, "formS04", isParticipantVerifiedByAdmin);

    return {
      no: index + 1,
      nomorPeserta: getDisplayNumber(participant),
      nama: getParticipantFullName(extended),
      panggilan: extractNickname(extended),
      kategori: participant.gender === "Encik" ? "Encik (Putra)" : "Puan (Putri)",
      agama: firstFilled(extended.religion),
      statusSaatIni: firstFilled(extended.currentStatus),
      nik: firstFilled(participant.nationalId),
      tempatLahir: firstFilled(participant.birthPlace),
      tanggalLahir: firstFilled(participant.birthDate),
      tinggiBadan: `${firstFilled(participant.heightCm)} cm`,
      beratBadan: `${firstFilled(extended.weightKg)} kg`,
      ukuranBaju: firstFilled(extended.shirtSize),
      lingkarDada: `${firstFilled(extended.chestCircumferenceCm)} cm`,
      lingkarPinggang: `${firstFilled(extended.waistCircumferenceCm)} cm`,
      lingkarPinggul: `${firstFilled(extended.hipCircumferenceCm)} cm`,
      ukuranCelana: firstFilled(extended.pantsSize),
      ukuranSepatu: firstFilled(extended.shoeSize),
      pendidikan: firstFilled(participant.education),
      instagram: firstFilled(resolveInstagramWithVote(participant)),
      tiktok: firstFilled(extended.tiktok),
      email: participant.email,
      phone: participant.phone,
      parentPhone: firstFilled(extended.parentPhone),
      fatherName: firstFilled(extended.fatherName),
      motherName: firstFilled(extended.motherName),
      domicileAddress: firstFilled(extended.domicileAddress),
      ktpAddress: firstFilled(extended.ktpAddress),
      occupation: firstFilled(extended.occupation),
      skills: firstFilled(extended.skills),
      hobbies: firstFilled(extended.hobbies),
      languages: firstFilled(extended.languages),
      vision: firstFilled(extended.vision),
      mission: firstFilled(extended.mission),
      experience: firstFilled(extended.experience),
      achievement: firstFilled(extended.achievement),
      agreementNoAgency: firstFilled(extended.agreementNoAgency),
      agencyName: firstFilled(extended.agencyName),
      agreementParentPermission: firstFilled(extended.agreementParentPermission),
      agreementAllStages: firstFilled(extended.agreementAllStages),
      motivationStatement: firstFilled(extended.motivationStatement),
      contributionIdea: firstFilled(extended.contributionIdea),
      publicSpeakingExperience: firstFilled(extended.publicSpeakingExperience),
      photo: normalizePhotoForPdf(participant.photo),
      documentLabels,
      verifikasi: verificationLabel,
      tahap: stageLabel,
      identityCardStatus: identityCard.statusLabel,
      identityCardFile: identityCard.fileName,
      identityCardUrl: identityCard.url,
      closeUpStatus: closeUpPhoto.statusLabel,
      closeUpFile: closeUpPhoto.fileName,
      closeUpUrl: closeUpPhoto.url,
      fullBodyStatus: fullBodyPhoto.statusLabel,
      fullBodyFile: fullBodyPhoto.fileName,
      fullBodyUrl: fullBodyPhoto.url,
      s01Status: formS01.statusLabel,
      s01File: formS01.fileName,
      s01Url: formS01.url,
      s02Status: formS02.statusLabel,
      s02File: formS02.fileName,
      s02Url: formS02.url,
      s03Status: formS03.statusLabel,
      s03File: formS03.fileName,
      s03Url: formS03.url,
      s04Status: formS04.statusLabel,
      s04File: formS04.fileName,
      s04Url: formS04.url,
    };
  };

  const buildExportRows = () => {
    return filteredParticipants.map((participant, index) => buildExportRow(participant, index));
  };

  const exportParticipantsToExcel = () => {
    const rows = buildExportRows();
    if (!rows.length) return;

    const headers = [
      "No",
      "Nomor Peserta",
      "Nama Lengkap",
      "Nama Panggilan",
      "Kategori",
      "Agama",
      "Status Saat Ini",
      "NIK",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Tinggi Badan",
      "Berat Badan",
      "Ukuran Baju",
      "Lingkar Dada",
      "Lingkar Pinggang",
      "Lingkar Pinggul",
      "Ukuran Celana",
      "Ukuran Sepatu",
      "Pendidikan",
      "Instagram",
      "TikTok",
      "Email",
      "Telepon",
      "No. HP Orang Tua/Wali",
      "Nama Ayah",
      "Nama Ibu",
      "Alamat Domisili",
      "Alamat Sesuai KTP",
      "Pekerjaan",
      "Keahlian / Bakat",
      "Hobi",
      "Bahasa",
      "Visi",
      "Misi",
      "Pengalaman",
      "Prestasi",
      "Kontrak Agensi",
      "Nama Agensi",
      "Izin Orang Tua/Wali",
      "Izin Semua Tahap",
      "Motivasi",
      "Kontribusi",
      "Pengalaman Public Speaking",
      "Status Verifikasi",
      "Tahap Seleksi",
      "Status KTP/SIM/Paspor/Kartu Pelajar",
      "File KTP/SIM/Paspor/Kartu Pelajar",
      "URL KTP/SIM/Paspor/Kartu Pelajar",
      "Status Foto Close Up 4R",
      "File Foto Close Up 4R",
      "URL Foto Close Up 4R",
      "Status Foto Full Body 4R",
      "File Foto Full Body 4R",
      "URL Foto Full Body 4R",
      "Status Formulir S-01",
      "File Formulir S-01",
      "URL Formulir S-01",
      "Status Formulir S-02",
      "File Formulir S-02",
      "URL Formulir S-02",
      "Status Formulir S-03",
      "File Formulir S-03",
      "URL Formulir S-03",
      "Status Formulir S-04",
      "File Formulir S-04",
      "URL Formulir S-04",
    ];

    const escapeCsv = (value: string | number) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const csvLines = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) =>
        [
          row.no,
          row.nomorPeserta,
          row.nama,
          row.panggilan,
          row.kategori,
          row.agama,
          row.statusSaatIni,
          row.nik,
          row.tempatLahir,
          row.tanggalLahir,
          row.tinggiBadan,
          row.beratBadan,
          row.ukuranBaju,
          row.lingkarDada,
          row.lingkarPinggang,
          row.lingkarPinggul,
          row.ukuranCelana,
          row.ukuranSepatu,
          row.pendidikan,
          row.instagram,
          row.tiktok,
          row.email,
          row.phone,
          row.parentPhone,
          row.fatherName,
          row.motherName,
          row.domicileAddress,
          row.ktpAddress,
          row.occupation,
          row.skills,
          row.hobbies,
          row.languages,
          row.vision,
          row.mission,
          row.experience,
          row.achievement,
          row.agreementNoAgency,
          row.agencyName,
          row.agreementParentPermission,
          row.agreementAllStages,
          row.motivationStatement,
          row.contributionIdea,
          row.publicSpeakingExperience,
          row.verifikasi,
          row.tahap,
          row.identityCardStatus,
          row.identityCardFile,
          row.identityCardUrl,
          row.closeUpStatus,
          row.closeUpFile,
          row.closeUpUrl,
          row.fullBodyStatus,
          row.fullBodyFile,
          row.fullBodyUrl,
          row.s01Status,
          row.s01File,
          row.s01Url,
          row.s02Status,
          row.s02File,
          row.s02Url,
          row.s03Status,
          row.s03File,
          row.s03Url,
          row.s04Status,
          row.s04File,
          row.s04Url,
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const dateTag = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `data-peserta-${dateTag}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const resolveDownloadFileName = (headerValue: string | null, fallbackName: string) => {
    const raw = headerValue ?? "";
    const utf8Match = raw.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      try {
        const decoded = decodeURIComponent(utf8Match[1]).trim();
        if (decoded) return decoded;
      } catch {
        // ignore decode error and fallback to plain filename parser
      }
    }

    const plainMatch = raw.match(/filename\s*=\s*"?([^\";]+)"?/i);
    if (plainMatch?.[1]) {
      const clean = plainMatch[1].trim();
      if (clean) return clean;
    }

    return fallbackName;
  };

  const triggerBlobDownload = (blob: Blob, fallbackName: string, contentDisposition?: string | null) => {
    const fileName = resolveDownloadFileName(contentDisposition ?? null, fallbackName)
      .replace(/[\\/:*?"<>|]/g, "-")
      .trim() || fallbackName;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 15000);
  };

  const exportParticipantsToPdf = async () => {
    const rows = buildExportRows();
    if (!rows.length) return;

    const session = getParticipantAuthSession();
    const token = session?.token;

    if (!token) {
      alert("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    const title = "Data Peserta Duta Wisata Batam 2026";
    const response = await fetch(`${API_BASE_URL}/super-admin/participants/pdf-bulk`, {
      method: "POST",
      headers: {
        Accept: "application/pdf, application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        participants: rows,
        title,
      }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          const payload = await response.json() as { message?: string };
          alert(payload.message || "Gagal generate PDF semua peserta.");
          return;
        } catch {
          // fallback ke parser text jika body JSON tidak valid
        }
      }

      const errorText = (await response.text()).trim();
      const fallbackMessage = "Gagal generate PDF semua peserta. Cek log backend untuk detail error.";
      alert(errorText.startsWith("<!DOCTYPE html>") ? fallbackMessage : (errorText || fallbackMessage));
      return;
    }

    const blob = await response.blob();
    triggerBlobDownload(
      blob,
      `data-peserta-${new Date().toISOString().slice(0, 10)}.pdf`,
      response.headers.get("content-disposition")
    );
  };

  const exportParticipantToPdf = async (participant: Participant) => {
    const row = buildExportRow(participant, 0);
    const title = `Data Peserta - ${row.nama} (${row.nomorPeserta})`;
    const session = getParticipantAuthSession();
    const token = session?.token;

    if (!token) {
      alert("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/super-admin/participants/pdf`, {
      method: "POST",
      headers: {
        Accept: "application/pdf, application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        participant: row,
        title,
      }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          const payload = await response.json() as { message?: string };
          alert(payload.message || "Gagal generate PDF peserta.");
          return;
        } catch {
          // fallback ke parser text jika body JSON tidak valid
        }
      }

      const errorText = (await response.text()).trim();
      const fallbackMessage = "Gagal generate PDF peserta. Cek log backend untuk detail error.";
      alert(errorText.startsWith("<!DOCTYPE html>") ? fallbackMessage : (errorText || fallbackMessage));
      return;
    }

    const blob = await response.blob();
    triggerBlobDownload(
      blob,
      `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "data-peserta"}.pdf`,
      response.headers.get("content-disposition")
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1
          style={{
            fontFamily: "var(--font-cinzel)",
            color: "#D4AF37",
            fontSize: "1.5rem",
            fontWeight: 700,
          }}
        >
          Data Peserta
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Detail peserta kini menampilkan verifikasi, progres tahap, ringkasan dokumen, dan catatan revisi admin.
        </p>
      </div>

      <GoldCard className="mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#D4AF37" }} />
            <input
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Cari nama, nomor, atau email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "#111",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#F5E6C8",
                fontFamily: "var(--font-poppins)",
              }}
            />
          </div>

          <select
            value={verificationFilter}
            onChange={(event) => setVerificationFilter(event.target.value as VerificationFilterValue)}
            className="px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#F5E6C8",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {verificationFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value as StageFilterValue)}
            className="px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#F5E6C8",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {stageFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={genderFilter}
            onChange={(event) => setGenderFilter(event.target.value as GenderFilterValue)}
            className="px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#F5E6C8",
              fontFamily: "var(--font-poppins)",
            }}
          >
            <option value="all">Semua Kategori</option>
            <option value="Encik">Encik (Putra)</option>
            <option value="Puan">Puan (Putri)</option>
          </select>

          <button
            type="button"
            onClick={exportParticipantsToExcel}
            className="px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
            style={{
              background: "rgba(34,197,94,0.14)",
              border: "1px solid rgba(34,197,94,0.28)",
              color: "#22c55e",
              fontFamily: "var(--font-poppins)",
              cursor: "pointer",
            }}
          >
            <FileSpreadsheet size={14} />
            Export Excel
          </button>

          <button
            type="button"
            onClick={exportParticipantsToPdf}
            className="px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
            style={{
              background: "rgba(59,130,246,0.14)",
              border: "1px solid rgba(59,130,246,0.28)",
              color: "#60a5fa",
              fontFamily: "var(--font-poppins)",
              cursor: "pointer",
            }}
          >
            <FileText size={14} />
            Export PDF
          </button>
        </div>

        <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
          <Filter size={12} />
          Menampilkan {filteredParticipants.length} dari {participantList.length} peserta
        </p>
      </GoldCard>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(212,175,55,0.2)", background: "#1A1A1A" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      background: "rgba(212,175,55,0.08)",
                      borderBottom: "1px solid rgba(212,175,55,0.15)",
                    }}
                  >
                    <th className="px-4 py-3 text-left text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      Peserta
                    </th>
                    <th className="px-4 py-3 text-left text-xs hidden md:table-cell" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      Verifikasi
                    </th>
                    <th className="px-4 py-3 text-left text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      Tahap
                    </th>
                    <th className="px-4 py-3 text-center text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((participant, index) => {
                    const verificationStatus = getAdminParticipantVerificationStatus(participant as ParticipantExtended);
                    const selectionStage = getParticipantSelectionStage(participant);
                    const isEliminated = Boolean(participant.eliminatedInAudition);
                    const stageLabel = isEliminated ? "Tereliminasi (Audisi)" : selectionStageLabels[selectionStage];
                    const verificationLabel =
                      isEliminated && verificationStatus === "Rejected"
                        ? "Tereliminasi"
                        : verificationStatusLabels[verificationStatus];

                    return (
                      <tr
                        key={participant.id}
                        className="transition-colors cursor-pointer"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          background: selectedId === participant.id ? "rgba(212,175,55,0.08)" : "transparent",
                        }}
                        onClick={() => {
                          setSelectedId(participant.id);
                          setParticipantPhotoMenuOpen(false);
                        }}
                      >
                        <td className="px-4 py-3 text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Image
                              src={resolveParticipantPhotoWithVote(participant)}
                              alt={participant.name}
                              width={32}
                              height={32}
                              unoptimized
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                            <div>
                              <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                                {getParticipantDisplayName(participant as ParticipantExtended)}
                              </p>
                              <p className="text-xs" style={{ color: "#666" }}>
                                {getDisplayNumber(participant)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span
                            className="text-xs px-2 py-1 rounded-full whitespace-nowrap"
                            style={{
                              background:
                                verificationLabel === "Terverifikasi"
                                  ? "rgba(34,197,94,0.15)"
                                  : verificationLabel === "Perlu Perbaikan"
                                  ? "rgba(249,115,22,0.15)"
                                  : verificationLabel === "Tereliminasi"
                                  ? "rgba(239,68,68,0.15)"
                                  : "rgba(245,158,11,0.15)",
                              color:
                                verificationLabel === "Terverifikasi"
                                  ? "#22c55e"
                                  : verificationLabel === "Perlu Perbaikan"
                                  ? "#f97316"
                                  : verificationLabel === "Tereliminasi"
                                  ? "#ef4444"
                                  : "#F59E0B",
                              fontFamily: "var(--font-poppins)",
                            }}
                          >
                            {verificationLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs px-2 py-1 rounded-full whitespace-nowrap"
                            style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", fontFamily: "var(--font-poppins)" }}
                          >
                            {stageLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(participant.id);
                              setParticipantPhotoMenuOpen(false);
                            }}
                            className="p-1.5 rounded-lg transition-all"
                            style={{
                              color: "#D4AF37",
                              background: "rgba(212,175,55,0.1)",
                              border: "none",
                              cursor: "pointer",
                            }}
                            type="button"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredParticipants.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                    Tidak ada peserta yang sesuai filter
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          {selectedParticipant ? (
            <GoldCard glow>
              <div className="text-center mb-5">
                <div className="relative w-20 mx-auto mb-3">
                  <button
                    type="button"
                    onClick={() => setParticipantPhotoMenuOpen((prev) => !prev)}
                    className="relative block w-20 h-20 rounded-2xl overflow-hidden group"
                    style={{ border: "2px solid rgba(212,175,55,0.5)", cursor: "pointer" }}
                  >
                    <Image
                      src={resolveParticipantPhotoWithVote(selectedParticipant)}
                      alt={selectedParticipant.name}
                      width={80}
                      height={80}
                      unoptimized
                      className="w-20 h-20 object-cover object-top"
                    />
                    <span
                      className="absolute inset-0 flex items-end justify-center pb-2 text-[10px] transition-opacity opacity-0 group-hover:opacity-100"
                      style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.7))", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                    >
                      Klik foto
                    </span>
                  </button>

                  {participantPhotoMenuOpen ? (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-40 rounded-xl p-2 z-20"
                      style={{ background: "#141414", border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 18px 36px rgba(0,0,0,0.35)" }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewPhoto({
                            src: resolveParticipantPhotoWithVote(selectedParticipant),
                            name: selectedParticipant.name,
                          });
                          setParticipantPhotoMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                        style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)", background: "transparent", border: "none", cursor: "pointer" }}
                      >
                        <Eye size={13} />
                        Lihat Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isUpdatingParticipantPhoto) {
                            participantPhotoInputRef.current?.click();
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                        disabled={isUpdatingParticipantPhoto}
                        style={{
                          color: "#D4AF37",
                          fontFamily: "var(--font-poppins)",
                          background: "transparent",
                          border: "none",
                          cursor: isUpdatingParticipantPhoto ? "not-allowed" : "pointer",
                          opacity: isUpdatingParticipantPhoto ? 0.7 : 1,
                        }}
                      >
                        <ImagePlus size={13} />
                        {isUpdatingParticipantPhoto ? "Mengunggah..." : "Pilih Foto Baru"}
                      </button>
                    </div>
                  ) : null}

                  <input
                    ref={participantPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleParticipantPhotoChange}
                  />
                </div>
                <p className="text-xs mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
                  {selectedParticipant.number}
                </p>
                <h3 className="text-sm font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                  {getParticipantDisplayName(selectedParticipant as ParticipantExtended)}
                </h3>
                <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                  Nama asli: {getParticipantFullName(selectedParticipant as ParticipantExtended)}
                </p>
                {photoUpdateNotice ? (
                  <p
                    className="text-xs mt-2"
                    style={{
                      color: photoUpdateNotice.type === "success" ? "#22c55e" : "#ef4444",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    {photoUpdateNotice.message}
                  </p>
                ) : null}
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => exportParticipantToPdf(selectedParticipant)}
                    className="px-3 py-2 rounded-xl text-xs inline-flex items-center gap-2"
                    style={{
                      background: "rgba(59,130,246,0.14)",
                      border: "1px solid rgba(59,130,246,0.28)",
                      color: "#60a5fa",
                      fontFamily: "var(--font-poppins)",
                      cursor: "pointer",
                    }}
                  >
                    <FileText size={12} />
                    Print PDF Peserta
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs" style={{ fontFamily: "var(--font-poppins)" }}>
                {(() => {
                  const verificationStatus = getAdminParticipantVerificationStatus(selectedParticipant as ParticipantExtended);
                  const isVerifiedByAdmin = verificationStatus === "Verified";
                  const biodataRows = [
                  { label: "Kategori", value: selectedParticipant.gender },
                  { label: "Tahap Seleksi", value: selectionStageLabels[getParticipantSelectionStage(selectedParticipant)] },
                  { label: "Status Verifikasi", value: verificationStatusLabels[verificationStatus] },
                  { label: "Tinggi", value: `${selectedParticipant.heightCm} cm` },
                  {
                    label: "Berat",
                    value: `${firstFilled(
                      (selectedParticipant as ParticipantExtended).weight_kg,
                      (selectedParticipant as ParticipantExtended).weightKg
                    )} kg`,
                  },
                  {
                    label: "Ukuran Baju",
                    value: firstFilled(
                      (selectedParticipant as ParticipantExtended).shirt_size,
                      (selectedParticipant as ParticipantExtended).shirtSize
                    ),
                  },
                  {
                    label: "Ukuran Celana",
                    value: firstFilled(
                      (selectedParticipant as ParticipantExtended).pants_size,
                      (selectedParticipant as ParticipantExtended).pantsSize
                    ),
                  },
                  {
                    label: "Ukuran Sepatu",
                    value: firstFilled(
                      (selectedParticipant as ParticipantExtended).shoe_size,
                      (selectedParticipant as ParticipantExtended).shoeSize
                    ),
                  },
                  {
                    label: "Lingkar Dada",
                    value: `${firstFilled(
                      (selectedParticipant as ParticipantExtended).chest_circumference_cm,
                      (selectedParticipant as ParticipantExtended).chestCircumferenceCm
                    )} cm`,
                  },
                  {
                    label: "Lingkar Pinggang",
                    value: `${firstFilled(
                      (selectedParticipant as ParticipantExtended).waist_circumference_cm,
                      (selectedParticipant as ParticipantExtended).waistCircumferenceCm
                    )} cm`,
                  },
                  {
                    label: "Lingkar Pinggul",
                    value: `${firstFilled(
                      (selectedParticipant as ParticipantExtended).hip_circumference_cm,
                      (selectedParticipant as ParticipantExtended).hipCircumferenceCm
                    )} cm`,
                  },
                  { label: "Pendidikan", value: selectedParticipant.education },
                  { label: "Email", value: selectedParticipant.email },
                  { label: "HP", value: selectedParticipant.phone },
                  { label: "Daftar", value: selectedParticipant.registeredAt },
                  ];
                  const missingCount = biodataRows.filter((item) => isMissingFieldValue(String(item.value))).length;
                  return (
                    <>
                      <div
                        className="rounded-xl p-2.5 mb-2 flex items-center justify-between gap-2"
                        style={{
                          background: missingCount > 0 ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                          border: missingCount > 0 ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(34,197,94,0.25)",
                        }}
                      >
                        <span style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                          Ringkasan Biodata
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: missingCount > 0 ? "rgba(239,68,68,0.14)" : "rgba(34,197,94,0.14)",
                            color: missingCount > 0 ? "#ef4444" : "#22c55e",
                            fontFamily: "var(--font-poppins)",
                          }}
                        >
                          {missingCount > 0
                            ? `${missingCount} field belum diisi peserta`
                            : "Data biodata lengkap"}
                        </span>
                      </div>
                      {biodataRows.map((item) => {
                        const badge = getBiodataFieldBadge(isVerifiedByAdmin, String(item.value));
                        return (
                  <div key={item.label} className="flex justify-between gap-2">
                    <span style={{ color: "#888" }}>{item.label}</span>
                    <div className="flex items-center gap-2" style={{ maxWidth: "220px" }}>
                      <span style={{ color: "#F5E6C8", textAlign: "right", wordBreak: "break-word" }}>
                        {item.value}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                        );
                      })}
                    </>
                  );
                })()}

                <div className="flex justify-between gap-2">
                  <span style={{ color: "#888" }}>Instagram</span>
                  {resolveInstagramWithVote(selectedParticipant) ? (
                    <a
                      href={resolveInstagramWithVote(selectedParticipant).startsWith("http")
                        ? resolveInstagramWithVote(selectedParticipant)
                        : `https://instagram.com/${resolveInstagramWithVote(selectedParticipant).replace("@", "")}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1"
                      style={{ color: "#D4AF37", textAlign: "right", maxWidth: "160px", wordBreak: "break-word" }}
                    >
                      <Instagram size={11} />
                      {resolveInstagramWithVote(selectedParticipant)}
                    </a>
                  ) : (
                    <span style={{ color: "#666" }}>-</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                {(() => {
                  const summary = getDocumentSummary(selectedParticipant);
                  const reviewSummary = getReviewSummary(selectedParticipant);

                  return (
                    <>
                      <div
                        className="rounded-xl p-3"
                        style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}
                      >
                        <FileCheck2 size={14} style={{ color: "#22c55e", marginBottom: 8 }} />
                        <p className="text-lg font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                          {summary.readyCount}
                        </p>
                        <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                          Dokumen siap
                        </p>
                      </div>
                      <div
                        className="rounded-xl p-3"
                        style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}
                      >
                        <ClipboardList size={14} style={{ color: "#f97316", marginBottom: 8 }} />
                        <p className="text-lg font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                          {Math.max(summary.revisionCount, reviewSummary.revisionCount)}
                        </p>
                        <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                          Perlu revisi
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mt-5 pt-4 space-y-4" style={{ borderTop: "1px solid rgba(212,175,55,0.1)" }}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquareMore size={14} style={{ color: "#D4AF37" }} />
                    <p className="text-xs font-semibold" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                      Catatan Admin
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", lineHeight: 1.7 }}>
                    {selectedParticipant.adminRevisionNote || selectedParticipant.adminVerificationNote || "Belum ada catatan admin untuk peserta ini."}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                    Item Review
                  </p>
                  <div className="space-y-2">
                    {(selectedParticipant.reviewItems ?? []).length > 0 ? (
                      selectedParticipant.reviewItems?.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl p-3"
                          style={{
                            background: item.status === "revision_required" ? "rgba(249,115,22,0.08)" : "rgba(34,197,94,0.08)",
                            border: item.status === "revision_required" ? "1px solid rgba(249,115,22,0.16)" : "1px solid rgba(34,197,94,0.16)",
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                              {item.label}
                            </p>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{
                                background: item.status === "revision_required" ? "rgba(249,115,22,0.16)" : "rgba(34,197,94,0.16)",
                                color: item.status === "revision_required" ? "#f97316" : "#22c55e",
                                fontFamily: "var(--font-poppins)",
                              }}
                            >
                              {item.status === "revision_required" ? "Perlu revisi" : "OK"}
                            </span>
                          </div>
                          <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", lineHeight: 1.6 }}>
                            {item.note}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                        Belum ada item review terperinci.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                    Dokumen Terkait
                  </p>
                  <div className="space-y-2">
                    {(() => {
                      const verificationStatus = getAdminParticipantVerificationStatus(selectedParticipant as ParticipantExtended);
                      const isParticipantVerifiedByAdmin = verificationStatus === "Verified";
                      return (
                        <>
                    {getAdminDocuments(selectedParticipant).map((document) => (
                      <div
                        key={`${selectedParticipant.id}-${document.key}`}
                        className="rounded-xl p-3"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        {(() => {
                          const badge = getDocumentBadgeMeta(
                            document,
                            isParticipantVerifiedByAdmin
                          );
                          return (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                            {document.label}
                          </p>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              fontFamily: "var(--font-poppins)",
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                          );
                        })()}
                        {document.url ? (
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-xs"
                            style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}
                          >
                            <ExternalLink size={11} />
                            Lihat dokumen
                          </a>
                        ) : null}
                        {document.original_name || document.originalName ? (
                          <p className="text-xs mt-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                            File: {document.original_name ?? document.originalName}
                          </p>
                        ) : null}
                        {document.note ? (
                          <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", lineHeight: 1.6 }}>
                            {document.note}
                          </p>
                        ) : null}
                      </div>
                    ))}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </GoldCard>
          ) : (
            <GoldCard className="text-center py-12">
              <Eye size={32} style={{ color: "#444", margin: "0 auto 12px" }} />
              <p className="text-sm" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                Pilih peserta untuk melihat detail
              </p>
            </GoldCard>
          )}
        </div>
      </div>

      {previewPhoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)" }}
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl p-5"
            style={{ background: "#141414", border: "1px solid rgba(212,175,55,0.2)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#F5E6C8", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
            <p className="text-sm mb-4 pr-10" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
              {previewPhoto.name}
            </p>
            <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(212,175,55,0.2)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveParticipantPhoto(previewPhoto.src)} alt={previewPhoto.name} className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

