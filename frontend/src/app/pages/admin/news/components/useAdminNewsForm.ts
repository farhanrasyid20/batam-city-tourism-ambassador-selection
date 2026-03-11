"use client";

import React, { useState } from "react";
import { useApp } from "../../../../../context/AppContext";
import type { NewsBlock, NewsItem } from "../../../../../data/mockData";
import { defaultImage } from "./config";
import { blocksToHtml, getTodayDate, readFileAsDataUrl, toExcerptFromHtml } from "./newsUtils";
import type { NewsFormState } from "./types";

export const inputStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid rgba(212,175,55,0.25)",
  color: "#F5E6C8",
  fontFamily: "var(--font-poppins)",
};

export function useAdminNewsForm() {
  const { newsList, setNewsList } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<NewsFormState>({
    title: "",
    contentHtml: "",
    coverImage: "",
    date: getTodayDate(),
    category: "Pengumuman",
  });

  const resetForm = () => {
    setForm({
      title: "",
      contentHtml: "",
      coverImage: "",
      date: getTodayDate(),
      category: "Pengumuman",
    });
    setEditId(null);
    setShowForm(false);
    setFormError("");
    setIsSaving(false);
  };

  const openCreateForm = () => {
    if (showForm && !editId) {
      resetForm();
      return;
    }
    setEditId(null);
    setForm({
      title: "",
      contentHtml: "",
      coverImage: "",
      date: getTodayDate(),
      category: "Pengumuman",
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSave = () => {
    const cleanTitle = form.title.trim();
    const excerpt = toExcerptFromHtml(form.contentHtml);

    if (!cleanTitle || !excerpt) {
      setFormError("Judul dan isi berita wajib diisi.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    const payload = {
      title: cleanTitle,
      image: form.coverImage || defaultImage,
      date: form.date,
      category: form.category,
      excerpt,
      contentHtml: form.contentHtml,
      body: excerpt ? [{ type: "paragraph", text: excerpt } as NewsBlock] : [],
    };

    if (editId) {
      setNewsList((prev) => prev.map((item) => (item.id === editId ? { ...item, ...payload } : item)));
    } else {
      const newItem: NewsItem = {
        id: `n${Date.now()}`,
        ...payload,
      };
      setNewsList((prev) => [newItem, ...prev]);
    }

    resetForm();
  };

  const handleEdit = (item: NewsItem) => {
    setEditId(item.id);
    setForm({
      title: item.title,
      contentHtml: item.contentHtml ?? blocksToHtml(item.body),
      coverImage: item.image,
      date: item.date,
      category: item.category,
    });
    setFormError("");
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setNewsList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCoverImageChange = async (file: File | null) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setForm((prev) => ({ ...prev, coverImage: dataUrl }));
  };

  return {
    newsList,
    showForm,
    editId,
    isSaving,
    formError,
    form,
    setForm,
    resetForm,
    openCreateForm,
    handleSave,
    handleEdit,
    handleDelete,
    handleCoverImageChange,
  };
}
