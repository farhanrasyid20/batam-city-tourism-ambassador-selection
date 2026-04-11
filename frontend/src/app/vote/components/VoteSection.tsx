"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { CheckCircle2, Heart, Instagram, Radio, Crown } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { GoldButton } from "../../../components/ui/GoldButton";
import { resolveApiAssetUrl } from "../../../lib/api";

const OFFICIAL_ACCOUNT = "@dutawisatakotabatam";
const OFFICIAL_ACCOUNT_URL = "https://instagram.com/dutawisatakotabatam";

/**
 * Mengekstrak angka urutan dari kode finalis untuk kebutuhan sorting stabil.
 */
function extractCodeOrder(value: string) {
  const match = value.match(/(\d{1,4})$/);
  return match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

/**
 * Menggabungkan list finalis berdasarkan urutan kode dengan pola selang-seling Encik/Puan.
 */
function interleaveByCode<T extends { gender: "Encik" | "Puan"; number: string }>(items: T[]) {
  const encik = items
    .filter((item) => item.gender === "Encik")
    .sort((a, b) => extractCodeOrder(a.number) - extractCodeOrder(b.number));
  const puan = items
    .filter((item) => item.gender === "Puan")
    .sort((a, b) => extractCodeOrder(a.number) - extractCodeOrder(b.number));

  const max = Math.max(encik.length, puan.length);
  const result: T[] = [];
  for (let index = 0; index < max; index += 1) {
    if (encik[index]) result.push(encik[index]);
    if (puan[index]) result.push(puan[index]);
  }
  return result;
}

/**
 * Menentukan URL foto finalis yang aman ditampilkan pada UI.
 * Mendukung aset lokal, storage backend, URL absolut, dan fallback avatar default.
 */
function resolveDisplayPhoto(url?: string | null) {
  const value = url?.trim();
  if (!value || value === "/default-avatar.svg") return "/default-avatar.svg";
  if (value.startsWith("/vote-candidates/")) return value;
  if (value.startsWith("/storage/")) {
    return resolveApiAssetUrl(value) ?? "/default-avatar.svg";
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    if (value.includes("/default-avatar.svg")) return "/default-avatar.svg";
    return value;
  }
  return resolveApiAssetUrl(value) ?? "/default-avatar.svg";
}

/**
 * Memformat angka dukungan (like) ke format numerik Indonesia.
 */
function formatLikes(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

/**
 * Memformat datetime ke format WIB lengkap untuk metadata sinkronisasi.
 */
function formatWibDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${formatted} WIB`;
}

/**
 * Memformat datetime ke versi ringkas WIB untuk kartu finalis.
 */
function formatWibCompact(value: string | null) {
  if (!value) return "Belum diupdate";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum diupdate";
  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${formatted} WIB`;
}

/**
 * Komponen utama halaman vote finalis.
 * Menampilkan daftar finalis, data like postingan resmi, dan CTA ke Instagram.
 */
export default function VoteSection() {
  const { voteCandidateList, voteTopPublished } = useApp();
  const finalists = useMemo(
    () => interleaveByCode(voteCandidateList.filter((item) => item.enabled)),
    [voteCandidateList]
  );
  const lastSyncedAt = useMemo(() => {
    const latest = finalists
      .map((item) => item.likeUpdatedAt)
      .filter((item): item is string => Boolean(item))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

    return formatWibDateTime(latest);
  }, [finalists]);

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <p
            className="text-sm tracking-widest uppercase mb-3"
            style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
          >
            Grand Final
          </p>

          <h1
            style={{
              fontFamily: "var(--font-cinzel)",
              background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 700,
            }}
          >
            VOTE FINALIS
          </h1>

          <div
            className="w-24 h-0.5 mx-auto mt-4 mb-6"
            style={{
              background: "linear-gradient(90deg, transparent, #C8A24D, transparent)",
            }}
          />

          <p
            className="max-w-3xl mx-auto text-sm leading-relaxed"
            style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
          >
            Halaman ini menampilkan finalis Grand Final yang dapat didukung melalui postingan resmi Instagram <strong style={{ color: "#F5D06F" }}>{OFFICIAL_ACCOUNT}</strong>. Pengunjung dapat melihat identitas Instagram masing-masing peserta serta menuju kanal resmi untuk memberikan dukungan.
          </p>
        </div>

        <div
          className="max-w-4xl mx-auto mb-12 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-4"
          style={{
            background: "rgba(200,162,77,0.08)",
            border: "1px solid rgba(200,162,77,0.2)",
          }}
        >
          <div className="flex items-start gap-3 flex-1">
            <Radio
              size={16}
              style={{ color: "#C8A24D", marginTop: 2, flexShrink: 0 }}
            />
            <div>
              <p
                className="text-xs sm:text-sm leading-relaxed"
                style={{ color: "#D6D6D6", fontFamily: "var(--font-poppins)" }}
              >
                Dukungan publik terpusat pada akun resmi <strong style={{ color: "#F5D06F" }}>{OFFICIAL_ACCOUNT}</strong> agar interaksi, jangkauan, dan pertumbuhan audiens terkelola dalam satu kanal resmi. Jumlah like pada postingan resmi finalis ditampilkan pada halaman ini sebagai indikator dukungan masyarakat.
              </p>
              <p
                className="text-[11px] sm:text-xs mt-2"
                style={{ color: "#A9A9A9", fontFamily: "var(--font-poppins)" }}
              >
                Pembaruan data terakhir: {lastSyncedAt}
              </p>
            </div>
          </div>

          <a
            href={OFFICIAL_ACCOUNT_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shrink-0"
            style={{
              background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
              color: "#0F0F0F",
              fontFamily: "var(--font-poppins)",
            }}
          >
            <Instagram size={15} /> Buka IG Resmi
          </a>
        </div>

        {!voteTopPublished ? (
          <div className="text-center py-16">
            <Crown
              size={48}
              style={{ color: "#C8A24D", margin: "0 auto 16px", opacity: 0.5 }}
            />
            <p style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              Vote finalis sedang tidak dipublikasikan oleh admin.
            </p>
          </div>
        ) : finalists.length === 0 ? (
          <div className="text-center py-16">
            <Crown
              size={48}
              style={{ color: "#C8A24D", margin: "0 auto 16px", opacity: 0.5 }}
            />
            <p style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              Finalis Grand Final belum diumumkan.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {finalists.map((candidate, index) => {
              const displayNumber = index + 1;
              const genderLabel = candidate.gender === "Encik" ? "ENCIK" : "PUAN";
              const genderBg =
                candidate.gender === "Encik"
                  ? "rgba(34,117,196,0.65)"
                  : "rgba(183,61,131,0.65)";
              const igHandle = candidate.instagramHandle.replace("@", "");
              const instagramTarget = candidate.instagramProfileUrl || `https://instagram.com/${igHandle}`;
              const officialPostTarget =
                candidate.instagramPostUrl || `${OFFICIAL_ACCOUNT_URL}/p/${candidate.participantId.toLowerCase()}-demo/`;
              const officialLikeCount = candidate.officialLikeCount ?? 0;
              const candidateUpdatedAt = formatWibCompact(candidate.likeUpdatedAt);
              const candidatePhoto = resolveDisplayPhoto(candidate.photo);

              return (
                <div
                  key={candidate.id}
                  className="rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "#1A1A1A",
                    border: "1px solid rgba(200,162,77,0.3)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  }}
                >
                  <div className="relative overflow-hidden h-[260px]">
                    <Image
                      src={candidatePhoto}
                      alt={candidate.name}
                      fill
                      unoptimized
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />

                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(0deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.2) 50%, transparent 100%)",
                      }}
                    />

                    <div
                      className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
                        color: "#0F0F0F",
                        fontFamily: "var(--font-cinzel)",
                      }}
                    >
                      {displayNumber}
                    </div>

                    <span
                      className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full"
                      style={{
                        background: genderBg,
                        color: "#fff",
                        fontFamily: "var(--font-cinzel)",
                        fontWeight: 600,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {genderLabel}
                    </span>

                    <div className="absolute bottom-4 left-4 right-4">
                      <p
                        className="text-sm font-bold leading-tight"
                        style={{
                          color: "#F5E6C8",
                          fontFamily: "var(--font-cinzel)",
                        }}
                      >
                        {candidate.name}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{
                          color: "#C8A24D",
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        {candidate.number}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div>
                      <p
                        className="text-xs mb-1 truncate"
                        style={{
                          color: "#BDBDBD",
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        {candidate.education.split(" - ")[0].trim()}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{
                          color: "#C8A24D",
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        <Instagram size={11} className="inline mr-1" />
                        {candidate.instagramHandle || "-"}
                      </p>
                    </div>

                    <div
                      className="rounded-xl p-3 space-y-2"
                      style={{
                        background: "rgba(200,162,77,0.06)",
                        border: "1px solid rgba(200,162,77,0.18)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-[11px] uppercase tracking-[0.18em]"
                          style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
                        >
                          Like IG Resmi
                        </p>
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border"
                          style={{
                            color: "#F5D06F",
                            borderColor: "rgba(34,197,94,0.45)",
                            background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(212,175,55,0.2))",
                            fontFamily: "var(--font-poppins)",
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={12} />
                          Validasi Admin
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p
                            className="text-lg font-bold"
                            style={{ color: "#F5D06F", fontFamily: "var(--font-cinzel)" }}
                          >
                            {formatLikes(officialLikeCount)}
                          </p>
                          <p
                            className="text-[11px] leading-relaxed"
                            style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
                          >
                            Like dari postingan resmi {OFFICIAL_ACCOUNT}
                          </p>
                          <p
                            className="text-[11px] mt-1"
                            style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}
                          >
                            Diperbarui admin: {candidateUpdatedAt}
                          </p>
                        </div>

                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
                        >
                          <Heart size={18} fill="#ef4444" />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <GoldButton
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => window.open(officialPostTarget, "_blank")}
                      >
                        <Heart size={14} />
                        Vote di IG Resmi
                      </GoldButton>

                      <button
                        type="button"
                        onClick={() => window.open(instagramTarget, "_blank")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold border transition-colors"
                        style={{
                          borderColor: "rgba(200,162,77,0.28)",
                          color: "#F5E6C8",
                          background: "rgba(200,162,77,0.05)",
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        <Instagram size={14} />
                        Lihat IG Peserta
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}




