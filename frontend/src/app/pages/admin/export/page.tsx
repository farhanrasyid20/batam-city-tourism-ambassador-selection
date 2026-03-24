"use client";

import React, { useMemo, useState } from "react";
import { Download, CheckCircle, FileSpreadsheet, ClipboardList, NotebookPen } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { useApp } from "../../../../context/AppContext";
import {
  getAdminScoreStageLabel,
  getStageScoreRecords,
  getParticipantAdminStageScore,
  getStageCriteriaAverages,
  getStageCriteria,
  isParticipantEligibleForScoreStage,
  stages,
  type AdminScoreStage,
} from "../../../../data/mockData";

type GenderFilter = "Semua" | "Encik" | "Puan";
type ExportStage = AdminScoreStage;

type ExportRow = {
  rank: number;
  number: string;
  name: string;
  gender: string;
  scores: number[];
  total: number;
};

type WorkbookSheet = {
  name: string;
  headers: string[];
  rows: Array<Array<string | number>>;
};

const exportStages: Array<{ key: ExportStage; sheetName: string }> = [
  { key: "Audition", sheetName: "AUDISI" },
  { key: "Camp", sheetName: "KARANTINA" },
  { key: "Grand Final", sheetName: "GRAND FINAL" },
  { key: "Final Result", sheetName: "NILAI AKHIR" },
];

function toXmlSafe(value: string | number) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function buildWorkbookXml(sheets: Array<{ name: string; headers: string[]; rows: Array<Array<string | number>> }>) {
  const worksheetXml = sheets
    .map((sheet) => {
      const headerCells = sheet.headers.map((header) => `<Cell><Data ss:Type="String">${toXmlSafe(header)}</Data></Cell>`).join("");
      const rowXml = sheet.rows
        .map((row) => {
          const cells = row
            .map((cell) => `<Cell><Data ss:Type="${typeof cell === "number" ? "Number" : "String"}">${toXmlSafe(cell)}</Data></Cell>`)
            .join("");
          return `<Row>${cells}</Row>`;
        })
        .join("");

      return `<Worksheet ss:Name="${toXmlSafe(sheet.name)}"><Table><Row>${headerCells}</Row>${rowXml}</Table></Worksheet>`;
    })
    .join("");

  return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${worksheetXml}</Workbook>`;
}

export default function AdminExportPage() {
  const { participantList, scoreList } = useApp();
  const [selectedStage, setSelectedStage] = useState<ExportStage>("Grand Final");
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("Semua");
  const [done, setDone] = useState<"single" | "all" | null>(null);

  const stageDataMap = useMemo(() => {
    const map: Record<string, ExportRow[]> = {};

    exportStages.forEach((stageConfig) => {
      const rows = participantList
        .filter((participant) => {
          const genderMatch = selectedGender === "Semua" || participant.gender === selectedGender;
          if (!genderMatch) return false;
          if (stageConfig.key === "Final Result") return isParticipantEligibleForScoreStage(participant, "Grand Final");
          return isParticipantEligibleForScoreStage(participant, stageConfig.key);
        })
        .map((participant) => {
          if (stageConfig.key === "Final Result") {
            const campScore = getParticipantAdminStageScore(scoreList, participant.id, "Camp");
            const grandFinalScore = getParticipantAdminStageScore(scoreList, participant.id, "Grand Final");
            const total = getParticipantAdminStageScore(scoreList, participant.id, "Final Result");
            return { rank: 0, number: participant.number, name: participant.name, gender: participant.gender, scores: [campScore, grandFinalScore], total };
          }

          const criteria = getStageCriteria(stageConfig.key);
          const total = getParticipantAdminStageScore(scoreList, participant.id, stageConfig.key);
          return {
            rank: 0,
            number: participant.number,
            name: participant.name,
            gender: participant.gender,
            scores: getStageCriteriaAverages(scoreList, participant.id, stageConfig.key, { judgeRole: "main", scoreType: "official" }).slice(0, criteria.length),
            total,
          };
        })
        .filter((row) => row.total > 0)
        .sort((a, b) => b.total - a.total)
        .map((row, index) => ({ ...row, rank: index + 1 }));

      map[stageConfig.key] = rows;
    });

    return map;
  }, [participantList, scoreList, selectedGender]);

  const tableData = stageDataMap[selectedStage] ?? [];

  const headers = useMemo(() => {
    if (selectedStage === "Final Result") return ["Rank", "No Urut", "Nama", "Kategori", "Karantina", "Grand Final", "Nilai Akhir"];
    return ["Rank", "No Urut", "Nama", "Kategori", ...getStageCriteria(selectedStage).map((criteria) => criteria.label), "Total Nilai"];
  }, [selectedStage]);

  const mentorCampRows = useMemo(() => {
    return participantList
      .filter((participant) => isParticipantEligibleForScoreStage(participant, "Camp"))
      .map((participant) => {
        const mentorRecords = getStageScoreRecords(scoreList, participant.id, "Camp", {
          judgeRole: "mentor",
          scoreType: "mentor_observation",
        });

        return mentorRecords.map((record) => [
          participant.number,
          participant.name,
          record.judgeName,
          record.totalScore.toFixed(2),
          record.note ?? "-",
        ]);
      })
      .flat();
  }, [participantList, scoreList]);

  const workbookSheets = useMemo<WorkbookSheet[]>(() => {
    const stageSheets = exportStages.map((stageConfig) => {
      const rows = (stageDataMap[stageConfig.key] ?? []).map((row) => [
        row.rank,
        row.number,
        row.name,
        row.gender,
        ...row.scores,
        row.total.toFixed(2),
      ]);
      const stageHeaders =
        stageConfig.key === "Final Result"
          ? ["Rank", "No Urut", "Nama", "Kategori", "Karantina", "Grand Final", "Nilai Akhir"]
          : ["Rank", "No Urut", "Nama", "Kategori", ...getStageCriteria(stageConfig.key).map((criteria) => criteria.label), "Total Nilai"];

      return { name: stageConfig.sheetName, headers: stageHeaders, rows };
    });

    if (mentorCampRows.length === 0) return stageSheets;

    return [
      ...stageSheets,
      {
        name: "MENTOR KARANTINA",
        headers: ["No Urut", "Nama", "Juri Mentor", "Skor Observasi", "Catatan Mentor"],
        rows: mentorCampRows,
      },
    ];
  }, [mentorCampRows, stageDataMap]);

  const exportWorkbook = (onlyActiveStage: boolean) => {
    const sheets = onlyActiveStage
      ? workbookSheets.filter((sheet) => {
          if (selectedStage === "Audition") return sheet.name === "AUDISI";
          if (selectedStage === "Camp") return sheet.name === "KARANTINA" || sheet.name === "MENTOR KARANTINA";
          if (selectedStage === "Grand Final") return sheet.name === "GRAND FINAL";
          return sheet.name === "NILAI AKHIR";
        })
      : workbookSheets;

    const workbookXml = buildWorkbookXml(sheets);
    const blob = new Blob([workbookXml], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = onlyActiveStage ? `Rekap_${selectedStage.replace(/\s/g, "_")}.xls` : "Rekap_Semua_Tahap.xls";
    anchor.click();
    URL.revokeObjectURL(url);
    setDone(onlyActiveStage ? "single" : "all");
    setTimeout(() => setDone(null), 2500);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
          Export Data
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Workbook multi-sheet kini mengikuti alur audisi, karantina, grand final, dan nilai akhir.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Baris Preview",
            value: tableData.length,
            sub: `Tahap ${getAdminScoreStageLabel(selectedStage)}`,
            icon: <ClipboardList size={18} />,
            color: "#D4AF37",
          },
          {
            label: "Sheet Workbook",
            value: workbookSheets.length,
            sub: mentorCampRows.length > 0 ? "Termasuk sheet mentor karantina" : "Sheet utama tanpa mentor",
            icon: <FileSpreadsheet size={18} />,
            color: "#60a5fa",
          },
          {
            label: "Catatan Mentor",
            value: mentorCampRows.length,
            sub: "Referensi observasi karantina",
            icon: <NotebookPen size={18} />,
            color: "#f59e0b",
          },
          {
            label: "Mode Export",
            value: selectedStage === "Final Result" ? "30/70" : "Resmi",
            sub: selectedStage === "Final Result" ? "Karantina 30% + Grand Final 70%" : "Mengikuti rubrik tahap aktif",
            icon: <Download size={18} />,
            color: "#22c55e",
          },
        ].map((item) => (
          <GoldCard key={item.label}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs mb-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                  {item.label}
                </p>
                <p className="text-2xl font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                  {item.value}
                </p>
                <p className="text-xs mt-1" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                  {item.sub}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${item.color}18`, color: item.color }}>
                {item.icon}
              </div>
            </div>
          </GoldCard>
        ))}
      </div>

      <GoldCard glow className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
              Filter Tahap
            </label>
            <div className="flex gap-2 flex-wrap">
              {([...stages, "Final Result"] as ExportStage[]).map((stage) => (
                <button
                  key={stage}
                  onClick={() => setSelectedStage(stage)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: selectedStage === stage ? "linear-gradient(135deg, #F5D06F, #D4AF37)" : "rgba(212,175,55,0.08)",
                    color: selectedStage === stage ? "#0F0F0F" : "#D4AF37",
                    border: `1px solid ${selectedStage === stage ? "transparent" : "rgba(212,175,55,0.2)"}`,
                    fontFamily: "var(--font-cinzel)",
                    cursor: "pointer",
                  }}
                  type="button"
                >
                  {getAdminScoreStageLabel(stage)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
              Filter Kategori
            </label>
            <div className="flex gap-2">
              {(["Semua", "Encik", "Puan"] as const).map((gender) => (
                <button
                  key={gender}
                  onClick={() => setSelectedGender(gender)}
                  className="px-4 py-2 rounded-xl text-xs transition-all"
                  style={{
                    background: selectedGender === gender ? "rgba(212,175,55,0.15)" : "transparent",
                    border: `1px solid ${selectedGender === gender ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.08)"}`,
                    color: selectedGender === gender ? "#D4AF37" : "#888",
                    fontFamily: "var(--font-poppins)",
                    cursor: "pointer",
                  }}
                  type="button"
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex gap-2">
            <GoldButton variant="outline" onClick={() => exportWorkbook(true)}>
              {done === "single" ? <CheckCircle size={16} /> : <Download size={16} />}
              Export Tahap Aktif
            </GoldButton>
            <GoldButton variant="primary" onClick={() => exportWorkbook(false)}>
              {done === "all" ? <CheckCircle size={16} /> : <Download size={16} />}
              Export Semua Tahap
            </GoldButton>
          </div>
        </div>
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(212,175,55,0.12)" }}>
          <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
            Export tahap karantina akan menyertakan sheet tambahan `MENTOR KARANTINA` jika observasi mentor tersedia.
          </p>
        </div>
      </GoldCard>

      <GoldCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
            Preview: Rekap {getAdminScoreStageLabel(selectedStage)}
          </h3>
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(212,175,55,0.1)", color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
            {tableData.length} peserta
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ fontFamily: "var(--font-poppins)" }}>
            <thead>
              <tr style={{ background: "rgba(212,175,55,0.08)", borderBottom: "1px solid rgba(212,175,55,0.15)" }}>
                {headers.map((header) => (
                  <th key={header} className="px-3 py-2 text-left whitespace-nowrap" style={{ color: "#D4AF37" }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={`${selectedStage}-${row.number}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="px-3 py-2.5" style={{ color: "#F5E6C8" }}>{row.rank}</td>
                  <td className="px-3 py-2.5" style={{ color: "#888" }}>{row.number}</td>
                  <td className="px-3 py-2.5" style={{ color: "#F5E6C8" }}>{row.name}</td>
                  <td className="px-3 py-2.5" style={{ color: row.gender === "Encik" ? "#60a5fa" : "#f472b6" }}>{row.gender}</td>
                  {row.scores.map((score, index) => (
                    <td key={`${row.number}-${index}`} className="px-3 py-2.5 text-center" style={{ color: score > 0 ? "#BDBDBD" : "#555" }}>
                      {score > 0 ? score.toFixed(2) : "-"}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-center" style={{ color: "#D4AF37", fontWeight: 700 }}>{row.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GoldCard>
    </div>
  );
}







