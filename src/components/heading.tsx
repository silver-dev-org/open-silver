export default function Heading({
  description,
  children,
  center = true,
}: {
  description: string;
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`space-y-8 ${center ? "text-center" : "text-left"}`}>
      <h1 className="text-6xl lg:text-8xl font-serif text-balance pt-32">
        {children}
      </h1>
      <p className="text-xl">{description}</p>
    </div>
  );
}
