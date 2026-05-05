import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyDashboardPassword } from "@/token-tracker/actions";

interface PasswordFormProps {
  hasError: boolean;
}

export function PasswordForm({ hasError }: PasswordFormProps) {
  return (
    <form
      action={verifyDashboardPassword}
      className="flex flex-col gap-4 max-w-sm w-full mx-auto"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter dashboard password"
          required
          autoFocus
        />
      </div>
      {hasError && (
        <p className="text-sm text-destructive">Incorrect password.</p>
      )}
      <Button type="submit">Unlock Dashboard</Button>
    </form>
  );
}
