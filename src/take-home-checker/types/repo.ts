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

export type AnalysisResult = {
  score: "strong-no" | "no" | "yes" | "strong-yes";
  documentationFeedback: {
    green: string[];
    yellow: string[];
    red: string[];
  };
  codeFeedback: {
    green: string[];
    yellow: string[];
    red: string[];
  };
  prompts: {
    documentation: string;
    code: string;
  };
};
