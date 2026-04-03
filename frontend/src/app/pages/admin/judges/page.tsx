"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Edit } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { useApp } from "../../../../context/AppContext";
import { getReadableApiError, resolveApiAssetUrl } from "../../../../lib/api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import { fetchInternalUsers, updateInternalUser } from "../../../../lib/user-management-api";
import {
  getAdminScoreStageLabel,
  getJudgeAssignedStages,
  normalizeJudgeAssignment,
  stages,
  type Judge,
  type JudgeType,
  type JudgeAssignedStageKey,
} from "../../../../data/mockData";

type JudgeAccessFormState = {
  assignedStages: JudgeAssignedStageKey[];
  judgeType: "judge" | "committee" | "mentor" | "camp_team";
};

type StageFilter = "Semua" | JudgeAssignedStageKey;

const emptyForm: JudgeAccessFormState = {
  assignedStages: [],
  judgeType: "judge",
};

const defaultAssignedStages: JudgeAssignedStageKey[] = [
  "Audition",
  "Pre Camp",
  "Camp",
  "Grand Final",
];

function toJudgeId(internalId: number): string {
  return `J_API_${internalId}`;
}

function toInternalId(judgeId: string): number | null {
  const match = judgeId.match(/^J_API_(\d+)$/);
  if (!match) return null;
  return Number(match[1]) || null;
}

const judgeTypeOptions: Array<{
  value: "judge" | "committee" | "mentor" | "camp_team";
  label: string;
}> = [
  { value: "judge", label: "Juri Utama" },
  { value: "committee", label: "Panitia" },
  { value: "mentor", label: "Mentor" },
  { value: "camp_team", label: "Tim Karantina" },
];

function getJudgeTypeLabel(type?: JudgeType | null): string {
  if (type === "committee") return "Panitia";
  if (type === "mentor") return "Mentor";
  if (type === "camp_team") return "Tim Karantina";
  return "Juri Utama";
}

const stageLabelMap: Record<JudgeAssignedStageKey, string> = {
  Audition: "Audisi",
  "Pre Camp": "Pra Karantina",
  Camp: "Karantina",
  "Grand Final": "Grand Final",
};

function buildJudgeAccessSummary(judge: Judge): string {
  const assigned = getJudgeAssignedStages(judge);
  const mainStages = assigned.filter((stage) => stage !== "Camp");
  const parts: string[] = [];

  if (mainStages.length > 0) {
    const labels = mainStages.map((stage) => stageLabelMap[stage]);
    parts.push(`Juri Utama (${labels.join(" - ")})`);
  }

  if (assigned.includes("Camp")) {
    parts.push(`Karantina (${getJudgeTypeLabel(judge.judgeType)})`);
  }

  if (parts.length === 0) {
    return "Juri Utama";
  }

  return parts.join(" - ");
}

export default function AdminJudgesPage() {
  const { judgeList, setJudgeList } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<JudgeAccessFormState>(emptyForm);
  const [stageFilter, setStageFilter] = useState<StageFilter>("Semua");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const token = useMemo(() => getParticipantAuthSession()?.token ?? "", []);

  const loadJudges = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetchInternalUsers(token, "judge");
      const mapped: Judge[] = response.data.map((item) => {
        const assigned = (item.judge_assigned_stages?.length
          ? item.judge_assigned_stages
          : defaultAssignedStages) as JudgeAssignedStageKey[];
        const normalized = normalizeJudgeAssignment(assigned, "judge");

        return {
          id: toJudgeId(item.id),
          name: item.name,
          email: item.email,
          title: item.judge_title || "Dewan Juri",
          organization: item.judge_organization || "Duta Wisata Kota Batam",
          stages: normalized.assignedStages,
          assignedStages: normalized.assignedStages,
          avatar: resolveApiAssetUrl(item.judge_avatar) || "/default-avatar.svg",
          judgeType: (item.judge_type ?? "judge") as JudgeType,
        };
      });

      setJudgeList(mapped);
    } catch (err) {
      setError(getReadableApiError(err));
    } finally {
      setLoading(false);
    }
  }, [setJudgeList, token]);

  useEffect(() => {
    void loadJudges();
  }, [loadJudges]);

  const campMainJudges = useMemo(
    () =>
      judgeList.filter((judge) => {
        const assignedStages = getJudgeAssignedStages(judge);
        return assignedStages.includes("Camp");
      }),
    [judgeList]
  );
  const campRoleCounts = useMemo(
    () => ({
      judge: campMainJudges.filter((item) => (item.judgeType ?? "judge") === "judge").length,
      committee: campMainJudges.filter((item) => item.judgeType === "committee").length,
      mentor: campMainJudges.filter((item) => item.judgeType === "mentor").length,
      campTeam: campMainJudges.filter((item) => item.judgeType === "camp_team").length,
    }),
    [campMainJudges]
  );

  const filteredJudges = useMemo(
    () =>
      judgeList.filter((judge) => {
        if (stageFilter === "Semua") return true;
        return getJudgeAssignedStages(judge).includes(stageFilter);
      }),
    [judgeList, stageFilter],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  const toggleStage = (stage: JudgeAssignedStageKey) => {
    setForm((prev) => {
      const nextStages = prev.assignedStages.includes(stage)
        ? prev.assignedStages.filter((item) => item !== stage)
        : [...prev.assignedStages, stage];
      const normalized = normalizeJudgeAssignment(nextStages, "judge");
      const hasCampStage = normalized.assignedStages.includes("Camp");

      return {
        assignedStages: normalized.assignedStages,
        judgeType: hasCampStage ? prev.judgeType : "judge",
      };
    });
  };

  const saveJudgeAccess = () => {
    if (!editId || form.assignedStages.length === 0) return;
    const internalId = toInternalId(editId);
    if (!internalId || !token) return;

    const normalized = normalizeJudgeAssignment(form.assignedStages, "judge");
    const hasCampStage = normalized.assignedStages.includes("Camp");
    setSaving(true);
    setError("");
    setNotice("");

    void updateInternalUser(token, internalId, {
      judge_assigned_stages: normalized.assignedStages,
      judge_type: hasCampStage ? form.judgeType : "judge",
    })
      .then(async () => {
        setNotice("Hak akses tahap juri berhasil diperbarui ke database.");
        await loadJudges();
        resetForm();
      })
      .catch((err) => {
        setError(getReadableApiError(err));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const editJudgeAccess = (judge: Judge) => {
    setEditId(judge.id);
    setForm({
      assignedStages: normalizeJudgeAssignment(
        getJudgeAssignedStages(judge),
        (judge.judgeType ?? "judge") as JudgeType,
      ).assignedStages,
      judgeType: (judge.judgeType ?? "judge") as
        | "judge"
        | "committee"
        | "mentor"
        | "camp_team",
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
            Data Juri
          </h1>
          <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
            Halaman ini untuk mengatur tahapan penugasan juri, termasuk pra karantina yang hanya memakai catatan peserta.
          </p>
        </div>
      </div>

      {notice ? (
        <p className="text-xs mb-4" style={{ color: "#22c55e", fontFamily: "var(--font-poppins)" }}>
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs mb-4" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>
          {error}
        </p>
      ) : null}

      {showForm ? (
        <GoldCard glow className="mb-6">
          <h3 className="text-sm font-bold mb-3" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
            Edit Hak Akses Juri
          </h3>

          <div className="mb-4">
            <label className="block text-xs mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
              Tahap Penugasan
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {stages.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => toggleStage(stage)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: form.assignedStages.includes(stage) ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${form.assignedStages.includes(stage) ? "rgba(212,175,55,0.45)" : "rgba(255,255,255,0.08)"}`,
                    color: form.assignedStages.includes(stage) ? "#D4AF37" : "#888",
                    fontFamily: "var(--font-cinzel)",
                  }}
                >
                  {getAdminScoreStageLabel(stage)}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
              Pra karantina aktif untuk catatan peserta, sedangkan audisi, karantina, dan grand final tetap memakai penilaian resmi.
            </p>
          </div>

          {form.assignedStages.includes("Camp") ? (
            <div className="mb-4">
              <label className="block text-xs mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                Tipe Penilai Karantina
              </label>
              <div className="grid sm:grid-cols-2 gap-2">
                {judgeTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, judgeType: option.value }))
                    }
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-left"
                    style={{
                      background:
                        form.judgeType === option.value
                          ? "rgba(212,175,55,0.2)"
                          : "rgba(255,255,255,0.05)",
                      border: `1px solid ${
                        form.judgeType === option.value
                          ? "rgba(212,175,55,0.45)"
                          : "rgba(255,255,255,0.08)"
                      }`,
                      color: form.judgeType === option.value ? "#D4AF37" : "#888",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                Opsi ini hanya muncul saat tahap Karantina dipilih.
              </p>
            </div>
          ) : null}

          <div className="flex gap-3">
            <GoldButton variant="primary" size="sm" onClick={saveJudgeAccess} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </GoldButton>
            <GoldButton variant="outline" size="sm" onClick={resetForm} disabled={saving}>
              Batal
            </GoldButton>
          </div>
        </GoldCard>
      ) : null}

      <GoldCard className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-bold mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
              Ringkasan Penugasan Karantina
            </h3>
            <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
              Saat ini ada {campMainJudges.length} juri yang bertugas di tahap karantina.
            </p>
            <p className="text-xs mt-1" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
              Juri Utama: {campRoleCounts.judge} | Panitia: {campRoleCounts.committee} | Mentor: {campRoleCounts.mentor} | Tim Karantina: {campRoleCounts.campTeam}
            </p>
          </div>
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: campMainJudges.length === 4 ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
              color: campMainJudges.length === 4 ? "#22c55e" : "#f59e0b",
              border: `1px solid ${campMainJudges.length === 4 ? "rgba(34,197,94,0.22)" : "rgba(245,158,11,0.22)"}`,
              fontFamily: "var(--font-poppins)",
            }}
          >
            {campMainJudges.length === 4 ? "Jumlah juri karantina sudah ideal" : "Target ideal: 4 juri karantina"}
          </span>
        </div>
      </GoldCard>

      <GoldCard className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-bold mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
              Filter Tahap Juri
            </h3>
            <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
              Gunakan filter ini untuk melihat juri berdasarkan tahapan penugasan.
            </p>
          </div>

          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: "rgba(212,175,55,0.12)",
              color: "#D4AF37",
              border: "1px solid rgba(212,175,55,0.22)",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {filteredJudges.length} juri tampil
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {(["Semua", ...stages] as const).map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setStageFilter(stage)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background:
                  stageFilter === stage
                    ? "rgba(212,175,55,0.2)"
                    : "rgba(255,255,255,0.05)",
                border: `1px solid ${
                  stageFilter === stage
                    ? "rgba(212,175,55,0.45)"
                    : "rgba(255,255,255,0.08)"
                }`,
                color: stageFilter === stage ? "#D4AF37" : "#888",
                fontFamily: "var(--font-cinzel)",
              }}
            >
              {stage === "Semua" ? "Semua" : getAdminScoreStageLabel(stage)}
            </button> 
          ))}
        </div>
      </GoldCard>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading && filteredJudges.length === 0 ? (
          <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
            Belum ada data juri dari database.
          </p>
        ) : null}
        {filteredJudges.map((judge) => (
          <GoldCard key={judge.id}>
            <div className="flex items-start gap-4">
              <Image src={judge.avatar} alt={judge.name} width={56} height={56} unoptimized className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>{judge.name}</h4>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                      background: "rgba(212,175,55,0.14)",
                      color: "#D4AF37",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    {getJudgeAssignedStages(judge).includes("Camp")
                      ? getJudgeTypeLabel(judge.judgeType)
                      : "Juri Utama"}
                  </span>
                </div>
                <p className="text-xs mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>{judge.title}</p>
                <p className="text-xs mb-2" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>{judge.organization}</p>
                <p className="text-xs mb-2" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                  {buildJudgeAccessSummary(judge)}
                </p>
                <div className="flex flex-wrap gap-1">
                  {getJudgeAssignedStages(judge).map((stage) => (
                    <span key={stage} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.12)", color: "#D4AF37", fontFamily: "var(--font-poppins)", fontSize: "10px" }}>
                      {getAdminScoreStageLabel(stage)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: "1px solid rgba(212,175,55,0.1)" }}>
              <button
                onClick={() => editJudgeAccess(judge)}
                className="w-full flex items-center justify-center gap-1 py-2 rounded-xl text-xs"
                style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: "#D4AF37", fontFamily: "var(--font-poppins)", cursor: "pointer" }}
                type="button"
              >
                <Edit size={12} />
                Edit Hak Akses
              </button>
            </div>
          </GoldCard>
        ))}
      </div>
    </div>
  );
}
