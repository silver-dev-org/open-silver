import { spaceSizes } from "./spacer";

export default function Section({
  children,
  id,
  className,
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={`${spaceSizes.sm.px} xl:px-0`}>
      <section
        id={id}
        className={`container mx-auto ${spaceSizes.lg.scrollMt} ${className}`}
      >
        {children}
      </section>
    </div>
  );
}
