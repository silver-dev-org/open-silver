"use client";

import Grid from "@/components/grid";
import Spacer from "@/components/spacer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, PreppingData } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Code,
  Eye,
  FileText,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import React, {
  ElementType,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FaGithub } from "react-icons/fa";
import {
  codeEvaluationPrompt,
  loadingMessageInterval,
  loadingMessages,
  readmeEvaluationPrompt,
  scoreColors,
} from "./constants";
import { FeedbackFlags, Repo, RepoAnalysis } from "./types";

export default function Client({
  repos,
  installationId,
}: {
  repos: Repo[];
  installationId?: string;
}) {
  const [selectedRepo, setSelectedRepo] = useState<Repo | undefined>(undefined);
  const { refetch, data, error, isLoading, isSuccess, isError } = useAnalysis(
    selectedRepo,
    installationId
  );
  const component = useMemo(() => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState error={error} />;
    if (isSuccess) return <SuccessState {...data!} />;
    return null;
  }, [isLoading, isSuccess, isError, error, data]);

  const handleRepoChange = useCallback(
    (value: string) => {
      const repo = repos.find((repo) => repo.id.toString() === value);
      setSelectedRepo(repo);
    },
    [repos]
  );

  const handleAnalyzeClick = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (selectedRepo && data) {
      const preppingData = PreppingData.getToolData("take-home-checker");
      preppingData[selectedRepo.full_name] = data.score;
      PreppingData.setToolData("take-home-checker", preppingData);
    }
  }, [selectedRepo, data]);

  useEffect(() => {
    if (installationId) {
      document.cookie = `installationId=${installationId}; path=/; max-age=31536000`;
    }
  }, [installationId]);

  return (
    <>
      <div className="flex flex-col gap-3 max-w-prose w-full mx-auto">
        <Button asChild className="w-full" variant="outline">
          <Link
            href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME}/installations/new`}
          >
            <FaGithub />
            Grant repo access
          </Link>
        </Button>
        <div className="flex gap-1.5">
          <RepoSelector repos={repos} onValueChange={handleRepoChange} />
          <AnalyzeButton
            onClick={handleAnalyzeClick}
            isLoading={isLoading}
            hasSelectedRepo={!!selectedRepo}
          />
        </div>
      </div>
      {component && (
        <>
          <Spacer size="lg" />
          {component}
        </>
      )}
    </>
  );
}

function useAnalysis(repo?: Repo, installationId?: string) {
  return useQuery({
    queryKey: ["analyze-take-home", repo?.owner, repo?.name, installationId],
    queryFn: async () => {
      if (!repo || !installationId) return;
      const response = await fetch("/api/analyze-take-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoFullName: repo.full_name,
          installationId: parseInt(installationId),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data as RepoAnalysis;
    },
    enabled: false,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

function RepoSelector({
  repos,
  onValueChange,
}: {
  repos: Repo[];
  onValueChange: (value: string) => void;
}) {
  return (
    <Select onValueChange={onValueChange} disabled={repos.length === 0}>
      <SelectTrigger className="text-left w-full">
        <SelectValue
          placeholder={
            repos.length === 0
              ? "No repositories available"
              : "Select a repository"
          }
        />
      </SelectTrigger>
      <SelectContent>
        {repos
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((repo) => (
            <SelectItem key={repo.id} value={repo.id.toString()}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{repo.name}</span>
                {repo.private && (
                  <Badge variant="outline" className="text-xs">
                    Private
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

function AnalyzeButton({
  onClick,
  isLoading,
  hasSelectedRepo,
}: {
  onClick: () => void;
  isLoading: boolean;
  hasSelectedRepo: boolean;
}) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      disabled={!hasSelectedRepo || isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Sparkles />
          Analyze
        </>
      )}
    </Button>
  );
}

function ErrorState({ error }: { error: Error }) {
  return <p className="text-destructive text-center">Error: {error.message}</p>;
}

function LoadingState() {
  const [message, setMessage] = useState("");

  const updateMessage = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * loadingMessages.length);
    setMessage(loadingMessages[randomIndex]);
  }, []);

  useEffect(() => {
    updateMessage();
    const interval = setInterval(updateMessage, loadingMessageInterval);
    return () => clearInterval(interval);
  }, [updateMessage]);

  return (
    <>
      <div className="flex flex-col gap-6 mx-auto max-w-[130ch]">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center relative">
              <div className="text-center flex items-center gap-3">
                <Skeleton className="h-10 w-20 mx-auto rounded-full" />
                <Skeleton className="h-6 w-32 mx-auto" />
              </div>
              <div className="text-center absolute left-1/2 -translate-x-1/2">
                {message}
              </div>
              <Skeleton className="h-9 w-32" />
            </div>
          </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function SuccessState(analysis: RepoAnalysis) {
  return (
    <div className="flex flex-col gap-6 mx-auto max-w-[130ch]">
      <Card>
        <CardContent className="pt-6">
          <section className="flex justify-between items-center">
            <div className="text-center flex gap-3 items-center">
              <h1 className="text-lg font-semibold text-muted-foreground order-last">
                Project Score
              </h1>
              <strong
                className={cn(
                  "text-lg px-3 py-1.5 rounded-full",
                  scoreColors[analysis.score]
                )}
              >
                {analysis.score}
              </strong>
            </div>
            <PromptsDialog />
          </section>
        </CardContent>
      </Card>
      <Grid>
        <FeedbackCard
          title="Documentation"
          flags={analysis.docs}
          Icon={FileText}
        />
        <FeedbackCard title="Code" flags={analysis.code} Icon={Code} />
      </Grid>
    </div>
  );
}

function PromptsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye />
          View Prompts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Analysis Prompts</DialogTitle>
          <DialogDescription>
            The prompts used to analyze your repository
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <div className="flex flex-col gap-6">
            <Separator />
            <p className="font-semibold">Documentation Analysis Prompt</p>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded whitespace-pre-wrap">
              {readmeEvaluationPrompt}
            </p>
            <p className="font-semibold">Code Analysis Prompt</p>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded whitespace-pre-wrap">
              {codeEvaluationPrompt}
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function FeedbackCard({
  title,
  flags,
  Icon,
}: {
  title: string;
  flags: FeedbackFlags;
  Icon: ElementType;
}): React.ReactElement {
  return (
    <Card>
      <section>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon />
            <h1>{title}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FeedbackFlagList
            label="Strengths"
            color="text-green-500"
            Icon={CheckCircle}
            items={flags.green}
          />
          <FeedbackFlagList
            label="Areas of Improvement"
            color="text-yellow-500"
            Icon={AlertTriangle}
            items={flags.yellow}
          />
          <FeedbackFlagList
            label="Critical Issues"
            color="text-red-500"
            Icon={XCircle}
            items={flags.red}
          />
        </CardContent>
      </section>
    </Card>
  );
}

function FeedbackFlagList({
  label,
  color,
  Icon,
  items,
}: {
  label: string;
  color: string;
  Icon: ElementType;
  items?: string[];
}): React.ReactElement | null {
  if (!items || items.length === 0) return null;

  return (
    <section>
      <h1 className={cn("font-semibold flex items-center gap-3", color)}>
        <Icon className="size-4" />
        {label}
      </h1>
      <ul className="list-disc list-inside pl-1.5">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
