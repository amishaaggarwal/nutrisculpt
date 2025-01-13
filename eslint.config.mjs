import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      "react/react-in-jsx-scope": "off", // Next.js doesn't require React in scope
      "react/prop-types": 0,
      "react/jsx-props-no-spreading": "off",
      "react/function-component-definition": [
        2,
        {
          namedComponents: ["arrow-function", "function-declaration"],
          unnamedComponents: "arrow-function",
        },
      ],
      "react/jsx-filename-extension": [1, { extensions: [".js", ".jsx"] }],
      "no-console": ["error", { allow: ["error", "info"] }],
      "jsx-a11y/control-has-associated-label": "off",
    },
  },
];
