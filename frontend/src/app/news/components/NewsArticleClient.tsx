"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import type { NewsBlock } from "../../../data/mockData";
import { resolveApiAssetUrl } from "../../../lib/api";

/**
 * Renderer paragraf standar untuk konten artikel berbasis blok.
 */
function Paragraph({ text }: { text: string }) {
  return (
    <p
      className="mb-5 leading-relaxed"
      style={{
        color: "#BDBDBD",
        fontFamily: "var(--font-poppins)",
        fontSize: "0.95rem",
        lineHeight: 1.9,
      }}
    >
      {text}
    </p>
  );
}

type NewsArticleClientProps = {
  body: NewsBlock[];
  contentHtml?: string;
  title?: string;
  excerpt?: string;
};

function normalizeComparableText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim()
    .toLowerCase();
}

function htmlToComparableText(value: string) {
  return normalizeComparableText(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;/gi, "'")
  );
}

function stripDuplicateLeadFromHtmlFallback(contentHtml: string, title?: string, excerpt?: string) {
  const titleNorm = normalizeComparableText(title ?? "");
  const excerptNorm = normalizeComparableText(excerpt ?? "");

  let html = contentHtml.trim();

  const headingMatch = html.match(/^\s*<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>\s*/i);
  if (headingMatch) {
    const headingText = htmlToComparableText(headingMatch[2] ?? "");
    if (titleNorm && headingText === titleNorm) {
      html = html.replace(/^\s*<(h[1-6])\b[^>]*>[\s\S]*?<\/\1>\s*/i, "");
    }
  }

  const firstParagraphLikeMatch = html.match(/^\s*<(p|div)\b[^>]*>([\s\S]*?)<\/\1>\s*/i);
  if (firstParagraphLikeMatch) {
    const firstText = htmlToComparableText(firstParagraphLikeMatch[2] ?? "");
    if (
      excerptNorm &&
      (firstText === excerptNorm || firstText.startsWith(excerptNorm))
    ) {
      html = html.replace(/^\s*<(p|div)\b[^>]*>[\s\S]*?<\/\1>\s*/i, "");
    }
  }

  return html.trim() || contentHtml;
}

function stripDuplicateLeadFromHtml(contentHtml: string, title?: string, excerpt?: string) {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return stripDuplicateLeadFromHtmlFallback(contentHtml, title, excerpt);
  }

  const titleNorm = normalizeComparableText(title ?? "");
  const excerptNorm = normalizeComparableText(excerpt ?? "");
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(contentHtml, "text/html");
  const root = documentNode.body;

  const removeIfDuplicateLead = (node: Element, nextNodes: Element[]) => {
    const textNorm = normalizeComparableText(node.textContent ?? "");
    if (!textNorm) {
      node.remove();
      return true;
    }

    if (titleNorm && (textNorm === titleNorm || textNorm.startsWith(titleNorm))) {
      node.remove();
      return true;
    }

    if (excerptNorm && (textNorm === excerptNorm || textNorm.startsWith(excerptNorm) || textNorm.includes(excerptNorm))) {
      node.remove();
      return true;
    }

    const duplicatedLater = nextNodes.some((nextNode) => normalizeComparableText(nextNode.textContent ?? "") === textNorm);
    if (duplicatedLater) {
      node.remove();
      return true;
    }

    const boldCount = node.querySelectorAll("strong, b").length;
    const likelyMetaLead =
      (node.tagName === "P" || node.tagName === "DIV") &&
      boldCount >= 2 &&
      textNorm.length <= 160;
    if (likelyMetaLead && nextNodes.length > 0) {
      node.remove();
      return true;
    }

    return false;
  };

  // Hanya evaluasi elemen awal, supaya aman tidak menghapus isi utama.
  for (let i = 0; i < 2; i += 1) {
    const elements = Array.from(root.children);
    const first = elements[0];
    if (!first) break;

    const removed = removeIfDuplicateLead(first, elements.slice(1));
    if (!removed) break;
  }

  const cleanedHtml = root.innerHTML.trim();
  return cleanedHtml || contentHtml;
}

/**
 * Komponen renderer isi artikel berita.
 * Prioritas menampilkan `contentHtml` (jika tersedia), fallback ke struktur blok `body`.
 */
export default function NewsArticleClient({ body, contentHtml, title, excerpt }: NewsArticleClientProps) {
  const cleanedHtml = useMemo(() => {
    if (!contentHtml?.trim()) return "";
    return stripDuplicateLeadFromHtml(contentHtml, title, excerpt);
  }, [contentHtml, title, excerpt]);

  if (cleanedHtml) {
    return (
      <div
        className="news-reader-content"
        style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", lineHeight: 1.9 }}
        dangerouslySetInnerHTML={{ __html: cleanedHtml }}
      />
    );
  }

  return (
    <div>
      {body.map((block, idx) => {
        if (block.type === "heading") {
          return (
            <h2
              key={idx}
              className="mt-8 mb-3"
              style={{
                color: "#F5E6C8",
                fontFamily: "var(--font-cinzel)",
                fontWeight: 700,
                fontSize: "1.15rem",
                letterSpacing: "0.02em",
              }}
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === "paragraph") {
          return <Paragraph key={idx} text={block.text} />;
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={idx}
              className="my-8 p-5 rounded-2xl"
              style={{
                background: "#141414",
                border: "1px solid rgba(200,162,77,0.25)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              }}
            >
              <p
                style={{
                  color: "#F5E6C8",
                  fontFamily: "var(--font-poppins)",
                  fontStyle: "italic",
                  lineHeight: 1.9,
                }}
              >
                Ã¢â‚¬Å“{block.text}Ã¢â‚¬Â
              </p>
              {block.author ? (
                <p
                  className="mt-3 text-sm"
                  style={{
                    color: "#C8A24D",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  Ã¢â‚¬â€ {block.author}
                </p>
              ) : null}
            </blockquote>
          );
        }

        if (block.type === "list") {
          return (
            <ul
              key={idx}
              className="mb-6 pl-5 space-y-2"
              style={{
                color: "#BDBDBD",
                fontFamily: "var(--font-poppins)",
                lineHeight: 1.9,
              }}
            >
              {block.items.map((it, i) => (
                <li key={i} className="list-disc">
                  {it}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={idx} className="my-8">
              <div
                className="relative w-full overflow-hidden rounded-2xl"
                style={{
                  border: "1px solid rgba(200,162,77,0.20)",
                  background: "#0F0F0F",
                }}
              >
                <Image
                  src={resolveApiAssetUrl(block.src) ?? "/news-placeholder.jpg"}
                  alt={block.alt ?? "Gambar berita"}
                  width={1400}
                  height={900}
                  unoptimized
                  className="w-full h-auto object-cover"
                />
              </div>

              {block.caption ? (
                <figcaption
                  className="mt-2 text-xs"
                  style={{
                    color: "#BDBDBD",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        return null;
      })}
    </div>
  );
}
