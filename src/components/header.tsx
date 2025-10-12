"use client";

import { SilverDev } from "@/components/logos";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { spaceSizes } from "./spacer";
import { TYPST_TEMPLATE_URL } from "@/resume-checker/utils";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const prefix = pathname?.startsWith("/hire") ? "" : "/";
  const links: {
    href: string;
    label: string;
    external?: boolean;
    button?: boolean;
  }[][] = [
    [
      { href: prefix + "#for-talent", label: "For Talent" },
      { href: prefix + "#for-employers", label: "For Employers" },
    ],
    [
      {
        href: "https://ready.silver.dev",
        label: "Interview Ready",
        external: true,
      },
      {
        href: "https://jobs.ashbyhq.com/Silver?utm_source=Pedw1mQEZd",
        label: "Jobs",
        external: true,
      },
    ],
  ];

  if (pathname?.startsWith("/resume-checker")) {
    links[1].push({
      href: TYPST_TEMPLATE_URL,
      label: "Resume Template",
      external: true,
      button: true,
    });
  } else if (pathname?.startsWith("/take-home-checker")) {
    links[1].push({
      href: "https://docs.silver.dev/interview-ready/technical-fundamentals/code-quality/guia-de-takehomes",
      label: "Guía de take-homes",
      external: true,
      button: true,
    });
  }

  return (
    <header
      className={`fixed top-0 z-50 w-screen bg-background border-b border-foreground/25 backdrop-blur-sm uppercase ${spaceSizes.sm.px}`}
    >
      <div className="container flex flex-col xl:flex-row justify-between items-center mx-auto">
        <div
          className={`flex items-center justify-between w-full xl:w-auto ${spaceSizes.lg.h}`}
        >
          <h1>
            <span className="sr-only">Silver.dev</span>
            <Link onClick={() => setOpen(false)} href={"/#"}>
              <SilverDev className="fill-foreground w-48 hover:opacity-75 trasnition-all duration-300" />
            </Link>
          </h1>
          <Button
            className="xl:hidden"
            variant="ghost"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </Button>
        </div>
        {links.map((group, index) => (
          <div
            key={index}
            className={`justify-center w-full xl:w-auto transition-all duration-300 ease-in-out ${spaceSizes.sm.py} ${
              open
                ? `flex flex-col max-h-screen`
                : "hidden xl:flex xl:flex-row max-h-0 xl:max-h-screen"
            }`}
          >
            {group.map(({ href, label, external, button }, index) => (
              <Button
                key={index}
                asChild
                variant={button ? "default" : "link"}
                className={`${button && "mx-4"}`}
              >
                <Link
                  key={href}
                  href={href}
                  target={external ? "_blank" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              </Button>
            ))}
          </div>
        ))}
      </div>
    </header>
  );
}
