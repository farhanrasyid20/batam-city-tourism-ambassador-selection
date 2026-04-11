import "./globals.css";
import type { Metadata } from "next";
import { Cinzel, Poppins } from "next/font/google";
import type { ReactNode } from "react";
import { AppProvider } from "../context/AppContext";
import AppShell from "../components/layout/AppShell";
import GlobalPreloader from "../components/layout/GlobalPreloader";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-poppins",
});

/**
 * Metadata global aplikasi untuk judul, deskripsi, dan ikon default.
 */
export const metadata: Metadata = {
  title: "Duta Wisata Kota Batam",
  description: "Platform Digital Pemilihan Encik & Puan Kota Batam",
  icons: {
    icon: "/logo1.png",
  },
};

/**
 * Root layout App Router.
 * Menginisialisasi font global, context aplikasi, preloader, dan shell layout utama.
 */
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${cinzel.variable} ${poppins.variable}`}
    >
      <body className="bg-elegantBlack text-softCream">
        <AppProvider>
          <GlobalPreloader />
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
