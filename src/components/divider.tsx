import { Spacer, spacing } from "@/components/spacer";
import { cn } from "@/lib/utils";

function Divider({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn(spacing.sm.px, "md:px-0")}>
      <Spacer size="lg" />
      <div
        className={cn("bg-foreground h-px container mx-auto", className)}
        {...props}
      />
      <Spacer size="lg" />
    </div>
  );
}

export { Divider };
