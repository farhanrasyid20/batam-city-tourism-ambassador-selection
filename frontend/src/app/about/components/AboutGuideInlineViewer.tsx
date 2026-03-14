"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type AboutGuideInlineViewerProps = {
  file: string;
};

export default function AboutGuideInlineViewer({ file }: AboutGuideInlineViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [viewerWidth, setViewerWidth] = useState(880);

  useEffect(() => {
    const updateWidth = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;

      if (width < 640) {
        setViewerWidth(Math.max(width - 44, 260));
        return;
      }

      if (width < 1024) {
        setViewerWidth(Math.min(width - 72, 760));
        return;
      }

      setViewerWidth(900);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const pageLabel = useMemo(() => {
    if (!numPages) return "Memuat panduan...";
    return `Halaman ${pageNumber} / ${numPages}`;
  }, [numPages, pageNumber]);

  const goPrev = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const goNext = () => setPageNumber((prev) => Math.min(prev + 1, numPages || prev + 1));

  return (
    <div className="p-4 sm:p-6 bg-[#111111]">
      <div className="rounded-2xl border border-yellow-700/20 bg-[#181818] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-yellow-700/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm" style={{ color: "#D6D6D6", fontFamily: "var(--font-poppins)" }}>
            {pageLabel}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={pageNumber <= 1}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border disabled:opacity-40"
              style={{
                borderColor: "rgba(200,162,77,0.28)",
                color: "#C8A24D",
                background: "rgba(200,162,77,0.08)",
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={numPages > 0 ? pageNumber >= numPages : true}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border disabled:opacity-40"
              style={{
                borderColor: "rgba(200,162,77,0.28)",
                color: "#C8A24D",
                background: "rgba(200,162,77,0.08)",
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-5 overflow-x-auto">
          <div className="flex justify-center min-w-fit">
            <Document
              file={file}
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
                renderAnnotationLayer
                renderTextLayer
              />
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
}
