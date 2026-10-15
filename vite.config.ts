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
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
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
