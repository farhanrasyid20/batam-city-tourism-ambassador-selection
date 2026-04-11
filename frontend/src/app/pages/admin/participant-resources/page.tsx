"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React from "react";
import { Save } from "lucide-react";
import { GoldButton } from "../../../../components/ui/GoldButton";
import DocumentSummaryCard from "./components/DocumentSummaryCard";
import HashtagMentionsCard from "./components/HashtagMentionsCard";
import OfficialDocumentsCard from "./components/OfficialDocumentsCard";
import PhotoExamplesCard from "./components/PhotoExamplesCard";
import ResourceStatusCard from "./components/ResourceStatusCard";
import TextSectionCard from "./components/TextSectionCard";
import { documentConfigs, textSections } from "./components/config";
import {
  getDocumentSourceLabel,
  getDocumentSummary,
  inputStyle,
  useParticipantResourcesForm,
} from "./components/useParticipantResourcesForm";

export default function AdminParticipantResourcesPage() {
  const {
    form,
    saveMessage,
    isSaving,
    updateTextField,
    updateDocumentLink,
    updateDocumentFile,
    clearDocumentFile,
    updateSingleImage,
    clearSingleImage,
    updateExampleImage,
    updateExampleCaption,
    clearExampleImage,
    handleSave,
  } = useParticipantResourcesForm();

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
          Pusat Dokumen Peserta
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Kelola dokumen resmi, twibbon, hashtag, dan grup WhatsApp peserta dalam satu halaman.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid xl:grid-cols-[1.45fr_0.75fr] gap-6 items-start">
          <OfficialDocumentsCard
            form={form}
            documentConfigs={documentConfigs}
            inputStyle={inputStyle}
            updateDocumentLink={updateDocumentLink}
            updateDocumentFile={updateDocumentFile}
            clearDocumentFile={clearDocumentFile}
            getDocumentSourceLabel={getDocumentSourceLabel}
          />

          <div className="space-y-6">
            <DocumentSummaryCard
              form={form}
              documentConfigs={documentConfigs}
              getDocumentSummary={getDocumentSummary}
            />
            <HashtagMentionsCard form={form} />
            <ResourceStatusCard form={form} />
          </div>
        </div>

        <PhotoExamplesCard
          form={form}
          inputStyle={inputStyle}
          updateExampleCaption={updateExampleCaption}
          updateExampleImage={updateExampleImage}
          clearExampleImage={clearExampleImage}
        />

        {textSections.map((section) => (
          <TextSectionCard
            key={section.title}
            form={form}
            section={section}
            inputStyle={inputStyle}
            updateTextField={updateTextField}
            updateDocumentFile={updateDocumentFile}
            clearDocumentFile={clearDocumentFile}
            updateSingleImage={updateSingleImage}
            clearSingleImage={clearSingleImage}
          />
        ))}

        <div className="flex items-center gap-3">
          <GoldButton variant="primary" size="sm" onClick={() => void handleSave()} disabled={isSaving}>
            <Save size={14} />
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </GoldButton>
          {saveMessage ? (
            <p className="text-xs" style={{ color: "#22c55e", fontFamily: "var(--font-poppins)" }}>
              {saveMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

