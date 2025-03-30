"use client";

import { Repo } from "@/take-home-checker/types/repo";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";

interface RepoSelectorProps {
  repos: Repo[];
  onChange?: (repo: Repo | null) => void;
}

export default function RepoSelector({ repos, onChange }: RepoSelectorProps) {
  const handleValueChange = (value: string) => {
    const repo = repos.find((repo) => repo.id.toString() === value) || null;
    if (onChange) {
      onChange(repo);
    }
  };

  return (
    <div className="w-full mx-auto">
      <Select onValueChange={handleValueChange}>
        <SelectTrigger className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 min-h-[64px] dark:border-gray-700 dark:text-white">
          <SelectValue placeholder="Select a repository" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-700 shadow-lg rounded-md min-h-[64px]">
          {repos.map((repo) => (
            <SelectItem key={repo.id} value={repo.id.toString()}>
              <div className="text-base cursor-pointer text-left text-gray-700 dark:text-white">
                {repo.name}
                <div className="text-sm text-gray-500 truncate dark:text-gray-400">
                  {repo.description
                    ? repo.description.length > 100
                      ? `${repo.description.slice(0, 100)}...`
                      : repo.description
                    : "No description"}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
