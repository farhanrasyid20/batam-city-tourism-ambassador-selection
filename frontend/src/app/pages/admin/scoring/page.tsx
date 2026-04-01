"use client";

import React, { useMemo, useState } from "react";
import { useApp } from "../../../../context/AppContext";
import ProgressChecklistSection from "./components/ProgressChecklistSection";
import RubricSummaryCard from "./components/RubricSummaryCard";
import ScoreStageSummary from "./components/ScoreStageSummary";
import ScoringSidePanel from "./components/ScoringSidePanel";
import ScoringStatsCards from "./components/ScoringStatsCards";
import StageRankingCard from "./components/StageRankingCard";
import StageToolbar from "./components/StageToolbar";
import {
  getAdminScoreStageLabel,
  getAvailableNoteStages,
  getJudgeAssignedStages,
  getParticipantAdminStageScore,
  getParticipantSelectionStage,
  getParticipantStageProgress,
  getParticipantVerificationStatus,
  getSelectionStageFromStageProgress,
  getStageScoreRecords,
  isParticipantEligibleForScoreStage,
  mockParticipantStageNotes,
  participantProgressStages,
  type AdminScoreStage,
  type Participant,
  type ParticipantNoteAuthorRole,
  type ParticipantNoteStageKey,
  type ParticipantProgressStageKey,
  type ParticipantStageNote,
  type ParticipantStageProgress,
  type ScoreStageKey,
} from "../../../../data/mockData";

type GenderFilter = "Semua" | "Encik" | "Puan";
type RankedParticipant = Participant & { score: number };
type ProgressDraftMap = Record<string, ParticipantStageProgress>;
// Draft note dipakai saat admin sedang mengisi catatan di panel kanan.
type NoteDraft = {
  stage: ParticipantNoteStageKey;
  authorName: string;
  authorRole: ParticipantNoteAuthorRole;
  content: string;
};

const stageOptions: AdminScoreStage[] = [
  "Technical Meeting",
  "Audition",
  "Pre Camp",
  "Camp",
  "Grand Final",
  "Final Result",
];
const isScoreStage = (stage: AdminScoreStage): stage is ScoreStageKey =>
  stage === "Audition" || stage === "Camp" || stage === "Grand Final";
const isProgressStage = (
  stage: AdminScoreStage,
): stage is ParticipantProgressStageKey =>
  stage === "Technical Meeting" ||
  stage === "Audition" ||
  stage === "Pre Camp" ||
  stage === "Camp" ||
  stage === "Grand Final";

// Helper ini menentukan peserta mana yang relevan di tahap admin tertentu.
function isParticipantRelevantForAdminStage(
  participant: Participant,
  stage: AdminScoreStage,
) {
  const selectionStage = getParticipantSelectionStage(participant);
  if (stage === "Final Result")
    return isParticipantEligibleForScoreStage(participant, "Grand Final");
  if (stage === "Technical Meeting") return selectionStage !== "Verification";
  if (stage === "Pre Camp")
    return ["Pre Camp", "Camp", "Grand Final", "Final Result"].includes(
      selectionStage,
    );
  return isParticipantEligibleForScoreStage(participant, stage);
}

// Helper ini mengatur efek saat checklist progres dicentang atau dibatalkan.
function toggleParticipantStageProgress(
  progress: ParticipantStageProgress,
  stage: ParticipantProgressStageKey,
  checked: boolean,
) {
  const nextProgress = { ...progress };
  const stageIndex = participantProgressStages.indexOf(stage);
  participantProgressStages.forEach((key, index) => {
    if (checked && index === stageIndex) nextProgress[key] = true;
    if (!checked && index >= stageIndex) nextProgress[key] = false;
  });
  return nextProgress;
}

// Nilai akhir tidak punya note sendiri, jadi diarahkan ke grand final.
const getDefaultNoteStage = (
  stage: AdminScoreStage,
): ParticipantNoteStageKey =>
  stage === "Final Result" ? "Grand Final" : (stage as ParticipantNoteStageKey);

const createDraft = (stage: AdminScoreStage): NoteDraft => {
  const noteStage = getDefaultNoteStage(stage);
  return {
    stage: noteStage,
    authorName: "",
    authorRole: noteStage === "Technical Meeting" ? "committee" : "judge",
    content: "",
  };
};

// Format tanggal untuk daftar riwayat catatan.
const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function AdminScoresPage() {
  // Pusat state dan logic utama halaman scoring admin.
  const { participantList, setParticipantList, judgeList, scoreList } =
    useApp();
  const [activeStage, setActiveStage] =
    useState<AdminScoreStage>("Grand Final");
  const [activeGender, setActiveGender] = useState<GenderFilter>("Semua");
  const [progressDrafts, setProgressDrafts] = useState<
    Partial<ProgressDraftMap>
  >({});
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [participantNotes, setParticipantNotes] = useState<
    ParticipantStageNote[]
  >(mockParticipantStageNotes);
  const [noteDraft, setNoteDraft] = useState<NoteDraft>(() =>
    createDraft("Grand Final"),
  );

  const availableNoteStages = useMemo(
    () => getAvailableNoteStages(activeStage),
    [activeStage],
  );

  // Helper ini membaca draft progres terbaru, kalau belum ada maka ambil progres asli peserta.
  const getDraftProgress = (participant: Participant) =>
    progressDrafts[participant.id] ?? getParticipantStageProgress(participant);

  // Daftar peserta utama untuk tabel kiri. Ubah filter ini kalau aturan tampil per tahap berubah.
  const participants = useMemo(
    () =>
      participantList.filter((participant) => {
        if (activeGender !== "Semua" && participant.gender !== activeGender)
          return false;
        return isParticipantRelevantForAdminStage(participant, activeStage);
      }),
    [activeGender, activeStage, participantList],
  );

  // Ranking nilai admin diambil dari score resmi juri pada tahap aktif.
  const rankings = useMemo<RankedParticipant[]>(
    () =>
      !isScoreStage(activeStage) && activeStage !== "Final Result"
        ? []
        : participants
            .map((participant) => ({
              ...participant,
              score: getParticipantAdminStageScore(
                scoreList,
                participant.id,
                activeStage,
              ),
            }))
            .filter((participant) => participant.score > 0)
            .sort((a, b) => b.score - a.score),
    [activeStage, participants, scoreList],
  );

  // Daftar juri per tahap dipakai untuk panel kanan saat belum memilih peserta.
  const judgesForStage = useMemo(() => {
    if (activeStage === "Technical Meeting" || activeStage === "Pre Camp")
      return [];
    if (activeStage === "Final Result") return judgeList;
    return judgeList.filter((judge) =>
      getJudgeAssignedStages(judge).includes(activeStage),
    );
  }, [activeStage, judgeList]);

  const submittedParticipantsCount = !isProgressStage(activeStage)
    ? rankings.length
    : participants.filter(
        (participant) => getDraftProgress(participant)[activeStage],
      ).length;

  const selectedParticipant = useMemo(
    () =>
      participants.find(
        (participant) => participant.id === selectedParticipantId,
      ) ?? null,
    [participants, selectedParticipantId],
  );
  const resolvedNoteStage = availableNoteStages.includes(noteDraft.stage)
    ? noteDraft.stage
    : getDefaultNoteStage(activeStage);

  // Ringkasan cepat ini dipakai oleh kartu nilai di bagian atas.
  const averageStageScore = rankings.length
    ? rankings.reduce((sum, participant) => sum + participant.score, 0) /
      rankings.length
    : 0;
  const officialScoreCount = isScoreStage(activeStage)
    ? participants.reduce(
        (sum, participant) =>
          sum +
          getStageScoreRecords(scoreList, participant.id, activeStage, {
            judgeRole: "judge",
            scoreType: "official",
          }).length,
        0,
      )
    : activeStage === "Final Result"
      ? participants.reduce(
          (sum, participant) =>
            sum +
            getStageScoreRecords(scoreList, participant.id, "Camp", {
              judgeRole: "judge",
              scoreType: "official",
            }).length +
            getStageScoreRecords(scoreList, participant.id, "Grand Final", {
              judgeRole: "judge",
              scoreType: "official",
            }).length,
          0,
        )
      : 0;

  // Riwayat note hanya menampilkan tahap yang sudah relevan sampai tab aktif.
  const visibleNotes = useMemo(() => {
    if (!selectedParticipantId) return [];
    return participantNotes
      .filter(
        (note) =>
          note.participantId === selectedParticipantId &&
          availableNoteStages.includes(note.stage),
      )
      .sort(
        (a, b) =>
          availableNoteStages.indexOf(a.stage) -
            availableNoteStages.indexOf(b.stage) ||
          a.createdAt.localeCompare(b.createdAt),
      );
  }, [availableNoteStages, participantNotes, selectedParticipantId]);

  // Handler ini hanya mengubah draft di UI, belum menyimpan permanen ke participantList.
  const handleProgressToggle = (
    participantId: string,
    stage: ParticipantProgressStageKey,
  ) => {
    setProgressDrafts((prev) => {
      const participant = participantList.find(
        (item) => item.id === participantId,
      );
      if (!participant) return prev;
      const currentProgress =
        prev[participantId] ?? getParticipantStageProgress(participant);
      const nextChecked = !currentProgress[stage];
      const canMark =
        !nextChecked ||
        participantProgressStages
          .slice(0, participantProgressStages.indexOf(stage))
          .every((previousStage) => currentProgress[previousStage]);
      if (!canMark) return prev;
      const nextProgress = toggleParticipantStageProgress(
        currentProgress,
        stage,
        nextChecked,
      );
      const persistedProgress = getParticipantStageProgress(participant);
      const shouldClearDraft = participantProgressStages.every(
        (progressStage) =>
          nextProgress[progressStage] === persistedProgress[progressStage],
      );
      if (shouldClearDraft) {
        const nextDrafts = { ...prev };
        delete nextDrafts[participantId];
        return nextDrafts;
      }
      return { ...prev, [participantId]: nextProgress };
    });
  };

  // Saat tombol simpan diklik, draft progres dipindahkan ke data peserta utama.
  const handleSaveProgress = () => {
    setParticipantList((prev) =>
      prev.map((participant) => {
        const nextProgress =
          progressDrafts[participant.id] ??
          getParticipantStageProgress(participant);
        return {
          ...participant,
          stageProgress: nextProgress,
          selectionStage: getSelectionStageFromStageProgress(
            nextProgress,
            getParticipantVerificationStatus(participant),
          ),
        };
      }),
    );
    setProgressDrafts({});
  };

  // Catatan admin/juri/panitia ditambahkan ke state lokal agar alurnya bisa langsung diuji di UI.
  const handleSaveNote = () => {
    if (
      !selectedParticipant ||
      !noteDraft.authorName.trim() ||
      !noteDraft.content.trim()
    )
      return;
    setParticipantNotes((prev) => [
      ...prev,
      {
        id: `note-${Date.now()}`,
        participantId: selectedParticipant.id,
        participantName: selectedParticipant.name,
        stage: resolvedNoteStage,
        authorName: noteDraft.authorName.trim(),
        authorRole:
          resolvedNoteStage === "Technical Meeting" &&
          noteDraft.authorRole === "judge"
            ? "committee"
            : noteDraft.authorRole,
        content: noteDraft.content.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setNoteDraft((prev) => ({ ...prev, authorName: "", content: "" }));
  };

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
          Tahapan & Nilai
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
        >
          Rekap progres peserta dari technical meeting sampai grand final,
          lengkap dengan catatan per tahap.
        </p>
      </div>

      {/* Toolbar ini adalah tempat utama untuk ganti tab tahap dan filter gender. */}
      <StageToolbar
        activeStage={activeStage}
        activeGender={activeGender}
        onStageChange={setActiveStage}
        onGenderChange={setActiveGender}
        stageOptions={stageOptions}
      />

      {/* Kartu statistik ini aman dipindah ke komponen karena hanya butuh data siap pakai. */}
      <ScoringStatsCards
        participantsCount={participants.length}
        stageLabel={getAdminScoreStageLabel(activeStage)}
        submittedParticipantsCount={submittedParticipantsCount}
        isProgressStage={isProgressStage(activeStage)}
        judgeCount={judgesForStage.length}
        stageKeyLabel={activeStage}
        notesCount={
          participantNotes.filter(
            (note) => note.stage === getDefaultNoteStage(activeStage),
          ).length
        }
      />

      {/* Ringkasan nilai tetap diletakkan dekat atas agar halaman tidak terasa hanya berisi tahapan. */}
      <ScoreStageSummary
        title={`Ringkasan Nilai Tahap ${getAdminScoreStageLabel(activeStage)}`}
        activeStage={activeStage}
        rankings={rankings}
        officialScoreCount={officialScoreCount}
        averageStageScore={averageStageScore}
        selectedParticipantId={selectedParticipantId}
        onSelectParticipant={setSelectedParticipantId}
      />

      <div className="grid xl:grid-cols-[minmax(0,2fr)_380px] gap-6 mb-6">
        {/* Tabel progres sengaja dipisah ke komponen karena ini blok UI terbesar di halaman. */}
        <ProgressChecklistSection
          activeStage={activeStage}
          isProgressStage={isProgressStage(activeStage)}
          participants={participants}
          progressDraftsCount={Object.keys(progressDrafts).length}
          selectedParticipantId={selectedParticipantId}
          onSaveProgress={handleSaveProgress}
          onSelectParticipant={setSelectedParticipantId}
          onToggleProgress={handleProgressToggle}
          getDraftProgress={getDraftProgress}
        />

        {/* Panel kanan ini berisi dua mode: daftar juri atau detail catatan peserta terpilih. */}
        <ScoringSidePanel
          activeStage={activeStage}
          selectedParticipant={selectedParticipant}
          judgesForStage={judgesForStage}
          availableNoteStages={availableNoteStages}
          resolvedNoteStage={resolvedNoteStage}
          noteDraft={noteDraft}
          visibleNotes={visibleNotes}
          formatDateTime={formatDateTime}
          onCloseParticipant={() => setSelectedParticipantId(null)}
          onSaveNote={handleSaveNote}
          onNoteDraftChange={(updater) => setNoteDraft((prev) => updater(prev))}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StageRankingCard
            stageLabel={getAdminScoreStageLabel(activeStage)}
            activeStage={activeStage}
            rankings={rankings}
            selectedParticipantId={selectedParticipantId}
            onSelectParticipant={setSelectedParticipantId}
          />
        </div>
        <div>
          <RubricSummaryCard
            activeStage={activeStage}
            isScoreStage={isScoreStage(activeStage)}
          />
        </div>
      </div>
    </div>
  );
}
