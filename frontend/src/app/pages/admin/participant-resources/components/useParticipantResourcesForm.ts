"use client";

import React, { useState } from "react";
import {
  useApp,
  type ParticipantResources,
  type ResourceDocument,
  type ResourceImage,
} from "../../../../../context/AppContext";
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
    if (saveMessage) setSaveMessage("");
  };

  const clearSingleImage = (key: ResourceImageField, fallbackCaption: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: createEmptyImage(fallbackCaption),
    }));
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
    if (saveMessage) setSaveMessage("");
  };

  const handleSave = () => {
    setParticipantResources(form);
    setSaveMessage("Pusat dokumen peserta berhasil diperbarui.");
  };

  return {
    form,
    saveMessage,
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
