import { AssistanceResponse } from "@/behavioral-checker/client-assistance/core/domain/Action";
import { NAME } from "@/behavioral-checker/constants";
import Container from "@/components/container";
import Heading from "@/components/heading";
import Link from "next/link";
import { FC } from "react";
import { Button } from "./ui/button";
import RatingBar from "./ui/ratingbar";

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
    <Container>
      <Heading
        center
        description="  Get instant feedback from answering classical behavioral questions
          with Silver.dev's themed auto-response. Great for practicing
          English & Storytelling."
      >
        {NAME}
      </Heading>
      <div className="w-full flex flex-col lg:flex-row-reverse items-center lg:items-start justify-center lg:space-x-reverse lg:space-x-20 space-y-6 lg:space-y-0 px-[5%] lg:px-[10%] my-20">
        <div className="flex flex-col justify-center items-center w-full lg:w-1/2 space-y-6">
          <p className="text-gray-800 dark:text-gray-100 text-xl font-semibold text-center mb-2 leading-relaxed">
            {question}
          </p>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 w-full">
            <p className="text-gray-700 dark:text-gray-200 text-lg text-center italic">
              &ldquo;{response}&rdquo;
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center pt-5 lg:pt-0">
          <RatingBar active={result} />
          <div className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 p-8 shadow-lg">
            {greenFlags.length > 0 && (
              <>
                <h3 className="text-green-600 font-bold text-lg mt-6 mb-3">
                  Green Flags
                </h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-3">
                  {greenFlags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </>
            )}
            {redFlags.length > 0 && (
              <>
                <h3
                  className={`text-red-600 font-bold text-lg mb-3 ${greenFlags.length > 0 && "mt-6"}`}
                >
                  Red Flags
                </h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200 space-y-3">
                  {redFlags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className="w-full flex gap-4 mt-8">
            <Button
              className="flex-1 bg-pink-700 hover:bg-pink-600 text-white py-3 text-lg"
              onClick={onTryAgain}
            >
              Repeat question
            </Button>
            <Button
              className="flex-1 bg-indigo-800 hover:bg-indigo-600 text-white py-3 text-lg"
              onClick={onNext}
            >
              New question
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-6 mb-20 animate-fly-in container mx-auto px-4 grid lg:grid-cols-2 gap-6">
        {/* divider */}
        <div className="w-full h-0.5 bg-gray-300 dark:bg-gray-400 lg:col-span-2"></div>
        <h2 className="w-full my-2 text-xl text-center lg:col-span-2">
          {NAME} es de{" "}
          <Link
            href="https://ready.silver.dev"
            className="text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            Interview Ready
          </Link>
        </h2>
        <p className="mt-0 text-center lg:col-span-2">
          Esta herramienta es parte de un programa integral de preparación de
          entrevistas.
          <br />
          Podes ver el formato y más contenido en el video.
        </p>
        <iframe
          className="rounded-lg shadow-lg mt-4 max-w-xs md:max-w-none mx-auto lg:col-span-2"
          width="560"
          height="315"
          src="https://www.youtube.com/embed/D8ExwS6iPAI?si=aTDQHypNf1s0KHyM"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        ></iframe>
      </div>
    </Container>
  );
};

export default Step2;
