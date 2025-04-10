import {
  AssistanceResponse,
  Result,
} from "@/behavioral-checker/client-assistance/core/domain/Action";
import Notification from "@/behavioral-checker/components/Notification";
import Step1 from "@/behavioral-checker/components/Step1";
import Step2 from "@/behavioral-checker/components/Step2";
import { Question, questions } from "@/behavioral-checker/data/questions";
import { PreppingData } from "@/lib/utils";
import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState<AssistanceResponse>();
  const [error, setError] = useState<string>("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingExampleId, setLoadingExampleId] = useState<Result | null>(null);

  const question = questions[questionIndex];

  const handleSubmit = async (
    id: Question["id"],
    question: string,
    audioBlob: Blob | null
  ) => {
    if (!audioBlob) return;

    try {
      setError("");
      setIsLoading(true);
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.wav");
      formData.append("id", id);
      formData.append("question", question);
      formData.append("consent", localStorage.getItem("consent") || "false");

      const response = await fetch("/api/analysis", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error analyzing audio");
      }

      const data = (await response.json()) as AssistanceResponse;
      const preppingData = PreppingData.getToolData("behavioral-checker");
      preppingData[id] = data.result;
      PreppingData.setToolData("behavioral-checker", preppingData);
      setResult(data);
    } catch (error: any) {
      console.error("Error during audio analysis:", error.message);
      setError("An error occurred, please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExample = async (id: Question["id"], result: Result) => {
    if (isLoading || loadingExampleId) return;

    try {
      setError("");
      setLoadingExampleId(result);

      const response = await fetch("/api/example", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, result }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error processing example");
      }

      if (response.status === 204) {
        setError(
          `No example available for this question with the result '${result}'. Be the first to create one!`
        );
        setResult(undefined);
        return;
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error("Error processing example:", error.message);
      setError("Error trying to show the example");
    } finally {
      setLoadingExampleId(null);
    }
  };

  const handleNext = () => {
    setResult(undefined);
    scrollTo({ top: 350, behavior: "instant" });
    setQuestionIndex((prev) => (prev + 1) % questions.length);
  };

  const handleTryAgain = () => {
    scrollTo({ top: 350, behavior: "instant" });
    setResult(undefined);
  };

  const handleSelectQuestion = (id: Question["id"]) => {
    const question = questions.find((q) => q.id === id);
    if (!question) return;

    setQuestionIndex(questions.indexOf(question));
  };

  return (
    <div className={`w-full items-center justify-items-center`}>
      {error && (
        <Notification
          message={error}
          type="error"
          onClose={() => setError("")}
        />
      )}
      {result ? (
        <Step2
          onNext={handleNext}
          onTryAgain={handleTryAgain}
          result={result}
        />
      ) : (
        <Step1
          question={question}
          onSelectQuestion={handleSelectQuestion}
          onSubmit={handleSubmit}
          onExample={handleExample}
          isLoading={isLoading}
          loadingExampleId={loadingExampleId}
        />
      )}
    </div>
  );
}
