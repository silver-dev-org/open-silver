import { spacing } from "./spacer";

export function Grid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 mx-auto ${spacing.sm.gap} ${className}`}
    >
      {children}
    </div>
  );
}
