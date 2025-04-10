import { AssistanceResponse } from "@/behavioral-checker/client-assistance/core/domain/Action";
import Spacer, { spaceSizes } from "@/components/spacer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FC, useEffect, useState } from "react";
import { FaFlag } from "react-icons/fa";
import RatingBar from "./RatingBar";

const Step2: FC<{
  result: AssistanceResponse;
  onNext: () => void;
  onTryAgain: () => void;
}> = ({
  result: { greenFlags, redFlags, question, response, result, questionId },
  onNext,
  onTryAgain,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });

    const handleBackButton = (e: PopStateEvent) => {
      e.preventDefault();
      onTryAgain();
    };

    window.history.pushState(null, "", window.location.pathname);

    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [onTryAgain]);

  const handleSubmitFeedback = async () => {
    if (!feedbackScore) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const feedbackResponse = await fetch("/api/behavioral-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageId,
          questionId,
          question,
          response,
          result,
          greenFlags,
          redFlags,
          feedbackScore,
        }),
      });

      if (!feedbackResponse.ok) {
        throw new Error("Failed to submit feedback");
      }

      const data = await feedbackResponse.json();
      if (data.pageId) {
        setPageId(data.pageId);
      }

      setShowFeedback(false);
      setFeedbackScore("");
    } catch (error) {
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Spacer size="lg" />
      <div
        className={`w-full flex flex-col lg:flex-row items-center lg:items-start justify-center ${spaceSizes.sm.gap}`}
      >
        <Card className="w-full lg:w-1/2 max-w-prose">
          <CardHeader>
            <CardTitle>{question}</CardTitle>
          </CardHeader>
          <CardContent>&ldquo;{response}&rdquo;</CardContent>
        </Card>
        <div
          className={`w-full lg:w-1/2 max-w-prose flex flex-col justify-center lg:pt-0 ${spaceSizes.sm.gap}`}
        >
          <RatingBar active={result} />
          {greenFlags.length > 0 && (
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="text-green-500 flex items-center gap-2">
                  <FaFlag className="size-8" />
                  Green Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4">
                  {greenFlags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {redFlags.length > 0 && (
            <Card className="border-red-500">
              <CardHeader>
                <CardTitle className="text-red-500 flex items-center gap-2">
                  <FaFlag className="size-8" />
                  Red Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4">
                  {redFlags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          <div className={`w-full justify-center flex ${spaceSizes.sm.gap}`}>
            <Button className="flex-1/2" variant="outline" onClick={onTryAgain}>
              Try again
            </Button>
            <Button className="flex-1/2" variant="secondary" onClick={onNext}>
              Next question
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setShowFeedback(true);
              setFeedbackScore("");
            }}
          >
            Was it wrong? Tell us
          </Button>
        </div>
      </div>

      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              What do you think should be the correct score for this answer?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup
              value={feedbackScore}
              onValueChange={setFeedbackScore}
              className="flex flex-row gap-4"
            >
              <div className="flex items-center flex-grow">
                <RadioGroupItem
                  value="Strong no"
                  id="strong-no"
                  className="hidden"
                />
                <Label
                  htmlFor="strong-no"
                  className={`px-3 py-2 rounded-md w-full text-center bg-red-600 text-white cursor-pointer transition-opacity ${
                    feedbackScore === "Strong no" ? "opacity-100" : "opacity-50"
                  }`}
                >
                  Strong no
                </Label>
              </div>
              <div className="flex items-center flex-grow">
                <RadioGroupItem value="No" id="no" className="hidden" />
                <Label
                  htmlFor="no"
                  className={`px-3 py-2 rounded-md w-full text-center bg-orange-500 text-white cursor-pointer transition-opacity ${
                    feedbackScore === "No" ? "opacity-100" : "opacity-50"
                  }`}
                >
                  No
                </Label>
              </div>
              <div className="flex items-center flex-grow">
                <RadioGroupItem value="Yes" id="yes" className="hidden" />
                <Label
                  htmlFor="yes"
                  className={`px-3 py-2 rounded-md w-full text-center bg-lime-600 text-white cursor-pointer transition-opacity ${
                    feedbackScore === "Yes" ? "opacity-100" : "opacity-50"
                  }`}
                >
                  Yes
                </Label>
              </div>
              <div className="flex items-center flex-grow">
                <RadioGroupItem
                  value="Strong yes"
                  id="strong-yes"
                  className="hidden"
                />
                <Label
                  htmlFor="strong-yes"
                  className={`px-3 py-2 rounded-md w-full text-center bg-green-600 text-white cursor-pointer transition-opacity ${
                    feedbackScore === "Strong yes"
                      ? "opacity-100"
                      : "opacity-50"
                  }`}
                >
                  Strong yes
                </Label>
              </div>
            </RadioGroup>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              onClick={handleSubmitFeedback}
              disabled={
                !feedbackScore || isSubmitting || feedbackScore === result
              }
              variant="secondary"
              className="w-full"
            >
              {isSubmitting
                ? "Submitting..."
                : feedbackScore === result
                  ? "Same as current score"
                  : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Step2;
