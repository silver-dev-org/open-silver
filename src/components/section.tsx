import Space from "./space";

export default function Section({
  children,
  id,
  className,
  space = "lg",
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
  space?: "lg" | "sm" | null;
}) {
  return (
    <div className="mx-4 sm:mx-0">
      <section id={id} className={`container mx-auto ${className}`}>
        {space && <Space size={space} />}
        {children}
        {space && <Space size={space} loose />}
      </section>
    </div>
  );
}
