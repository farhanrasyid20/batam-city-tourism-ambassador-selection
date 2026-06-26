"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


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
  CalendarRange,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { useApp } from "../../../context/AppContext";

const adminNavItems = [
  { label: "Dashboard", href: "/pages/admin/dashboard", icon: <LayoutDashboard size={16} /> },
  { label: "Edisi Lomba", href: "/pages/admin/editions", icon: <CalendarRange size={16} /> },
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
      { label: "Branding & Identitas", href: "/pages/admin/branding", icon: <ShieldCheck size={14} /> },
      { label: "Landing Page", href: "/pages/admin/landing-page", icon: <BookOpen size={14} /> },
      { label: "Berita", href: "/pages/admin/news", icon: <Newspaper size={14} /> },
      { label: "Partner/Sponsor", href: "/pages/admin/partners", icon: <Users size={14} /> },
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
  const { user, authInitialized } = useApp();
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

