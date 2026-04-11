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
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return (temp.textContent ?? temp.innerText ?? "").trim();
}

export function toExcerptFromHtml(contentHtml: string) {
  const text = stripHtml(contentHtml);
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

