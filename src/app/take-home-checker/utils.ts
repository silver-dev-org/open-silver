import { TakeHome } from "./types";

export function takeHomeToXML(takeHome: TakeHome) {
  return `<take-home>
<docs>
${takeHome.docs ?? "N/A"}
</docs>
<code>
${
  takeHome.code
    ?.map((file) => `File: ${file.path}\n---\n${file.content}\n---`)
    .join("\n") ?? "N/A"
}
</code>
</take-home>
`;
}
