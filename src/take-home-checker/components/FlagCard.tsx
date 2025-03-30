import { FaFlag } from "react-icons/fa";
import { twMerge } from "tailwind-merge";

type FlagType = "red" | "yellow" | "green";

interface FlagCardProps {
  type?: FlagType;
  flags?: string[];
  className?: string;
}

const flagStyles: Record<FlagType, { border: string; text: string; icon: string; label: string }> = {
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

const FlagCard: React.FC<FlagCardProps> = ({ type = "green", flags = [], className }) => {
  const { border, text, icon, label } = flagStyles[type];

  return (
    <div className={twMerge("bg-white dark:bg-gray-800 border-l-4 p-4 rounded shadow-sm", border, className)}>
      <div className={twMerge("flex items-center font-medium mb-2", text)}>
        <FaFlag className={twMerge("mr-2", icon)} />
        {label} ({flags.length})
      </div>
      <ul className="space-y-2 text-gray-600 dark:text-gray-300">
        {flags.length > 0 ? (
          flags.map((flag, index) => <li key={index}>• {flag}</li>)
        ) : (
          <li className="italic text-gray-400">No flags</li>
        )}
      </ul>
    </div>
  );
};

export default FlagCard;
