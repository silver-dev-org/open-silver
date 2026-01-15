import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const headingVariants = cva("text-balance font-serif", {
  variants: {
    lvl: {
      1: "text-6xl md:text-8xl",
      2: "text-4xl md:text-6xl",
      3: "text-2xl md:text-4xl",
      4: "text-xl md:text-2xl",
      5: "text-lg md:text-xl",
      6: "text-base md:text-lg",
    },
    center: {
      true: "text-center mx-auto",
    },
  },
});

export function Heading({
  lvl,
  center = false,
  className,
  ...props
}: VariantProps<typeof headingVariants> & React.ComponentProps<"h1">) {
  const Comp = `h${lvl}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return (
    <Comp
      className={cn(headingVariants({ lvl, center }), className)}
      {...props}
    />
  );
}

export function Subheading({
  center = false,
  className,
  ...props
}: {
  center?: boolean;
} & React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        headingVariants({ lvl: 5, center }),
        className,
        "font-sans max-w-[80ch]",
      )}
      {...props}
    />
  );
}
