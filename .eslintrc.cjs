module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2020, sourceType: "module" },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  env: { browser: true, es2020: true },
  ignorePatterns: ["dist", "node_modules", "*.mjs", "*.cjs"],
  globals: { kintone: "readonly" },
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": "off",
    // Japanese UI strings legitimately contain the full-width space (U+3000).
    "no-irregular-whitespace": ["error", { skipStrings: true, skipTemplates: true }],
  },
};
