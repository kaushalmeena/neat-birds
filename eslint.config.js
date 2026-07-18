import js from "@eslint/js";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";

export default [
  js.configs.recommended,
  prettierRecommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser
      }
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      eqeqeq: "error",
      "prefer-const": "error",
      "no-var": "error"
    }
  }
];
