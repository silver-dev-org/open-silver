"use client";

import { SilverDev } from "@/components/logos";
import { Button, buttonVariants } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { spaceSizes } from "./spacer";

interface Link {
  href: string;
  label: string;
  target?: string;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const hrefPrefix = pathname?.startsWith("/hire") ? "" : "/";

  const anchorLinks: Link[] = [
    { href: hrefPrefix + "#for-talent", label: "For Talent" },
    { href: hrefPrefix + "#for-employers", label: "For Employers" },
  ];

  const externalLinks: Link[] = [
    {
      href: "https://ready.silver.dev",
      label: "Interview Ready",
      target: "_blank",
    },
    {
      href: "https://jobs.ashbyhq.com/Silver?utm_source=Pedw1mQEZd",
      label: "Jobs",
      target: "_blank",
    },
  ];

  function LinksGroup({ links }: { links: Link[] }) {
    return (
      <div
        className={`justify-center w-full xl:w-auto transition-all duration-300 ease-in-out ${
          isMenuOpen
            ? `flex flex-col max-h-screen ${spaceSizes.sm.mt}`
            : "hidden xl:flex xl:flex-row max-h-0 xl:max-h-screen"
        }`}
      >
        {links.map(({ href, label, target }) => (
          <Link
            key={href}
            href={href}
            target={target}
            onClick={() => setIsMenuOpen(false)}
            className={buttonVariants({ variant: "link" })}
          >
            {label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <header
      className={`fixed top-0 z-50 w-screen bg-background/85 border-b border-foreground/25 backdrop-blur-sm uppercase ${spaceSizes.sm.p}`}
    >
      <div className="container flex flex-col xl:flex-row justify-between items-center mx-auto">
        <div className="flex items-center justify-between w-full xl:w-auto">
          <h1>
            <span className="sr-only">Silver.dev</span>
            <Link onClick={() => setIsMenuOpen(false)} href={"/#"}>
              <SilverDev className="fill-foreground w-48 hover:opacity-75 trasnition-all duration-300" />
            </Link>
          </h1>
          <Button
            className="xl:hidden"
            variant="ghost"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </Button>
        </div>
        <LinksGroup links={anchorLinks} />
        <LinksGroup links={externalLinks} />
      </div>
    </header>
  );
}
