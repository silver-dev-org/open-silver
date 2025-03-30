import { FC, PropsWithChildren } from "react";

interface CardProps {
  fullHeight?: boolean;
  maxHeight?: string;
  className?: string;
}

const Card: FC<PropsWithChildren<CardProps>> = ({ children, fullHeight, maxHeight, className }) => (
  <div
    className={`mx-auto p-6 border rounded-lg shadow-lg bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-700 ${className} ${fullHeight ? "h-full" : ""
      }`}
    style={{
      maxHeight: maxHeight || "none",
      overflowY: maxHeight ? "auto" : "visible",
    }}
  >
    {children}
  </div>
);

export default Card;
