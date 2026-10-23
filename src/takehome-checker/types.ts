export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  language?: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
};

export type RepoFile = { path: string; content: string };

export type TakeHomeCheckerData = {
  takeHome: TakeHome;
  analysis: TakeHomeAnalysis;
};

export type TakeHome = {
  docs?: string;
  code?: Codebase;
};

export type Codebase = RepoFile[];

export type Rubric = "frontend" | "backend" | "cli" | "fullstack" | "ml" | "written";

export type Color = "red" | "yellow" | "info";

export type Vertical = "docs" | "code" | "assignment";

export type Criterion = {
  title: string;
  check: "code" | "ai";
  reads?: Vertical;
  detects: string;
  feedback: string;
  severity: Partial<Record<Rubric | "*", Color | "off">>;
};

export type Evidence = { id: string; note?: string; file?: string; snippet?: string };

export type Finding = {
  id: string;
  title: string;
  color: Color;
  feedback: string;
  evidence: Omit<Evidence, "id">[];
};

export type FastReject = {
  reason: "no-readme" | "short-readme" | "no-source" | "dependencies" | "heavy";
  path?: string;
  size?: number;
};

export type Score = "Strong no" | "No" | "Yes" | "Strong yes";

export type TakeHomeAnalysis = {
  rubric?: Rubric;
  findings: Finding[];
  passed: string[];
};

export type SubmissionFile = { path: string; size: number };

export type Submission = {
  root: string;
  files: SubmissionFile[];
  readmePath?: string;
  readme?: string;
};
