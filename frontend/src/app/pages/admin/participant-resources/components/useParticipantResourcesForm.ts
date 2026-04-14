"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React, { useEffect, useState } from "react";
import {
  useApp,
  type ParticipantResources,
  type ResourceDocument,
  type ResourceImage,
} from "../../../../../context/AppContext";
import {
  updateParticipantResources,
  type UpdateParticipantResourcesFiles,
} from "../../../../../lib/auth-api";
import { resolveApiAssetUrl } from "../../../../../lib/api";
import { getParticipantAuthSession } from "../../../../../lib/auth-storage";
import type {
  ResourceDocumentField,
  ResourceImageField,
  ResourceImageListField,
  ResourceTextField,
} from "./types";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

function createEmptyImage(caption: string): ResourceImage {
  return {
    imageUrl: "",
    imageName: "",
    caption,
  };
}

function normalizeResourceAssetUrl(value?: string | null): string {
  const normalized = (value ?? "").trim();
  if (!normalized) return "";
  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }
  if (normalized.startsWith("/storage/") || normalized.startsWith("storage/")) {
    return resolveApiAssetUrl(normalized) ?? normalized;
  }
  return normalized;
}

function normalizeResourcesForUi(value: ParticipantResources): ParticipantResources {
  const normalizeDocument = (doc: ResourceDocument): ResourceDocument => ({
    ...doc,
    linkUrl: normalizeResourceAssetUrl(doc.linkUrl),
    fileDataUrl: normalizeResourceAssetUrl(doc.fileDataUrl),
  });
  const normalizeImage = (image: ResourceImage): ResourceImage => ({
    ...image,
    imageUrl: normalizeResourceAssetUrl(image.imageUrl),
  });

  return {
    ...value,
    guideDocument: normalizeDocument(value.guideDocument),
    submissionDocument: normalizeDocument(value.submissionDocument),
    formS1Document: normalizeDocument(value.formS1Document),
    formS2Document: normalizeDocument(value.formS2Document),
    formS3Document: normalizeDocument(value.formS3Document),
    formS4Document: normalizeDocument(value.formS4Document),
    twibbonDocument: normalizeDocument(value.twibbonDocument),
    twibbonThumbnail: normalizeImage(value.twibbonThumbnail),
    whatsappThumbnail: normalizeImage(value.whatsappThumbnail),
    closeUpExamples: value.closeUpExamples.map(normalizeImage),
    fullBodyExamples: value.fullBodyExamples.map(normalizeImage),
  };
}

export function getDocumentSummary(document: ResourceDocument) {
  if (document.fileName) return `File: ${document.fileName}`;
  if (document.linkUrl) return `Link: ${document.linkUrl}`;
  return "Belum diisi";
}

export function getDocumentSourceLabel(document: ResourceDocument) {
  if (document.fileDataUrl) return "File Upload";
  if (document.linkUrl) return "Link";
  return "Kosong";
}

export const inputStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid rgba(212,175,55,0.25)",
  color: "#F5E6C8",
  fontFamily: "var(--font-poppins)",
};

export function useParticipantResourcesForm() {
  const { participantResources, setParticipantResources } = useApp();
  const [form, setForm] = useState<ParticipantResources>(participantResources);
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UpdateParticipantResourcesFiles>({});

  useEffect(() => {
    setForm(participantResources);
  }, [participantResources]);

  const markPendingFile = (key: keyof UpdateParticipantResourcesFiles, file: File | null) => {
    setPendingFiles((prev) => {
      const next = { ...prev };
      if (file) {
        next[key] = file;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const updateTextField = (key: ResourceTextField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (saveMessage) setSaveMessage("");
  };

  const updateDocumentLink = (key: ResourceDocumentField, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        linkUrl: value,
      },
    }));
    if (saveMessage) setSaveMessage("");
  };

  const updateDocumentFile = async (key: ResourceDocumentField, file: File | null) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        fileName: file.name,
        fileDataUrl: dataUrl,
        fileMimeType: file.type,
      },
    }));

    const map: Partial<Record<ResourceDocumentField, keyof UpdateParticipantResourcesFiles>> = {
      guideDocument: "guideDocumentFile",
      submissionDocument: "submissionDocumentFile",
      formS1Document: "formS1DocumentFile",
      formS2Document: "formS2DocumentFile",
      formS3Document: "formS3DocumentFile",
      formS4Document: "formS4DocumentFile",
      twibbonDocument: "twibbonDocumentFile",
    };
    const pendingKey = map[key];
    if (pendingKey) {
      markPendingFile(pendingKey, file);
    }

    if (saveMessage) setSaveMessage("");
  };

  const clearDocumentFile = (key: ResourceDocumentField) => {
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        fileName: "",
        fileDataUrl: "",
        fileMimeType: "",
      },
    }));

    const map: Partial<Record<ResourceDocumentField, keyof UpdateParticipantResourcesFiles>> = {
      guideDocument: "guideDocumentFile",
      submissionDocument: "submissionDocumentFile",
      formS1Document: "formS1DocumentFile",
      formS2Document: "formS2DocumentFile",
      formS3Document: "formS3DocumentFile",
      formS4Document: "formS4DocumentFile",
      twibbonDocument: "twibbonDocumentFile",
    };
    const pendingKey = map[key];
    if (pendingKey) {
      markPendingFile(pendingKey, null);
    }

    if (saveMessage) setSaveMessage("");
  };

  const updateSingleImage = async (
    key: ResourceImageField,
    file: File | null,
    fallbackCaption: string
  ) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        imageUrl: dataUrl,
        imageName: file.name,
        caption: prev[key].caption || fallbackCaption,
      },
    }));

    const map: Partial<Record<ResourceImageField, keyof UpdateParticipantResourcesFiles>> = {
      twibbonThumbnail: "twibbonThumbnailFile",
      whatsappThumbnail: "whatsappThumbnailFile",
    };
    const pendingKey = map[key];
    if (pendingKey) {
      markPendingFile(pendingKey, file);
    }

    if (saveMessage) setSaveMessage("");
  };

  const clearSingleImage = (key: ResourceImageField, fallbackCaption: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: createEmptyImage(fallbackCaption),
    }));

    const map: Partial<Record<ResourceImageField, keyof UpdateParticipantResourcesFiles>> = {
      twibbonThumbnail: "twibbonThumbnailFile",
      whatsappThumbnail: "whatsappThumbnailFile",
    };
    const pendingKey = map[key];
    if (pendingKey) {
      markPendingFile(pendingKey, null);
    }

    if (saveMessage) setSaveMessage("");
  };

  const updateExampleImage = async (
    key: ResourceImageListField,
    index: number,
    file: File | null,
    fallbackCaption: string
  ) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setForm((prev) => {
      const nextList = [...prev[key]];
      while (nextList.length <= index) {
        nextList.push(createEmptyImage(`${fallbackCaption} ${nextList.length + 1}`));
      }
      nextList[index] = {
        ...nextList[index],
        imageUrl: dataUrl,
        imageName: file.name,
        caption: nextList[index].caption || `${fallbackCaption} ${index + 1}`,
      };
      return { ...prev, [key]: nextList };
    });

    if (key === "closeUpExamples") {
      const targetKey = (["closeUpExample1File", "closeUpExample2File", "closeUpExample3File"] as const)[index];
      markPendingFile(targetKey, file);
    }
    if (key === "fullBodyExamples") {
      const targetKey = (["fullBodyExample1File", "fullBodyExample2File", "fullBodyExample3File"] as const)[index];
      markPendingFile(targetKey, file);
    }

    if (saveMessage) setSaveMessage("");
  };

  const updateExampleCaption = (
    key: ResourceImageListField,
    index: number,
    caption: string,
    fallbackCaption: string
  ) => {
    setForm((prev) => {
      const nextList = [...prev[key]];
      while (nextList.length <= index) {
        nextList.push(createEmptyImage(`${fallbackCaption} ${nextList.length + 1}`));
      }
      nextList[index] = {
        ...nextList[index],
        caption,
      };
      return { ...prev, [key]: nextList };
    });
    if (saveMessage) setSaveMessage("");
  };

  const clearExampleImage = (key: ResourceImageListField, index: number, fallbackCaption: string) => {
    setForm((prev) => {
      const nextList = [...prev[key]];
      while (nextList.length <= index) {
        nextList.push(createEmptyImage(`${fallbackCaption} ${nextList.length + 1}`));
      }
      nextList[index] = createEmptyImage(`${fallbackCaption} ${index + 1}`);
      return { ...prev, [key]: nextList };
    });

    if (key === "closeUpExamples") {
      const targetKey = (["closeUpExample1File", "closeUpExample2File", "closeUpExample3File"] as const)[index];
      markPendingFile(targetKey, null);
    }
    if (key === "fullBodyExamples") {
      const targetKey = (["fullBodyExample1File", "fullBodyExample2File", "fullBodyExample3File"] as const)[index];
      markPendingFile(targetKey, null);
    }

    if (saveMessage) setSaveMessage("");
  };

  const stripInlineDataUrls = (value: ParticipantResources): ParticipantResources => {
    const sanitizeDoc = (doc: ResourceDocument): ResourceDocument => ({
      ...doc,
      fileDataUrl: doc.fileDataUrl.startsWith("data:") ? "" : doc.fileDataUrl,
    });
    const sanitizeImage = (img: ResourceImage): ResourceImage => ({
      ...img,
      imageUrl: img.imageUrl.startsWith("data:") ? "" : img.imageUrl,
    });

    return {
      ...value,
      guideDocument: sanitizeDoc(value.guideDocument),
      submissionDocument: sanitizeDoc(value.submissionDocument),
      formS1Document: sanitizeDoc(value.formS1Document),
      formS2Document: sanitizeDoc(value.formS2Document),
      formS3Document: sanitizeDoc(value.formS3Document),
      formS4Document: sanitizeDoc(value.formS4Document),
      twibbonDocument: sanitizeDoc(value.twibbonDocument),
      twibbonThumbnail: sanitizeImage(value.twibbonThumbnail),
      whatsappThumbnail: sanitizeImage(value.whatsappThumbnail),
      closeUpExamples: value.closeUpExamples.map(sanitizeImage),
      fullBodyExamples: value.fullBodyExamples.map(sanitizeImage),
    };
  };

  const handleSave = async () => {
    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setSaveMessage("Sesi login habis. Silakan login ulang.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = stripInlineDataUrls(form);
      const response = await updateParticipantResources(token, payload, pendingFiles);
      const normalizedResources = normalizeResourcesForUi(response.data as ParticipantResources);
      setParticipantResources(normalizedResources);
      setForm(normalizedResources);
      setPendingFiles({});
      setSaveMessage("Pusat dokumen peserta berhasil diperbarui.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
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
  };
}

