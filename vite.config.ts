import { defineConfig } from "vite-plus";

export default defineConfig({
  base: "/neat-birds/",
  lint: {
    plugins: ["oxc", "typescript", "unicorn"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    categories: {
      correctness: "error"
    },
    env: {
      browser: true,
      es2026: true
    },
    ignorePatterns: ["dist/**"],
    rules: {
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "typescript/ban-ts-comment": "error",
      "typescript/no-explicit-any": "error",
      "typescript/no-namespace": "error",
      "typescript/no-require-imports": "error",
      "typescript/no-empty-object-type": "error",
      "typescript/no-unsafe-function-type": "error",
      "typescript/no-wrapper-object-types": "error",
      "typescript/prefer-as-const": "error",
      "vite-plus/prefer-vite-plus-imports": "error"
    },
    options: {
      typeAware: true,
      typeCheck: true
    }
  },
  fmt: {
    semi: true,
    trailingComma: "none",
    singleQuote: false,
    printWidth: 80,
    tabWidth: 2,
    sortPackageJson: false,
    ignorePatterns: ["dist/**"]
  }
});
