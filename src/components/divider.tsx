import { cn } from "@/lib/utils";
import Spacer, { spaceSizes } from "./spacer";

export default function Divider({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn(spaceSizes.sm.px, "md:px-0")}>
      <Spacer size="lg" />
      <div
        className={cn("bg-foreground h-px container mx-auto", className)}
        {...props}
      />
      <Spacer size="lg" />
    </div>
  );
}
