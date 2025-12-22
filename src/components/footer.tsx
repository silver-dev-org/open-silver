import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { spacing } from "./spacer";

const links: {
  group: string;
  links: { href: string; label: string }[];
}[] = [
  {
    group: "General",
    links: [
      { href: "https://silver.dev/", label: "Home" },
      { href: "https://silver.dev/about", label: "About" },
      { href: "mailto:info@silver.dev", label: "Contact" },
      { href: "https://silver.dev/careers", label: "Careers" },
      { href: "https://silver.dev/intros", label: "Refer us" },
      {
        href: "https://github.com/silver-dev-org/open-silver",
        label: "Source code",
      },
      { href: "https://silver.dev/dvd", label: "DVD" },
    ],
  },
  {
    group: "For Employers",
    links: [
      { href: "https://blog.silver.dev", label: "Hiring Blog" },
      { href: "https://silver.dev/roles", label: "Roles we Support" },
      { href: "https://silver.dev/placements", label: "Our Placements" },
      { href: "https://silver.dev/aor", label: "Agency of Record" },
      { href: "https://silver.dev/advisory", label: "Advisory" },
      {
        href: "https://silver.dev/argentina",
        label: "Build your Argentina Hub",
      },
      {
        href: "/salary-calculator",
        label: "Argentina Salary Calculator",
      },
      { href: "https://silver.dev/agencies", label: "For Agencies" },
    ],
  },
  {
    group: "For Talent",
    links: [
      { href: "https://silver.dev/jobs", label: "Jobs" },
      { href: "https://app.silver.dev", label: "Platform" },
      { href: "https://ready.silver.dev", label: "Interview Ready" },
      { href: "https://silver.dev/referrals", label: "Refer Engineers" },
      {
        href: "https://wpm.silver.dev",
        label: "WPM Game",
      },
      {
        href: "/resume-checker",
        label: "Resume Checker",
      },
      {
        href: "/behavioral-checker",
        label: "Behavioral Checker",
      },
      {
        href: "/take-home-checker",
        label: "Take-home Checker",
      },
      { href: "https://silver.dev/podcast", label: "Podcast" },
      { href: "https://silver.dev/community", label: "Community" },
      { href: "https://ready.silver.dev/blog", label: "Career Blog" },
      { href: "https://silver.dev/library", label: "Recommended Books" },
      { href: "https://docs.silver.dev", label: "Documentation" },
      { href: "https://silver.dev/ed", label: "SilverEd" },
      { href: "https://silver.dev/mentors", label: "Mentoring" },
      { href: "https://silver.dev/english", label: "English Coaching" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className={`flex flex-col ${spacing.lg.gap} border-t border-foreground/25 text-nowrap ${spacing.sm.px} ${spacing.lg.py}`}
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
