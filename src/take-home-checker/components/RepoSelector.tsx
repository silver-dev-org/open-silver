"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Repo } from "@/take-home-checker/types/repo";

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
    <Select onValueChange={handleValueChange}>
      <SelectTrigger className="py-8 text-left w-full">
        <SelectValue placeholder="Select a repository" />
      </SelectTrigger>
      <SelectContent>
        {repos.map((repo) => (
          <SelectItem key={repo.id} value={repo.id.toString()}>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <strong>{repo.name}</strong>
                {repo.private && (
                  <span className="text-xs bg-input text-foreground px-1 rounded">
                    Private
                  </span>
                )}
              </div>
              <span>{repo.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
