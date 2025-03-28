import React from "react";

type RatingValue = "Strong yes" | "Yes" | "No" | "Strong no";

interface RatingBarProps {
  active: RatingValue;
}

const bgColor = {
  "Strong yes": "bg-green-600",
  Yes: "bg-lime-600",
  No: "bg-orange-500",
  "Strong no": "bg-red-600",
}

const RatingBar: React.FC<RatingBarProps> = ({ active }) => {
  const options: RatingValue[] = ["Strong no", "No", "Yes", "Strong yes"];

  return (
    <div className="flex items-center justify-between w-full border border-gray-300 dark:border-gray-600 rounded-full p-2 bg-white dark:bg-gray-800 mb-6">
      {options.map((option) => (
        <div
          key={option}
          className={`flex-1 text-center py-2 rounded-full
          ${
            active === option
              ? `${bgColor[option]} text-white font-bold`
              : "text-gray-700 dark:text-gray-300"
          }
          `}
        >
          {option}
        </div>
      ))}
    </div>
  );
};

export default RatingBar;
