"use client";

import Spacer from "@/components/spacer";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PreppingData } from "@/lib/utils";
import useLoadingMessage from "@/take-home-checker/hooks/useLoadingMessage";
import { useProjectAnalysis } from "@/take-home-checker/hooks/useProjectAnalysis";
import { Repo } from "@/take-home-checker/types/repo";
import { motion } from "framer-motion";
import { Loader2, LogOut, Plus, Sparkles } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import LoadingSkeleton from "./LoadingSkeleton";
import ProjectAnalysis from "./ProjectAnalysis";
import RepoSelector from "./RepoSelector";

interface RepoAnalysisProps {
  repos: Repo[];
  token: string;
}

export default function RepoAnalysis({ repos, token }: RepoAnalysisProps) {
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);

  const { data, isSuccess, isLoading, isError, error, refetch } =
    useProjectAnalysis(selectedRepo, token);
  const loadingMessage = useLoadingMessage(isLoading);

  const { content: readme, analysis } = data ?? {};

  const handleAnalyzeClick = () => {
    refetch();
  };

  useEffect(() => {
    if (selectedRepo && analysis?.score) {
      const preppingData = PreppingData.getToolData("take-home-checker");
      preppingData[selectedRepo.full_name] = analysis.score;
      PreppingData.setToolData("take-home-checker", preppingData);
    }
  }, [selectedRepo, analysis]);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3 max-w-prose w-full mx-auto">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" asChild>
            <Link href="https://github.com/apps/take-home-checker/installations/select_target">
              <Plus />
              Grant repo access
            </Link>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut />
                Logout
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Logout from GitHub</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex gap-1.5">
        <RepoSelector repos={repos} onChange={setSelectedRepo} />
          <Button
            onClick={handleAnalyzeClick}
            disabled={!selectedRepo || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles />
                Analyze
              </>
            )}
          </Button>
        </div>
      </div>

      {(isLoading || (isSuccess && analysis) || isError) && (
        <Spacer size="lg" />
      )}

      {isLoading && <LoadingSkeleton />}
      {isError && (
        <p className="text-destructive text-center">
          Error: {error instanceof Error ? error.message : "An error occurred"}
        </p>
      )}
      {isSuccess && analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ProjectAnalysis {...analysis} />
        </motion.div>
      )}
    </TooltipProvider>
  );
}
