"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Search, MessageSquareText, CheckCircle2 } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { useApp, type FeedbackEntry } from "../../../../context/AppContext";
import { fetchFeedbackList, updateFeedbackStatus } from "../../../../lib/auth-api";
import { getReadableApiError } from "../../../../lib/api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";

const categories = ["Semua", "Saran", "Kritik", "Pertanyaan", "Lainnya"] as const;
const statuses = ["Semua", "baru", "ditinjau", "selesai"] as const;

type CategoryFilter = (typeof categories)[number];
type StatusFilter = (typeof statuses)[number];

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminFeedbackPage() {
  const { feedbackList, setFeedbackList } = useApp();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("Semua");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadFeedback = useCallback(async (preferredId?: string | null) => {
    const token = getParticipantAuthSession()?.token;
    if (!token) return;

    try {
      setErrorMessage("");
      const response = await fetchFeedbackList(token);

      setFeedbackList(response.data);
      setSelectedId((current) => {
        const nextPreferredId = preferredId ?? current;
        if (nextPreferredId && response.data.some((item) => item.id === nextPreferredId)) {
          return nextPreferredId;
        }

        return response.data[0]?.id ?? null;
      });
    } catch (error) {
      setErrorMessage(getReadableApiError(error));
    }
  }, [setFeedbackList]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const filtered = useMemo(() => {
    return feedbackList.filter((item) => {
      const matchCategory = categoryFilter === "Semua" ? true : item.category === categoryFilter;
      const matchStatus = statusFilter === "Semua" ? true : item.status === statusFilter;
      const matchSearch = `${item.name} ${item.email} ${item.message}`.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchStatus && matchSearch;
    });
  }, [categoryFilter, feedbackList, search, statusFilter]);

  const selectedItem = filtered.find((item) => item.id === selectedId) ?? null;

  const updateStatus = async (id: string, status: FeedbackEntry["status"]) => {
    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setErrorMessage("Sesi login tidak ditemukan.");
      return;
    }

    try {
      setErrorMessage("");
      await updateFeedbackStatus(token, id, { status });
      await loadFeedback(id);
    } catch (error) {
      setErrorMessage(getReadableApiError(error));
    }
  };

  const summary = useMemo(
    () => ({
      total: feedbackList.length,
      baru: feedbackList.filter((item) => item.status === "baru").length,
      ditinjau: feedbackList.filter((item) => item.status === "ditinjau").length,
      selesai: feedbackList.filter((item) => item.status === "selesai").length,
    }),
    [feedbackList]
  );

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
          Data Feedback
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Feedback dari halaman publik masuk ke sini dan bisa difilter berdasarkan kategori maupun status.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: summary.total, color: "#D4AF37" },
          { label: "Baru", value: summary.baru, color: "#F59E0B" },
          { label: "Ditinjau", value: summary.ditinjau, color: "#3B82F6" },
          { label: "Selesai", value: summary.selesai, color: "#22c55e" },
        ].map((item) => (
          <GoldCard key={item.label} className="text-center p-4">
            <p className="text-lg font-bold" style={{ color: item.color, fontFamily: "var(--font-cinzel)" }}>
              {item.value}
            </p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
              {item.label}
            </p>
          </GoldCard>
        ))}
      </div>

      <GoldCard className="mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative w-full lg:flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#D4AF37" }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, email, atau isi feedback..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "#111",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#F5E6C8",
                fontFamily: "var(--font-poppins)",
              }}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
            className="px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#F5E6C8",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "Semua" ? "Semua Kategori" : item}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#F5E6C8",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === "Semua" ? "Semua Status" : item}
              </option>
            ))}
          </select>
        </div>
        {errorMessage ? (
          <p className="text-xs mt-3" style={{ color: "#F59E0B", fontFamily: "var(--font-poppins)" }}>
            {errorMessage}
          </p>
        ) : null}
      </GoldCard>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <GoldCard className="text-center py-10">
              <p className="text-sm" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                Belum ada feedback sesuai filter.
              </p>
            </GoldCard>
          ) : (
            filtered.map((item) => (
              <GoldCard key={item.id} className="p-4">
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="w-full text-left"
                  style={{ cursor: "pointer" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                      {item.name}
                    </p>
                    <span
                      className="text-[11px] px-2 py-1 rounded-full"
                      style={{
                        background:
                          item.status === "baru"
                            ? "rgba(245,158,11,0.15)"
                            : item.status === "ditinjau"
                            ? "rgba(59,130,246,0.15)"
                            : "rgba(34,197,94,0.15)",
                        color:
                          item.status === "baru"
                            ? "#F59E0B"
                            : item.status === "ditinjau"
                            ? "#60A5FA"
                            : "#22c55e",
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                    {item.email}
                  </p>
                  <p className="text-xs mt-2 line-clamp-2" style={{ color: "#E5E7EB", fontFamily: "var(--font-poppins)" }}>
                    {item.message}
                  </p>
                </button>
              </GoldCard>
            ))
          )}
        </div>

        <div>
          {selectedItem ? (
            <GoldCard glow>
              <h3 className="text-sm font-bold mb-3" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
                Detail Feedback
              </h3>
              <div className="space-y-2 text-xs" style={{ fontFamily: "var(--font-poppins)" }}>
                <p style={{ color: "#F5E6C8" }}>
                  <strong>Nama:</strong> {selectedItem.name}
                </p>
                <p style={{ color: "#F5E6C8" }}>
                  <Mail size={11} className="inline mr-1" />
                  {selectedItem.email}
                </p>
                <p style={{ color: "#9CA3AF" }}>
                  <strong>Kategori:</strong> {selectedItem.category}
                </p>
                <p style={{ color: "#9CA3AF" }}>
                  <strong>Masuk:</strong> {formatDate(selectedItem.createdAt)}
                </p>
                <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.15)" }}>
                  <p style={{ color: "#E5E7EB", lineHeight: 1.7 }}>{selectedItem.message}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => updateStatus(selectedItem.id, "ditinjau")}
                  className="w-full px-3 py-2 rounded-xl text-xs"
                  style={{
                    background: "rgba(59,130,246,0.12)",
                    border: "1px solid rgba(59,130,246,0.25)",
                    color: "#60A5FA",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  <MessageSquareText size={12} className="inline mr-1" />
                  Tandai Ditinjau
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(selectedItem.id, "selesai")}
                  className="w-full px-3 py-2 rounded-xl text-xs"
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    color: "#22c55e",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  <CheckCircle2 size={12} className="inline mr-1" />
                  Tandai Selesai
                </button>
              </div>
            </GoldCard>
          ) : (
            <GoldCard className="text-center py-10">
              <p className="text-sm" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                Pilih feedback untuk melihat detail.
              </p>
            </GoldCard>
          )}
        </div>
      </div>
    </div>
  );
}

