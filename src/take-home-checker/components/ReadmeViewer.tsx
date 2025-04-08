import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

import { dracula, github } from "react-syntax-highlighter/dist/esm/styles/hljs";

const ReadmeViewer = ({ markdown }: { markdown: string }) => {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  return (
    <Card className="h-full overflow-x-auto">
      <CardContent>
        <ReactMarkdown
          components={{
            h1: ({ ...props }) => (
              <h1 className="text-3xl font-bold mt-4 mb-2" {...props} />
            ),
            h2: ({ ...props }) => (
              <h2 className="text-2xl font-semibold mt-3 mb-1" {...props} />
            ),
            h3: ({ ...props }) => (
              <h3 className="text-xl font-semibold mt-2 mb-1" {...props} />
            ),
            p: ({ ...props }) => (
              <p className="leading-relaxed mb-4" {...props} />
            ),
            a: ({ ...props }) => (
              <a
                target="_blank"
                className="hover:underline text-secondary"
                {...props}
              />
            ),
            ul: ({ ...props }) => (
              <ul className="list-disc pl-5 mb-4" {...props} />
            ),
            ol: ({ ...props }) => (
              <ol className="list-decimal pl-5 mb-4" {...props} />
            ),
            li: ({ ...props }) => <li className="mb-2" {...props} />,
            code: ({ children }) => (
              <SyntaxHighlighter
                language="javascript"
                className="my-4 rounded-md"
                style={isDark ? dracula : github}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
};

export default ReadmeViewer;
