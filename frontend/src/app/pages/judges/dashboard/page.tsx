"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Star, Users } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { useApp } from "../../../../context/AppContext";
import { resolveAvatarUrl } from "../../../../lib/api";
import {
  getAdminScoreStageLabel,
  getJudgeAssignedStages,
  isParticipantEligibleForScoreStage,
} from "../../../../data/mockData";

/**
 * Dashboard utama juri.
 * Menampilkan ringkasan profil juri, jumlah peserta relevan, dan akses cepat ke penilaian.
 */
export default function JudgeDashboardPage() {
  const { user, participantList, judgeList } = useApp();
  const router = useRouter();
  const [failedAvatarSrc, setFailedAvatarSrc] = React.useState<string | null>(null);
  const judgeInfo = judgeList.find((judge) => judge.id === user?.judgeId) ?? judgeList[0];
  const judgeAvatar = resolveAvatarUrl(judgeInfo?.avatar);
  const judgeAvatarSrc =
    judgeAvatar && failedAvatarSrc !== judgeAvatar ? judgeAvatar : "/default-avatar.svg";
  const assignedStages = getJudgeAssignedStages(judgeInfo);

  const totalParticipants = participantList.filter((participant) =>
    assignedStages.some((stage) =>
      stage === "Pre Camp"
        ? ["Pre Camp", "Camp", "Grand Final", "Final Result"].includes(
            participant.selectionStage ?? "Verification",
          )
        : isParticipantEligibleForScoreStage(participant, stage)
    )
  ).length;

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
          Dashboard Juri
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Selamat datang, <strong style={{ color: "#F5D06F" }}>{user?.name ?? judgeInfo?.name}</strong>
        </p>
      </div>

      <GoldCard glow className="mb-6">
        <div className="flex items-center gap-5 flex-wrap">
          <Image src={judgeAvatarSrc} alt={judgeInfo?.name ?? "Juri"} width={64} height={64} onError={() => setFailedAvatarSrc(judgeAvatarSrc)} unoptimized className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" style={{ border: "2px solid rgba(212,175,55,0.4)" }} />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>Dewan Juri</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.12)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.25)", fontFamily: "var(--font-poppins)" }}>
                Juri
              </span>
            </div>
            <h2 className="text-base font-bold mb-1" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>{judgeInfo?.name}</h2>
            <p className="text-xs mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
              {judgeInfo?.title} - {judgeInfo?.organization}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>Ditugaskan pada:</span>
              {assignedStages.map((stage) => (
                <span key={stage} className="text-xs px-3 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37", fontFamily: "var(--font-cinzel)", border: "1px solid rgba(212,175,55,0.3)" }}>
                  {getAdminScoreStageLabel(stage)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </GoldCard>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <GoldCard className="text-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>
            <Users size={18} />
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>{totalParticipants}</p>
          <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>Peserta Relevan</p>
        </GoldCard>

        <GoldCard className="text-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
            <Star size={18} />
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>{assignedStages.length}</p>
          <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>Tahap Ditugaskan</p>
        </GoldCard>
      </div>

      <GoldCard className="mb-6">
        <h3 className="text-sm font-bold mb-4" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
          Ketentuan Penilaian
        </h3>
        <ul className="space-y-2">
          {[
            "Nilai yang telah di-submit tidak dapat diubah kembali.",
            "Pra karantina dipakai untuk menulis catatan peserta tanpa nilai angka.",
            "Audisi, karantina, dan grand final menggunakan penilaian resmi juri.",
            "Nilai akhir dihitung dari karantina 30% dan grand final 70%.",
          ].map((note) => (
            <li key={note} className="flex items-start gap-2 text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              <Star size={10} fill="#D4AF37" style={{ color: "#D4AF37", marginTop: 3, flexShrink: 0 }} />
              {note}
            </li>
          ))}
        </ul>
      </GoldCard>

      <GoldCard>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base font-bold mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
              Mulai Penilaian
            </h3>
            <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
              Masuk ke halaman input nilai resmi dan catatan sesuai tahap penugasan.
            </p>
          </div>
          <GoldButton variant="primary" onClick={() => router.push("/pages/judges/scoring")}>
            <Star size={16} fill="#0F0F0F" />
            Input Nilai
            <ArrowRight size={16} />
          </GoldButton>
        </div>
      </GoldCard>
    </div>
  );
}
