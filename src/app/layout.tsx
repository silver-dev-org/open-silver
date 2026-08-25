import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { QueryClientWrapper } from "@/components/query-client-wrapper";
import { Spacer } from "@/components/spacer";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleAnalytics } from "@next/third-parties/google";
import { DEFAULT_OPEN_GRAPH, DEFAULT_TWITTER, SITE_URL } from "@/lib/seo";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s • Open Silver",
    default: "Open Silver",
  },
  description:
    "Open Source Software made by Silver.dev and its contributors: free tools for engineers and employers, from resume checkers to salary calculators.",
  alternates: { canonical: "/" },
  openGraph: DEFAULT_OPEN_GRAPH,
  twitter: DEFAULT_TWITTER,
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <GoogleAnalytics gaId="G-QFVTDBRTP4" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Header />
        <main>
          <Spacer size="lg" />
          <Spacer size="lg" />
          <Suspense>
            <TooltipProvider>
              <QueryClientWrapper>{children}</QueryClientWrapper>
            </TooltipProvider>
          </Suspense>
          <Spacer size="lg" />
        </main>
        <Toaster />
        <Footer />
      </body>
    </html>
  );
}
