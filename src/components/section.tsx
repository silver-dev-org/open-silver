import { spacing } from "./spacer";

export function Section({
  children,
  id,
  className,
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={`${spacing.sm.px} xl:px-0`}>
      <section
        id={id}
        className={`container mx-auto ${spacing.lg.scrollMt} ${className}`}
      >
        {children}
      </section>
    </div>
  );
}
