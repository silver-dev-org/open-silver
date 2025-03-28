const sizes: {
  [key: string]: {
    text: string;
    spacing: string;
    description: string;
  };
} = {
  md: {
    text: "text-3xl xl:text-5xl",
    spacing: "pt-8 mb-8 space-y-4",
    description: "text-xl",
  },
  lg: {
    text: "text-5xl xl:text-7xl",
    spacing: "pt-16 mb-16 space-y-8",
    description: "text-2xl",
  },
  xl: {
    text: "text-7xl xl:text-9xl",
    spacing: "pt-32 mb-32 space-y-16",
    description: "text-3xl",
  },
};

export default function Heading({
  description,
  children,
  center,
  size = "xl",
}: {
  description?: string;
  children: React.ReactNode;
  center?: boolean;
  size?: keyof typeof sizes;
}) {
  return (
    <div
      className={`text-balance ${sizes[size].spacing} ${
        center ? "text-center" : "text-left"
      }`}
    >
      <h1 className={`font-serif ${sizes[size].text}`}>{children}</h1>
      {description && (
        <p
          className={`max-w-prose ${sizes[size].description} ${
            center && "mx-auto"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
