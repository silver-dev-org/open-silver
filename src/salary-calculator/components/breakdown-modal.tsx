import {
  AnimatedDialogContent,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from "@/components/animated-dialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getOrdinal } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment, HTMLAttributes, useEffect, useState } from "react";
import {
  COLORS_BY_SCENARIO,
  CURRENCY_FORMAT,
  MAX_SIMPLIFIED_TAX_REGIME,
  MAX_TAXABLE_GROSS,
  SCENARIOS,
} from "../constants";
import type { Breakdown, BreakdownItem, Scenario } from "../types";

export function BreakdownModal({
  yearlyBreakdowns,
  open,
  onOpenChange,
  onNavigate,
  originRect,
  year = 0,
  scenarios = SCENARIOS,
  scenario = SCENARIOS[0],
}: {
  yearlyBreakdowns: Record<Scenario, Breakdown>[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (year: number, scenario: Scenario) => void;
  originRect: DOMRect | null;
  year?: number;
  scenarios?: Scenario[];
  scenario?: Scenario;
}) {
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [hasUsedArrowKeys, setHasUsedKeys] = useState(false);
  const breakdown = yearlyBreakdowns[year ?? 0][scenario];
  const currentIndex = scenario ? scenarios.indexOf(scenario) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < scenarios.length - 1;
  const color = COLORS_BY_SCENARIO[scenario];
  const totalGross =
    breakdown.items[0].value +
    (breakdown.items[1].label.includes("RSU") ? breakdown.items[1].value : 0);

  function handlePrevious() {
    if (hasPrevious) {
      setDirection("left");
      onNavigate(year, scenarios[currentIndex - 1]);
    }
  }

  function handleNext() {
    if (hasNext) {
      setDirection("right");
      onNavigate(year, scenarios[currentIndex + 1]);
    }
  }

  useEffect(() => {
    if (direction) {
      const timer = setTimeout(() => setDirection(null), 200);
      return () => clearTimeout(timer);
    }
  }, [direction, scenario]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "ArrowLeft" && hasPrevious) {
        handlePrevious();
        setHasUsedKeys(true);
      } else if (e.key === "ArrowRight" && hasNext) {
        handleNext();
        setHasUsedKeys(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasPrevious, hasNext, currentIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <AnimatedDialogContent className={color.border} originRect={originRect}>
          <div
            key={scenario}
            className={cn(
              "animate-in duration-300",
              direction === "left" && "slide-in-from-left-4 fade-in-0",
              direction === "right" && "slide-in-from-right-4 fade-in-0",
              !direction && "fade-in",
            )}
          >
            <DialogHeader>
              <DialogTitle className="text-left">
                {yearlyBreakdowns.length > 1 &&
                  `${getOrdinal(year + 1)} year • `}
                {breakdown.title}
              </DialogTitle>
              <DialogDescription className="text-left">
                {breakdown.description}
                {scenario === "eor-worker" && (
                  <>
                    <br />
                    (*) Capped at max. taxable gross of{" "}
                    {Math.round(MAX_TAXABLE_GROSS).toLocaleString(
                      "en-US",
                      CURRENCY_FORMAT,
                    )}
                  </>
                )}
                {scenario === "aor-worker" &&
                  totalGross > MAX_SIMPLIFIED_TAX_REGIME && (
                    <span className="text-yellow-600">
                      <br />
                      <strong>NOTE:</strong> Simplified Tax Regime (
                      <i>monotributo</i>) is not fully applicable for salaries
                      over{" "}
                      {Math.round(MAX_SIMPLIFIED_TAX_REGIME).toLocaleString(
                        "en-US",
                        CURRENCY_FORMAT,
                      )}
                      . Beyond that threshold, you should move to the more
                      complex, expensive tax regime (
                      <i>Responsable Inscripto</i>), currently not supported by
                      this calculator.
                    </span>
                  )}
                <br />
                Sources:{" "}
                {breakdown.sources.map((source, i) => (
                  <Fragment key={i}>
                    <Link className="link" target="_blank" href={source}>
                      {new URL(source).host.replace("www.", "")}
                    </Link>
                    {i < breakdown.sources.length - 1 && ", "}
                  </Fragment>
                ))}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              {breakdown.items.map((item, idx) => (
                <BreakdownItem key={idx} {...item} />
              ))}
              <BreakdownItem
                label={
                  scenario.endsWith("worker")
                    ? "Net Salary"
                    : "Total Employer Cost"
                }
                value={breakdown.total}
                className="text-base font-semibold border-t border-foreground pt-4"
              />
            </div>
          </div>
          <DialogFooter className="md:hidden flex-row items-center border-t pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={!hasPrevious}
              className="flex items-center gap-2"
            >
              <ChevronLeft />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground w-full text-center">
              {currentIndex + 1} / {scenarios.length}
            </span>
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={!hasNext}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight />
            </Button>
          </DialogFooter>
          <FloatingArrowButton
            side="left"
            onClick={handlePrevious}
            disabled={!hasPrevious}
            hideTooltip={!hasUsedArrowKeys}
          />
          <FloatingArrowButton
            side="right"
            onClick={handleNext}
            disabled={!hasNext}
            hideTooltip={!hasUsedArrowKeys}
          />
        </AnimatedDialogContent>
      </DialogPortal>
    </Dialog>
  );
}

function FloatingArrowButton({
  side,
  disabled,
  onClick,
  hideTooltip,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
  hideTooltip: boolean;
}) {
  const isLeft = side === "left";
  return (
    <Tooltip
      delayDuration={0}
      open={hideTooltip || disabled ? false : undefined}
    >
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          tabIndex={-1}
          className={cn(
            "absolute hidden md:flex translate-none -translate-y-1/2 top-1/2 disabled:pointer-events-auto disabled:cursor-not-allowed",
            isLeft ? "-left-16 " : "-right-16 ",
          )}
          aria-label={isLeft ? "Previous breakdown" : "Next breakdown"}
        >
          {isLeft ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>
        <p className="flex items-center gap-1">
          Try pressing <Kbd>{isLeft ? "←" : "→"}</Kbd>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function BreakdownItem({
  label,
  value,
  className,
  ...props
}: BreakdownItem & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex justify-between", className)} {...props}>
      <span>{label}</span>
      <span>{value.toLocaleString("en-US", CURRENCY_FORMAT)}</span>
    </div>
  );
}
