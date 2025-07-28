// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

// import { dirname } from "path";
// import { fileURLToPath } from "url";
// import { FlatCompat } from "@eslint/eslintrc";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const compat = new FlatCompat({
//   baseDirectory: __dirname,
// });

// const eslintConfig = [
//   ...compat.extends("next/core-web-vitals", "next/typescript"),
// ];

// export default eslintConfig;

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import reactServerPlugin from "eslint-plugin-react-server";

/** resolve __dirname and compat for legacy configs */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** final config */
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Add this ruleset to restrict browser globals in server components
  {
    files: ["app/**/*.{js,ts,jsx,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "window",
          message: "Avoid using 'window' in server components.",
        },
        {
          name: "document",
          message: "Avoid using 'document' in server components.",
        },
        {
          name: "navigator",
          message: "Avoid using 'navigator' in server components.",
        },
      ],
    },
  },
  // Optional: Add react-server plugin to enforce server/client boundaries
  {
    plugins: {
      "react-server": reactServerPlugin,
    },
    rules: {
      "react-server/no-browser-globals": "error",
    },
  },
  ...storybook.configs["flat/recommended"]
];

export default eslintConfig;
