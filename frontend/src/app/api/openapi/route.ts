import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";
  const specUrl = `${backendBaseUrl.replace(/\/$/, "")}/docs/api.json`;

  try {
    const response = await fetch(specUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Gagal mengambil OpenAPI spec dari backend Laravel.",
          status: response.status,
          source: specUrl,
          body: text.slice(0, 500),
        },
        { status: response.status },
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Tidak bisa terhubung ke backend Laravel.",
        source: specUrl,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
