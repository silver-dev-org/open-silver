import Footer from "@/components/footer";
import Header from "@/components/header";
import Spacer from "@/components/spacer";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import SessionProvider from "@/providers/SessionProvider";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s • Open Silver",
    default: "Open Silver",
  },
  description: "Open Source Software made by Silver.dev",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html className="scroll-smooth dark" lang="en">
      <GoogleAnalytics gaId="G-QFVTDBRTP4" />
      <SessionProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <Header />
          <main>
            <Spacer size="lg" />
            {children}
            <Spacer size="lg" />
          </main>
          <Footer />
        </body>
      </SessionProvider>
    </html>
  );
}
