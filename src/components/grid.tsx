import { cn } from "@/lib/utils";
import { spacing } from "@/components/spacer";

function Grid({
  flex,
  spacingSize = "sm",
  className,
  ...props
}: {
  spacingSize?: keyof typeof spacing | null;
  flex?: boolean;
} & React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto",
        flex
          ? "flex flex-wrap justify-center"
          : "grid grid-cols-1 md:grid-cols-2",
        spacingSize && spacing[spacingSize].gap,
        className,
      )}
      {...props}
    />
  );
}

export { Grid };
