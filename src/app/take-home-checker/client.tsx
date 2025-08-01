"use client";

import Spacer from "@/components/spacer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn, PreppingData } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Code,
  Eye,
  FileArchive,
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
import { useForm } from "react-hook-form";
import { FaGithub } from "react-icons/fa";
import { toast } from "sonner";
import z from "zod";
import {
  cookieName,
  loadingMessageInterval,
  loadingMessages,
  prompt,
  scoreColors,
} from "./constants";
import { FeedbackFlags, GithubRepo, TakeHomeCheckerData } from "./types";

export default function TakeHomeCheckerClient({
  installationId,
}: {
  installationId?: string;
}) {
  const [githubRepo, setGithubRepo] = useState<GithubRepo>();
  const [zipRepo, setZipRepo] = useState<File>();
  const { data: repos, isLoading: areReposLoading } = useQuery({
    queryKey: ["repos", installationId],
    queryFn: async () => {
      if (!installationId) return [];
      const response = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installationId: parseInt(installationId) }),
      });
      const data = await response.json();
      return data as GithubRepo[];
    },
    enabled: !!installationId,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  const {
    data,
    refetch: analyze,
    isSuccess,
    isError,
    isFetching,
    error,
    status,
    fetchStatus,
  } = useQuery({
    queryKey: ["analyze-take-home", githubRepo?.full_name, installationId],
    queryFn: async () => {
      const formData = new FormData();
      if (zipRepo) {
        const sizeInMb = zipRepo.size / 1000000;
        if (sizeInMb > 4.5) {
          throw new Error(
            `File must be less than 4.5MB (it's ${sizeInMb.toFixed(2)}MB). Please remove heavy files like images and videos from your take-home and try uploading it again.`
          );
        }
        formData.append("file", zipRepo);
      } else if (githubRepo && installationId) {
        formData.append("name", githubRepo.full_name);
        formData.append("installationId", installationId);
      }
      const response = await fetch("/api/analyze-take-home", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      return data as TakeHomeCheckerData;
    },
    enabled: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  const result = useMemo(() => {
    if (isFetching) return <LoadingState />;
    if (isError) return <ErrorState error={error} />;
    if (isSuccess) return <SuccessState {...data} />;
    return null;
  }, [status, fetchStatus]);

  const handleRepoChange = useCallback(
    (value: string) => {
      const repo = repos?.find((repo) => repo.id.toString() === value);
      setGithubRepo(repo);
    },
    [repos]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) return;
      const file = event.target.files[0];
      setZipRepo(file);
    },
    []
  );

  useEffect(() => {
    if (githubRepo && data) {
      const preppingData = PreppingData.getToolData("take-home-checker");
      preppingData[githubRepo.full_name] = data?.analysis.score;
      PreppingData.setToolData("take-home-checker", preppingData);
    }
  }, [githubRepo, data]);

  useEffect(() => {
    if (installationId) {
      document.cookie = `${cookieName}=${installationId}; path=/; max-age=31536000`;
    }
  }, [installationId]);

  useEffect(() => {
    if (zipRepo) {
      analyze();
      setZipRepo(undefined);
    }
  }, [zipRepo]);

  return (
    <>
      <div className="flex flex-col gap-3 max-w-prose w-full mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <Button asChild className="w-full mt-auto" variant="outline">
            <Link
              href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME}/installations/new`}
            >
              <FaGithub />
              Grant repo access
            </Link>
          </Button>
          <div className="grid w-full items-center gap-3">
            <Button className="w-full" variant="outline" asChild>
              <Label>
                <FileArchive />
                Upload zip file
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept="application/zip"
                  className="hidden"
                />
              </Label>
            </Button>
          </div>
        </div>
        <div className="flex gap-1.5">
          <RepoSelector
            repos={repos || []}
            onValueChange={handleRepoChange}
            isLoading={areReposLoading}
            isAnalyzing={isFetching}
          />
          <AnalyzeButton
            onClick={analyze}
            isLoading={isFetching}
            hasSelectedRepo={!!githubRepo || !!zipRepo}
          />
        </div>
      </div>
      {result && (
        <>
          <Spacer size="lg" />
          {result}
        </>
      )}
    </>
  );
}

function RepoSelector({
  repos,
  onValueChange,
  isLoading,
  isAnalyzing,
}: {
  repos: GithubRepo[];
  onValueChange: (value: string) => void;
  isLoading: boolean;
  isAnalyzing: boolean;
}) {
  return (
    <Select
      onValueChange={onValueChange}
      disabled={repos.length === 0 || isLoading || isAnalyzing}
    >
      <SelectTrigger className="text-left w-full">
        <SelectValue
          placeholder={
            isLoading
              ? "Loading repositories..."
              : repos.length === 0
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
  return (
    <p className="text-destructive text-center max-w-prose mx-auto">
      {error.message}
    </p>
  );
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

function SuccessState(data: TakeHomeCheckerData) {
  return (
    <div className="flex flex-col gap-6 mx-auto">
      <Card>
        <CardContent className="pt-6">
          <section className="flex justify-between items-center flex-col gap-6 md:flex-row">
            <div className="text-center flex gap-3 items-center">
              <h1 className="text-lg font-semibold text-muted-foreground order-last">
                Project Score
              </h1>
              <strong
                className={cn(
                  "text-lg px-3 py-1.5 rounded-full",
                  scoreColors[data.analysis.score]
                )}
              >
                {data.analysis.score}
              </strong>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <UserFeedbackDialog {...data} />
              <PromptDialog />
            </div>
          </section>
        </CardContent>
      </Card>
      <div className="flex flex-col md:flex-row gap-6 w-full">
        <FeedbackCard
          title="Documentation"
          flags={data.analysis.docs}
          Icon={FileText}
        />
        <FeedbackCard title="Code" flags={data.analysis.code} Icon={Code} />
      </div>
    </div>
  );
}

function PromptDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full md:w-auto">
          <Eye />
          View Prompt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Analysis Prompt</DialogTitle>
        </DialogHeader>
        <p className="max-h-96 text-sm text-muted-foreground bg-muted p-3 rounded whitespace-pre-wrap overflow-y-auto overflow-x-hidden">
          {prompt}
        </p>
      </DialogContent>
    </Dialog>
  );
}

function UserFeedbackDialog(data: TakeHomeCheckerData) {
  const [open, setOpen] = useState<boolean | undefined>();
  const formSchema = z.object({
    description: z.string().min(50, "Explayate un poco más."),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: "" },
  });
  const {
    mutate: send,
    error,
    isError,
    isPending,
  } = useMutation({
    mutationFn: async ({ description }: z.infer<typeof formSchema>) => {
      const res = await fetch("/api/feedback-take-home-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, description }),
      });

      if (!res.ok) {
        throw new Error("Hubo un error inesperado, probá de nuevo.");
      }
    },
    onSuccess: () => {
      form.reset();
      setOpen(false);
      toast("Gracias por tu feedback.");
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    send(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full md:w-auto order-last md:order-first"
        >
          Dijo cualquiera? Avisanos
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gracias por tu feedback</DialogTitle>
          <DialogDescription>
            Al enviar aceptás compartir tu código con Silver.dev.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      id="description"
                      placeholder="Describí lo que debería haber pasado comparado a lo que
                    sucedió en realidad."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="items-center">
              {isError && (
                <span className="text-destructive text-sm">
                  {error.message}
                </span>
              )}
              <DialogClose asChild>
                <Button variant="outline" onClick={() => form.reset()}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enviando..." : "Enviar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
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
    <Card className="flex-1 h-min">
      <section>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon />
            <h1>{title}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
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
  items?: FeedbackFlags[keyof FeedbackFlags];
}): React.ReactElement | null {
  if (!items || items.length === 0) return null;

  return (
    <section className="max-w-prose">
      <h1 className={cn("font-semibold flex items-center gap-3", color)}>
        <Icon className="size-4" />
        {label}
      </h1>
      <ul className="list-disc list-inside pl-1.5">
        {items.map((item, index) => (
          <li key={index}>
            {typeof item === "string" ? (
              item
            ) : (
              <>
                <span>{item.description}</span>
                <pre className="border-l-8 font-mono border-muted-foregrounnd bg-muted text-xs rounded p-4 my-1.5 -ml-0.5 w-full overflow-x-auto">
                  {item.snippet}
                </pre>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
