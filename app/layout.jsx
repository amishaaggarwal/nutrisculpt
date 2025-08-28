import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/constants";
import { Analytics } from "@vercel/analytics/next";
import SiteLayout from "@/components/layouts/SiteLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: `${BRAND} | Your Personal Trainer`,
  description:
    "Your journey to fitness starts here with AK's personalized training plans.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SiteLayout>{children}</SiteLayout>
        <Analytics />
      </body>
    </html>
  );
}
