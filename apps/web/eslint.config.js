// SPDX-License-Identifier: AGPL-3.0-only
import js from "@eslint/js";
import ts from "typescript-eslint";
import a11y from "eslint-plugin-jsx-a11y";
import hooks from "eslint-plugin-react-hooks";
import globals from "globals";
export default ts.config(
  {
    ignores: [
      "dist/**",
      "src/generated/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.worker, ...globals.node },
    },
  },
  { files: ["**/*.tsx"], ...a11y.flatConfigs.recommended },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": hooks },
    rules: hooks.configs.recommended.rules,
  },
);
