"use client";

import { Result } from "@/behavioral-checker/client-assistance/core/domain/Action";
import { Question, questions } from "@/behavioral-checker/data/questions";
import {
  companyOptions,
  roleOptions,
  valueOptions,
} from "@/behavioral-checker/data/selects";
import Description from "@/components/description";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Space from "@/components/space";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import ConsentDialog from "./ConsentDialog";

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
  const [company, setCompany] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedCompany = localStorage.getItem("behavioral-company");
      return savedCompany || companyOptions[0].value;
    }
    return companyOptions[0].value;
  });
  const [role, setRole] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("behavioral-role");
      return savedRole || roleOptions[0].value;
    }
    return roleOptions[0].value;
  });
  const [value, setValue] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedValue = localStorage.getItem("behavioral-value");
      return savedValue || valueOptions[0].value;
    }
    return valueOptions[0].value;
  });

  const questionToText = () => {
    let q = question.text;

    if (question.tags?.includes("company")) {
      q += ` ${company}`;
    }

    if (question.tags?.includes("role")) {
      q += ` ${role}`;
    }

    if (question.tags?.includes("value")) {
      q += ` ${value}`;
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
  const [isHelping, setIsHelping] = useState<boolean>(true);
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
    setIsHelping(consent === "true" || consent === null);
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

  const handleCompanyChange = (value: string) => {
    setCompany(value);
    localStorage.setItem("behavioral-company", value);
  };

  const handleRoleChange = (value: string) => {
    setRole(value);
    localStorage.setItem("behavioral-role", value);
  };

  const handleValueChange = (value: string) => {
    setValue(value);
    localStorage.setItem("behavioral-value", value);
  };

  return (
    <Section>
      <Heading center>
        <span className="text-primary">Behavioral</span> Checker
      </Heading>
      <Space />
      <Description center>
        Get instant feedback from answering classical behavioral questions with
        Silver.dev&lsquo;s themed auto-response. Great for practicing English &
        Storytelling. Check{" "}
        <Link
          className="link"
          href="https://docs.silver.dev/interview-ready/soft-fundamentals/pasando-entrevistas/behavioral-preguntas-clasicas#tips"
          target="_blank"
        >
          our tips
        </Link>{" "}
        for more guidance.
      </Description>
      <Space size="lg" />
      <Card className="max-w-[1000px] w-full mx-auto">
        <CardContent>
          {/* Sección Pregunta - Ancho completo */}
          <div className="border-b border-foreground pb-6">
            <h2 className="text-xl font-bold mb-4">Question</h2>
            <Select
              value={question.id}
              onValueChange={(value) => onSelectQuestion(value)}
            >
              <SelectTrigger className="w-full text-lg whitespace-normal text-left py-8">
                <SelectValue placeholder="Select a question" />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                {questions.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contenedor flex para Respuesta y Ejemplos */}
          <div className="flex flex-col lg:flex-row gap-8 pt-6">
            {/* Sección Respuesta - Mitad izquierda */}
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-4">Your answer</h2>
              {question.tags?.includes("company") && (
                <>
                  <label className="block text-lg mb-1">Company</label>
                  <Select value={company} onValueChange={handleCompanyChange}>
                    <SelectTrigger className="w-full mb-4">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyOptions.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              {question.tags?.includes("role") && (
                <>
                  <label className="block text-lg mb-1">Role</label>
                  <Select value={role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="w-full mb-4">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              {question.tags?.includes("value") && (
                <>
                  <label className="block text-lg mb-1">Value</label>
                  <Select value={value} onValueChange={handleValueChange}>
                    <SelectTrigger className="w-full mb-4">
                      <SelectValue placeholder="Select a value" />
                    </SelectTrigger>
                    <SelectContent>
                      {valueOptions.map((v) => (
                        <SelectItem key={v.value} value={v.value}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              <div className="mb-4">
                <label className="block text-lg mb-1">Audio</label>
                <div
                  className={`flex items-center justify-between w-full p-4 border rounded-lg ${
                    invalidLength
                      ? "border-red-600"
                      : "border-gray-300 dark:border-gray-300"
                  }`}
                >
                  <div className="flex items-center w-full sm:w-auto">
                    <div className="size-10 flex justify-center items-center">
                      {!isActive && recorded ? (
                        <div
                          className="size-10 bg-secondary rounded-full flex items-center justify-center cursor-pointer"
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
                    <span className="text-lg font-bold ml-4">
                      {isActive && "Recording ("}
                      {recorded ? `${formatTime(reproduced)}/` : ""}
                      {formatTime(counter)}
                      {isActive && ")"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {recorded && (
                      <Button variant="destructive" onClick={deleteRecording}>
                        Retry
                      </Button>
                    )}
                    {!recorded && (
                      <p className="text-sm text-center">{question.maxTime}s</p>
                    )}
                  </div>
                </div>
                {invalidLength && (
                  <p className="text-red-500 text-sm text-center mt-2">
                    Answer time must be less than {question.maxTime}s
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="consent"
                  checked={isHelping}
                  onCheckedChange={handleConsentChange}
                />
                <label htmlFor="consent" className="text-sm cursor-pointer">
                  Help improve the model with my answer
                </label>
              </div>
              <Button
                className="mt-4 w-full"
                variant="secondary"
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
                    Processing audio...
                  </div>
                )}
              </Button>
            </div>

            {/* Línea divisoria vertical */}
            <div className="hidden lg:flex flex-col items-center">
              <div className="flex-1 w-[1px] bg-foreground"></div>
              <span className="text-sm font-medium my-4">o</span>
              <div className="flex-1 w-[1px] bg-foreground"></div>
            </div>

            {/* Sección Ejemplos - Mitad derecha */}
            <div className="w-full lg:w-[250px]">
              <h2 className="text-xl font-bold mb-3">Examples</h2>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <button
                  onClick={() => onExample(question.id, "Strong yes")}
                  disabled={isLoading || loadingExampleId !== null}
                  className="cursor-pointer w-full p-4 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="cursor-pointer w-full p-4 rounded-lg text-sm font-medium text-white bg-lime-600 hover:bg-lime-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="cursor-pointer w-full p-4 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="cursor-pointer w-full p-4 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </Section>
  );
};

export default Step1;
