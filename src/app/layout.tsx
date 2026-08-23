import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const display = Oswald({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: { default: "Hostel Premier League — Live Auction", template: "%s · HPL" },
  description: "Six teams. One auction. ₹6,00,000 in total purse. The battle for HPL starts here.",
  openGraph: {
    title: "Hostel Premier League — Live Auction",
    description: "Six teams. One live auction. Watch every bid in real time.",
    siteName: "Hostel Premier League",
    type: "website",
  },
};

export const viewport = { themeColor: "#07090f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen"><Providers>{children}</Providers></body>
    </html>
  );
}
