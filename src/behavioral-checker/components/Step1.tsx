import { Result } from "@/behavioral-checker/client-assistance/core/domain/Action";
import { NAME } from "@/behavioral-checker/constants";
import { Question, questions } from "@/behavioral-checker/data/questions";
import { companyOptions, roleOptions } from "@/behavioral-checker/data/selects";
import Container from "@/components/container";
import Heading from "@/components/heading";
import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";
import ConsentDialog from "./ConsentDialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Checkbox } from "./ui/checkbox";

const customClassNames = {
  control: (state: any) =>
    `p-2 rounded border ${
      state.isFocused
        ? "border-blue-500 ring-2 ring-blue-400 dark:border-blue-300 dark:ring-blue-300"
        : "border-gray-300 dark:border-gray-300"
    } bg-white dark:bg-transparent text-gray-800 dark:text-white`,
  menu: () => "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200",
  option: (state: any) =>
    `p-2 cursor-pointer ${
      state.isSelected
        ? "bg-blue-500 dark:bg-blue-600 text-white font-bold"
        : state.isFocused
          ? "bg-blue-100 dark:bg-blue-500/30 text-gray-900 dark:text-gray-100"
          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
    }`,
};

const ThemedSelect = (props: any) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Select
      {...props}
      classNames={{
        control: customClassNames.control,
        menu: customClassNames.menu,
        option: customClassNames.option,
      }}
      theme={(theme) => ({
        ...theme,
        borderRadius: 4,
        colors: {},
      })}
    />
  );
};

const Step1: React.FC<{
  question: Question;
  onSelectQuestion: (id: Question["id"]) => void;
  onSubmit: (
    id: Question["id"],
    question: string,
    audioBlob: Blob | null
  ) => void;
  onExample: (id: Question["id"], result: Result) => void;
  isLoading: boolean;
  loadingExampleId: Result | null;
}> = ({
  question,
  onSelectQuestion,
  onSubmit,
  onExample,
  isLoading,
  loadingExampleId,
}) => {
  const [company, setCompany] = useState<{ value: string; label: string }>(
    companyOptions[0]
  );
  const [role, setRole] = useState<{ value: string; label: string }>(
    roleOptions[0]
  );

  const questionToText = () => {
    let q = question.text;

    if (question.tags?.includes("company")) {
      q += ` ${company.value}`;
    }

    if (question.tags?.includes("role")) {
      q += `, ${role.value}`;
    }

    return q;
  };

  const [isActive, setIsActive] = useState<boolean>(false);
  const [reproduced, setReproduced] = useState<number>(0);
  const [counter, setCounter] = useState<number>(0);
  const [recorded, setRecorded] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [reproducing, setReproducing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioURLRef = useRef<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const reproducingTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [isHelping, setIsHelping] = useState<boolean>(false);
  const [pendingSubmission, setPendingSubmission] = useState<{
    id: string;
    question: string;
    audioBlob: Blob;
  } | null>(null);
  const [hasExistingConsent, setHasExistingConsent] = useState(false);

  const invalidLength = recorded && counter > question.maxTime;

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isActive) {
      setCounter(0);
      timer = setInterval(() => {
        setCounter((prev) => {
          if (prev >= question.maxTime) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isActive, question.maxTime]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        setAudioBlob(event.data);
        setRecorded(true);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsActive(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setError("Could not access microphone");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsActive(false);
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const handlePlay = () => {
    if (audioURLRef.current) {
      audioPlayerRef.current = new Audio(audioURLRef.current);
      audioPlayerRef.current.play();
      setReproducing(true);

      const duration = audioPlayerRef.current.duration;
      setReproduced(0);

      reproducingTimerRef.current = setInterval(() => {
        setReproduced((prev) => {
          if (prev >= Math.floor(duration)) {
            clearInterval(reproducingTimerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      audioPlayerRef.current.onended = () => {
        setReproducing(false);
        setReproduced(0);
        clearInterval(reproducingTimerRef.current);
      };
    }
  };

  const handleStop = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    clearInterval(reproducingTimerRef.current);
    setReproducing(false);
    setReproduced(0);
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setRecorded(false);
    setReproduced(0);
    setCounter(0);
    audioURLRef.current = null;
  };

  useEffect(() => {
    if (audioBlob) {
      audioURLRef.current = URL.createObjectURL(audioBlob);
    }
  }, [audioBlob]);

  useEffect(() => {
    // Reset everything when question changes
    deleteRecording();
    handleStop();
    if (isActive) {
      stopRecording();
    }
  }, [question.id]); // Usamos question.id como dependencia para evitar re-renders innecesarios

  useEffect(() => {
    const consent = localStorage.getItem("consent");
    setIsHelping(consent === "true");
    setHasExistingConsent(consent !== null);
  }, []);

  const handleConsentChange = (checked: boolean) => {
    localStorage.setItem("consent", checked.toString());
    setIsHelping(checked);
  };

  const handleEvaluate = () => {
    if (isLoading || !audioBlob) return;

    onSubmit(question.id, questionToText(), audioBlob);

    // const hasConsent = localStorage.getItem("consent");

    // if (hasConsent === null) {
    //   setPendingSubmission({
    //     id: question.id,
    //     question: questionToText(),
    //     audioBlob,
    //   });
    //   setShowConsent(true);
    // } else {
    //   setShowConsent(false);
    // }
  };

  const handleAcceptConsent = () => {
    localStorage.setItem("consent", "true");
    setShowConsent(false);
    if (pendingSubmission) {
      onSubmit(
        pendingSubmission.id,
        pendingSubmission.question,
        pendingSubmission.audioBlob
      );
      setPendingSubmission(null);
    }
  };

  const handleDeclineConsent = () => {
    localStorage.setItem("consent", "false");
    setShowConsent(false);
    if (pendingSubmission) {
      onSubmit(
        pendingSubmission.id,
        pendingSubmission.question,
        pendingSubmission.audioBlob
      );
      setPendingSubmission(null);
    }
  };

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
      <Card className="max-w-[1000px] w-full mx-auto my-20">
        <CardContent className="py-4 px-8">
          {/* Sección Pregunta - Ancho completo */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">
              Question
            </h2>
            <ThemedSelect
              options={questions.map((q) => ({ value: q.id, label: q.text }))}
              value={{ value: question.id, label: question.text }}
              onChange={(value: { value: string; label: string }) =>
                onSelectQuestion(value.value)
              }
              className="w-full"
              styles={{
                control: (base: any) => ({
                  ...base,
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                }),
              }}
            />
          </div>

          {/* Contenedor flex para Respuesta y Ejemplos */}
          <div className="flex gap-8 pt-8">
            {/* Sección Respuesta - Mitad izquierda */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                Your answer
              </h2>
              {question.tags?.includes("company") && (
                <>
                  <label className="block text-gray-700 dark:text-gray-200 text-lg mb-2">
                    Company
                  </label>
                  <ThemedSelect
                    options={companyOptions}
                    value={company}
                    onChange={(value: { value: string; label: string }) =>
                      setCompany(value)
                    }
                    className="mb-4"
                  />
                </>
              )}
              {question.tags?.includes("role") && (
                <>
                  <label className="block text-gray-700 dark:text-gray-200 text-lg mb-2">
                    Role
                  </label>
                  <ThemedSelect
                    options={roleOptions}
                    value={role}
                    onChange={(value: { value: string; label: string }) =>
                      setRole(value)
                    }
                    className="mb-4"
                  />
                </>
              )}
              <div className="mb-2">
                <label className="block text-gray-700 dark:text-gray-200 text-lg mb-2">
                  Audio
                </label>
                <div
                  className={`flex items-center justify-between w-full p-4 border rounded-lg ${
                    invalidLength
                      ? "border-red-600"
                      : "border-gray-300 dark:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-[36px] h-[36px] flex justify-center items-center">
                      {!isActive && recorded ? (
                        <div
                          className="w-[36px] h-[36px] bg-indigo-800 dark:bg-indigo-500 rounded-full flex items-center justify-center cursor-pointer"
                          onClick={reproducing ? handleStop : handlePlay}
                        >
                          {reproducing ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="white"
                              viewBox="0 0 24 24"
                              className="w-6 h-6"
                            >
                              <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="white"
                              viewBox="-1 0 24 24"
                              className="w-6 h-6"
                            >
                              <path d="M5.25 5.25l13.5 6.75-13.5 6.75V5.25z" />
                            </svg>
                          )}
                        </div>
                      ) : (
                        <motion.div
                          className="bg-red-500"
                          onClick={() => {
                            isActive ? stopRecording() : startRecording();
                          }}
                          initial={false}
                          animate={{
                            borderRadius: isActive ? "6px" : "50%",
                            width: isActive ? "24px" : "36px",
                            height: isActive ? "24px" : "36px",
                          }}
                          transition={{
                            duration: 0.2,
                            ease: "easeInOut",
                          }}
                          style={{
                            cursor: "pointer",
                          }}
                        />
                      )}
                    </div>
                    <span className="text-lg font-bold text-gray-800 dark:text-gray-200 ml-4">
                      {isActive && "Recording ("}
                      {recorded ? `${formatTime(reproduced)}/` : ""}
                      {formatTime(counter)}
                      {isActive && ")"}
                    </span>
                  </div>
                  {recorded && (
                    <Button variant="destructive" onClick={deleteRecording}>
                      Retry
                    </Button>
                  )}
                  {!recorded && (
                    <p className="text-gray-700 dark:text-gray-200 text-sm text-center">
                      {question.maxTime}s
                    </p>
                  )}
                </div>
                {invalidLength && (
                  <p className="text-red-500 text-sm text-center mt-2">
                    Answer time must be less than {question.maxTime}s
                  </p>
                )}
              </div>
              {hasExistingConsent && (
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="consent"
                    checked={isHelping}
                    onCheckedChange={handleConsentChange}
                  />
                  <label
                    htmlFor="consent"
                    className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Ayudar a mejorar el modelo con mi respuesta
                  </label>
                </div>
              )}
              <Button
                className="mt-4 w-full bg-indigo-800 hover:bg-indigo-600 text-white"
                onClick={handleEvaluate}
                disabled={
                  !recorded ||
                  counter > question.maxTime ||
                  isLoading ||
                  loadingExampleId !== null
                }
              >
                {!isLoading && "Evaluate Answer"}
                {isLoading && (
                  <div className="flex items-center justify-center">
                    <svg
                      aria-hidden="true"
                      role="status"
                      className="inline w-4 h-4 me-3 text-white animate-spin"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="#E5E7EB"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentColor"
                      />
                    </svg>
                    Loading...
                  </div>
                )}
              </Button>
            </div>

            {/* Línea divisoria vertical */}
            <div className="flex flex-col items-center">
              <div className="flex-1 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium my-4">
                ó
              </span>
              <div className="flex-1 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
            </div>

            {/* Sección Ejemplos - Mitad derecha */}
            <div className="w-[250px]">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                Examples
              </h2>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => onExample(question.id, "Strong yes")}
                  disabled={isLoading || loadingExampleId !== null}
                  className="w-full p-4 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingExampleId === "Strong yes" ? (
                    <div className="flex items-center justify-center">
                      <svg
                        aria-hidden="true"
                        role="status"
                        className="inline w-4 h-4 me-3 text-white animate-spin"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="#E5E7EB"
                        />
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentColor"
                        />
                      </svg>
                      Loading...
                    </div>
                  ) : (
                    "Strong yes"
                  )}
                </button>
                <button
                  onClick={() => onExample(question.id, "Yes")}
                  disabled={isLoading || loadingExampleId !== null}
                  className="w-full p-4 rounded-lg text-sm font-medium text-white bg-lime-600 hover:bg-lime-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingExampleId === "Yes" ? (
                    <div className="flex items-center justify-center">
                      <svg
                        aria-hidden="true"
                        role="status"
                        className="inline w-4 h-4 me-3 text-white animate-spin"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="#E5E7EB"
                        />
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentColor"
                        />
                      </svg>
                      Loading...
                    </div>
                  ) : (
                    "Yes"
                  )}
                </button>
                <button
                  onClick={() => onExample(question.id, "No")}
                  disabled={isLoading || loadingExampleId !== null}
                  className="w-full p-4 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingExampleId === "No" ? (
                    <div className="flex items-center justify-center">
                      <svg
                        aria-hidden="true"
                        role="status"
                        className="inline w-4 h-4 me-3 text-white animate-spin"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="#E5E7EB"
                        />
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentColor"
                        />
                      </svg>
                      Loading...
                    </div>
                  ) : (
                    "No"
                  )}
                </button>
                <button
                  onClick={() => onExample(question.id, "Strong no")}
                  disabled={isLoading || loadingExampleId !== null}
                  className="w-full p-4 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingExampleId === "Strong no" ? (
                    <div className="flex items-center justify-center">
                      <svg
                        aria-hidden="true"
                        role="status"
                        className="inline w-4 h-4 me-3 text-white animate-spin"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="#E5E7EB"
                        />
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentColor"
                        />
                      </svg>
                      Loading...
                    </div>
                  ) : (
                    "Strong no"
                  )}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <ConsentDialog
        open={showConsent}
        onAccept={handleAcceptConsent}
        onDecline={handleDeclineConsent}
      />
    </Container>
  );
};

export default Step1;
