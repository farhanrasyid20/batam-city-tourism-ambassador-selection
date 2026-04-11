/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */
import React from "react";
import { FileArchive } from "lucide-react";
import GoldCard from "../../../../../components/dashboard/GoldCard";
import type { ParticipantResources, ResourceDocument } from "../../../../../context/AppContext";
import type { DocumentConfig } from "./types";

type DocumentSummaryCardProps = {
  form: ParticipantResources;
  documentConfigs: DocumentConfig[];
  getDocumentSummary: (document: ResourceDocument) => string;
};

export default function DocumentSummaryCard({
  form,
  documentConfigs,
  getDocumentSummary,
}: DocumentSummaryCardProps) {
  return (
    <GoldCard>
      <h3 className="text-sm font-bold mb-4" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
        Ringkasan Dokumen
      </h3>
      <div className="space-y-3 text-xs" style={{ fontFamily: "var(--font-poppins)" }}>
        {documentConfigs.map((documentItem) => {
          const document = form[documentItem.key];
          return (
            <div
              key={documentItem.key}
              className="p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.12)" }}
            >
              <div className="flex items-center gap-2 mb-1" style={{ color: "#D4AF37" }}>
                <FileArchive size={12} />
                <span>{documentItem.label}</span>
              </div>
              <p style={{ color: document.fileName || document.linkUrl ? "#F5E6C8" : "#666" }}>
                {getDocumentSummary(document)}
              </p>
            </div>
          );
        })}
      </div>
    </GoldCard>
  );
}

