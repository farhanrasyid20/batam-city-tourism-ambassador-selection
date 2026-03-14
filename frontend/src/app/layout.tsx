import "./globals.css";
import { Cinzel, Poppins } from "next/font/google";
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

export const metadata = {
  title: "Duta Wisata Kota Batam",
  description: "Platform Digital Pemilihan Encik & Puan Kota Batam",
  icons: {
    icon: "/logo1.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
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

