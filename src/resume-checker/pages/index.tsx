"use client";

import Description from "@/components/description";
import Grid from "@/components/grid";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Spacer, { spaceSizes } from "@/components/spacer";
import { Button } from "@/components/ui/button";
import ErrorBadge from "@/resume-checker/components/error-badge";
import { useFormState } from "@/resume-checker/hooks/form-context";
import { useMutationState } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useDropzone } from "react-dropzone";
import { TYPST_TEMPLATE_URL } from "@/resume-checker/utils";

function usePasteEvent(pasteListener: (event: ClipboardEvent) => void) {
  useEffect(() => {
    document.addEventListener("paste", pasteListener);

    return () => {
      document.removeEventListener("paste", pasteListener);
    };
  }, [pasteListener]);
}

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<Error | null>(null);
  const [, setFormState] = useFormState();

  const onDrop = useCallback(
    (files: File[]) => {
      const formData = new FormData();
      const [cvFile] = files;

      if (!cvFile) return;

      formData.set("resume", cvFile);
      setFormState({ formData });
      router.push("/resume-checker/review");
    },
    [router, setFormState],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    multiple: false,
  });

  usePasteEvent(async (event: ClipboardEvent) => {
    event.preventDefault();
    const data = event.clipboardData;
    if (!data) {
      return;
    }

    const url = data.getData("text").toString();
    if (!url.startsWith("https") || !url.endsWith(".pdf")) {
      setError(
        new Error("El URL tiene que empezar con 'https' y terminar con 'pdf'"),
      );
      return;
    }
    setFormState({ url });
    router.push("/resume-checker/review");
  });

  function submitWithResumeUrl(letter: string) {
    const url = `public/${letter}_resume.pdf`;
    console.log("Setting URL:", url);
    setFormState({ url });
    router.push(`/resume-checker/review?url=${encodeURIComponent(url)}`);
  }

  async function handleFormSubmission(event: ChangeEvent) {
    const formElement = event.currentTarget.parentElement;
    if (!formElement || !(formElement instanceof HTMLFormElement)) return;
    const formData = new FormData(formElement);
    const honeypot = formData.get("name");

    if (honeypot) {
      return;
    }

    setFormState({ formData });
    router.push("/resume-checker/review");
  }

  function prevent(event: FormEvent) {
    event.preventDefault();
  }

  const mutations = useMutationState({
    filters: { mutationKey: ["resume-check"] },
    select: (mutation) => mutation.state.error,
  });

  const mutationError = mutations[mutations.length - 1];

  return (
    <>
      <ErrorBadge error={error || mutationError} />
      <Section>
        <Heading size="lg" center>
          <span className="text-primary">Resume</span> Checker
        </Heading>
        <Spacer />
        <Description center>
          Build your resume with{" "}
          <Link
            href={TYPST_TEMPLATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            Silver&apos;s template
          </Link>
          . Upload it here and get instant feedback.
        </Description>
        <Spacer size="lg" />
        <Grid className="grid-cols-1 md:grid-cols-4">
          <form
            {...getRootProps()}
            onSubmit={prevent}
            method="POST"
            action="/api/grade"
            encType="multipart/form-data"
            className={`w-full overflow-hidden md:col-span-3 h-full p-8 relative border-2 rounded-lg  ${isDragActive ? "cursor-grabbing border-foreground " : "border-foreground/50"}  border-dashed flex items-center justify-center flex-col gap-1`}
          >
            <Button variant="secondary">Click here to upload your CV</Button>
            <span className="mt-4 text-center">or drag it here</span>
            <input
              className="sr-only"
              onChange={handleFormSubmission}
              id="resume"
              name="resume"
              {...getInputProps()}
            />
            {/* honeypot */}
            <input className="hidden" type="text" name="name" />
          </form>
          <div>
            <p className="text-center md:text-left">Or use an example:</p>
            <Spacer />
            <div className={`flex flex-col ${spaceSizes.sm.gap}`}>
              {[
                { letter: "s", name: "Victor Vigon" },
                { letter: "a", name: "Gabriel Benmergui" },
                { letter: "b", name: "Horacio Consultora" },
                { letter: "c", name: "Claudia Alves" },
              ].map(({ letter, name }) => (
                <button
                  key={letter}
                  className="relative"
                  onClick={() => submitWithResumeUrl(letter)}
                >
                  <div
                    className={`${letter} absolute transition-colors inset-0 rounded-lg`}
                  ></div>
                  <div
                    className={`m-1 pointer-events-none flex flex-col gap-2 text-center items-center justify-center rounded-lg ${spaceSizes.sm.p} relative bg-[var(--background)]`}
                  >
                    <span className="font-semibold tracking-wider">{name}</span>
                    <span>Grade: {letter.toUpperCase()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Grid>
        <Spacer size="lg" />
        <div className="text-center">
          <Link href="/resume-checker/privacy" className="link">
            Privacy policy
          </Link>
        </div>
      </Section>
    </>
  );
}
