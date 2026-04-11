"use client";

import { apiRequest } from "./api";

type ExportKind = "excel" | "pdf";
type ExportStage = "Audition" | "Camp" | "Grand Final" | "Final Result";
type ExportGender = "Semua" | "Encik" | "Puan";

export type ExportReportUploadResponse = {
  message: string;
  data: {
    kind: ExportKind;
    stage: ExportStage;
    gender: ExportGender;
    file_name: string;
    storage_path: string;
    public_url: string;
    saved_at: string;
  };
};

/**
 * Mengunggah file laporan export (excel/pdf) ke endpoint super admin.
 */
export async function uploadExportReport(
  token: string,
  payload: {
    kind: ExportKind;
    stage: ExportStage;
    gender: ExportGender;
    file: File;
  }
) {
  const form = new FormData();
  form.append("kind", payload.kind);
  form.append("stage", payload.stage);
  form.append("gender", payload.gender);
  form.append("file", payload.file);

  return apiRequest<ExportReportUploadResponse>("/super-admin/exports/upload", {
    method: "POST",
    token,
    body: form,
  });
}

