import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["127.0.0.1", "localhost"]);

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src")?.trim();
  if (!src) {
    return NextResponse.json({ message: "Parameter src wajib diisi." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return NextResponse.json({ message: "URL gambar tidak valid." }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ message: "Protocol URL tidak didukung." }, { status: 400 });
  }

  const requestHost = request.nextUrl.hostname;
  const isAllowedHost = ALLOWED_HOSTS.has(parsed.hostname) || parsed.hostname === requestHost;
  if (!isAllowedHost) {
    return NextResponse.json({ message: "Host URL tidak diizinkan." }, { status: 403 });
  }

  try {
    const response = await fetch(parsed.toString(), { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ message: "Gagal mengambil gambar." }, { status: response.status });
    }

    const bytes = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ message: "Terjadi kesalahan saat memuat gambar." }, { status: 500 });
  }
}
