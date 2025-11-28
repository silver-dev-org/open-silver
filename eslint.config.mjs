import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ["next"],
    rules: {
      // "@next/next/no-page-custom-font": "off",
      "import/no-anonymous-default-export": "off",
      "react-hooks/exhaustive-deps": "off",
      "import/no-default-export": "error",
    },
    overrides: [
      {
        files: ["src/app/**/*.{js,jsx,ts,tsx}", "src/pages/api/**/*.{js,ts}"],
        rules: {
          "import/no-default-export": "off",
        },
      },
    ],
  }),
];

export default eslintConfig;
