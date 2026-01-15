import { spacing } from "@/components/spacer";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

export function Container({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      className={cn(
        spacing.sm.px,
        spacing.lg.scrollMt,
        "container mx-auto md:px-0",
        className,
      )}
      {...props}
    />
  );
}
