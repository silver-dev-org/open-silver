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
import { Card, CardContent } from "@/components/ui/card";
import { createPrompt } from "@/company-checker/utils/prompts";

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
  };

  const investigateCompany = async () => {
    const company = inputRef?.current?.value;
    if (!company) {
      setError(new Error('Por favor ingresa el nombre de una empresa'));
      return;
    }

    setText("");
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/company?company=${encodeURIComponent(company)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al buscar información de la empresa');
      }
      
      const json = await response.json();
      setText(removeMarkdown(removeTripleBackticks(json.text)));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al buscar información de la empresa'));
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
          {isLoading ? <Skeleton /> : (text && (
            <div>
            <Card className="w-full max-w-4xl mx-auto">
              <CardContent className="pt-6">
                <div className="markdown-container">
                  <ReactMarkdown>{text}</ReactMarkdown>
                </div>
                
              </CardContent>
            </Card>
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
                {copied ? "¡Copiado!" : "Copiar prompt para usar en otras plataformas"}
              </Button>
            </div>
            </div>
          )
          )}
      </Section>
    </>
  );
}
