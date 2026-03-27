"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Star } from "lucide-react";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { useApp } from "../../../context/AppContext";

const judgeNavItems = [
  { label: "Dashboard", href: "/pages/judges/dashboard", icon: <LayoutDashboard size={16} /> },
  { label: "Input Penilaian", href: "/pages/judges/scoring", icon: <Star size={16} /> },
];

export default function JudgePagesLayout({
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

    if (user.role !== "judge") {
      router.replace("/");
    }
  }, [router, user, authInitialized]);

  if (!authInitialized) return null;
  if (!user || user.role !== "judge") return null;

  return (
    <DashboardLayout navItems={judgeNavItems} role="judge">
      {children}
    </DashboardLayout>
  );
}
