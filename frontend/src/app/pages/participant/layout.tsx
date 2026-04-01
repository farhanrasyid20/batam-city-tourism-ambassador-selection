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

function mapSelectionStatusToStage(
  selectionStatus?: string | null,
  accountStatus?: string | null
): StageStatus {
  const allowed: StageStatus[] = [
    "Pending",
    "Verified",
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

export default function ParticipantPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setCurrentParticipant, setParticipantList, setAuthenticatedUser, user } = useApp();
  const syncLockRef = useRef(false);

  useEffect(() => {
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
        const nextParticipant: Participant = {
          id: `P_API_${data.id}`,
          number: data.participant_number ?? "-",
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
          photo: data.photo ?? "",
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
          agreementNoAgency: data.agreement_no_agency ?? undefined,
          agencyName: data.agency_name ?? undefined,
          agreementParentPermission: data.agreement_parent_permission ?? undefined,
          agreementAllStages: data.agreement_all_stages ?? undefined,
          motivationStatement: data.motivation_statement ?? undefined,
          contributionIdea: data.contribution_idea ?? undefined,
          publicSpeakingExperience: data.public_speaking_experience ?? undefined,
        };

        saveParticipantProfileSnapshot({
          id: String(data.id),
          email,
          name: nextParticipant.name,
          number: nextParticipant.number,
          gender: nextParticipant.gender,
          phone: nextParticipant.phone,
          photo: nextParticipant.photo,
          updatedAt: new Date().toISOString(),
        });

        setAuthenticatedUser({
          id: String(data.id),
          name: nextParticipant.name,
          email,
          role: user?.role === "participant" ? "participant" : "participant",
        });

        setCurrentParticipant((prev) => ({
          ...(prev ?? nextParticipant),
          ...nextParticipant,
          status: prev?.status ?? nextParticipant.status,
          verificationStatus: prev?.verificationStatus,
          selectionStage: prev?.selectionStage,
          adminVerificationNote: prev?.adminVerificationNote,
          adminRevisionNote: prev?.adminRevisionNote,
          reviewItems: prev?.reviewItems ?? [],
          verificationIssues: prev?.verificationIssues ?? [],
          rejectionReason: prev?.rejectionReason,
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
    const intervalId = window.setInterval(() => void syncProfile(), 15000);
    window.addEventListener("focus", onFocus);

    void syncProfile();

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [setAuthenticatedUser, setCurrentParticipant, setParticipantList, user?.role]);

  // Wrapper layout seluruh halaman /pages/participant/*
  return (
    <DashboardLayout navItems={participantNavItems} role="participant">
      {children}
    </DashboardLayout>
  );
}
