import { TakeHome } from "./types";

export function takeHomeToXML(takeHome: TakeHome, truncationInChars = 1000) {
  return `<take-home>
<docs>
${takeHome.docs ?? "N/A"}
</docs>
<code>
${
  takeHome.code
    ?.map(
      (file) => `File: ${file.path}
---
${
  truncationInChars > 0
    ? file.content.slice(0, truncationInChars) +
      (file.content.length > truncationInChars ? "\n<content-truncated />" : "")
    : file.content
}
---`
    )
    .join("\n") ?? "N/A"
}
</code>
</take-home>
`;
}
