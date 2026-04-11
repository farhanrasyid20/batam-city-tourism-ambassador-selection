"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React, { useEffect, useMemo, useState } from "react";
import {
  Download,
  CheckCircle,
  FileSpreadsheet,
  ClipboardList,
  Sigma,
  FileText,
} from "lucide-react";
import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { getReadableApiError } from "../../../../lib/api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import {
  fetchJudgeScoreRecap,
  type JudgeScoreRecapResponse,
} from "../../../../lib/judge-score-recap-api";

type GenderFilter = "Semua" | "Encik" | "Puan";
type ExportStage = "Audition" | "Camp" | "Grand Final" | "Final Result";
type PdfPaperSize = "A4" | "A3" | "A2" | "A1" | "LETTER" | "LEGAL";
type PdfOrientation = "landscape" | "portrait";

type WorkbookSheet = {
  name: string;
  headers: string[];
  rows: Array<Array<string | number>>;
};

type JuryPdfRow = Array<string | number>;

const juryPdfStyles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  logo: {
    width: 44,
    height: 44,
    objectFit: "contain",
  },
  titleWrap: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    marginBottom: 4,
  },
  smallMuted: {
    fontSize: 8,
    color: "#4b5563",
    marginBottom: 8,
  },
  table: {
    width: "100%",
    borderWidth: 0.7,
    borderColor: "#111827",
    borderStyle: "solid",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.7,
    borderBottomColor: "#111827",
    borderBottomStyle: "solid",
  },
  headerCell: {
    padding: 4,
    fontWeight: 700,
    borderRightWidth: 0.7,
    borderRightColor: "#111827",
    borderRightStyle: "solid",
  },
  bodyCell: {
    padding: 4,
    borderRightWidth: 0.7,
    borderRightColor: "#111827",
    borderRightStyle: "solid",
  },
  lastCell: {
    borderRightWidth: 0,
  },
  signaturesWrap: {
    marginTop: 20,
  },
  signaturesTitle: {
    fontSize: 9,
    marginBottom: 10,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  signatureCol: {
    flex: 1,
    alignItems: "center",
  },
  signatureLine: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: "#111827",
    borderTopStyle: "solid",
    width: "85%",
  },
  signatureLabel: {
    marginTop: 4,
    fontSize: 8,
  },
});

function getPdfColumnWidths(headers: string[]): number[] {
  return headers.map((header) => {
    if (header === "Rank") return 26;
    if (header === "No Urut") return 54;
    if (header === "Nama") return 68;
    if (header === "Kategori") return 52;
    if (header === "Total" || header === "Rata-rata" || header.startsWith("Juri ")) return 52;
    if (
      header === "Audisi" ||
      header === "Karantina" ||
      header === "Grand Final" ||
      header === "Karantina 30%" ||
      header === "Grand Final 70%" ||
      header === "Nilai Akhir"
    ) {
      return 56;
    }
    return 64;
  });
}

function JuryReportDocument(props: {
  stageLabel: string;
  genderLabel: GenderFilter;
  headers: string[];
  rows: JuryPdfRow[];
  generatedAtLabel: string;
  paperSize: PdfPaperSize;
  orientation: PdfOrientation;
  logoUrl?: string;
}) {
  const {
    stageLabel,
    genderLabel,
    headers,
    rows,
    generatedAtLabel,
    paperSize,
    orientation,
    logoUrl,
  } = props;
  const columnWidths = getPdfColumnWidths(headers);

  return (
    <Document>
      <Page size={paperSize} orientation={orientation} style={juryPdfStyles.page}>
        <View style={juryPdfStyles.topHeader}>
          {logoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={logoUrl} style={juryPdfStyles.logo} />
          ) : (
            <View style={juryPdfStyles.logo} />
          )}
          <View style={juryPdfStyles.titleWrap}>
            <Text style={juryPdfStyles.title}>Laporan Rekap Nilai Juri</Text>
            <Text style={juryPdfStyles.subtitle}>Pemilihan Duta Wisata Kota Batam 2026</Text>
          </View>
        </View>
        <Text style={juryPdfStyles.smallMuted}>
          Tahap: {stageLabel} | Kategori: {genderLabel} | Total peserta: {rows.length} | Dibuat:
          {" "}
          {generatedAtLabel}
        </Text>

        <View style={juryPdfStyles.table}>
          <View style={juryPdfStyles.tableRow}>
            {headers.map((header, index) => (
              <Text
                key={`h-${header}-${index}`}
                style={[
                  juryPdfStyles.headerCell,
                  { width: columnWidths[index] ?? 64 },
                  ...(index === headers.length - 1 ? [juryPdfStyles.lastCell] : []),
                ]}
              >
                {header}
              </Text>
            ))}
          </View>
          {rows.map((row, rowIndex) => (
            <View
              key={`r-${rowIndex}`}
              style={[
                juryPdfStyles.tableRow,
                ...(rowIndex === rows.length - 1 ? [{ borderBottomWidth: 0 }] : []),
              ]}
            >
              {row.map((cell, cellIndex) => (
                <Text
                  key={`c-${rowIndex}-${cellIndex}`}
                  style={[
                    juryPdfStyles.bodyCell,
                    { width: columnWidths[cellIndex] ?? 64 },
                    ...(cellIndex === row.length - 1 ? [juryPdfStyles.lastCell] : []),
                  ]}
                >
                  {String(cell)}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={juryPdfStyles.signaturesWrap}>
          <Text style={juryPdfStyles.signaturesTitle}>
            Verifikasi Dewan Juri (tanda tangan):
          </Text>
          <View style={juryPdfStyles.signatureRow}>
            <View style={juryPdfStyles.signatureCol}>
              <View style={juryPdfStyles.signatureLine} />
              <Text style={juryPdfStyles.signatureLabel}>Ketua Dewan Juri</Text>
            </View>
            <View style={juryPdfStyles.signatureCol}>
              <View style={juryPdfStyles.signatureLine} />
              <Text style={juryPdfStyles.signatureLabel}>Anggota Juri 1</Text>
            </View>
            <View style={juryPdfStyles.signatureCol}>
              <View style={juryPdfStyles.signatureLine} />
              <Text style={juryPdfStyles.signatureLabel}>Anggota Juri 2</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

const stageLabels: Record<ExportStage, string> = {
  Audition: "Audisi",
  Camp: "Karantina",
  "Grand Final": "Grand Final",
  "Final Result": "Nilai Akhir",
};

const sheetNameMap: Record<ExportStage, string> = {
  Audition: "AUDISI",
  Camp: "KARANTINA",
  "Grand Final": "GRAND FINAL",
  "Final Result": "NILAI AKHIR",
};

const exportStages: ExportStage[] = ["Audition", "Camp", "Grand Final", "Final Result"];

const criteriaLabelMap: Record<string, string> = {
  auditionAppearanceEthicsConfidence: "Penampilan, Etika & Kepercayaan Diri",
  auditionCultureTourismKnowledge: "Pengetahuan Kebudayaan & Pariwisata",
  auditionCommunicationForeignLanguage: "Kemampuan Komunikasi & Bahasa Asing",
  auditionTalent: "Bakat",
  campDisciplinePunctuality: "Disiplin & Ketepatan Waktu",
  campAttitudeEthics: "Sikap & Etika",
  campTeamwork: "Kerja Sama & Teamwork",
  campActivenessInitiative: "Keaktifan & Inisiatif",
  campTaskResponsibility: "Tanggung Jawab Tugas",
  grandFinalAppearancePersonality: "Penampilan & Kepribadian",
  grandFinalTourismCultureInsight: "Wawasan Pariwisata & Budaya",
  grandFinalCommunicationPublicSpeaking: "Komunikasi & Public Speaking",
  grandFinalIntelligenceAttitude: "Intelegensi & Sikap",
  grandFinalDutaPotential: "Potensi Duta Wisata",
};

function toXmlSafe(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildWorkbookXml(sheets: WorkbookSheet[]) {
  const printedAt = new Date().toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const worksheetXml = sheets
    .map((sheet) => {
      const titleRow = `<Row><Cell><Data ss:Type=\"String\">${toXmlSafe(
        "Laporan Rekap Nilai Juri - Pemilihan Duta Wisata Kota Batam 2026"
      )}</Data></Cell></Row>`;
      const metaRow = `<Row><Cell><Data ss:Type=\"String\">${toXmlSafe(
        `Sheet: ${sheet.name} | Dicetak: ${printedAt}`
      )}</Data></Cell></Row>`;
      const spacerRow = "<Row></Row>";
      const headerCells = sheet.headers
        .map(
          (header) =>
            `<Cell><Data ss:Type=\"String\">${toXmlSafe(header)}</Data></Cell>`
        )
        .join("");

      const rowXml = sheet.rows
        .map((row) => {
          const cells = row
            .map(
              (cell) =>
                `<Cell><Data ss:Type=\"${typeof cell === "number" ? "Number" : "String"}\">${toXmlSafe(cell)}</Data></Cell>`
            )
            .join("");
          return `<Row>${cells}</Row>`;
        })
        .join("");

      return `<Worksheet ss:Name=\"${toXmlSafe(sheet.name)}\"><Table>${titleRow}${metaRow}${spacerRow}<Row>${headerCells}</Row>${rowXml}</Table></Worksheet>`;
    })
    .join("");

  return `<?xml version=\"1.0\"?><Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\">${worksheetXml}</Workbook>`;
}

function padJudgeScores(scores: number[], max: number): Array<number | string> {
  const values: Array<number | string> = [...scores];
  while (values.length < max) {
    values.push("");
  }
  return values;
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function toDisplayParticipantName(
  name: string,
  gender?: "Encik" | "Puan" | null
) {
  const normalized = name.trim().replace(/^(encik|puan)\s+/i, "");
  const nickname = normalized.split(/\s+/)[0] ?? "";
  const prefix = gender === "Puan" ? "Puan" : "Encik";
  const finalName = toTitleCase(nickname || normalized || "Peserta");
  return `${prefix} ${finalName}`.trim();
}

function normalizeParticipantCode(value: string) {
  return value
    .trim()
    .replace(/[â€â€‘â€’â€“â€”âˆ’]/g, "-")
    .replace(/\s+/g, "");
}

function splitParticipantCode(value: string) {
  const normalized = normalizeParticipantCode(value);
  const match = normalized.match(/^([A-Za-z]{3}-)(\d{3,4})$/);
  if (!match) {
    return { prefix: normalized, suffix: "" };
  }
  return { prefix: match[1].toUpperCase(), suffix: match[2] };
}

function getStageCriteriaKeys(
  stage: Exclude<ExportStage, "Final Result">,
  recap: JudgeScoreRecapResponse | null
) {
  const fromMeta =
    stage === "Audition"
      ? recap?.meta.criteria_keys?.Audition
      : stage === "Camp"
        ? recap?.meta.criteria_keys?.Camp
        : recap?.meta.criteria_keys?.["Grand Final"];

  return fromMeta ?? [];
}

function getStageCriteriaAverage(
  stage: Exclude<ExportStage, "Final Result">,
  row: JudgeScoreRecapResponse["data"][number]
) {
  if (stage === "Audition") return row.audition_criteria_average ?? {};
  if (stage === "Camp") return row.camp_criteria_average ?? {};
  return row.grand_final_criteria_average ?? {};
}

export default function AdminExportPage() {
  const [selectedStage, setSelectedStage] = useState<ExportStage>("Final Result");
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("Semua");
  const [done, setDone] = useState<"single" | "all" | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfPaperSize, setPdfPaperSize] = useState<PdfPaperSize>("A4");
  const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>("landscape");
  const [error, setError] = useState<string | null>(null);
  const [recap, setRecap] = useState<JudgeScoreRecapResponse | null>(null);

  useEffect(() => {
    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setLoading(false);
      setError("Token login tidak ditemukan. Silakan login ulang.");
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchJudgeScoreRecap(
          token,
          selectedGender === "Semua" ? undefined : { gender: selectedGender }
        );

        if (!cancelled) {
          setRecap(response);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getReadableApiError(err));
          setRecap(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [selectedGender]);

  const rows = useMemo(() => recap?.data ?? [], [recap]);

  const tableData = useMemo(() => {
    const stageRows = [...rows];

    if (selectedStage === "Audition") {
      return stageRows
        .filter((row) => row.audition_average > 0)
        .sort((a, b) => b.audition_average - a.audition_average);
    }

    if (selectedStage === "Camp") {
      return stageRows
        .filter((row) => row.camp_average > 0)
        .sort((a, b) => b.camp_average - a.camp_average);
    }

    if (selectedStage === "Grand Final") {
      return stageRows
        .filter((row) => row.grand_final_average > 0)
        .sort((a, b) => b.grand_final_average - a.grand_final_average);
    }

    return stageRows
      .filter((row) => row.final_score > 0)
      .sort((a, b) => b.final_score - a.final_score);
  }, [rows, selectedStage]);

  const completion = useMemo(() => {
    const stageScopeRows = rows.filter((row) => {
      if (selectedStage === "Audition") {
        // Audition menghitung semua kandidat audisi yang ada di rekap.
        return true;
      }
      if (selectedStage === "Camp") {
        // Scope karantina: peserta yang sudah punya nilai karantina/final.
        return row.camp_average > 0 || row.grand_final_average > 0 || row.final_score > 0;
      }
      if (selectedStage === "Grand Final") {
        // Scope grand final: peserta yang sudah masuk grand final/final result.
        return row.grand_final_average > 0 || row.final_score > 0;
      }
      // Final result hanya menghitung finalis yang punya basis nilai final.
      return row.grand_final_average > 0 || row.camp_average > 0 || row.final_score > 0;
    });

    const total = stageScopeRows.length;
    if (total === 0) {
      return { total: 0, scored: 0, isComplete: false };
    }

    const scored = stageScopeRows.filter((row) => {
      if (selectedStage === "Audition") return row.audition_average > 0;
      if (selectedStage === "Camp") return row.camp_average > 0;
      if (selectedStage === "Grand Final") return row.grand_final_average > 0;
      return row.final_score > 0;
    }).length;

    return {
      total,
      scored,
      isComplete: scored === total,
    };
  }, [rows, selectedStage]);

  const isFinalStage = selectedStage === "Final Result";
  const canExportPdf = !isFinalStage || completion.isComplete;

  const headers = useMemo(() => {
    const maxJudges = recap?.meta.max_judges;

    if (selectedStage === "Final Result") {
      return [
        "Rank",
        "No Urut",
        "Nama",
        "Kategori",
        "Audisi",
        "Karantina",
        "Grand Final",
        "Karantina 30%",
        "Grand Final 70%",
        "Nilai Akhir",
      ];
    }

    const stageJudgeCount =
      selectedStage === "Audition"
        ? maxJudges?.audition ?? 0
        : selectedStage === "Camp"
          ? maxJudges?.camp ?? 0
          : maxJudges?.grand_final ?? 0;

    const criteriaKeys = getStageCriteriaKeys(selectedStage, recap);
    const criteriaHeaders = criteriaKeys.map(
      (key, index) => `Aspek ${index + 1}: ${criteriaLabelMap[key] ?? key}`
    );

    const judgeColumns = Array.from({ length: stageJudgeCount }, (_, index) => `Juri ${index + 1}`);

    return [
      "Rank",
      "No Urut",
      "Nama",
      "Kategori",
      ...criteriaHeaders,
      ...judgeColumns,
      "Total",
      "Rata-rata",
    ];
  }, [recap, selectedStage]);

  const workbookSheets = useMemo<WorkbookSheet[]>(() => {
    const maxJudges = recap?.meta.max_judges;

    const buildStageSheet = (stage: "Audition" | "Camp" | "Grand Final"): WorkbookSheet => {
      const stageRows = [...rows]
        .filter((row) => {
          if (stage === "Audition") return row.audition_average > 0;
          if (stage === "Camp") return row.camp_average > 0;
          return row.grand_final_average > 0;
        })
        .sort((a, b) => {
          if (stage === "Audition") return b.audition_average - a.audition_average;
          if (stage === "Camp") return b.camp_average - a.camp_average;
          return b.grand_final_average - a.grand_final_average;
        });

      const judgeCount =
        stage === "Audition"
          ? maxJudges?.audition ?? 0
          : stage === "Camp"
            ? maxJudges?.camp ?? 0
            : maxJudges?.grand_final ?? 0;

      const judgeHeaders = Array.from({ length: judgeCount }, (_, index) => `Juri ${index + 1}`);
      const criteriaKeys = getStageCriteriaKeys(stage, recap);
      const criteriaHeaders = criteriaKeys.map(
        (key, index) => `Aspek ${index + 1}: ${criteriaLabelMap[key] ?? key}`
      );

      const sheetRows = stageRows.map((row, index) => {
        const summary = stage === "Audition" ? row.audition : stage === "Camp" ? row.camp : row.grand_final;
        const criteriaAverage = getStageCriteriaAverage(stage, row);
        const criteriaValues = criteriaKeys.map((key) =>
          Number(((criteriaAverage[key] ?? 0) as number).toFixed(2))
        );

        return [
          index + 1,
          normalizeParticipantCode(row.participant_number),
          toDisplayParticipantName(row.participant_name, row.gender),
          row.gender ?? "-",
          ...criteriaValues,
          ...padJudgeScores(summary.judge_scores, judgeCount),
          Number(summary.total.toFixed(2)),
          Number(summary.average.toFixed(2)),
        ];
      });

      return {
        name: sheetNameMap[stage],
        headers: [
          "Rank",
          "No Urut",
          "Nama",
          "Kategori",
          ...criteriaHeaders,
          ...judgeHeaders,
          "Total",
          "Rata-rata",
        ],
        rows: sheetRows,
      };
    };

    const finalRows = [...rows]
      .filter((row) => row.final_score > 0)
      .sort((a, b) => b.final_score - a.final_score)
      .map((row, index) => [
        index + 1,
        normalizeParticipantCode(row.participant_number),
        toDisplayParticipantName(row.participant_name, row.gender),
        row.gender ?? "-",
        Number(row.audition_average.toFixed(2)),
        Number(row.camp_average.toFixed(2)),
        Number(row.grand_final_average.toFixed(2)),
        Number(row.camp_weighted_30.toFixed(2)),
        Number(row.grand_final_weighted_70.toFixed(2)),
        Number(row.final_score.toFixed(2)),
      ]);

    return [
      buildStageSheet("Audition"),
      buildStageSheet("Camp"),
      buildStageSheet("Grand Final"),
      {
        name: sheetNameMap["Final Result"],
        headers: [
          "Rank",
          "No Urut",
          "Nama",
          "Kategori",
          "Audisi",
          "Karantina",
          "Grand Final",
          "Karantina 30%",
          "Grand Final 70%",
          "Nilai Akhir",
        ],
        rows: finalRows,
      },
    ];
  }, [recap, rows]);

  const exportWorkbook = (onlyActiveStage: boolean) => {
    const sheets = onlyActiveStage
      ? workbookSheets.filter((sheet) => sheet.name === sheetNameMap[selectedStage])
      : workbookSheets;

    const workbookXml = buildWorkbookXml(sheets);
    const blob = new Blob([workbookXml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = onlyActiveStage
      ? `Rekap_${selectedStage.replace(/\s/g, "_")}.xls`
      : "Rekap_Semua_Tahap.xls";
    anchor.click();
    URL.revokeObjectURL(url);

    setDone(onlyActiveStage ? "single" : "all");
    setTimeout(() => setDone(null), 2500);
  };

  const exportJuryPdf = async () => {
    const currentSheet = workbookSheets.find(
      (sheet) => sheet.name === sheetNameMap[selectedStage]
    );
    if (!currentSheet || currentSheet.rows.length === 0) {
      return;
    }

    try {
      setExportingPdf(true);
      const generatedAt = new Date().toLocaleString("id-ID", {
        dateStyle: "full",
        timeStyle: "short",
      });

      const blob = await pdf(
        <JuryReportDocument
          stageLabel={stageLabels[selectedStage]}
          genderLabel={selectedGender}
          headers={currentSheet.headers}
          rows={currentSheet.rows}
          generatedAtLabel={generatedAt}
          paperSize={pdfPaperSize}
          orientation={pdfOrientation}
          logoUrl={`${window.location.origin}/logo.png`}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Laporan_Juri_${selectedStage.replace(/\s/g, "_")}_${pdfPaperSize}_${pdfOrientation}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingPdf(false);
    }
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
          Export Data
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
        >
          Rekap diambil langsung dari database per tahap: audisi, karantina, grand final, lalu nilai akhir gabungan.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Baris Preview",
            value: tableData.length,
            sub: `Tahap ${stageLabels[selectedStage]}`,
            icon: <ClipboardList size={18} />,
            color: "#D4AF37",
          },
          {
            label: "Sheet Workbook",
            value: workbookSheets.length,
            sub: "AUDISI, KARANTINA, GRAND FINAL, NILAI AKHIR",
            icon: <FileSpreadsheet size={18} />,
            color: "#60a5fa",
          },
          {
            label: "Mode Gabungan",
            value: "30/70",
            sub: "Karantina 30% + Grand Final 70%",
            icon: <Sigma size={18} />,
            color: "#f59e0b",
          },
          {
            label: "Sumber Data",
            value: loading ? "Sync..." : error ? "Error" : "DB",
            sub: error ? error : "Tidak memakai data mock",
            icon: <Download size={18} />,
            color: error ? "#ef4444" : "#22c55e",
          },
        ].map((item) => (
          <GoldCard key={item.label}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className="text-xs mb-1"
                  style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
                >
                  {item.label}
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}
                >
                  {item.value}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "#666", fontFamily: "var(--font-poppins)" }}
                >
                  {item.sub}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: `${item.color}18`, color: item.color }}
              >
                {item.icon}
              </div>
            </div>
          </GoldCard>
        ))}
      </div>

      <GoldCard glow className="mb-6">
        <div
          className="mb-4 rounded-xl px-4 py-3"
          style={{
            border: "1px solid rgba(212,175,55,0.2)",
            background: "rgba(212,175,55,0.05)",
          }}
        >
          <p
            className="text-xs"
            style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}
          >
            Progress nilai tahap {stageLabels[selectedStage]}:{" "}
            <span style={{ color: "#F5E6C8", fontWeight: 700 }}>
              {completion.scored}/{completion.total} peserta
            </span>
            .{" "}
            {canExportPdf
              ? isFinalStage
                ? "Penilaian lengkap, PDF final bisa diexport."
                : "PDF tahap ini tetap bisa diexport meski progres belum 100%."
              : "Penilaian belum lengkap, PDF final masih dikunci."}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label
              className="block text-xs mb-2"
              style={{
                color: "#D4AF37",
                fontFamily: "var(--font-poppins)",
                fontWeight: 600,
              }}
            >
              Kertas PDF
            </label>
            <select
              value={pdfPaperSize}
              onChange={(event) => setPdfPaperSize(event.target.value as PdfPaperSize)}
              className="px-3 py-2 rounded-xl text-xs"
              style={{
                background: "#141414",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#F5E6C8",
                fontFamily: "var(--font-poppins)",
              }}
            >
              <option value="A4" style={{ color: "#111827", background: "#F5E6C8" }}>A4</option>
              <option value="A3" style={{ color: "#111827", background: "#F5E6C8" }}>A3</option>
              <option value="A2" style={{ color: "#111827", background: "#F5E6C8" }}>A2</option>
              <option value="A1" style={{ color: "#111827", background: "#F5E6C8" }}>A1</option>
              <option value="LETTER" style={{ color: "#111827", background: "#F5E6C8" }}>LETTER</option>
              <option value="LEGAL" style={{ color: "#111827", background: "#F5E6C8" }}>LEGAL</option>
            </select>
          </div>

          <div>
            <label
              className="block text-xs mb-2"
              style={{
                color: "#D4AF37",
                fontFamily: "var(--font-poppins)",
                fontWeight: 600,
              }}
            >
              Orientasi PDF
            </label>
            <select
              value={pdfOrientation}
              onChange={(event) =>
                setPdfOrientation(event.target.value as PdfOrientation)
              }
              className="px-3 py-2 rounded-xl text-xs"
              style={{
                background: "#141414",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#F5E6C8",
                fontFamily: "var(--font-poppins)",
              }}
            >
              <option value="landscape" style={{ color: "#111827", background: "#F5E6C8" }}>Landscape</option>
              <option value="portrait" style={{ color: "#111827", background: "#F5E6C8" }}>Portrait</option>
            </select>
          </div>

          <div>
            <label
              className="block text-xs mb-2"
              style={{
                color: "#D4AF37",
                fontFamily: "var(--font-poppins)",
                fontWeight: 600,
              }}
            >
              Filter Tahap
            </label>
            <div className="flex gap-2 flex-wrap">
              {exportStages.map((stage) => (
                <button
                  key={stage}
                  onClick={() => setSelectedStage(stage)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background:
                      selectedStage === stage
                        ? "linear-gradient(135deg, #F5D06F, #D4AF37)"
                        : "rgba(212,175,55,0.08)",
                    color: selectedStage === stage ? "#0F0F0F" : "#D4AF37",
                    border: `1px solid ${
                      selectedStage === stage
                        ? "transparent"
                        : "rgba(212,175,55,0.2)"
                    }`,
                    fontFamily: "var(--font-cinzel)",
                    cursor: "pointer",
                  }}
                  type="button"
                >
                  {stageLabels[stage]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className="block text-xs mb-2"
              style={{
                color: "#D4AF37",
                fontFamily: "var(--font-poppins)",
                fontWeight: 600,
              }}
            >
              Filter Kategori
            </label>
            <div className="flex gap-2">
              {(["Semua", "Encik", "Puan"] as const).map((gender) => (
                <button
                  key={gender}
                  onClick={() => setSelectedGender(gender)}
                  className="px-4 py-2 rounded-xl text-xs transition-all"
                  style={{
                    background:
                      selectedGender === gender
                        ? "rgba(212,175,55,0.15)"
                        : "transparent",
                    border: `1px solid ${
                      selectedGender === gender
                        ? "rgba(212,175,55,0.5)"
                        : "rgba(255,255,255,0.08)"
                    }`,
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
            <GoldButton
              variant="outline"
              onClick={() => exportWorkbook(true)}
              disabled={loading || Boolean(error)}
            >
              {done === "single" ? (
                <CheckCircle size={16} />
              ) : (
                <Download size={16} />
              )}
              Export Tahap Aktif
            </GoldButton>
            <GoldButton
              variant="primary"
              onClick={() => exportWorkbook(false)}
              disabled={loading || Boolean(error)}
            >
              {done === "all" ? (
                <CheckCircle size={16} />
              ) : (
                <Download size={16} />
              )}
              Export Semua Tahap
            </GoldButton>
            <GoldButton
              variant="outline"
              onClick={exportJuryPdf}
              disabled={
                loading ||
                Boolean(error) ||
                exportingPdf ||
                tableData.length === 0 ||
                !canExportPdf
              }
            >
              {exportingPdf ? <CheckCircle size={16} /> : <FileText size={16} />}
              Export PDF Laporan Juri
            </GoldButton>
          </div>
        </div>
      </GoldCard>

      <GoldCard>
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-sm font-bold"
            style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}
          >
            Preview: Rekap {stageLabels[selectedStage]}
          </h3>
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: "rgba(212,175,55,0.1)",
              color: "#D4AF37",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {tableData.length} peserta
          </span>
        </div>

        {error ? (
          <p
            className="text-sm"
            style={{ color: "#fca5a5", fontFamily: "var(--font-poppins)" }}
          >
            {error}
          </p>
        ) : loading ? (
          <p
            className="text-sm"
            style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
          >
            Sinkronisasi data rekap dari database...
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full text-xs"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(212,175,55,0.08)",
                    borderBottom: "1px solid rgba(212,175,55,0.15)",
                  }}
                >
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="px-3 py-2 text-left whitespace-nowrap"
                      style={{ color: "#D4AF37" }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => {
                  const rank = index + 1;
                  const participantCode = splitParticipantCode(row.participant_number);
                  const baseCells = [
                    <td
                      key="rank"
                      className="px-3 py-2.5"
                      style={{ color: "#F5E6C8" }}
                    >
                      {rank}
                    </td>,
                    <td key="number" className="px-3 py-2.5" style={{ color: "#888", lineHeight: 1.2 }}>
                      {participantCode.suffix ? (
                        <>
                          <span className="block">{participantCode.prefix}</span>
                          <span className="block">{participantCode.suffix}</span>
                        </>
                      ) : (
                        participantCode.prefix
                      )}
                    </td>,
                    <td
                      key="name"
                      className="px-3 py-2.5"
                      style={{ color: "#F5E6C8" }}
                    >
                      {toDisplayParticipantName(row.participant_name, row.gender)}
                    </td>,
                    <td
                      key="gender"
                      className="px-3 py-2.5"
                      style={{
                        color: row.gender === "Encik" ? "#60a5fa" : "#f472b6",
                      }}
                    >
                      {row.gender ?? "-"}
                    </td>,
                  ];

                  if (selectedStage === "Final Result") {
                    return (
                      <tr
                        key={`${selectedStage}-${row.participant_id}`}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        {baseCells}
                        <td className="px-3 py-2.5 text-center" style={{ color: "#BDBDBD" }}>
                          {row.audition_average.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-center" style={{ color: "#BDBDBD" }}>
                          {row.camp_average.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-center" style={{ color: "#BDBDBD" }}>
                          {row.grand_final_average.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-center" style={{ color: "#BDBDBD" }}>
                          {row.camp_weighted_30.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-center" style={{ color: "#BDBDBD" }}>
                          {row.grand_final_weighted_70.toFixed(2)}
                        </td>
                        <td
                          className="px-3 py-2.5 text-center"
                          style={{ color: "#D4AF37", fontWeight: 700 }}
                        >
                          {row.final_score.toFixed(2)}
                        </td>
                      </tr>
                    );
                  }

                  const summary =
                    selectedStage === "Audition"
                      ? row.audition
                      : selectedStage === "Camp"
                        ? row.camp
                        : row.grand_final;

                  const criteriaKeys = getStageCriteriaKeys(selectedStage, recap);
                  const criteriaAverage = getStageCriteriaAverage(selectedStage, row);
                  const criteriaCells = criteriaKeys.map((key, criteriaIndex) => (
                    <td
                      key={`criteria-${criteriaIndex}`}
                      className="px-3 py-2.5 text-center"
                      style={{ color: "#BDBDBD" }}
                    >
                      {Number(((criteriaAverage[key] ?? 0) as number)).toFixed(2)}
                    </td>
                  ));

                  const judgeCount =
                    selectedStage === "Audition"
                      ? recap?.meta.max_judges.audition ?? 0
                      : selectedStage === "Camp"
                        ? recap?.meta.max_judges.camp ?? 0
                        : recap?.meta.max_judges.grand_final ?? 0;

                  const judgeCells = padJudgeScores(summary.judge_scores, judgeCount).map(
                    (score, judgeIndex) => (
                      <td
                        key={`judge-${judgeIndex}`}
                        className="px-3 py-2.5 text-center"
                        style={{ color: score === "" ? "#555" : "#BDBDBD" }}
                      >
                        {score === "" ? "-" : Number(score).toFixed(2)}
                      </td>
                    )
                  );

                  return (
                    <tr
                      key={`${selectedStage}-${row.participant_id}`}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      {baseCells}
                      {criteriaCells}
                      {judgeCells}
                      <td className="px-3 py-2.5 text-center" style={{ color: "#BDBDBD" }}>
                        {summary.total.toFixed(2)}
                      </td>
                      <td
                        className="px-3 py-2.5 text-center"
                        style={{ color: "#D4AF37", fontWeight: 700 }}
                      >
                        {summary.average.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GoldCard>
    </div>
  );
}

