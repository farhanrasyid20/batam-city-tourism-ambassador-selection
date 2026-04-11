"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type RedocGlobal = {
  init: (
    specOrSpecUrl: unknown,
    options: Record<string, unknown>,
    element: HTMLElement,
  ) => void;
};

declare global {
  interface Window {
    Redoc?: RedocGlobal;
  }
}

export default function ApiDocsPage() {
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!scriptReady || !window.Redoc) return;

    const container = document.getElementById("redoc-container");
    if (!container) return;

    container.innerHTML = "";
    window.Redoc.init(
      "/api/openapi",
      {
        hideDownloadButton: false,
        expandResponses: "200,201",
        pathInMiddlePanel: true,
      },
      container,
    );
  }, [scriptReady]);

  return (
    <section className="min-h-screen bg-white">
      <Script
        src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div id="redoc-container" />
    </section>
  );
}
