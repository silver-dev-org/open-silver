import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaFlag } from "react-icons/fa";
import { twMerge } from "tailwind-merge";

type FlagType = "red" | "yellow" | "green";

interface FlagCardProps {
  type?: FlagType;
  flags?: string[];
  className?: string;
}

const flagStyles: Record<
  FlagType,
  { border: string; text: string; icon: string; label: string }
> = {
  red: {
    border: "border-red-500",
    text: "text-red-700 dark:text-red-400",
    icon: "text-red-500",
    label: "Red Flags",
  },
  yellow: {
    border: "border-yellow-500",
    text: "text-yellow-700 dark:text-yellow-400",
    icon: "text-yellow-500",
    label: "Yellow Flags",
  },
  green: {
    border: "border-green-500",
    text: "text-green-700 dark:text-green-400",
    icon: "text-green-500",
    label: "Green Flags",
  },
};

const FlagCard: React.FC<FlagCardProps> = ({
  type = "green",
  flags = [],
  className,
}) => {
  const { border, text, icon, label } = flagStyles[type];

  return (
    <Card className={twMerge(border, className)}>
      <CardHeader className={text}>
        <CardTitle className="flex items-center gap-2">
          <FaFlag className={icon} />
          {label} ({flags.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {flags.length > 0 ? (
            flags.map((flag, index) => (
              <li key={index} className="list-disc list-inside">
                {" "}
                {flag}
              </li>
            ))
          ) : (
            <li className="italic">No flags</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
};

export default FlagCard;
