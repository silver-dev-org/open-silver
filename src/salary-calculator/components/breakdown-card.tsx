import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NumberFlow from "@number-flow/react";
import type { Breakdown } from "../types";

export function BreakdownCard({
  breakdown,
  onView,
  buttonRef,
}: {
  breakdown: Breakdown;
  onView: () => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <Card className="flex flex-col size-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl text-center">
          {breakdown.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
        <div>
          <div className="flex items-baseline gap-2 justify-center">
            <NumberFlow
              className="text-3xl font-bold text-primary"
              value={Math.round(breakdown.total)}
              prefix="$"
            />
          </div>
        </div>
        <Button
          ref={buttonRef}
          variant="outline"
          onClick={onView}
          className="w-full bg-transparent mt-auto"
        >
          View Breakdown
        </Button>
      </CardContent>
    </Card>
  );
}
