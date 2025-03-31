export const spaceSizes: {
  [key: string]: {
    gap: string;
    h: string;
    p: string;
    px: string;
    py: string;
    mt: string;
  };
} = {
  sm: {
    gap: "gap-8",
    h: "h-8",
    p: "p-8",
    px: "px-8",
    py: "py-8",
    mt: "mt-8",
  },
  lg: {
    gap: "gap-32",
    h: "h-32",
    p: "p-32",
    px: "px-32",
    py: "py-32",
    mt: "mt-32",
  },
};

export default function Space({
  size = "sm",
  loose,
}: {
  size?: keyof typeof spaceSizes;
  loose?: boolean;
}) {
  return <div className={loose ? spaceSizes[size].mt : spaceSizes[size].h} />;
}
