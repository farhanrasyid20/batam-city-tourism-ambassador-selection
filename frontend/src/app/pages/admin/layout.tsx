"use client";

import React, { useEffect } from "react";
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

const adminNavItems = [
  { label: "Dashboard", href: "/pages/admin/dashboard", icon: <LayoutDashboard size={16} /> },
  {
    label: "Manajemen Peserta",
    icon: <Users size={16} />,
    children: [
      { label: "Data Peserta", href: "/pages/admin/participants", icon: <Users size={14} /> },
      { label: "Verifikasi Berkas", href: "/pages/admin/verification", icon: <ShieldCheck size={14} /> },
      { label: "Tahapan & Nilai", href: "/pages/admin/scoring", icon: <Award size={14} /> },
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
      { label: "Pusat Dokumen Peserta", href: "/pages/admin/participant-resources", icon: <BookOpen size={14} /> },
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

  if (!authInitialized) return null;
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
