import { cn } from "@/lib/utils";

const spacing = {
  sm: {
    gap: "gap-6",
    h: "h-6",
    p: "p-6",
    px: "px-6",
    py: "py-6",
    pl: "pl-6",
    pr: "pr-6",
    mt: "mt-6",
    my: "my-6",
    scrollMt: "scroll-mt-30",
  },
  lg: {
    gap: "gap-24",
    h: "h-24",
    p: "p-24",
    px: "px-24",
    py: "py-24",
    pl: "pl-24",
    pr: "pr-24",
    mt: "mt-24",
    my: "my-24",
    scrollMt: "scroll-mt-48",
  },
};

function Spacer({
  size = "sm",
  loose = false,
  className,
  ...props
}: {
  size?: keyof typeof spacing;
  loose?: boolean;
} & React.ComponentProps<"div">) {
  return (
    <div
      className={cn(loose ? spacing[size].mt : spacing[size].h, className)}
      {...props}
    />
  );
}

export { Spacer, spacing };
