"use client";

import React, { useEffect, useRef } from "react";
import {
  LayoutDashboard,
  User,
  Upload,
  CheckCircle,
  Download,
} from "lucide-react";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { useApp } from "../../../context/AppContext";
import { type Participant, type StageStatus } from "../../../data/mockData";
import { fetchParticipantBiodata } from "../../../lib/auth-api";
import { resolveApiAssetUrl } from "../../../lib/api";
import { useRouter } from "next/navigation";
import {
  getParticipantAuthSession,
  saveParticipantProfileSnapshot,
} from "../../../lib/auth-storage";

// Navigation khusus area peserta.
const participantNavItems = [
  { label: "Dashboard", href: "/pages/participant/dashboard", icon: <LayoutDashboard size={16} /> },
  { label: "Biodata", href: "/pages/participant/biodata", icon: <User size={16} /> },
  { label: "Upload Dokumen", href: "/pages/participant/dokumen", icon: <Upload size={16} /> },
  { label: "Status Seleksi", href: "/pages/participant/status", icon: <CheckCircle size={16} /> },
  { label: "Export PDF", href: "/pages/participant/export", icon: <Download size={16} /> },
];

/**
 * Normalisasi role dari sesi backend ke nilai role internal frontend.
 */
function normalizeSessionRole(rawRole?: string | null): "participant" | "admin" | "super_admin" | "judge" | null {
  const normalized = (rawRole ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (normalized === "participant" || normalized === "peserta") return "participant";
  if (normalized === "admin") return "admin";
  if (normalized === "super_admin" || normalized === "superadmin") return "super_admin";
  if (normalized === "judge" || normalized === "juri") return "judge";
  return null;
}

/**
 * Mapping status seleksi backend ke status stage frontend.
 */
function mapSelectionStatusToStage(
  selectionStatus?: string | null,
  accountStatus?: string | null
): StageStatus {
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

  return (accountStatus ?? "").toLowerCase() === "suspended" ? "Rejected" : "Pending";
}

const documentIssueTargetMap: Record<string, NonNullable<Participant["verificationIssues"]>[number]["target"]> = {
  identityCard: "identityCard",
  closeUpPhoto: "closeUpPhoto",
  fullBodyPhoto: "fullBodyPhoto",
  formS01: "formS01",
  formS02: "formS02",
  formS03: "formS03",
  formS04: "formS04",
};

/**
 * Menyusun daftar issue verifikasi dari status dokumen peserta.
 */
function buildVerificationIssuesFromDocuments(documents: NonNullable<Participant["documents"]>) {
  return documents
    .filter((doc) => doc.status === "revision_required")
    .map((doc) => {
      const target = documentIssueTargetMap[doc.key];
      if (!target) return null;
      return {
        id: `issue-${doc.key}`,
        target,
        status: "revision_required" as const,
        message: doc.note?.trim() || `Dokumen ${doc.label} perlu diperbaiki.`,
      };
    })
    .filter((item): item is NonNullable<Participant["verificationIssues"]>[number] => Boolean(item));
}

/**
 * Layout area peserta.
 * Menjaga autentikasi role peserta dan sinkronisasi profil/biodata ke context.
 */
export default function ParticipantPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setCurrentParticipant, setParticipantList, setAuthenticatedUser, user, authInitialized } = useApp();
  const router = useRouter();
  const syncLockRef = useRef(false);

  useEffect(() => {
    if (!authInitialized) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const sessionRole = normalizeSessionRole(getParticipantAuthSession()?.user?.role);
    const effectiveRole = sessionRole ?? user.role;

    if (effectiveRole === "participant") return;

    if (effectiveRole === "admin" || effectiveRole === "super_admin") {
      router.replace("/pages/admin/dashboard");
      return;
    }

    if (effectiveRole === "judge") {
      router.replace("/pages/judges/dashboard");
      return;
    }

    router.replace("/");
  }, [authInitialized, router, user]);

  useEffect(() => {
    if (!authInitialized || !user || user.role !== "participant") return;

    const token = getParticipantAuthSession()?.token;
    if (!token) return;

    let disposed = false;

    const syncProfile = async () => {
      if (syncLockRef.current) return;
      syncLockRef.current = true;
      try {
        const response = await fetchParticipantBiodata(token);
        if (disposed) return;

        const data = response.data;
        const email = (data.email ?? "").trim().toLowerCase();
        const resolvedPhoto = resolveApiAssetUrl(data.photo) ?? data.photo ?? "";
        const auditionNumber = data.audition_number ?? data.participant_number ?? "-";
        const participantCode = data.participant_code ?? undefined;
        const nextParticipant: Participant = {
          id: `P_API_${data.id}`,
          number: participantCode ?? auditionNumber,
          auditionNumber,
          participantCode,
          name: data.name ?? "Peserta",
          gender: data.gender ?? "Encik",
          nationalId: data.national_id ?? "",
          birthPlace: data.birth_place ?? "",
          birthDate: data.birth_date ?? "",
          heightCm: data.height_cm ?? 0,
          education: [data.education_category, data.education_institution, data.education_degree, data.education_major]
            .filter(Boolean)
            .join(" - "),
          instagram: data.instagram ?? "",
          phone: data.phone ?? "",
          email,
          photo: resolvedPhoto,
          status: mapSelectionStatusToStage(data.selection_status, data.account_status),
          registeredAt: new Date().toISOString().slice(0, 10),
          scores: [],
          documents:
            data.documents?.map((doc) => ({
              key: doc.key,
              label: doc.label,
              status:
                doc.status === "verified" || doc.status === "revision_required" || doc.status === "missing"
                  ? doc.status
                  : ("submitted" as const),
              note: doc.note ?? undefined,
              url: doc.url ?? undefined,
              mimeType: doc.mime_type ?? undefined,
              originalName: doc.original_name ?? undefined,
            })) ?? [],
          submittedToAdmin: data.submitted_to_admin ?? false,
          eliminatedInAudition: data.eliminated_in_audition ?? false,
          agreementNoAgency: data.agreement_no_agency ?? undefined,
          agencyName: data.agency_name ?? undefined,
          agreementParentPermission: data.agreement_parent_permission ?? undefined,
          agreementAllStages: data.agreement_all_stages ?? undefined,
          motivationStatement: data.motivation_statement ?? undefined,
          contributionIdea: data.contribution_idea ?? undefined,
          publicSpeakingExperience: data.public_speaking_experience ?? undefined,
        };
        nextParticipant.verificationIssues = buildVerificationIssuesFromDocuments(nextParticipant.documents ?? []);

        saveParticipantProfileSnapshot({
          id: String(data.id),
          email,
          name: nextParticipant.name,
          number: nextParticipant.number,
          gender: nextParticipant.gender,
          phone: nextParticipant.phone,
          photo: resolvedPhoto,
          updatedAt: new Date().toISOString(),
        });

        setAuthenticatedUser({
          id: String(data.id),
          name: nextParticipant.name,
          email,
          role: "participant",
        });

        setCurrentParticipant((prev) => ({
          ...(prev ?? nextParticipant),
          ...nextParticipant,
          // Status seleksi harus selalu mengikuti backend (source of truth admin/DB),
          // jangan dipertahankan dari cache lokal sebelumnya.
          status: nextParticipant.status,
          verificationStatus: prev?.verificationStatus,
          selectionStage: prev?.selectionStage,
          adminVerificationNote: prev?.adminVerificationNote,
          adminRevisionNote: prev?.adminRevisionNote,
          reviewItems: prev?.reviewItems ?? [],
          verificationIssues: nextParticipant.verificationIssues ?? [],
          rejectionReason:
            data.selection_status === "Rejected"
              ? (data.selection_status_note ?? prev?.rejectionReason)
              : undefined,
          likes: prev?.likes ?? 0,
        }));

        setParticipantList((prev) => {
          const idx = prev.findIndex(
            (item) =>
              item.id === nextParticipant.id ||
              item.email.trim().toLowerCase() === email
          );

          if (idx === -1) return [nextParticipant, ...prev];

          const next = [...prev];
          next[idx] = {
            ...next[idx],
            ...nextParticipant,
          };
          return next;
        });
      } catch {
        // silent: tetap pakai snapshot/local state jika backend lambat/down
      } finally {
        syncLockRef.current = false;
      }
    };

    const onFocus = () => void syncProfile();
    const intervalId = window.setInterval(() => void syncProfile(), 120000);
    window.addEventListener("focus", onFocus);

    void syncProfile();

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [authInitialized, setAuthenticatedUser, setCurrentParticipant, setParticipantList, user]);

  // Wrapper layout seluruh halaman /pages/participant/*
  if (!authInitialized) return null;
  if (!user || user.role !== "participant") return null;

  return (
    <DashboardLayout navItems={participantNavItems} role="participant">
      {children}
    </DashboardLayout>
  );
}
