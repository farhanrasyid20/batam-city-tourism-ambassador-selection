/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */
import type { NewsBlock } from "../../../../../data/mockData";

export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
}

export function stripHtml(html: string) {
  if (!html) return "";
  const withSeparators = html
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/blockquote|\/figure)\s*\/?>/gi, " ")
    .replace(/&nbsp;/gi, " ");
  const temp = document.createElement("div");
  temp.innerHTML = withSeparators;
  return (temp.textContent ?? temp.innerText ?? "").replace(/\s+/g, " ").trim();
}

export function toExcerptFromHtml(contentHtml: string) {
  if (!contentHtml) return "";

  const temp = document.createElement("div");
  temp.innerHTML = contentHtml;

  const firstLead = Array.from(temp.querySelectorAll("p, h1, h2, h3, h4, li"))
    .map((node) => (node.textContent ?? "").replace(/\s+/g, " ").trim())
    .find((text) => text.length > 0);

  const text = firstLead || stripHtml(contentHtml);
  if (!text) return "";
  if (text.length <= 130) return text;
  return `${text.slice(0, 127)}...`;
}

export function blocksToHtml(blocks: NewsBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "paragraph") return `<p>${block.text}</p>`;
      if (block.type === "heading") return `<h2>${block.text}</h2>`;
      if (block.type === "list") return `<ul>${block.items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
      if (block.type === "quote") {
        const authorHtml = block.author ? `<p><em>- ${block.author}</em></p>` : "";
        return `<blockquote><p>${block.text}</p>${authorHtml}</blockquote>`;
      }
      if (block.type === "image") {
        const caption = block.caption ? `<p><em>${block.caption}</em></p>` : "";
        return `<figure><img src="${block.src}" alt="${block.alt ?? "Gambar berita"}" />${caption}</figure>`;
      }
      return "";
    })
    .join("");
}

