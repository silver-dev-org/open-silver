import ErrorBadge from "@/components/ui/error-badge";
import Link from "next/link";
import Description from "@/components/description";
import Grid from "@/components/grid";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Spacer, { spaceSizes } from "@/components/spacer";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import { marked } from "marked";

function removeTripleBackticks(text: string): string {
  // Trim leading/trailing whitespace
  const trimmed = text.trim();

  // Check if starts and ends with triple backticks
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    // Remove the first and last triple backticks
    return trimmed.slice(3, -3).trim();
  }

  // If no wrapping backticks, return as-is
  return text;
}

function removeMarkdown(text: string): string {
  // Trim leading/trailing whitespace
  const trimmed = text.trim();

  // Check if starts and ends with triple `markdown`
  if (trimmed.startsWith("markdown")) {
    // Remove markdown from the start
    return trimmed.slice(9, -1).trim();
  }

  // If no wrapping backticks, return as-is
  return text;
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  function prevent(event: FormEvent) {
    event.preventDefault();
  }

  const investigateCompany = async () => {
    const company = inputRef?.current?.value;
    setText("");
    setIsLoading(true);
    await fetch(`/api/company?company=${company}`).then((response) => {
      response.json().then((json) => {
        setText(removeMarkdown(removeTripleBackticks(json.text)));
      });
    });
    setIsLoading(false);
  };

  return (
    <>
      {/* <ErrorBadge error={error || mutationError} /> */}
      <Section>
        <Heading size="lg" center>
          <span className="text-primary">Company</span> Checker
        </Heading>
        <Spacer />
        <Description center>Investigá una empresa que te interese.</Description>
        <Spacer size="lg" />
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-4 col-start-2">
            {isLoading ? (
              <div className="text-center">Cargando la información...</div>
            ) : (
              <div>
                <div className="markdown-container">
                  <ReactMarkdown>{text}</ReactMarkdown>
                </div>
                <form onSubmit={prevent} method="GET" action="/api/company">
                  <input
                    ref={inputRef}
                    type="text"
                    name="resume"
                    className="flex min-h-[80px] w-full text-center rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button
                    className="mt-4 w-full"
                    variant="secondary"
                    onClick={investigateCompany}
                  >
                    Buscar información
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
