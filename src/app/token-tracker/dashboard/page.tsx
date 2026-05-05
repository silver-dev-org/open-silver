import { Container } from "@/components/container";
import { Heading } from "@/components/heading";
import { Spacer } from "@/components/spacer";
import { getTokenTrackerConfig } from "@/token-tracker/config";
import { isAuthenticated } from "@/token-tracker/actions";
import { DashboardTable } from "@/token-tracker/components/dashboard-table";
import { PasswordForm } from "@/token-tracker/components/password-form";
import { SetupRequired } from "@/token-tracker/components/setup-required";
import { listAllReports } from "@/token-tracker/storage";
import type { UserReport } from "@/token-tracker/types";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

async function getReports(): Promise<UserReport[]> {
  try {
    const entries = await listAllReports();
    return entries
      .map((e) => e.report)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  } catch {
    return [];
  }
}

export default async function DashboardPage({ searchParams }: Props) {
  const { isConfigured, missingVars } = getTokenTrackerConfig();
  if (!isConfigured) {
    return <SetupRequired missingVars={missingVars} />;
  }

  const authed = await isAuthenticated();

  if (!authed) {
    const { error } = await searchParams;
    return (
      <Container>
        <Heading lvl={1} center>
          Token Usage <span className="text-primary">Dashboard</span>
        </Heading>
        <Spacer />
        <PasswordForm hasError={error === "1"} />
      </Container>
    );
  }

  const reports = await getReports();

  return (
    <Container>
      <Heading lvl={1}>
        Token Usage <span className="text-primary">Dashboard</span>
      </Heading>
      <Spacer />
      <DashboardTable reports={reports} />
    </Container>
  );
}
