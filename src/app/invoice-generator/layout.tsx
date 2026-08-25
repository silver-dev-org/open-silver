import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Invoice Generator: Free PDF Invoices",
  description:
    "Create and download professional PDF invoices in seconds. Add line items and payment details, then send the finished invoice straight to your client by email.",
  path: "/invoice-generator",
  ogTitle: "Invoice Generator • Open Silver",
  ogDescription:
    "Create and download professional PDF invoices in seconds, then send them straight to your client.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
