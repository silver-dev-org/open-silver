import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { spaceSizes } from "./space";

const links: {
  group: string;
  links: { href: string; label: string }[];
}[] = [
  {
    group: "General",
    links: [
      { href: "https://silver.dev", label: "Website" },
      { href: "https://silver.dev/about", label: "About" },
      { href: "mailto:info@silver.dev", label: "Contact" },
      {
        href: "https://github.com/silver-dev-org/open-silver",
        label: "Source code",
      },
    ],
  },
  {
    group: "For talent",
    links: [
      { href: "https://ready.silver.dev/blog", label: "Career Blog" },
      { href: "https://docs.silver.dev", label: "Silver Docs" },
      { href: "https://silver.dev/podcast", label: "Podcast" },
      { href: "https://silver.dev/ed", label: "SilverEd" },
      { href: "https://silver.dev/community", label: "Community" },
      { href: "https://silver.dev/jobs", label: "Jobs" },
      { href: "https://silver.dev/job-alerts", label: "New Job Alerts" },
    ],
  },
  {
    group: "For employers",
    links: [{ href: "https://blog.silver.dev", label: "Hiring Blog" }],
  },
];

export default function Footer() {
  return (
    <footer
      className={`flex flex-col ${spaceSizes.lg.gap} border-t border-foreground/25 text-nowrap ${spaceSizes.sm.px} ${spaceSizes.lg.py}`}
    >
      <section className="container mx-auto">
        <h1 className="sr-only">Useful links</h1>
        <div className="flex flex-wrap gap-16 justify-center">
          {links.map(({ group: title, links }, index) => (
            <section className="w-min" key={index}>
              <h1 className="text-primary uppercase">{title}</h1>
              <ul className="-ml-4 w-min flex flex-col sm:grid grid-flow-col grid-rows-4">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      target="_blank"
                      className={buttonVariants({ variant: "link" })}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
      <p className="text-center text-sm">
        © 2025 Silver.dev. All Rights Reserved.
      </p>
    </footer>
  );
}
