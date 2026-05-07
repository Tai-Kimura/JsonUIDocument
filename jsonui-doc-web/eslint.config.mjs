import next from "eslint-config-next";

export default [
  ...next,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react/no-unescaped-entities": "off"
    },
    ignores: [
      "src/generated/**",
      "src/Layouts/**",
      "src/Styles/**",
      "src/Strings/**",
      "node_modules/**",
      ".next/**",
      "src/data/attribute-reference/**"
    ]
  }
];
