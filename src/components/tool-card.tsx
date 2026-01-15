"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import posthog from "posthog-js";

export interface ToolCardProps {
  title: string;
  description: string;
  href: string;
}

export function ToolCard({ title, description, href }: ToolCardProps) {
  const handleClick = () => {
    posthog.capture("tool_card_clicked", {
      tool_title: title,
      tool_href: href,
    });
  };

  return (
    <Link href={href} prefetch={true} onClick={handleClick}>
      <Card className="hover:bg-foreground/10 transition-all size-full duration-300">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
