"use client";

import { Button } from "@/components/ui/button";
import { PreppingData } from "@/lib/utils";
import useLoadingMessage from "@/take-home-checker/hooks/useLoadingMessage";
import { useProjectAnalysis } from "@/take-home-checker/hooks/useProjectAnalysis";
import { Repo } from "@/take-home-checker/types/repo";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import LoadingBanner from "./LoadingBanner";
import ProjectAnalysis from "./ProjectAnalysis";
import ReadmeViewer from "./ReadmeViewer";
import RepositoryList from "./RepositoryList";

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
    if (selectedRepo && analysis?.grade) {
      const preppingData = PreppingData.getToolData("take-home-checker");
      preppingData[selectedRepo.full_name] = analysis.grade;
      PreppingData.setToolData("take-home-checker", preppingData);
    }
  }, [selectedRepo, analysis]);

  return (
    <div className="max-w-7xl pt-6 px-4 w-full">
      <div className="w-full flex flex-col sm:flex-row gap-4">
        <RepositoryList repos={repos} onSelect={setSelectedRepo} />
        <Button
          className="py-8"
          variant="secondary"
          onClick={handleAnalyzeClick}
          disabled={!selectedRepo || isLoading}
        >
          {isLoading ? "Analyzing..." : "Analyze Project"}
        </Button>
      </div>

      {isLoading && <div className="text-center my-6">{loadingMessage}</div>}

      {isLoading && (
        <div className="w-full mt-4">
          <LoadingBanner />
        </div>
      )}

      {isError && (
        <p className="text-red-500 text-center">
          Error: {error instanceof Error ? error.message : "An error occurred"}
        </p>
      )}

      {isSuccess && readme && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>{analysis && <ProjectAnalysis {...analysis} />}</div>
          </motion.div>
        </>
      )}
    </div>
  );
}
