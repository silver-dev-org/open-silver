import { AssistanceResponse } from "@/behavioral-checker/client-assistance/core/domain/Action";

import Description from "@/components/description";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Space, { spaceSizes } from "@/components/space";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FC } from "react";
import { FaFlag } from "react-icons/fa";
import RatingBar from "./RatingBar";

const Step2: FC<{
  result: AssistanceResponse;
  onNext: () => void;
  onTryAgain: () => void;
}> = ({
  result: { greenFlags, redFlags, question, response, result },
  onNext,
  onTryAgain,
}) => {
  return (
    <Section>
      <Heading center>
        <span className="text-primary">Behavioral</span> Checker
      </Heading>
      <Space />
      <Description center>
        Get instant feedback from answering classical behavioral questions with
        Silver.dev's themed auto-response. Great for practicing English &
        Storytelling.
      </Description>
      <Space size="lg" />
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
            <Button className="flex-1/2" onClick={onNext}>
              Next question
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Step2;
