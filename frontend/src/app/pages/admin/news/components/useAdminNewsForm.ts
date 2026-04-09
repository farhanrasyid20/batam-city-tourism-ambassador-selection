"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "../../../../../context/AppContext";
import {
  createNews,
  deleteNews,
  fetchAdminNews,
  updateNews,
  type NewsItem,
} from "../../../../../lib/auth-api";
import { getReadableApiError } from "../../../../../lib/api";
import { getParticipantAuthSession } from "../../../../../lib/auth-storage";
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

  useEffect(() => {
    let cancelled = false;

    const loadNews = async () => {
      const token = getParticipantAuthSession()?.token;
      if (!token) {
        if (!cancelled) {
          setFormError("Sesi login tidak ditemukan. Silakan login ulang.");
        }
        return;
      }

      try {
        const response = await fetchAdminNews(token);
        if (cancelled) return;
        setNewsList(response.data);
      } catch (error) {
        if (cancelled) return;
        setFormError(getReadableApiError(error));
      }
    };

    void loadNews();

    return () => {
      cancelled = true;
    };
  }, [setNewsList]);

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

  const handleSave = async () => {
    const cleanTitle = form.title.trim();
    const excerpt = toExcerptFromHtml(form.contentHtml);

    if (!cleanTitle || !excerpt) {
      setFormError("Judul dan isi berita wajib diisi.");
      return;
    }

    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setFormError("Sesi login tidak ditemukan. Silakan login ulang.");
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
    };

    try {
      if (editId) {
        const response = await updateNews(token, editId, payload);
        setNewsList((prev) => prev.map((item) => (item.id === editId ? response.data : item)));
      } else {
        const response = await createNews(token, payload);
        setNewsList((prev) => [response.data, ...prev]);
      }

      resetForm();
    } catch (error) {
      setFormError(getReadableApiError(error));
      setIsSaving(false);
    }
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

  const handleDelete = async (id: string) => {
    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setFormError("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    try {
      await deleteNews(token, id);
      setNewsList((prev) => prev.filter((item) => item.id !== id));
      if (editId === id) {
        resetForm();
      }
    } catch (error) {
      setFormError(getReadableApiError(error));
    }
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

