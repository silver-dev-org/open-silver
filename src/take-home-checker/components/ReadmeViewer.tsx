import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco, darcula } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import Card from "./Card";
import React from "react";
import { ThemeContext } from "./ThemeContext";

const ReadmeViewer = ({ markdown }: { markdown: string; }) => {
    const { isDark } = React.useContext(ThemeContext);

    return (
        <Card fullHeight maxHeight={"75vh"}>
            <ReactMarkdown
                components={{
                    h1: ({ ...props }) => (
                        <h1 className={`text-3xl font-bold mt-4 mb-2 ${isDark ? "text-white" : "text-black"}`} {...props} />
                    ),
                    h2: ({ ...props }) => (
                        <h2 className={`text-2xl font-semibold mt-3 mb-1 ${isDark ? "text-white" : "text-black"}`} {...props} />
                    ),
                    h3: ({ ...props }) => (
                        <h3 className={`text-xl font-semibold mt-2 mb-1 ${isDark ? "text-white" : "text-black"}`} {...props} />
                    ),
                    p: ({ ...props }) => <p className="leading-relaxed mb-4" {...props} />,
                    a: ({ ...props }) => (
                        <a className={`hover:underline ${isDark ? "text-blue-400" : "text-blue-600"}`} {...props} />
                    ),
                    ul: ({ ...props }) => <ul className="list-disc pl-5 mb-4" {...props} />,
                    ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-4" {...props} />,
                    li: ({ ...props }) => <li className="mb-2" {...props} />,
                    code: ({ children }) => (
                        <SyntaxHighlighter
                            language="javascript"
                            style={isDark ? darcula : docco}
                            className="my-4 rounded-md"
                            customStyle={{
                                fontSize: "14px",
                                background: isDark ? "#1e293b" : "#f6f8fa",
                            }}
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    ),
                }}
            >
                {markdown}
            </ReactMarkdown>
        </Card>
    );
}

export default ReadmeViewer;
