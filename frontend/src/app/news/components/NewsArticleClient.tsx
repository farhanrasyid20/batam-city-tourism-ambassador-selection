"use client";

import React from "react";
import Image from "next/image";
import type { NewsBlock } from "../../../data/mockData";
import { resolveApiAssetUrl } from "../../../lib/api";

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
};

export default function NewsArticleClient({ body, contentHtml }: NewsArticleClientProps) {
  if (contentHtml?.trim()) {
    return (
      <div
        className="news-reader-content"
        style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", lineHeight: 1.9 }}
        dangerouslySetInnerHTML={{ __html: contentHtml }}
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
