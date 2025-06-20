export const spaceSizes: {
  [key: string]: {
    gap: string;
    h: string;
    p: string;
    px: string;
    py: string;
    mt: string;
    pl: string;
    pr: string;
    scrollMt: string;
  };
} = {
  sm: {
    gap: "gap-6",
    h: "h-6",
    p: "p-6",
    px: "px-6",
    py: "py-6",
    mt: "mt-6",
    pl: "pl-6",
    pr: "pr-6",
    scrollMt: "scroll-mt-30",
  },
  lg: {
    gap: "gap-24",
    h: "h-24",
    p: "p-24",
    px: "px-24",
    py: "py-24",
    mt: "mt-24",
    pl: "pl-24",
    pr: "pr-24",
    scrollMt: "scroll-mt-48",
  },
};

export default function Spacer({
  size = "sm",
  loose,
}: {
  size?: keyof typeof spaceSizes;
  loose?: boolean;
}) {
  return <div className={loose ? spaceSizes[size].mt : spaceSizes[size].h} />;
}
