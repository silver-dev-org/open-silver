export type Repo = {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    private: boolean;
    owner: {
      login: string;
      avatar_url: string;
      html_url: string;
    };
  };
  