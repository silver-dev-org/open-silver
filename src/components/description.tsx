import { cn } from "@/lib/utils";

export function Description({
  children,
  center,
  className,
}: {
  children: React.ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-xl max-w-prose text-balance",
        center && "text-center mx-auto",
        className,
      )}
    >
      {children}
    </p>
  );
}
