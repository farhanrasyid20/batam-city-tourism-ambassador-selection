"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, Edit, Search, ChevronDown, ChevronRight } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { useApp } from "../../../../context/AppContext";
import type { FAQItem } from "../../../../data/faqData";
import { createFaq, deleteFaq, fetchAdminFaqs, updateFaq } from "../../../../lib/auth-api";
import { getReadableApiError } from "../../../../lib/api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";

const categories = ["Pendaftaran", "Berkas", "Tahapan", "Akun", "Penilaian"] as const;
type FaqCategory = (typeof categories)[number];
type FilterCategory = "Semua" | FaqCategory;

type FaqFormState = {
  question: string;
  answer: string;
  category: FaqCategory;
};

const initialForm: FaqFormState = {
  question: "",
  answer: "",
  category: "Pendaftaran",
};

export default function AdminFaqPage() {
  const { faqList, setFaqList } = useApp();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("Semua");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FaqFormState>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [openFaqIds, setOpenFaqIds] = useState<string[]>([]);

  useEffect(() => {
    const token = getParticipantAuthSession()?.token;
    if (!token) return;

    let cancelled = false;

    const loadFaqs = async () => {
      try {
        setErrorMessage("");
        const response = await fetchAdminFaqs(token);
        if (cancelled) return;
        setFaqList(response.data);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(getReadableApiError(error));
      }
    };

    void loadFaqs();

    return () => {
      cancelled = true;
    };
  }, [setFaqList]);

  const filteredFaq = useMemo(() => {
    return faqList.filter((item) => {
      const matchCategory = activeCategory === "Semua" ? true : item.category === activeCategory;
      const matchSearch = `${item.question} ${item.answer}`.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, faqList, search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;

    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setErrorMessage("Sesi login tidak ditemukan.");
      return;
    }

    try {
      setErrorMessage("");

      if (editingId) {
        const response = await updateFaq(token, editingId, {
          question: form.question.trim(),
          answer: form.answer.trim(),
          category: form.category,
        });

        setFaqList((prev) => prev.map((item) => (item.id === editingId ? response.data : item)));
      } else {
        const response = await createFaq(token, {
          question: form.question.trim(),
          answer: form.answer.trim(),
          category: form.category,
        });

        setFaqList((prev) => [response.data, ...prev]);
      }

      resetForm();
    } catch (error) {
      setErrorMessage(getReadableApiError(error));
    }
  };

  const handleEdit = (item: FAQItem) => {
    setEditingId(item.id);
    setForm({
      question: item.question,
      answer: item.answer,
      category: item.category,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setErrorMessage("Sesi login tidak ditemukan.");
      return;
    }

    try {
      setErrorMessage("");
      await deleteFaq(token, id);
      setFaqList((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      setErrorMessage(getReadableApiError(error));
    }
  };

  const toggleFaqOpen = (id: string) => {
    setOpenFaqIds((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
            Kelola FAQ
          </h1>
          <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
            Tambahkan pertanyaan, filter kategori, dan isi penjelasan FAQ untuk halaman publik.
          </p>
        </div>
        <GoldButton
          variant="primary"
          size="sm"
          onClick={() => {
            if (showForm && !editingId) {
              resetForm();
              return;
            }

            setEditingId(null);
            setForm(initialForm);
            setShowForm(true);
          }}
        >
          <Plus size={14} />
          Tambah FAQ
        </GoldButton>
      </div>

      <GoldCard className="mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-[420px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#D4AF37" }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari pertanyaan..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "#111",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#F5E6C8",
                fontFamily: "var(--font-poppins)",
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["Semua", ...categories] as const).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className="px-3 py-2 rounded-xl text-xs border transition"
                style={{
                  borderColor: "rgba(200,162,77,0.25)",
                  color: activeCategory === category ? "#0F0F0F" : "#F5E6C8",
                  background:
                    activeCategory === category
                      ? "linear-gradient(135deg, #F5D06F, #C8A24D, #8C6A1C)"
                      : "transparent",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        {errorMessage ? (
          <p className="text-xs mt-3" style={{ color: "#F59E0B", fontFamily: "var(--font-poppins)" }}>
            {errorMessage}
          </p>
        ) : null}
      </GoldCard>

      {showForm ? (
        <GoldCard glow className="mb-4">
          <h3 className="text-sm font-bold mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
            {editingId ? "Edit FAQ" : "FAQ Baru"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                Pertanyaan
              </label>
              <input
                type="text"
                value={form.question}
                onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))}
                placeholder="Tulis pertanyaan FAQ..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: "#111",
                  border: "1px solid rgba(212,175,55,0.25)",
                  color: "#F5E6C8",
                  fontFamily: "var(--font-poppins)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                Penjelasan / Jawaban
              </label>
              <textarea
                value={form.answer}
                onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
                rows={4}
                placeholder="Isi penjelasan jawaban FAQ..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{
                  background: "#111",
                  border: "1px solid rgba(212,175,55,0.25)",
                  color: "#F5E6C8",
                  fontFamily: "var(--font-poppins)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                Kategori
              </label>
              <select
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value as FaqCategory }))}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: "#111",
                  border: "1px solid rgba(212,175,55,0.25)",
                  color: "#F5E6C8",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <GoldButton variant="primary" size="sm" onClick={handleSave}>
                <Save size={14} />
                Simpan
              </GoldButton>
              <GoldButton variant="outline" size="sm" onClick={resetForm}>
                Batal
              </GoldButton>
            </div>
          </div>
        </GoldCard>
      ) : null}

      <div className="grid gap-3">
        {filteredFaq.map((item) => (
          <GoldCard key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => toggleFaqOpen(item.id)}
                className="flex-1 min-w-0 flex items-center gap-3 text-left"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                {openFaqIds.includes(item.id) ? (
                  <ChevronDown size={16} style={{ color: "#D4AF37", marginTop: 2, flexShrink: 0 }} />
                ) : (
                  <ChevronRight size={16} style={{ color: "#D4AF37", marginTop: 2, flexShrink: 0 }} />
                )}
                <p
                  style={{
                    color: "#F5D06F",
                    fontFamily: "var(--font-cinzel)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                  }}
                >
                  {item.question}
                </p>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(item)}
                  className="px-3 py-2 rounded-xl text-xs flex items-center gap-1"
                  style={{
                    background: "rgba(212,175,55,0.1)",
                    border: "1px solid rgba(212,175,55,0.2)",
                    color: "#D4AF37",
                    fontFamily: "var(--font-poppins)",
                    cursor: "pointer",
                  }}
                >
                  <Edit size={12} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="px-3 py-2 rounded-xl text-xs flex items-center gap-1"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#ef4444",
                    fontFamily: "var(--font-poppins)",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={12} />
                  Hapus
                </button>
              </div>
            </div>

            {openFaqIds.includes(item.id) ? (
              <>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "#E5E7EB", fontFamily: "var(--font-poppins)" }}>
                  {item.answer}
                </p>
                <p className="mt-3 text-xs" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                  Kategori: <span style={{ color: "#D4AF37" }}>{item.category}</span>
                </p>
              </>
            ) : null}
          </GoldCard>
        ))}

        {filteredFaq.length === 0 ? (
          <GoldCard className="text-center py-8">
            <p className="text-sm" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
              Tidak ada FAQ yang cocok dengan filter saat ini.
            </p>
          </GoldCard>
        ) : null}
      </div>
    </div>
  );
}
