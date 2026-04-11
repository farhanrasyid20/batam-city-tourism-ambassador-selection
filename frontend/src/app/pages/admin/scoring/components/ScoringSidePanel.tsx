"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import GoldCard from "../../../../../components/dashboard/GoldCard";
import {
  getAdminScoreStageLabel,
  type CriteriaItem,
  type AdminScoreStage,
  type Judge,
  type Participant,
  type ParticipantNoteAuthorRole,
  type ParticipantNoteStageKey,
  type ParticipantStageNote,
} from "../../../../../data/mockData";

type NoteDraft = {
  stage: ParticipantNoteStageKey;
  authorRole: ParticipantNoteAuthorRole;
  content: string;
};

type ScoringSidePanelProps = {
  activeStage: AdminScoreStage;
  selectedParticipant: Participant | null;
  judgesForStage: Judge[];
  activeScoreCriteria: CriteriaItem[];
  selectedJudgeId: string;
  selectedJudgeName: string;
  isScoreLocked: boolean;
  scoreLockedAt?: string;
  scoreInputs: Record<string, number>;
  scoreTotal: number;
  isScoreComplete: boolean;
  isScoreSaving: boolean;
  availableNoteStages: ParticipantNoteStageKey[];
  resolvedNoteStage: ParticipantNoteStageKey;
  noteDraft: NoteDraft;
  resolvedNoteAuthorName: string;
  visibleNotes: ParticipantStageNote[];
  formatDateTime: (value: string) => string;
  onCloseParticipant: () => void;
  onSelectJudge: (judgeId: string) => void;
  onScoreInputChange: (criterionKey: string, rawValue: string) => void;
  onSaveScore: () => void;
  onSaveNote: () => void;
  onNoteDraftChange: (updater: (draft: NoteDraft) => NoteDraft) => void;
};

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const getDisplayParticipantName = (participant: Participant) => {
  const cleanedNickname = (participant.nickname ?? "")
    .trim()
    .replace(/^(encik|puan)\s+/i, "");
  const cleanedName = participant.name
    .trim()
    .replace(/^(encik|puan)\s+/i, "");
  const baseRaw = cleanedNickname || cleanedName.split(/\s+/)[0] || "Peserta";
  const baseName = toTitleCase(baseRaw);
  return `${participant.gender} ${baseName}`.trim();
};

export default function ScoringSidePanel({
  activeStage,
  selectedParticipant,
  judgesForStage,
  activeScoreCriteria,
  selectedJudgeId,
  selectedJudgeName,
  isScoreLocked,
  scoreLockedAt,
  scoreInputs,
  scoreTotal,
  isScoreComplete,
  isScoreSaving,
  availableNoteStages,
  resolvedNoteStage,
  noteDraft,
  resolvedNoteAuthorName,
  visibleNotes,
  formatDateTime,
  onCloseParticipant,
  onSelectJudge,
  onScoreInputChange,
  onSaveScore,
  onSaveNote,
  onNoteDraftChange,
}: ScoringSidePanelProps) {
  const handleScoreInputWheel = (
    event: React.WheelEvent<HTMLInputElement>,
  ) => {
    // Agar gesture dua jari tetap memindahkan scroll panel, bukan mengunci di input angka.
    event.currentTarget.blur();
  };

  return (
    <GoldCard className="h-fit">
      {selectedParticipant ? (
        <div>
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <Image
                src={selectedParticipant.photo}
                alt={selectedParticipant.name}
                width={44}
                height={44}
                unoptimized
                className="w-11 h-11 rounded-2xl object-cover flex-shrink-0"
              />

              <div>
                <p
                  className="text-xs"
                  style={{
                    color: "#D4AF37",
                    fontFamily: "var(--font-cinzel)",
                  }}
                >
                  Catatan Peserta
                </p>
                <p
                  className="text-sm font-semibold truncate"
                  style={{
                    color: "#F5E6C8",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {getDisplayParticipantName(selectedParticipant)}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: "#888",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {selectedParticipant.number} - {selectedParticipant.gender}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCloseParticipant}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.05)", color: "#888" }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-3 mb-5">
            {activeScoreCriteria.length > 0 ? (
              <div
                className="p-3 rounded-2xl space-y-3"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(212,175,55,0.22)",
                }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: "#D4AF37",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  Input Nilai Resmi (Admin sebagai Juri)
                </p>

                <select
                  value={selectedJudgeId}
                  onChange={(event) => onSelectJudge(event.target.value)}
                  className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: "#111",
                    border: "1px solid rgba(212,175,55,0.25)",
                    color: "#F5E6C8",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  <option value="">Pilih akun juri</option>
                  {judgesForStage.map((judge) => (
                    <option key={judge.id} value={judge.id}>
                      {judge.name} - {judge.title}
                    </option>
                  ))}
                </select>

                <div
                  className="space-y-2 max-h-64 overflow-y-auto pr-1 dashboard-main-scroll"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {activeScoreCriteria.map((criterion) => (
                    <label
                      key={criterion.key}
                      className="block text-xs"
                      style={{
                        color: "#BDBDBD",
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      <span className="block mb-1">{criterion.label}</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={isScoreLocked || isScoreSaving}
                        onWheel={handleScoreInputWheel}
                        value={
                          Number.isFinite(Number(scoreInputs[criterion.key]))
                            ? String(scoreInputs[criterion.key] ?? 0)
                            : ""
                        }
                        onChange={(event) =>
                          onScoreInputChange(criterion.key, event.target.value)
                        }
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{
                          background: "#111",
                          border: "1px solid rgba(255,255,255,0.14)",
                          color: "#F5E6C8",
                          fontFamily: "var(--font-poppins)",
                          opacity: isScoreLocked ? 0.6 : 1,
                        }}
                      />
                    </label>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p
                    className="text-xs"
                    style={{
                      color: "#888",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    {selectedJudgeName
                      ? `Akun aktif: ${selectedJudgeName}`
                      : "Pilih akun juri untuk menyimpan nilai."}
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: "#F5E6C8",
                      fontFamily: "var(--font-cinzel)",
                    }}
                  >
                    Total: {scoreTotal.toFixed(2)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onSaveScore}
                  disabled={!selectedJudgeId || !isScoreComplete || isScoreSaving || isScoreLocked}
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background:
                      selectedJudgeId && isScoreComplete && !isScoreSaving && !isScoreLocked
                        ? "linear-gradient(135deg, #F5D06F, #D4AF37)"
                        : "rgba(255,255,255,0.06)",
                    color:
                      selectedJudgeId && isScoreComplete && !isScoreSaving && !isScoreLocked
                        ? "#0F0F0F"
                        : "#777",
                    border: `1px solid ${
                      selectedJudgeId && isScoreComplete && !isScoreSaving && !isScoreLocked
                        ? "transparent"
                        : "rgba(255,255,255,0.08)"
                    }`,
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {isScoreSaving
                    ? "Menyimpan Nilai..."
                    : isScoreLocked
                      ? "Nilai Sudah Terkunci"
                      : "Simpan Nilai Tahap Ini"}
                </button>

                {isScoreLocked ? (
                  <p
                    className="text-[11px]"
                    style={{ color: "#F97316", fontFamily: "var(--font-poppins)" }}
                  >
                    Nilai juri ini sudah disubmit{scoreLockedAt ? ` (${formatDateTime(scoreLockedAt)})` : ""}. Pilih akun juri lain jika ingin input nilai.
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Ubah dropdown ini kalau nanti urutan atau pilihan tahap catatan ingin diatur berbeda. */}
            <select
              value={resolvedNoteStage}
              onChange={(event) => {
                const nextStage = event.target.value as ParticipantNoteStageKey;
                onNoteDraftChange((prev) => ({
                  ...prev,
                  stage: nextStage,
                  authorRole:
                    nextStage === "Technical Meeting" &&
                    prev.authorRole === "judge"
                      ? "committee"
                      : prev.authorRole,
                }));
              }}
              className="w-full px-3 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "#111",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#F5E6C8",
                fontFamily: "var(--font-poppins)",
              }}
            >
              {availableNoteStages.map((stage) => (
                <option key={stage} value={stage}>
                  {getAdminScoreStageLabel(stage)}
                </option>
              ))}
            </select>

            <div
              className="w-full px-3 py-3 rounded-xl text-sm"
              style={{
                background: "#111",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#F5E6C8",
                fontFamily: "var(--font-poppins)",
              }}
            >
              <p className="text-[11px]" style={{ color: "#888" }}>
                Nama penulis catatan (otomatis)
              </p>
              <p className="text-sm font-semibold" style={{ color: "#F5E6C8" }}>
                {resolvedNoteAuthorName || "Pilih akun juri terlebih dahulu"}
              </p>
            </div>

            <select
              value={
                resolvedNoteStage === "Technical Meeting" &&
                noteDraft.authorRole === "judge"
                  ? "committee"
                  : noteDraft.authorRole
              }
              onChange={(event) =>
                onNoteDraftChange((prev) => ({
                  ...prev,
                  authorRole: event.target.value as ParticipantNoteAuthorRole,
                }))
              }
              className="w-full px-3 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "#111",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#F5E6C8",
                fontFamily: "var(--font-poppins)",
              }}
            >
              {resolvedNoteStage === "Technical Meeting" ? (
                <>
                  <option value="committee">Panitia</option>
                  <option value="admin">Admin</option>
                </>
              ) : (
                <>
                  <option value="judge">Juri</option>
                  <option value="admin">Admin</option>
                  <option value="committee">Panitia</option>
                </>
              )}
            </select>

            {/* Textarea utama untuk isi catatan manual atau pengamatan juri. */}
            <textarea
              value={noteDraft.content}
              onChange={(event) =>
                onNoteDraftChange((prev) => ({
                  ...prev,
                  content: event.target.value,
                }))
              }
              placeholder="Masukkan catatan hasil kertas/manual untuk peserta ini."
              className="w-full min-h-28 px-3 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "#111",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#F5E6C8",
                fontFamily: "var(--font-poppins)",
              }}
            />

            <button
              type="button"
              onClick={onSaveNote}
              disabled={!resolvedNoteAuthorName || !noteDraft.content.trim()}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background:
                  resolvedNoteAuthorName && noteDraft.content.trim()
                    ? "linear-gradient(135deg, #F5D06F, #D4AF37)"
                    : "rgba(255,255,255,0.06)",
                color:
                  resolvedNoteAuthorName && noteDraft.content.trim()
                    ? "#0F0F0F"
                    : "#777",
                border: `1px solid ${
                  resolvedNoteAuthorName && noteDraft.content.trim()
                    ? "transparent"
                    : "rgba(255,255,255,0.08)"
                }`,
                fontFamily: "var(--font-poppins)",
              }}
            >
              Simpan Catatan Peserta
            </button>
          </div>

          <div
            className="space-y-4 max-h-[560px] overflow-y-auto pr-1 dashboard-main-scroll"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {availableNoteStages.map((stage) => {
              const stageNotes = visibleNotes.filter((note) => note.stage === stage);

              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-2">
                    <p
                      className="text-xs font-semibold"
                      style={{
                        color: "#F5E6C8",
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      {getAdminScoreStageLabel(stage)}
                    </p>
                    <span
                      className="text-xs"
                      style={{
                        color: "#666",
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      {stageNotes.length} catatan
                    </span>
                  </div>

                  {stageNotes.length === 0 ? (
                    <div
                      className="p-3 rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{
                          color: "#666",
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        Belum ada catatan pada tahap ini.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stageNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 rounded-xl"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p
                                className="text-xs font-semibold"
                                style={{
                                  color: "#F5E6C8",
                                  fontFamily: "var(--font-poppins)",
                                }}
                              >
                                {note.authorName}
                              </p>
                              <p
                                className="text-xs"
                                style={{
                                  color: "#888",
                                  fontFamily: "var(--font-poppins)",
                                }}
                              >
                                {note.authorRole === "committee"
                                  ? "Panitia"
                                  : note.authorRole === "judge"
                                    ? "Juri"
                                    : "Admin"}
                              </p>
                            </div>

                            <span
                              className="text-[11px]"
                              style={{
                                color: "#666",
                                fontFamily: "var(--font-poppins)",
                              }}
                            >
                              {formatDateTime(note.createdAt)}
                            </span>
                          </div>

                          <p
                            className="text-xs leading-6"
                            style={{
                              color: "#BDBDBD",
                              fontFamily: "var(--font-poppins)",
                            }}
                          >
                            {note.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <h3
            className="text-sm font-bold mb-4"
            style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}
          >
            {activeStage === "Technical Meeting"
              ? "Panel Technical Meeting"
              : `Juri Tahap ${getAdminScoreStageLabel(activeStage)}`}
          </h3>

          {activeStage === "Technical Meeting" || activeStage === "Pre Camp" ? (
            <div
              className="p-4 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-sm mb-2"
                style={{
                  color: "#F5E6C8",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                {activeStage === "Technical Meeting"
                  ? "Technical meeting tidak memakai tabel juri."
                  : "Pra karantina fokus pada progress peserta."}
              </p>
              <p
                className="text-xs leading-6"
                style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
              >
                Klik salah satu nama peserta pada tabel kiri untuk membuka panel
                catatan dan memasukkan catatan sesuai tahap yang dipilih.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Kalau daftar juri per tahap mau diubah tampilannya, edit map ini. */}
              {judgesForStage.map((judge) => (
                <div
                  key={judge.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Image
                    src={judge.avatar}
                    alt={judge.name}
                    width={40}
                    height={40}
                    unoptimized
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div>
                    <p
                      className="text-xs font-semibold"
                      style={{
                        color: "#F5E6C8",
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      {judge.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{
                        color: "#888",
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      {judge.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className="mt-4 p-4 rounded-2xl"
            style={{
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.15)",
            }}
          >
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}
            >
              Input Catatan Peserta
            </p>
            <p
              className="text-xs leading-6"
              style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
            >
              Pilih nama peserta di tabel kiri untuk membuka kolom catatan.
              Riwayat catatan tampil berurutan dari technical meeting sampai
              tahap aktif.
            </p>
          </div>
        </div>
      )}
    </GoldCard>
  );
}

