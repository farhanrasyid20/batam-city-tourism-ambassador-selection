"use client";

import React from "react";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { resolveApiAssetUrl } from "../../../lib/api";

/**
 * Komponen daftar berita pada halaman publik.
 * Menampilkan kartu berita, metadata tanggal, kategori, dan tautan detail.
 */
export default function NewsListClient() {
  const { newsList } = useApp();

  /**
   * Mengubah tanggal ISO menjadi format tanggal Indonesia yang ramah baca.
   */
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <section className="py-20 lg:py-32 warm-champagne-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header (Figma style) */}
        <div className="text-center mb-14">
          <p
            className="text-sm tracking-widest uppercase mb-3"
            style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
          >
            Berita Terkini
          </p>

          <h2
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
            NEWS & INFORMASI
          </h2>

          <div
            className="w-24 h-0.5 mx-auto mt-4"
            style={{
              background:
                "linear-gradient(90deg, transparent, #C8A24D, transparent)",
            }}
          />
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newsList.map((news) => (
            <Link
              key={news.id}
              href={`/news/${news.id}`}
              className="rounded-2xl overflow-hidden group cursor-pointer transition-transform duration-300 hover:-translate-y-1 block"
              style={{
                background: "#1A1A1A",
                border: "1px solid rgba(200,162,77,0.25)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  "0 8px 30px rgba(200,162,77,0.2)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "rgba(200,162,77,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  "0 4px 20px rgba(0,0,0,0.3)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "rgba(200,162,77,0.25)";
              }}
            >
              {/* Image (pakai img biar ga error host) */}
              <div className="relative overflow-hidden" style={{ height: 180 }}>
                <img
                  src={resolveApiAssetUrl(news.image) ?? "/news-placeholder.jpg"}
                  alt={news.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(0deg, rgba(26,26,26,0.7) 0%, transparent 60%)",
                  }}
                />
                <span
                  className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
                    color: "#0F0F0F",
                    fontFamily: "var(--font-poppins)",
                    fontWeight: 600,
                  }}
                >
                  {news.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={12} style={{ color: "#C8A24D" }} />
                  <span
                    className="text-xs"
                    style={{
                      color: "#BDBDBD",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    {formatDate(news.date)}
                  </span>
                </div>

                <h3
                  className="mb-3 leading-snug line-clamp-2 text-sm"
                  style={{
                    color: "#F5E6C8",
                    fontFamily: "var(--font-cinzel)",
                    fontWeight: 600,
                  }}
                >
                  {news.title}
                </h3>

                <p
                  className="text-xs leading-relaxed mb-4 line-clamp-3"
                  style={{
                    color: "#BDBDBD",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {news.excerpt}
                </p>

                <div
                  className="flex items-center gap-2 text-xs font-medium transition-all duration-200 group-hover:gap-3"
                  style={{
                    color: "#C8A24D",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  Baca Selengkapnya
                  <ArrowRight size={13} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


