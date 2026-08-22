// @ts-check

import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import "eslint-plugin-only-warn";
import * as depend from "eslint-plugin-depend";
import { createNodeResolver, importX } from "eslint-plugin-import-x";
import * as perfectionist from "eslint-plugin-perfectionist";
import promise from "eslint-plugin-promise";
import * as regexp from "eslint-plugin-regexp";
import security from "eslint-plugin-security";
import * as sonarjs from "eslint-plugin-sonarjs";
import tailwindcss from "eslint-plugin-tailwindcss";
import unicorn from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";
import { globalIgnores } from "eslint/config";
import * as tseslint from "typescript-eslint";

// ---- Base config ----
/** @type {import("eslint").Linter.Config[]} */
const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  depend.configs["flat/recommended"],
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  perfectionist.configs["recommended-natural"],
  security.configs.recommended,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  promise.configs["flat/recommended"],
  regexp.configs.recommended,
  sonarjs.configs.recommended,
  unicorn.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.*", "postcss.config.*"],
        },
      },
    },
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowBoolean: true, allowNumber: true },
      ],
      "import-x/no-default-export": "error",
      "import-x/order": "off",
      "promise/no-multiple-resolved": "error",
      "promise/prefer-await-to-callbacks": "error",
      "promise/prefer-await-to-then": "error",
      "promise/prefer-catch": "error",
      "promise/spec-only": "error",
      "unicorn/prevent-abbreviations": [
        "error",
        {
          replacements: {
            env: false,
            param: false,
            params: false,
            props: false,
            ref: false,
          },
        },
      ],
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
    },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver(),
        createNodeResolver(),
      ],
    },
  },
  {
    files: ["**/*.config.*"],
    rules: {
      "import-x/no-default-export": "off",
    },
  },
  prettier,
];

// ---- Next.js config ----
/** @type {import("eslint").Linter.Config[]} */
const nextjsConfig = [
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "**/page.tsx",
      "**/layout.tsx",
      "**/not-found.tsx",
      "**/error.tsx",
      "**/loading.tsx",
      "next.config.*",
      "eslint.config.*",
    ],
    rules: {
      "import-x/no-default-export": "off",
    },
  },
];

// ---- Tailwind config ----
/** @type {import("eslint").Linter.Config[]} */
const tailwindConfig = [
  // @ts-expect-error tailwindcss ships its own config types, not ESLint core's
  tailwindcss.configs.recommended,
  {
    // @ts-expect-error plugin shape incompatible with ESLint core Plugin
    plugins: { tailwindcss },
    settings: {
      tailwindcss: {
        cssConfigPath: "src/app/globals.css",
      },
    },
  },
];

// ---- Project overrides ----
/** @type {import("eslint").Linter.Config[]} */
const projectOverrides = [
  {
    rules: {
      // High false-positive rate on dynamic lookups (form values keyed by id).
      "security/detect-object-injection": "off",
      // Subjective metric; validateField's per-rule validation switch is
      // intentionally a flat chain of branches.
      "sonarjs/cognitive-complexity": "off",
      // Vendored shadcn components don't wrap props in Readonly<>.
      "sonarjs/prefer-read-only-props": "off",
      // False positives on tw-animate-css utilities and custom classes defined
      // in globals.css
      "tailwindcss/no-custom-classname": "off",
      // React/shadcn conventions rely on null (returning null, T | null state).
      "unicorn/no-null": "off",
    },
  },
];

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...baseConfig,
  ...nextjsConfig,
  ...tailwindConfig,
  ...projectOverrides,
  globalIgnores([
    // Universal
    "dist/**",
    ".agents/**",
    // Next.js
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // pnpm
    "pnpm-lock.yaml",
  ]),
];

export default config;
