import Description from "@/components/description";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Spacer from "@/components/spacer";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import AuthGitHub from "@/take-home-checker/components/AuthGtihub";
import AppQueryProvider from "@/take-home-checker/components/QueryClientProvider";
import RepoAnalysis from "@/take-home-checker/components/RepoAnalysis";
import { Repo } from "@/take-home-checker/types/repo";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Octokit } from "octokit";

export const metadata: Metadata = {
  title: "Take-home Checker",
  description:
    "Upload your take-home project and get instant feedback to improve your technical interview performance.",
  openGraph: {
    title: "Take-home Checker • Open Silver",
    description: "Get instant feedback on your take-home project submissions",
    type: "website",
  },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;
  let repos: Repo[] = [];

  if (session && (session as unknown as { accessToken: string }).accessToken) {
    try {
      const octokit = new Octokit({
        auth: (session as unknown as { accessToken: string }).accessToken,
      });
      const { data: installations } = await octokit.request(
        "GET /user/installations"
      );
      for (const installation of installations.installations) {
        const { data: installationRepos } = await octokit.request(
          `GET /user/installations/${installation.id}/repositories`,
          {
            per_page: 100,
          }
        );
        repos.push(...installationRepos.repositories);
      }
    } catch (error) {
      console.error("Error fetching repos:", error);
    }
  }

  repos = repos.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Section>
      <Heading size="lg" center>
        <span className="text-primary">Take-home</span> Checker
      </Heading>
      <Spacer />
      <Description center>
        Upload your take-home and get instant feedback on the project.
      </Description>
      <Spacer size="lg" />
      <AppQueryProvider>
        {isAuthenticated ? (
          <RepoAnalysis
            repos={repos}
            token={(session as unknown as { accessToken: string })?.accessToken}
          />
        ) : (
          <AuthGitHub />
        )}
      </AppQueryProvider>
    </Section>
  );
}
