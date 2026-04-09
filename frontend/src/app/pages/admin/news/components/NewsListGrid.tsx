import React from "react";
import { Calendar, Edit, Trash2 } from "lucide-react";
import type { NewsItem } from "../../../../../data/mockData";
import { resolveApiAssetUrl } from "../../../../../lib/api";

type NewsListGridProps = {
  newsList: NewsItem[];
  handleEdit: (item: NewsItem) => void;
  handleDelete: (id: string) => void;
};

export default function NewsListGrid({ newsList, handleEdit, handleDelete }: NewsListGridProps) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {newsList.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl overflow-hidden"
          style={{ background: "#1A1A1A", border: "1px solid rgba(212,175,55,0.2)" }}
        >
          <div className="relative overflow-hidden" style={{ height: 140 }}>
            <img src={resolveApiAssetUrl(item.image) ?? "/news-placeholder.jpg"} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(26,26,26,0.8) 0%, transparent 60%)" }} />
            <span
              className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full"
              style={{ background: "linear-gradient(135deg, #F5D06F, #D4AF37)", color: "#0F0F0F", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
            >
              {item.category}
            </span>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={11} style={{ color: "#D4AF37" }} />
              <span className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                {new Date(item.date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <h4 className="text-sm font-semibold mb-2 line-clamp-2" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
              {item.title}
            </h4>
            <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
              {item.excerpt}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs transition-all"
                style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: "#D4AF37", fontFamily: "var(--font-poppins)", cursor: "pointer" }}
              >
                <Edit size={11} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs transition-all"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontFamily: "var(--font-poppins)", cursor: "pointer" }}
              >
                <Trash2 size={11} />
                Hapus
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
