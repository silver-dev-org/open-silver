export type Repo = {
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

export type RepoAnalysis = {
  score: Score;
  docs: FeedbackFlags;
  code: FeedbackFlags;
};

export type Score = "Strong no" | "No" | "Yes" | "Strong yes";

export type FeedbackFlags = {
  green?: string[];
  yellow?: string[];
  red?: string[];
};
