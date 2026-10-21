"use client";

import { Spacer } from "@/components/spacer";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  FileArchive,
  Info,
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
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { FaGithub } from "react-icons/fa";
import { toast } from "sonner";
import z from "zod";
import {
  cookieName,
  loadingMessageInterval,
  loadingMessages,
  rubrics,
  setupStorageKey,
  takeHomeGuideUrl,
  zipBytesLimit,
} from "../../takehome-checker/constants";
import {
  assembleAnalysis,
  criteriaFor,
  inspectZip,
  runCodeChecks,
  scoreFor,
} from "../../takehome-checker/utils";
import {
  Color,
  FastReject,
  Finding,
  GithubRepo,
  SubmissionFile,
  TakeHomeAnalysis,
  TakeHomeCheckerData,
} from "../../takehome-checker/types";
import { RatingBar } from "@/behavioral-checker/components/RatingBar";
import posthog from "posthog-js";

export default function TakeHomeCheckerClient({
  installationId,
}: {
  installationId?: string;
}) {
  const [githubRepo, setGithubRepo] = useState<GithubRepo>();
  const [zipRepo, setZipRepo] = useState<File>();
  const [assignment, setAssignment] = useState("");

  const [setupLoaded, setSetupLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(setupStorageKey) ?? "{}",
      ) as { assignment?: string };
      if (saved.assignment) setAssignment(saved.assignment);
    } catch {}
    setSetupLoaded(true);
  }, []);

  useEffect(() => {
    if (!setupLoaded) return;
    try {
      localStorage.setItem(setupStorageKey, JSON.stringify({ assignment }));
    } catch {}
  }, [setupLoaded, assignment]);
  const [preview, setPreview] = useState<TakeHomeAnalysis>();
  const [skipped, setSkipped] = useState<SubmissionFile[]>([]);
  const [uploadError, setUploadError] = useState<string>();
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
    queryKey: [
      "analyze-take-home",
      githubRepo?.full_name,
      installationId,
      assignment,
    ],
    queryFn: async () => {
      setPreview(undefined);
      setSkipped([]);
      const formData = new FormData();
      formData.append("assignment", assignment);
      if (zipRepo) {
        let inspected: ReturnType<typeof inspectZip>;
        try {
          inspected = inspectZip(new Uint8Array(await zipRepo.arrayBuffer()));
        } catch {
          throw new Error(
            "We couldn't open this zip. Use a standard .zip file without a password.",
          );
        }
        const { files, upload, skipped, problems, readmePath, readText } =
          inspected;
        if (problems.length)
          throw new Error("Fix these first", { cause: problems });
        setSkipped(skipped);
        setPreview(
          assembleAnalysis(
            undefined,
            criteriaFor().filter(({ criterion }) => criterion.check === "code"),
            runCodeChecks(
              {
                root: "",
                files,
                readmePath,
                readme: readmePath && readText(readmePath),
              },
              readText,
            ),
          ),
        );
        formData.append("file", new Blob([new Uint8Array(upload)]), "code.zip");
        formData.append("manifest", JSON.stringify(files));
      } else if (githubRepo && installationId) {
        formData.append("name", githubRepo.full_name);
        formData.append("installationId", installationId);
      }
      const response = await fetch("/api/analyze-take-home", {
        method: "POST",
        body: formData,
      });
      if (response.status === 422)
        throw new Error("Fix these first", {
          cause: (await response.json()).problems,
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
    if (isFetching)
      return preview ? (
        <SuccessState analysis={preview} skipped={skipped} pending />
      ) : (
        <LoadingState />
      );
    if (isError) return <ErrorState error={error} />;
    if (isSuccess)
      return (
        <SuccessState analysis={data.analysis} data={data} skipped={skipped} />
      );
    return null;
  }, [status, fetchStatus, preview]);

  const handleRepoChange = useCallback(
    (value: string) => {
      const repo = repos?.find((repo) => repo.id.toString() === value);
      setGithubRepo(repo);
    },
    [repos],
  );

  const handleFile = useCallback(
    (file: File | undefined, uploadMethod: "drop" | "picker") => {
      if (!file || isFetching) return;
      setUploadError(undefined);
      if (file.size > zipBytesLimit) {
        setUploadError(
          `This zip is ${(file.size / 1e6).toFixed(0)} MB. The checker opens zips up to ${zipBytesLimit / 1e6} MB: remove dependencies, datasets or videos and try again.`,
        );
        return;
      }

      posthog.capture("takehome_analysis_started", {
        source: "zip_upload",
        upload_method: uploadMethod,
        file_size_bytes: file.size,
      });

      setZipRepo(file);
    },
    [isFetching],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files, _, event) =>
      handleFile(
        files[0],
        event && "dataTransfer" in event ? "drop" : "picker",
      ),
    accept: {
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
    },
    multiple: false,
    onDropRejected: ([rejection]) =>
      setUploadError(
        `${rejection?.file.name ?? "This file"} isn't a .zip. Compress your project as a .zip (not .rar, .7z or .tar.gz) and try again.`,
      ),
  });

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
        <Textarea
          value={assignment}
          onChange={(event) => setAssignment(event.target.value)}
          placeholder="Paste the assignment (optional). We'll check its explicit requirements."
          aria-label="Assignment"
          className="max-h-40"
          disabled={isFetching}
        />
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center text-sm transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-border",
            isFetching ? "opacity-50" : "cursor-pointer hover:bg-muted",
          )}
        >
          <input {...getInputProps()} />
          <FileArchive className="size-6 text-muted-foreground" />
          <p className="font-medium">
            {isDragActive
              ? "Drop your zip here"
              : "Drag your zip here, or click to choose it"}
          </p>
        </div>
        {uploadError && (
          <p role="alert" className="text-sm text-destructive">
            {uploadError}
          </p>
        )}
        <Button asChild className="w-full" variant="outline">
          <Link
            href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME}/installations/new`}
          >
            <FaGithub />
            Or grant GitHub repo access
          </Link>
        </Button>
        <div className="flex gap-1.5">
          <RepoSelector
            repos={repos || []}
            onValueChange={handleRepoChange}
            isLoading={areReposLoading}
            isAnalyzing={isFetching}
          />
          <AnalyzeButton
            onClick={() => {
              if (githubRepo) {
                posthog.capture("takehome_analysis_started", {
                  source: "github",
                  repo_name: githubRepo.full_name,
                  repo_private: githubRepo.private,
                });
              }
              analyze();
            }}
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
  const problems = Array.isArray(error.cause)
    ? (error.cause as FastReject[])
    : undefined;
  if (!problems)
    return (
      <p className="text-destructive text-center max-w-prose mx-auto whitespace-pre-line">
        {error.message}
      </p>
    );

  return (
    <section className="mx-auto flex w-full max-w-prose flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-5">
      <h2 className="flex items-center gap-2 font-semibold text-destructive">
        <XCircle className="size-4" />
        Fix these first, then upload again
      </h2>
      <FileList
        files={problems.map(({ reason, path, size }) =>
          reason === "no-readme"
            ? { label: "Add a README.md" }
            : reason === "short-readme"
              ? {
                  label: `Write ${path}: what the project is and how to run it`,
                }
              : reason === "no-source"
                ? { label: "Add your source code" }
                : { label: `Remove ${path}`, path, size },
        )}
      />
    </section>
  );
}

function FileList({
  files,
}: {
  files: { label: string; path?: string; size?: number }[];
}) {
  return (
    <ul className="flex flex-col divide-y divide-border/60 text-sm">
      {files.map(({ label, path, size }) => (
        <li
          key={label}
          className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0"
        >
          <span className="min-w-0 break-all">
            {path ? (
              <>
                {label.slice(0, label.length - path.length)}
                <code className="font-mono text-[0.85em]">{path}</code>
              </>
            ) : (
              label
            )}
          </span>
          {size !== undefined && (
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {(size / 1e6).toFixed(1)} MB
            </span>
          )}
        </li>
      ))}
    </ul>
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
          <CardContent>
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

function SuccessState({
  analysis,
  data,
  skipped,
  pending,
}: {
  analysis: TakeHomeAnalysis;
  data?: TakeHomeCheckerData;
  skipped: SubmissionFile[];
  pending?: boolean;
}) {
  const { findings, passed, rubric } = analysis;
  const byColor = (color: Color) =>
    findings.filter((finding) => finding.color === color);

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-lg">
            <FileArchive />
            Take-home review
            {rubric && (
              <Badge variant="outline">
                {rubrics.find(({ value }) => value === rubric)?.label}
              </Badge>
            )}
          </h1>
          {data && <UserFeedbackDialog {...data} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-10">
        {pending ? (
          <div className="flex w-full items-center justify-center gap-3 rounded-full border border-border p-2 text-muted-foreground">
            <span className="flex items-center gap-3 py-2">
              <Loader2 className="size-4 animate-spin" />
              Reviewing your documentation and code…
            </span>
          </div>
        ) : (
          <RatingBar active={scoreFor(findings)} />
        )}
        {skipped.length > 0 && (
          <section className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning/5 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-warning">
              <AlertTriangle className="size-4" />
              Too large to review in full. These files were left out:
            </h2>
            <FileList
              files={skipped.map(({ path, size }) => ({
                label: path,
                path,
                size,
              }))}
            />
            <p className="text-sm text-muted-foreground">
              The checks didn&apos;t read them. Remove them if the project
              doesn&apos;t need them, or ship a small sample instead.
            </p>
          </section>
        )}
        <div className="grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border/60">
          <div className="min-w-0 md:pr-8">
            <FindingList
              label="Must fix"
              className="text-destructive"
              Icon={XCircle}
              findings={byColor("red")}
              empty="Nothing blocking."
            />
          </div>
          <div className="flex min-w-0 flex-col gap-10 md:px-8">
            <FindingList
              label="Worth fixing"
              className="text-warning"
              Icon={AlertTriangle}
              findings={byColor("yellow")}
              empty="Nothing to improve."
            />
            <FindingList
              label="Advice"
              className="text-muted-foreground"
              Icon={Info}
              findings={byColor("info")}
            />
          </div>
          <section className="flex min-w-0 flex-col gap-4 md:pl-8">
            <SectionHeading
              label="Looks good"
              className="text-success"
              Icon={CheckCircle}
              count={passed.length}
            />
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {passed.map((title) => (
                <li key={title} className="flex items-center gap-2">
                  <CheckCircle className="size-3.5 shrink-0 text-success" />
                  {title}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </CardContent>
    </Card>
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
      posthog.capture("takehome_feedback_submitted", {
        rubric: data.analysis.rubric,
        findings: data.analysis.findings.map(({ id }) => id),
      });
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
        <Button variant="ghost" size="sm">
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

function FindingList({
  label,
  className,
  Icon,
  findings,
  empty,
}: {
  label: string;
  className: string;
  Icon: ElementType;
  findings: Finding[];
  empty?: string;
}): React.ReactElement | null {
  if (findings.length === 0 && !empty) return null;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <SectionHeading
        label={label}
        className={className}
        Icon={Icon}
        count={findings.length}
      />
      {findings.length === 0 && (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
      <ul className="flex flex-col divide-y divide-border/60">
        {findings.map(({ id, title, feedback, evidence: allEvidence }) => {
          const evidence = allEvidence.filter(
            ({ note, file, snippet }) => note || file || snippet,
          );
          return (
            <li
              key={id}
              className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0"
            >
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-muted-foreground">{feedback}</p>
              </div>
              {evidence.length > 0 && (
                <ul className="flex flex-col gap-2.5 text-sm">
                  {evidence.map(({ note, file, snippet }, index) => (
                    <li key={index} className="flex min-w-0 flex-col gap-1.5">
                      {(file || note) && (
                        <p className="flex flex-wrap items-baseline gap-x-2 break-all">
                          {file && (
                            <code className="font-mono text-[0.85em]">
                              {file}
                            </code>
                          )}
                          {note && (
                            <span className="text-muted-foreground">
                              {note}
                            </span>
                          )}
                        </p>
                      )}
                      {snippet && (
                        <pre className="w-full whitespace-pre-wrap break-all rounded-md bg-muted px-3 py-2 font-mono text-xs leading-relaxed">
                          {snippet}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SectionHeading({
  label,
  className,
  Icon,
  count,
}: {
  label: string;
  className: string;
  Icon: ElementType;
  count: number;
}) {
  return (
    <h2 className={cn("flex items-center gap-2 font-semibold", className)}>
      <Icon className="size-4" />
      {label}
      <span className="ml-1 rounded-full bg-current/10 px-2 text-xs leading-5 tabular-nums">
        {count}
      </span>
    </h2>
  );
}
