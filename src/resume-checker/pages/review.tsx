import Spacer from "@/components/spacer";
import { Button, buttonVariants } from "@/components/ui/button";
import FeedbackForm from "@/resume-checker/components/feedback-form";
import Flags from "@/resume-checker/components/flags";
import PDF from "@/resume-checker/components/pdf";
import Score from "@/resume-checker/components/score";
import Skeleton from "@/components/skeleton";
import { useFormState } from "@/resume-checker/hooks/form-context";
import type { FormState } from "@/resume-checker/types";
import { sendGAEvent } from "@next/third-parties/google";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Review() {
  const router = useRouter();
  const [formState] = useFormState();
  const searchParams = useSearchParams();
  const [isFeedbackFormOpen, setFeedbackFormOpen] = useState(false);

  const urlFromQuery = searchParams?.get("url");

  const mutation = useMutation<
    FormState,
    Error,
    | { url: string; formData?: undefined }
    | { formData: FormData; url?: undefined }
  >({
    mutationKey: ["resume-check"],
    mutationFn: async ({ url, formData }) => {
      let res;

      if (formData) {
        res = await fetch("/api/grade", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/grade?url=" + url, {
          method: "GET",
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          "error" in err ? err.error : "Hubo un error inesperado"
        );
      }

      return res.json();
    },
    onMutate: () => {
      sendGAEvent("event", "resume-checker-submission");
    },
    onSuccess: (data) => {
      sendGAEvent("event", "resume-checker-success", data);
    },
    onError: (e) => {
      sendGAEvent("event", "resume-checker-error", e);
      router.push("/resume-checker");
    },
  });

  useEffect(() => {
    if (urlFromQuery) {
      mutation.mutate({ url: urlFromQuery });
    } else if (formState.url) {
      mutation.mutate({ url: formState.url });
    } else if (formState.formData) {
      mutation.mutate({ formData: formState.formData });
    } else {
      router.push("/resume-checker");
    }
  }, [formState.formData, formState.url, urlFromQuery]);

  const isExample = (url: string) => {
    return url?.startsWith("public/") && url?.endsWith("_resume.pdf");
  };

  const isVictorVigon = isExample(formState.url || urlFromQuery || "");

  return (
    <>
      <section className="mt-6 animate-fly-in container mx-auto px-4 grid lg:grid-cols-2 gap-6">
        <PDF />
        <div>
          <h1 className="text-2xl mb-4">Puntaje de tu CV</h1>
          <Score letter={mutation?.data?.grade} />
          <Spacer />
          <div>
            {mutation.isPending ? <Skeleton /> : null}
            {!mutation.isPending && isVictorVigon ? (
              <p>
                Este CV fue elaborado en{" "}
                <Link href="https://ready.silver.dev" className="link">
                  Interview Ready
                </Link>{" "}
                con la siguiente{" "}
                <Link
                  target="_blank"
                  href="https://docs.silver.dev/interview-ready/soft-fundamentals/preparando-el-cv"
                  className="link"
                >
                  guía
                </Link>
                .
              </p>
            ) : null}
            <Spacer />
            {mutation.data && mutation.data?.red_flags.length > 0 ? (
              <Flags
                flags={mutation.data.red_flags}
                color="red"
                label={`Red
                flag${mutation.data.red_flags.length > 1 ? "s" : ""}`}
              />
            ) : null}
            <Spacer />
            {mutation.data && mutation.data?.yellow_flags.length > 0 ? (
              <Flags
                flags={mutation.data.yellow_flags}
                color="yellow"
                label={`Yellow flag${mutation.data.yellow_flags.length > 1 ? "s" : ""}`}
              />
            ) : null}
          </div>
          <Spacer />
          {mutation.isPending ? (
            <p className="opacity-0 animate-[fadeIn_200ms_ease-in_3s_forwards] px-4 py-2 text-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow-md border border-gray-300 dark:border-gray-700">
              <span className="mr-2 text-secondary">●</span>
              El proceso puede tardar un hasta 2 minutos...
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 w-full">
                <Link
                  href="/resume-checker"
                  className={buttonVariants({
                    variant: "outline",
                    className: "flex-grow",
                  })}
                >
                  Probar otra vez
                </Link>
                <Link
                  href="https://app.silver.dev/prepping"
                  className={buttonVariants({
                    variant: "secondary",
                    className: "flex-grow",
                  })}
                >
                  Subir en Silver
                </Link>
              </div>
              <Button variant="ghost" onClick={() => setFeedbackFormOpen(true)}>
                Dijo cualquiera? Avisanos
              </Button>
            </div>
          )}
        </div>
      </section>
      {mutation.isSuccess ? (
        <FeedbackForm
          data={mutation.data}
          setFeedbackFormOpen={setFeedbackFormOpen}
          isFeedbackFormOpen={isFeedbackFormOpen}
        />
      ) : null}
    </>
  );
}
