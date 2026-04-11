"use client";

import React, { useMemo, useState } from "react";
import { useApp } from "../../../context/AppContext";

/**
 * Daftar FAQ dengan fitur pencarian teks, filter kategori, dan pembatasan jumlah item.
 * Dipakai di halaman FAQ penuh maupun section ringkas (dengan properti `limit`).
 */
export default function FAQList({ limit }: { limit?: number }) {
  const { faqList } = useApp();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "Semua" | "Pendaftaran" | "Berkas" | "Tahapan" | "Akun" | "Penilaian"
  >("Semua");

  const categories = ["Semua", "Pendaftaran", "Berkas", "Tahapan", "Akun", "Penilaian"] as const;

  /**
   * Menyaring data FAQ berdasarkan kategori aktif dan kata kunci pencarian.
   */
  const filtered = useMemo(() => {
    return faqList.filter((x) => {
      const matchCategory = activeCategory === "Semua" ? true : x.category === activeCategory;
      const matchQuery =
        (x.question + " " + x.answer).toLowerCase().includes(query.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [faqList, query, activeCategory]);

  const displayed = typeof limit === "number" ? filtered.slice(0, limit) : filtered;

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          suppressHydrationWarning
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari pertanyaan..."
          className="w-full md:w-[420px] rounded-xl px-4 py-3 bg-[#141414] border border-yellow-700/25 text-[#F5E6C8] outline-none"
        />

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className="px-3 py-2 rounded-xl text-sm border transition"
              style={{
                borderColor: "rgba(200,162,77,0.25)",
                color: activeCategory === c ? "#0F0F0F" : "#F5E6C8",
                background:
                  activeCategory === c
                    ? "linear-gradient(135deg, #F5D06F, #C8A24D, #8C6A1C)"
                    : "transparent",
                fontFamily: "var(--font-poppins)",
              }}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {displayed.map((item) => (
          <details
            key={item.id}
            className="rounded-2xl bg-[#1A1A1A] border border-yellow-700/25 px-5 py-4"
          >
            <summary
              className="cursor-pointer select-none"
              style={{ color: "#F5D06F", fontFamily: "var(--font-cinzel)" }}
            >
              {item.question}
            </summary>
            <p className="mt-3 text-sm text-gray-300 leading-relaxed">
              {item.answer}
            </p>
            <p className="mt-3 text-xs text-gray-500">
              Kategori: <span style={{ color: "#C8A24D" }}>{item.category}</span>
            </p>
          </details>
        ))}

        {displayed.length === 0 && (
          <div className="text-sm text-gray-400">
            Tidak ada hasil yang cocok.
          </div>
        )}
      </div>
    </div>
  );
}

