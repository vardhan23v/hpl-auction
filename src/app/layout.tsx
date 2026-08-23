import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const display = Oswald({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Hostel Premier League — Live Auction",
  description: "Six teams. One auction. ₹6,00,000 in total purse. The battle for HPL starts here.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen"><Providers>{children}</Providers></body>
    </html>
  );
}
