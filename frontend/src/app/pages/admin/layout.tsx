"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Award,
  Newspaper,
  Download,
  Settings,
  Vote,
  Trophy,
  Heart,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { useApp } from "../../../context/AppContext";
import { fetchJudgeParticipants } from "../../../lib/auth-api";
import { resolveApiAssetUrl } from "../../../lib/api";
import { getParticipantAuthSession } from "../../../lib/auth-storage";
import type { Participant } from "../../../data/mockData";

function normalizeParticipantCode(
  participantCode?: string | null,
  auditionNumber?: string | null,
  participantNumber?: string | null,
  gender?: "Encik" | "Puan" | null,
  fallbackId?: number
): string {
  const explicitCode = (participantCode ?? "").trim();
  if (explicitCode) return explicitCode;

  const sourceNumber = (auditionNumber ?? participantNumber ?? String(fallbackId ?? "")).trim();
  const lastDigits = sourceNumber.match(/(\d{1,4})$/)?.[1];
  if (!lastDigits) return "-";

  const padded = lastDigits.padStart(3, "0");
  if (gender === "Encik") return `ECK-${padded}`;
  if (gender === "Puan") return `PUA-${padded}`;
  return `PES-${padded}`;
}

const adminNavItems = [
  { label: "Dashboard", href: "/pages/admin/dashboard", icon: <LayoutDashboard size={16} /> },
  {
    label: "Manajemen Peserta",
    icon: <Users size={16} />,
    children: [
      { label: "Data Peserta", href: "/pages/admin/participants", icon: <Users size={14} /> },
      { label: "Verifikasi Berkas", href: "/pages/admin/verification", icon: <ShieldCheck size={14} /> },
      { label: "Tahapan & Nilai", href: "/pages/admin/scoring", icon: <Award size={14} /> },
      { label: "Pusat Dokumen Peserta", href: "/pages/admin/participant-resources", icon: <BookOpen size={14} /> },
    ],
  },
  {
    label: "Vote",
    icon: <Vote size={16} />,
    children: [
      { label: "Vote Terbanyak", href: "/pages/admin/vote/terbanyak", icon: <Heart size={14} /> },
      { label: "Juara Versi Juri", href: "/pages/admin/vote/juri", icon: <Trophy size={14} /> },
    ],
  },
  {
    label: "Manajemen Konten",
    icon: <Newspaper size={16} />,
    children: [
      { label: "Kelola Berita", href: "/pages/admin/news", icon: <Newspaper size={14} /> },
      { label: "Landing Page", href: "/pages/admin/landing-page", icon: <BookOpen size={14} /> },
      { label: "FAQ", href: "/pages/admin/faq", icon: <Newspaper size={14} /> },
      { label: "Feedback", href: "/pages/admin/feedback", icon: <MessageSquare size={14} /> },
    ],
  },
  { label: "Data Juri", href: "/pages/admin/judges", icon: <Settings size={16} /> },
  { label: "Export Excel", href: "/pages/admin/export", icon: <Download size={16} /> },
];

export default function AdminPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, authInitialized, setParticipantList } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authInitialized) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (user.role !== "admin" && user.role !== "super_admin") {
      router.replace("/");
    }
  }, [router, user, authInitialized]);

  useEffect(() => {
    if (!authInitialized || !user || (user.role !== "admin" && user.role !== "super_admin")) return;

    const token = getParticipantAuthSession()?.token;
    if (!token) return;

    let cancelled = false;

    const syncParticipants = async () => {
      try {
        const response = await fetchJudgeParticipants(token, { force: true, maxAgeMs: 0 });
        if (cancelled) return;

        const mappedParticipants: Participant[] = response.data.map((item) => {
          const education = [
            item.education_category?.trim(),
            item.education_institution?.trim(),
            item.education_degree?.trim(),
            item.education_major?.trim(),
          ]
            .filter(Boolean)
            .join(" - ");

          const status = (item.selection_status ?? "Pending") as Participant["status"];
          const generatedCode = normalizeParticipantCode(
            item.participant_code,
            item.audition_number,
            item.participant_number,
            item.gender,
            item.id
          );
          const number = generatedCode;

          return {
            id: `P_API_${item.id}`,
            number,
            auditionNumber: item.audition_number ?? item.participant_number ?? number,
            participantCode: generatedCode !== "-" ? generatedCode : undefined,
            name: item.name ?? "Peserta",
            fullName: item.name ?? "Peserta",
            nickname: item.nickname?.trim() || undefined,
            gender: item.gender ?? "Encik",
            nationalId: item.national_id?.trim() ?? "",
            birthPlace: item.birth_place?.trim() ?? "",
            birthDate: item.birth_date?.trim() ?? "",
            domicileAddress: item.domicile_address?.trim() ?? undefined,
            ktpAddress: item.ktp_address?.trim() ?? undefined,
            heightCm: item.height_cm ?? 0,
            weightKg: item.weight_kg != null ? String(item.weight_kg) : undefined,
            shirtSize: item.shirt_size ?? undefined,
            chestCircumferenceCm: item.chest_circumference_cm != null ? String(item.chest_circumference_cm) : undefined,
            waistCircumferenceCm: item.waist_circumference_cm != null ? String(item.waist_circumference_cm) : undefined,
            hipCircumferenceCm: item.hip_circumference_cm != null ? String(item.hip_circumference_cm) : undefined,
            pantsSize: item.pants_size ?? undefined,
            shoeSize: item.shoe_size ?? undefined,
            education,
            instagram: item.instagram ?? "",
            tiktok: item.tiktok ?? undefined,
            parentPhone: item.parent_phone ?? undefined,
            phone: item.phone ?? "",
            email: (item.email ?? "").trim().toLowerCase(),
            occupation: item.occupation ?? undefined,
            skills: item.skills ?? undefined,
            hobbies: item.hobbies ?? undefined,
            languages: item.languages ?? undefined,
            vision: item.vision ?? undefined,
            mission: item.mission ?? undefined,
            experience: item.experience ?? undefined,
            achievement: item.achievement ?? undefined,
            photo: resolveApiAssetUrl(item.photo) ?? "/default-avatar.svg",
            status,
            selectionStage: item.selection_stage ?? undefined,
            registeredAt: item.registered_at ?? new Date().toISOString().slice(0, 10),
            documents:
              item.documents?.map((doc) => ({
                key: doc.key,
                label: doc.label,
                status: doc.status,
                note: doc.note ?? undefined,
                url: doc.url ?? undefined,
                mimeType: doc.mime_type ?? undefined,
                originalName: doc.original_name ?? undefined,
              })) ?? [],
            submittedToAdmin: item.submitted_to_admin ?? false,
            scores: [],
          };
        });

        setParticipantList(mappedParticipants);
      } catch {
        // fallback to local data
      }
    };

    void syncParticipants();

    return () => {
      cancelled = true;
    };
  }, [authInitialized, user, setParticipantList]);

  if (!authInitialized) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(212,175,55,0.18), transparent 45%), #0B0B0B",
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-5 relative w-20 h-20 rounded-2xl p-3"
            style={{
              background: "rgba(212,175,55,0.12)",
              border: "1px solid rgba(212,175,55,0.25)",
            }}
          >
            <Image src="/logo.png" alt="Duta Wisata Batam" fill className="object-contain p-2" priority />
          </div>
          <p
            className="text-sm font-semibold"
            style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}
          >
            Memuat Panel Admin...
          </p>
          <p
            className="text-xs mt-2"
            style={{ color: "#A3A3A3", fontFamily: "var(--font-poppins)" }}
          >
            Menghubungkan data peserta dan sistem penilaian.
          </p>
        </div>
      </div>
    );
  }
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return null;

  const navItems = [
    ...adminNavItems,
    { label: "Manajemen User", href: "/pages/admin/users", icon: <Users size={16} /> },
  ];

  return (
    <DashboardLayout navItems={navItems} role={user.role === "super_admin" ? "super_admin" : "admin"}>
      {children}
    </DashboardLayout>
  );
}
