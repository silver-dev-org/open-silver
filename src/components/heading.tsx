export const headingSizes: {
  [key: string]: string;
} = {
  lg: "text-5xl xl:text-8xl",
  sm: "text-3xl xl:text-6xl",
};

export function Heading({
  children,
  center,
  size = "sm",
}: {
  children: React.ReactNode;
  center?: boolean;
  size?: keyof typeof headingSizes;
}) {
  return (
    <h1
      className={`text-balance font-serif ${
        center ? "text-center" : "text-left"
      } ${headingSizes[size]}`}
    >
      {children}
    </h1>
  );
}
