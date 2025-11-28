import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaFlag } from "react-icons/fa";
import Markdown from "react-markdown";
import { twMerge } from "tailwind-merge";

function Flag({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 72 72"
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6"
    >
      <path d="M22 36c6-4 12-3 15-1 9 4 14 4 16 3l1-1V22l-1-2c-10 1-12-2-16-4-6-3-12 0-15 1z" />
      <path
        fill={color}
        d="M22 17c3-1 9-4 15-1 4 2 6 5 16 4l1 2v15l-1 1c-2 1-7 1-16-3-3-2-9-3-15 1"
      />
      <g
        fill="none"
        stroke="#808080"
        strokeLinecap="round"
        strokeMiterlimit="10"
      >
        <path
          strokeWidth="3"
          strokeLinejoin="round"
          d="M23 17c3-1 9-4 15-1 3 2 5 5 15 4l1 2v15l-1 1c-2 1-7 1-15-3-4-2-9-3-15 1"
        />
        <path d="M19 13v47" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function Flags({
  flags,
  color,
  label,
}: {
  flags: Array<string>;
  color: string;
  label: string;
}) {
  const getColorStyles = (color: string) => {
    const colorMap: Record<
      string,
      { border: string; text: string; icon: string }
    > = {
      red: {
        border: "border-red-500",
        text: "text-red-500",
        icon: "text-red-500",
      },
      yellow: {
        border: "border-yellow-500",
        text: "text-yellow-500",
        icon: "text-yellow-500",
      },
      green: {
        border: "border-green-500",
        text: "text-green-500",
        icon: "text-green-500",
      },
    };
    return colorMap[color.toLowerCase()] || colorMap.green;
  };

  const { border, text, icon } = getColorStyles(color);

  return (
    <Card className={twMerge(border)}>
      <CardHeader className={text}>
        <CardTitle className="flex items-center gap-2">
          <FaFlag className={icon} />
          {label} ({flags.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {flags.length > 0 ? (
            flags.map((flag) => (
              <li key={flag} className="list-disc ml-4 mb-2 last:mb-0">
                <Markdown
                  components={{
                    a: ({ children, href, ...props }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link"
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {flag}
                </Markdown>
              </li>
            ))
          ) : (
            <li className="italic">No flags</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
