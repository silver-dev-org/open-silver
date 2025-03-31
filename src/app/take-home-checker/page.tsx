import Description from "@/components/description";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Space from "@/components/space";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import AuthGitHub from "@/take-home-checker/components/AuthGtihub";
import LogOutGithub from "@/take-home-checker/components/LogOutGithub";
import AppQueryProvider from "@/take-home-checker/components/QueryClientProvider";
import RepoAnalysis from "@/take-home-checker/components/RepoAnalysis";
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
    <Section>
      <Heading center>
        <span className="text-primary">Take-home</span> Checker
      </Heading>
      <Space />
      <Description center>
        Upload your take-home and get instant feedback on the project.
      </Description>
      <Space size="lg" />
      <AppQueryProvider>
        {isAuthenticated ? (
          <div className="flex flex-col justify-center items-center">
            <RepoAnalysis
              repos={repos}
              token={
                (session as unknown as { accessToken: string })?.accessToken
              }
            />
            <Space size="lg" />
            <LogOutGithub />
          </div>
        ) : (
          <AuthGitHub />
        )}
      </AppQueryProvider>
    </Section>
  );
}
