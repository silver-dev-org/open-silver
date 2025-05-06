import ErrorBadge from "@/components/ui/error-badge";
import Description from "@/components/description";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Spacer, { spaceSizes } from "@/components/spacer";
import Skeleton from "@/components/skeleton";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/fees-calculator/components/ui/input";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import Spinner from "@/components/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPrompt } from "@/company-checker/utils/prompts";
import { sendGAEvent } from "@next/third-parties/google";

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

function parseMarkdownSections(
  text: string,
): { title: string; content: string }[] {
  // Split the text by headers (## or ###)
  const sections = text.split(/(?=^#{1,3}\s)/m);

  return sections
    .filter((section) => section.trim())
    .map((section) => {
      const lines = section.split("\n");
      const title = lines[0].replace(/^#{1,3}\s/, "").trim();
      const content = lines.slice(1).join("\n").trim();
      return { title, content };
    });
}

// Add color variations for cards
const cardColors = [
  "bg-gradient-to-br from-blue-50/30 to-blue-100/20 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-100/50 dark:border-blue-800/30",
  "bg-gradient-to-br from-purple-50/30 to-purple-100/20 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-100/50 dark:border-purple-800/30",
  "bg-gradient-to-br from-green-50/30 to-green-100/20 dark:from-green-950/20 dark:to-green-900/10 border-green-100/50 dark:border-green-800/30",
  "bg-gradient-to-br from-amber-50/30 to-amber-100/20 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-100/50 dark:border-amber-800/30",
  "bg-gradient-to-br from-rose-50/30 to-rose-100/20 dark:from-rose-950/20 dark:to-rose-900/10 border-rose-100/50 dark:border-rose-800/30",
  "bg-gradient-to-br from-cyan-50/30 to-cyan-100/20 dark:from-cyan-950/20 dark:to-cyan-900/10 border-cyan-100/50 dark:border-cyan-800/30",
];

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  function prevent(event: FormEvent) {
    event.preventDefault();
  }

  const copyPrompt = () => {
    const company = inputRef?.current?.value || "";
    navigator.clipboard.writeText(createPrompt(company));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    sendGAEvent("event", "company-checker-copy-prompt", { company });
  };

  const investigateCompany = async () => {
    const company = inputRef?.current?.value;
    if (!company) {
      setError(new Error("Por favor ingresa el nombre de una empresa"));
      sendGAEvent("event", "company-checker-error", { error: "empty_company" });
      return;
    }

    setText("");
    setError(null);
    setIsLoading(true);
    sendGAEvent("event", "company-checker-search", { company });

    try {
      const response = await fetch(
        `/api/company?company=${encodeURIComponent(company)}`,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al buscar información de la empresa",
        );
      }

      const json = await response.json();
      setText(removeMarkdown(removeTripleBackticks(json.text)));
      sendGAEvent("event", "company-checker-success", { company });
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Error al buscar información de la empresa");
      setError(error);
      sendGAEvent("event", "company-checker-error", {
        error: error.message,
        company,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Section>
        <ErrorBadge error={error} />
        <Heading size="lg" center>
          <span className="text-primary">Company</span> Checker
        </Heading>
        <Spacer />
        <Description center>
          Investigá una empresa que te interese y preparate para tu entrevista.
        </Description>
        <Spacer size="lg" />
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-4 col-start-2">
            <div>
              <form
                onSubmit={prevent}
                method="GET"
                action="/api/company"
                className="flex flex-col items-center gap-4"
              >
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Ingresá el nombre de la empresa"
                  className="w-full max-w-md text-center text-lg"
                />

                <Button
                  type="submit"
                  onClick={investigateCompany}
                  className="w-full max-w-md text-lg"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Spinner />
                      Buscando información...
                    </div>
                  ) : (
                    "Buscar información"
                  )}
                </Button>
              </form>
              <Spacer />
            </div>
          </div>
        </div>
        <Spacer size="lg" />
        {isLoading ? (
          <Skeleton />
        ) : (
          text && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {parseMarkdownSections(text).map((section, index) => (
                  <Card 
                    key={index} 
                    className={`py-5 transition-all duration-300 hover:shadow-lg ${cardColors[index % cardColors.length]}`}
                  >
                    <CardHeader>
                      <CardTitle className="text-foreground/90">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="markdown-container prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{section.content}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Spacer size="lg" />
              <div className="text-center">
                <p className="text-lg mb-4">
                  Para una búsqueda más profunda probá directamente en{" "}
                  <a
                    href="https://chat.openai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    ChatGPT
                  </a>{" "}
                  o{" "}
                  <a
                    href="https://gemini.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Gemini
                  </a>
                  .
                </p>
                <Button
                  variant="outline"
                  onClick={copyPrompt}
                  className="w-full max-w-md"
                >
                  {copied
                    ? "¡Copiado!"
                    : "Copiar prompt para usar en otras plataformas"}
                </Button>
              </div>
            </div>
          )
        )}
      </Section>
    </>
  );
}
