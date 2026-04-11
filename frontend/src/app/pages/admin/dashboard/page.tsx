"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  Award,
  Clock,
  TrendingUp,
  Crown,
  Star,
  ArrowRight,
} from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { useApp } from "../../../../context/AppContext";
import {
  getParticipantSelectionStage,
  getParticipantVerificationStatus,
  schedule,
  selectionStageLabels,
} from "../../../../data/mockData";

export default function AdminDashboardPage() {
  const { participantList, newsList } = useApp();
  const router = useRouter();

  const totalParticipants = participantList.length;
  const pendingCount = participantList.filter(
    (participant) => getParticipantVerificationStatus(participant) === "Pending"
  ).length;
  const needsRevisionCount = participantList.filter(
    (participant) => getParticipantVerificationStatus(participant) === "NeedsRevision"
  ).length;
  const grandFinalCount = participantList.filter(
    (participant) => getParticipantSelectionStage(participant) === "Grand Final"
  ).length;
  const verifiedCount = participantList.filter(
    (participant) => getParticipantVerificationStatus(participant) === "Verified"
  ).length;
  const campCount = participantList.filter(
    (participant) => getParticipantSelectionStage(participant) === "Camp"
  ).length;
  const encikCount = participantList.filter((participant) => participant.gender === "Encik").length;
  const puanCount = participantList.filter((participant) => participant.gender === "Puan").length;

  const stats = [
    {
      label: "Total Peserta",
      value: totalParticipants,
      icon: <Users size={20} />,
      color: "#D4AF37",
      sub: `${encikCount} Encik â€¢ ${puanCount} Puan`,
    },
    {
      label: "Menunggu Verifikasi",
      value: pendingCount,
      icon: <Clock size={20} />,
      color: "#F59E0B",
      sub: "Perlu ditindaklanjuti",
    },
    {
      label: "Perlu Perbaikan",
      value: needsRevisionCount,
      icon: <ShieldCheck size={20} />,
      color: "#EF4444",
      sub: "Ada revisi dari admin",
    },
    {
      label: "Finalis Grand Final",
      value: grandFinalCount,
      icon: <Crown size={20} />,
      color: "#10B981",
      sub: "Lolos hingga Grand Final",
    },
    {
      label: "Total Berita",
      value: newsList.length,
      icon: <Star size={20} />,
      color: "#3B82F6",
      sub: "Berita aktif",
    },
  ];

  const quickActions = [
    {
      label: "Verifikasi Berkas",
      desc: `${pendingCount + needsRevisionCount} perlu ditindaklanjuti`,
      icon: <ShieldCheck size={18} />,
      href: "/pages/admin/verification",
      color: "#F59E0B",
    },
    {
      label: "Data Peserta",
      desc: `${totalParticipants} terdaftar`,
      icon: <Users size={18} />,
      href: "/pages/admin/participants",
      color: "#D4AF37",
    },
    {
      label: "Input Nilai",
      desc: "Audisi, karantina, grand final",
      icon: <Award size={18} />,
      href: "/pages/admin/scoring",
      color: "#10B981",
    },
    {
      label: "Export Excel",
      desc: "Download rekap resmi",
      icon: <TrendingUp size={18} />,
      href: "/pages/admin/export",
      color: "#3B82F6",
    },
  ];

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
          Dashboard Admin
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Selamat datang di panel administrasi Pemilihan Duta Wisata Kota Batam 2026
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <GoldCard key={stat.label} className="text-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: `${stat.color}20`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <p
              className="text-2xl font-bold mb-1"
              style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}
            >
              {stat.value}
            </p>
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}
            >
              {stat.label}
            </p>
            <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
              {stat.sub}
            </p>
          </GoldCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <GoldCard glow>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
            Distribusi Status Peserta
          </h3>
          <div className="space-y-3">
            {[
              { label: "Menunggu Verifikasi", count: pendingCount, color: "#6B7280", total: totalParticipants },
              { label: "Perlu Perbaikan", count: needsRevisionCount, color: "#EF4444", total: totalParticipants },
              { label: "Terverifikasi", count: verifiedCount, color: "#3B82F6", total: totalParticipants },
              { label: selectionStageLabels.Camp, count: campCount, color: "#10B981", total: totalParticipants },
              { label: selectionStageLabels["Grand Final"], count: grandFinalCount, color: "#D4AF37", total: totalParticipants },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5" style={{ fontFamily: "var(--font-poppins)" }}>
                  <span style={{ color: "#BDBDBD" }}>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 600 }}>{item.count}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "#2A2A2A" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GoldCard>

        <GoldCard>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
            Jadwal Pelaksanaan 2026
          </h3>
          <div className="space-y-2">
            {schedule.map((item, index) => (
              <div
                key={`${item.activity}-${index}`}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{
                  background: item.status === "active" ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${item.status === "active" ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{
                      color: item.status === "active" ? "#D4AF37" : "#BDBDBD",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    {item.activity}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                    {item.date}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: item.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
                    color: item.status === "active" ? "#22c55e" : "#555",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {item.status === "active" ? "Aktif" : item.status === "done" ? "Selesai" : "Upcoming"}
                </span>
              </div>
            ))}
          </div>
        </GoldCard>
      </div>

      <GoldCard>
        <h3 className="text-sm font-bold mb-5" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
          Aksi Cepat
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.href}
              onClick={() => router.push(action.href)}
              className="flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200"
              style={{
                background: `${action.color}10`,
                border: `1px solid ${action.color}30`,
                cursor: "pointer",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = `${action.color}20`;
                event.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = `${action.color}10`;
                event.currentTarget.style.transform = "translateY(0)";
              }}
              type="button"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${action.color}20`, color: action.color }}
              >
                {action.icon}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                  {action.label}
                </p>
                <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                  {action.desc}
                </p>
              </div>
              <ArrowRight size={14} style={{ color: action.color, marginLeft: "auto" }} />
            </button>
          ))}
        </div>
      </GoldCard>
    </div>
  );
}


