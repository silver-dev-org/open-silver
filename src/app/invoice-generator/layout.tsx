import QueryClientWrapper from "@/components/query-client-wrapper";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <QueryClientWrapper>{children}</QueryClientWrapper>;
}
