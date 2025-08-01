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

export type TakeHomeAnalysis = {
  score: Score;
  docs: FeedbackFlags;
  code: FeedbackFlags;
};

export type Score = "Strong no" | "No" | "Yes" | "Strong yes";

export type FeedbackFlags = {
  green?: FeedbackFlag[];
  yellow?: FeedbackFlag[];
  red?: FeedbackFlag[];
};

export type FeedbackFlag =
  | {
      description: string;
      snippet: string;
    }
  | string;
