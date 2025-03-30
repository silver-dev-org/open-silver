import { authOptions } from "@/pages/api/auth/[...nextauth]";
import AuthGitHub from "@/take-home-checker/components/AuthGtihub";
import Header from "@/take-home-checker/components/Header";
import AppQueryProvider from "@/take-home-checker/components/QueryClientProvider";
import RepoAnalysis from "@/take-home-checker/components/RepoAnalysis";
import { ThemeProvider } from "@/take-home-checker/components/ThemeContext";
import { Repo } from "@/take-home-checker/types/repo";
import { getServerSession } from "next-auth";
import { Octokit } from "octokit";

export default async function Page() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;
  let repos: Repo[] = [];

  if (session && (session as unknown as { accessToken: string }).accessToken) {
    try {
      const octokit = new Octokit({
        auth: (session as unknown as { accessToken: string }).accessToken,
      });
      const { data } = await octokit.request("GET /user/repos", {
        visibility: "all",
        per_page: 100,
        sort: "updated",
        direction: "desc",
      });
      repos = data as Repo[];
    } catch (error) {
      console.error("Error fetching repos:", error);
    }
  }

  return (
    <AppQueryProvider>
      <ThemeProvider>
        <div>
          <Header />
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AuthGitHub />
            {isAuthenticated && (
              <RepoAnalysis
                repos={repos}
                token={
                  (session as unknown as { accessToken: string })?.accessToken
                }
              />
            )}
          </div>
        </div>
      </ThemeProvider>
    </AppQueryProvider>
  );
}
