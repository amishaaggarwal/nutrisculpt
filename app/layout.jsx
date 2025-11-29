import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/constants";
import { Analytics } from "@vercel/analytics/next";
import SiteLayout from "@/components/layouts/SiteLayout";
import SEOContent from "@/components/SEOContent";
import StructuredData from "@/components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title:
    "NutriSculpt - AK's Fitness Coaching | Free Calorie Calculator & Fitness Tools",
  description:
    "Expert fitness coaching by AK at NutriSculpt. Free calorie calculator, BMI calculator, macro calculator & fitness tools. Personal training, online coaching, and nutrition guidance for your fitness goals.",
  keywords:
    "AK fitness coach, NutriSculpt, calorie calculator, BMI calculator, personal trainer, online fitness coaching, macro calculator, fitness tools, nutrition calculator, weight loss coach",
  author: "NutriSculpt - AK Fitness Coach",
  robots: "index, follow",
  openGraph: {
    title: "NutriSculpt - AK's Fitness Coaching & Free Calculators",
    description:
      "Expert fitness coaching by AK with free calorie calculator, BMI calculator, and fitness tools. Personal training and nutrition guidance for your goals.",
    url: "https://nutrisculpt.vercel.app",
    siteName: "NutriSculpt",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NutriSculpt - AK's Fitness Coaching & Free Calculators",
    description:
      "Expert fitness coaching by AK with free calorie calculator and fitness tools.",
  },
  alternates: {
    canonical: "https://nutrisculpt.vercel.app",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="canonical" href="https://nutrisculpt.vercel.app" />
        <meta
          name="google-site-verification"
          content={process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StructuredData
          type="website"
          name="NutriSculpt - Expert Fitness Coaching by AK"
          description="Expert fitness coaching by AK with free calorie calculator, BMI calculator, and fitness tools. Personal training and nutrition guidance."
          url="https://nutrisculpt.vercel.app"
        />
        <SiteLayout>
          {children}
          <SEOContent />
        </SiteLayout>
        <Analytics />
      </body>
    </html>
  );
}
