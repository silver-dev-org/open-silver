import { Codebase, TakeHome } from "./types";

export function takeHomeToXML(takeHome: TakeHome, codeTruncation?: number) {
  return `<take-home>
<docs>
${takeHome.docs ?? "N/A"}
</docs>
<code>
${codebaseToString(takeHome.code, codeTruncation)}
</code>
</take-home>
`;
}

export function codebaseToString(code?: Codebase, truncation: number = 1000) {
  if (!code) return "N/A";
  return code
    .map(
      (file) => `File: ${file.path}
---
${
  truncation && truncation > 0
    ? file.content.slice(0, truncation) +
      (file.content.length > truncation ? "\n<content-truncated />" : "")
    : file.content
}
---
`
    )
    .join("\n");
}
