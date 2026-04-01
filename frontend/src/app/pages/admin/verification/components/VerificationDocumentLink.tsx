"use client";

import React from "react";
import { useApp } from "../../../../../context/AppContext";
import type { Participant, ParticipantDocumentItem } from "../../../../../data/mockData";

type VerificationDocumentLinkProps = {
  participant: Participant;
  document: ParticipantDocumentItem;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
};

function resolveOfficialDocumentHref(documentKey: string, participantResources: ReturnType<typeof useApp>["participantResources"]) {
  switch (documentKey) {
    case "guide-form":
      return participantResources.guideDocument.fileDataUrl || participantResources.guideDocument.linkUrl || "/participant-resources/Buku-Panduan-Duta-Wisata-2026.pdf";
    case "form-s1":
      return participantResources.formS1Document.fileDataUrl || participantResources.formS1Document.linkUrl || "/participant-resources/S-01-Formulir-Pendaftaran-Encik-Puan-Batam-2026.pdf";
    case "form-s2":
      return participantResources.formS2Document.fileDataUrl || participantResources.formS2Document.linkUrl || "/participant-resources/S-02-Surat-Izin-Orang-Tua-Encik-Puan-Batam-2026.pdf";
    case "form-s3":
      return participantResources.formS3Document.fileDataUrl || participantResources.formS3Document.linkUrl || "/participant-resources/S-03-Pernyataan-Bersedia-Menjadi-Duta-Wisata-2026.pdf";
    case "form-s4":
      return participantResources.formS4Document.fileDataUrl || participantResources.formS4Document.linkUrl || "/participant-resources/S-04-Kesanggupan-Mengikuti-Rangkaian-Kegiatan-2026.pdf";
    default:
      return "";
  }
}

export function getVerificationDocumentMeta(
  participant: Participant,
  document: ParticipantDocumentItem,
  participantResources: ReturnType<typeof useApp>["participantResources"]
) {
  const href =
    document.url ||
    (((document.key === "close-up" || document.key === "full-body") && participant.photo) ? participant.photo : "") ||
    resolveOfficialDocumentHref(document.key, participantResources);

  const fileName =
    document.originalName ||
    (document.url ? document.url.split("/").pop()?.split("?")[0] ?? "" : "");

  return {
    href,
    fileName: fileName || "",
  };
}

export default function VerificationDocumentLink({ participant, document, children, className, style, title }: VerificationDocumentLinkProps) {
  const { participantResources } = useApp();
  const { href } = getVerificationDocumentMeta(participant, document, participantResources);

  return (
    <button
      type="button"
      onClick={() => {
        if (!href || typeof window === "undefined") return;
        window.open(href, "_blank", "noopener,noreferrer");
      }}
      disabled={!href}
      className={className}
      style={{
        ...style,
        cursor: href ? "pointer" : "not-allowed",
        opacity: href ? 1 : 0.55,
      }}
      title={title ?? (href ? "Buka dokumen di tab baru" : "File belum tersedia")}
    >
      {children}
    </button>
  );
}
