import Footer from "@/components/footer";
import Header from "@/components/header";
import Space from "@/components/space";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import SessionProvider from "@/providers/SessionProvider";
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
      <SessionProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <Header />
          <main>
            <Space size="lg" />
            {children}
          </main>
          <Footer />
        </body>
      </SessionProvider>
    </html>
  );
}
