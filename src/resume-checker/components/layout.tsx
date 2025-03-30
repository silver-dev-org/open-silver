import { Lato } from "next/font/google";
import { type ReactNode } from "react";
const lato = Lato({ subsets: ["latin"], weight: "400" });

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className={
        lato.className + " grid grid-rows-[auto_1fr_auto] min-h-screen"
      }
    >
      <main className="flex flex-col gap-8 row-start-2 items-center py-6 px-2 justify-center">
        {children}
      </main>
    </div>
  );
}
