"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2 } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { useApp } from "../../../../context/AppContext";
import {
  getAdminScoreStageLabel,
  getJudgeAssignedStages,
  normalizeJudgeAssignment,
  stages,
  type Judge,
  type JudgeType,
  type ScoreStageKey,
} from "../../../../data/mockData";

type JudgeFormState = {
  name: string;
  title: string;
  organization: string;
  email: string;
  assignedStages: ScoreStageKey[];
  judgeType: JudgeType;
};

const emptyForm: JudgeFormState = {
  name: "",
  title: "",
  organization: "",
  email: "",
  assignedStages: [],
  judgeType: "main",
};

export default function AdminJudgesPage() {
  const { judgeList, setJudgeList } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<JudgeFormState>(emptyForm);
  const campMainJudges = judgeList.filter((judge) => {
    const assignedStages = getJudgeAssignedStages(judge);
    return (judge.judgeType ?? "main") === "main" && assignedStages.includes("Camp");
  });
  const mentorModeAvailable = form.assignedStages.length === 1 && form.assignedStages[0] === "Camp";

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  const toggleStage = (stage: ScoreStageKey) => {
    setForm((prev) => {
      const nextStages = prev.assignedStages.includes(stage)
        ? prev.assignedStages.filter((item) => item !== stage)
        : [...prev.assignedStages, stage];
      const normalized = normalizeJudgeAssignment(nextStages, prev.judgeType);

      return {
        ...prev,
        assignedStages: normalized.assignedStages,
        judgeType: normalized.judgeType,
      };
    });
  };

  const saveJudge = () => {
    if (!form.name.trim() || !form.title.trim() || form.assignedStages.length === 0) return;
    const normalizedAssignment = normalizeJudgeAssignment(form.assignedStages, form.judgeType);

    const payload = {
      name: form.name.trim(),
      title: form.title.trim(),
      organization: form.organization.trim(),
      email: form.email.trim() || undefined,
      stages: normalizedAssignment.assignedStages,
      assignedStages: normalizedAssignment.assignedStages,
      judgeType: normalizedAssignment.judgeType,
    };

    if (editId) {
      setJudgeList((prev) => prev.map((judge) => (judge.id === editId ? { ...judge, ...payload } : judge)));
    } else {
      setJudgeList((prev) => [
        ...prev,
        {
          id: `J${Date.now()}`,
          ...payload,
          avatar: "https://images.unsplash.com/photo-1648448942225-7aa06c7e8f79?w=100&q=80",
        },
      ]);
    }

    resetForm();
  };

  const editJudge = (judge: Judge) => {
    setEditId(judge.id);
    setForm({
      name: judge.name,
      title: judge.title,
      organization: judge.organization,
      email: judge.email ?? "",
      ...normalizeJudgeAssignment(getJudgeAssignedStages(judge), judge.judgeType ?? "main"),
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
            Role juri dijaga tetap lurus: mentor hanya untuk karantina, audisi dan grand final tetap juri utama.
          </p>
        </div>
        <GoldButton variant="primary" size="sm" onClick={() => setShowForm((prev) => !prev)}>
          <Plus size={14} />
          Tambah Juri
        </GoldButton>
      </div>

      {showForm ? (
        <GoldCard glow className="mb-6">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {[
              ["name", "Nama Lengkap"],
              ["title", "Jabatan/Gelar"],
              ["organization", "Institusi/Organisasi"],
              ["email", "Email"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs mb-1.5" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                  {label}
                </label>
                <input
                  type="text"
                  value={form[key as keyof JudgeFormState] as string}
                  onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "#111", border: "1px solid rgba(212,175,55,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                />
              </div>
            ))}
          </div>

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
            <div className="grid sm:grid-cols-3 gap-2 mb-3 text-xs" style={{ fontFamily: "var(--font-poppins)" }}>
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#BDBDBD" }}>
                Audisi: hanya Juri Utama
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#BDBDBD" }}>
                Karantina: Juri Utama + Mentor
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#BDBDBD" }}>
                Grand Final: hanya Juri Utama
              </div>
            </div>
            <select
              value={form.judgeType}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  ...normalizeJudgeAssignment(prev.assignedStages, event.target.value as JudgeType),
                }))
              }
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "#111", border: "1px solid rgba(212,175,55,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
            >
              <option value="main">Juri Utama</option>
              {mentorModeAvailable ? <option value="mentor">Juri Mentor</option> : null}
            </select>
            <p className="text-xs mt-2" style={{ color: mentorModeAvailable ? "#888" : "#B45309", fontFamily: "var(--font-poppins)" }}>
              {mentorModeAvailable
                ? "Mode mentor tersedia karena penugasan hanya pada tahap karantina."
                : "Juri mentor hanya boleh ditugaskan pada satu tahap, yaitu karantina."}
            </p>
          </div>

          <div className="flex gap-3">
            <GoldButton variant="primary" size="sm" onClick={saveJudge}>Simpan</GoldButton>
            <GoldButton variant="outline" size="sm" onClick={resetForm}>Batal</GoldButton>
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
              Saat ini ada {campMainJudges.length} juri utama yang bertugas di tahap karantina.
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
            {campMainJudges.length === 4 ? "Jumlah juri utama karantina sudah ideal" : "Target ideal: 4 juri utama karantina"}
          </span>
        </div>
      </GoldCard>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {judgeList.map((judge) => (
          <GoldCard key={judge.id}>
            <div className="flex items-start gap-4">
              <Image src={judge.avatar} alt={judge.name} width={56} height={56} unoptimized className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>{judge.name}</h4>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: judge.judgeType === "mentor" ? "rgba(59,130,246,0.14)" : "rgba(212,175,55,0.14)",
                      color: judge.judgeType === "mentor" ? "#60a5fa" : "#D4AF37",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    {judge.judgeType === "mentor" ? "Juri Mentor" : "Juri Utama"}
                  </span>
                </div>
                <p className="text-xs mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>{judge.title}</p>
                <p className="text-xs mb-2" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>{judge.organization}</p>
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
                onClick={() => editJudge(judge)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs"
                style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: "#D4AF37", fontFamily: "var(--font-poppins)", cursor: "pointer" }}
                type="button"
              >
                <Edit size={12} />
                Edit
              </button>
              <button
                onClick={() => setJudgeList((prev) => prev.filter((item) => item.id !== judge.id))}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontFamily: "var(--font-poppins)", cursor: "pointer" }}
                type="button"
              >
                <Trash2 size={12} />
                Hapus
              </button>
            </div>
          </GoldCard>
        ))}
      </div>
    </div>
  );
}
