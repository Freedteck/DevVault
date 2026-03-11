import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import NextTopLoader from "nextjs-toploader";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = "https://legislative-lark-freedteck-77552fdd.koyeb.app";

export const metadata: Metadata = {
  title: "Vurso — Developer Knowledge Network",
  description:
    "A decentralised knowledge-sharing platform for developers. Ask questions, share insights, and earn VRS for your contributions.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "Vurso — Developer Knowledge Network",
    description:
      "A decentralised knowledge-sharing platform for developers, built on Hedera. Ask questions, share insights, and earn VRS for your contributions.",
    url: APP_URL,
    siteName: "Vurso",
    images: [
      {
        url: "/Vurso.jpg",
        width: 1200,
        height: 630,
        alt: "Vurso — Developer Knowledge Network",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vurso — Developer Knowledge Network",
    description:
      "A decentralised knowledge-sharing platform for developers, built on Hedera.",
    images: ["/Vurso.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          backgroundColor: "var(--bg-base)",
          color: "var(--text-primary)",
        }}
      >
        <NextTopLoader
          color="#10b981"
          initialPosition={0.08}
          crawlSpeed={200}
          height={4}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #10b981, 0 0 5px #10b981"
        />
        <ScrollToTop />
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
