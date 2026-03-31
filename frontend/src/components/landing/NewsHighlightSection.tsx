"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import { useApp } from "../../context/AppContext";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NewsHighlightSection() {
  const { newsList } = useApp();
  const items = newsList.slice(0, 4);

  return (
    <section id="news" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
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
              fontSize: "clamp(1.8rem, 4vw, 2.7rem)",
              fontWeight: 700,
            }}
          >
            NEWS HIGHLIGHTS
          </h2>
          <div
            className="w-24 h-[2px] mx-auto mt-4"
            style={{
              background: "linear-gradient(90deg, transparent, #C8A24D, transparent)",
            }}
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((news) => (
            <Link
              key={news.id}
              href={`/news/${news.id}`}
              className="rounded-2xl overflow-hidden group transition-transform duration-300 hover:-translate-y-1"
              style={{
                background: "#1A1A1A",
                border: "1px solid rgba(200,162,77,0.25)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              <div className="relative h-[180px] overflow-hidden">
                <img
                  src={news.image}
                  alt={news.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(0deg, rgba(26,26,26,0.75) 0%, transparent 60%)",
                  }}
                />
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={12} style={{ color: "#C8A24D" }} />
                  <span
                    className="text-xs"
                    style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
                  >
                    {formatDate(news.date)}
                  </span>
                </div>
                <h3
                  className="line-clamp-2 mb-3"
                  style={{
                    color: "#F5E6C8",
                    fontFamily: "var(--font-cinzel)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  {news.title}
                </h3>
                <p
                  className="line-clamp-3 text-xs"
                  style={{
                    color: "#BDBDBD",
                    fontFamily: "var(--font-poppins)",
                    lineHeight: 1.8,
                  }}
                >
                  {news.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/news" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
            Lihat semua berita
          </Link>
        </div>
      </div>
    </section>
  );
}
