"use client";

import { SilverDev } from "@/components/logos";
import { Button, buttonVariants } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { spaceSizes } from "./space";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const hrefPrefix = pathname?.startsWith("/hire") ? "" : "/";

  const heroLinks = [
    { href: hrefPrefix + "#for-talent", label: "For Talent" },
    { href: hrefPrefix + "#for-employers", label: "For Employers" },
  ];

  return (
    <header
      className={`fixed top-0 z-50 w-screen bg-background/85 border-b border-foreground/25 backdrop-blur-sm ${spaceSizes.sm.p}`}
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
        <div
          className={`uppercase justify-center w-full xl:w-auto transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? `flex flex-col max-h-screen ${spaceSizes.sm.mt}`
              : "hidden xl:flex xl:flex-row max-h-0 xl:max-h-screen"
          }`}
        >
          {heroLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={buttonVariants({ variant: "link" })}
              onClick={() => setIsMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
