"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Calendar, ArrowLeft } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import type { NewsBlock } from "../../../data/mockData";
import NewsArticleClient from "../components/NewsArticleClient";
import { resolveApiAssetUrl } from "../../../lib/api";

function formatDateId(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const { newsList } = useApp();
  const id = params?.id ?? "";
  const news = newsList.find((item) => item.id === id) ?? null;
  const articleBody: NewsBlock[] =
    news && news.body.length > 0 ? news.body : [{ type: "paragraph", text: news?.excerpt ?? "" }];

  if (!news) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24" style={{ color: "#F5E6C8" }}>
        <p className="mb-6" style={{ fontFamily: "var(--font-poppins)" }}>
          Berita tidak ditemukan.
        </p>
        <Link href="/news" className="underline" style={{ color: "#C8A24D" }}>
          Kembali ke News
        </Link>
      </div>
    );
  }

  return (
    <article className="pb-20">
      <div className="relative w-full overflow-hidden" style={{ height: 420 }}>
        <Image src={resolveApiAssetUrl(news.image) ?? "/news-placeholder.jpg"} alt={news.title} fill unoptimized className="object-cover" />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.85) 70%, #0F0F0F 100%)",
          }}
        />

        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-sm mb-6"
              style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
            >
              <ArrowLeft size={16} /> Kembali
            </Link>

            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
                  color: "#0F0F0F",
                  fontFamily: "var(--font-poppins)",
                  fontWeight: 600,
                }}
              >
                {news.category}
              </span>

              <div className="flex items-center gap-2 text-xs">
                <Calendar size={12} style={{ color: "#C8A24D" }} />
                <span style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                  {formatDateId(news.date)}
                </span>
              </div>
            </div>

            <h1
              className="leading-tight"
              style={{
                color: "#F5E6C8",
                fontFamily: "var(--font-cinzel)",
                fontSize: "clamp(1.7rem, 3vw, 2.7rem)",
                fontWeight: 800,
              }}
            >
              {news.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div
          className="rounded-2xl p-6 sm:p-10"
          style={{
            background: "#1A1A1A",
            border: "1px solid rgba(200,162,77,0.25)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <p
            className="mb-7"
            style={{
              color: "#F5E6C8",
              fontFamily: "var(--font-poppins)",
              lineHeight: 1.9,
              fontWeight: 600,
            }}
          >
            {news.excerpt}
          </p>

          <div className="w-full h-px mb-8" style={{ background: "rgba(200,162,77,0.15)" }} />

          <NewsArticleClient body={articleBody} contentHtml={news.contentHtml} />
        </div>
      </div>
    </article>
  );
}
