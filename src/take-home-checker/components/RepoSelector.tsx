"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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

  const reposByOwner = repos.reduce(
    (acc, repo) => {
      const owner = repo.owner.login;
      if (!acc[owner]) {
        acc[owner] = [];
      }
      acc[owner].push(repo);
      return acc;
    },
    {} as Record<string, Repo[]>
  );

  Object.keys(reposByOwner).forEach((owner) => {
    reposByOwner[owner].sort((a, b) => a.name.localeCompare(b.name));
  });

  return (
    <Select onValueChange={handleValueChange} disabled={repos.length === 0}>
      <SelectTrigger className="text-left w-full">
        <SelectValue placeholder={repos.length === 0 ? "No repositories available" : "Select a repository"} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(reposByOwner).map(([owner, repos]) => (
          <SelectGroup key={owner}>
            <SelectLabel>{owner}</SelectLabel>
            {repos.map((repo) => (
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
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
