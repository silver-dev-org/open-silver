"use client";

import { Button } from "@/components/ui/button";
import { refreshAllAction } from "@/token-tracker/actions";
import { useState, useTransition } from "react";

export function RefreshButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRefresh() {
    setError(null);
    startTransition(async () => {
      try {
        await refreshAllAction();
      } catch {
        setError("Refresh failed. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleRefresh}
      >
        {isPending ? "Refreshing…" : "Refresh All"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
