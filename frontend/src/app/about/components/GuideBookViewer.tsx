"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Document, Page, pdfjs } from "react-pdf";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Download } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const guideBookHref = "/participant-resources/Buku-Panduan-Duta-Wisata-2026.pdf";

export default function GuideBookViewer() {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [viewerWidth, setViewerWidth] = useState(900);

  useEffect(() => {
    const updateWidth = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      if (width < 640) {
        setViewerWidth(Math.max(width - 32, 260));
        return;
      }
      if (width < 1024) {
        setViewerWidth(Math.min(width - 64, 760));
        return;
      }
      setViewerWidth(920);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const totalPagesLabel = useMemo(() => (numPages > 0 ? `${pageNumber} / ${numPages}` : "Memuat..."), [numPages, pageNumber]);

  const goPrev = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const goNext = () => setPageNumber((prev) => Math.min(prev + 1, numPages || prev + 1));

  return (
    <section className="py-20 lg:py-28 min-h-screen bg-[#0F0F0F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm mb-3"
              style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
            >
              <ArrowLeft size={16} /> Kembali ke About
            </Link>
            <h1 style={{ color: "#F5D06F", fontFamily: "var(--font-cinzel)", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700 }}>
              Buku Panduan Duta Wisata Batam 2026
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-3xl" style={{ fontFamily: "var(--font-poppins)" }}>
              Viewer ini dibuat khusus agar panduan bisa dibaca langsung di desktop, HP, dan iPad tanpa terjebak di halaman pertama PDF.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={guideBookHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
                color: "#0F0F0F",
                fontFamily: "var(--font-poppins)",
              }}
            >
              <ExternalLink size={16} /> Buka PDF Asli
            </Link>
            <a
              href={guideBookHref}
              download
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border"
              style={{
                borderColor: "rgba(200,162,77,0.35)",
                color: "#F5E6C8",
                fontFamily: "var(--font-poppins)",
                background: "rgba(200,162,77,0.08)",
              }}
            >
              <Download size={16} /> Unduh PDF
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-700/30 bg-[#1A1A1A] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="px-4 sm:px-6 py-4 border-b border-yellow-700/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-[#F5E6C8]" style={{ fontFamily: "var(--font-poppins)" }}>
              Halaman {totalPagesLabel}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={pageNumber <= 1}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border disabled:opacity-40"
                style={{ borderColor: "rgba(200,162,77,0.28)", color: "#C8A24D", background: "rgba(200,162,77,0.08)" }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={numPages > 0 ? pageNumber >= numPages : true}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border disabled:opacity-40"
                style={{ borderColor: "rgba(200,162,77,0.28)", color: "#C8A24D", background: "rgba(200,162,77,0.08)" }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-6 bg-[#111111] overflow-x-auto">
            <div className="flex justify-center min-w-fit">
              <Document
                file={guideBookHref}
                loading={<p style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>Memuat buku panduan...</p>}
                onLoadSuccess={({ numPages: loadedPages }) => {
                  setNumPages(loadedPages);
                  setPageNumber((current) => Math.min(current, loadedPages));
                }}
                onLoadError={() => {
                  setNumPages(0);
                }}
              >
                <Page
                  pageNumber={pageNumber}
                  width={viewerWidth}
                  renderTextLayer
                  renderAnnotationLayer
                />
              </Document>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
