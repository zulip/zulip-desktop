import type {FlatXoConfig} from "xo";

const restrictedMainImports = [
  {
    name: "@sentry/electron/main",
    message: "Cannot use main-only APIs here.",
  },
  {
    name: "electron/main",
    message: "Cannot use main-only APIs here.",
    allowTypeImports: true, // https://github.com/zulip/zulip-desktop/issues/915
  },
  {
    name: "electron-log/main",
    message: "Cannot use main-only APIs here.",
  },
];

const restrictedRendererImports = [
  {
    name: "@sentry/electron/renderer",
    message: "Cannot use renderer-only APIs here.",
  },
  {
    name: "electron/renderer",
    message: "Cannot use renderer-only APIs here.",
  },
  {
    name: "electron-log/renderer",
    message: "Cannot use renderer-only APIs here.",
  },
];

const xoConfig: FlatXoConfig = [
  {
    prettier: "compat",
  },
  {
    files: ["**/*.{,c,m}[jt]s"],
    settings: {
      n: {
        resolvePaths: [import.meta.dirname],
        typescriptExtensionMap: [],
      },
    },
    rules: {
      "@stylistic/no-mixed-operators": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {disallowTypeAnnotations: false},
      ],
      "@typescript-eslint/no-dynamic-delete": "off",
      "@typescript-eslint/no-restricted-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {argsIgnorePattern: "^_", caughtErrors: "all"},
      ],
      "@typescript-eslint/no-unsafe-type-assertion": "error",
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        {
          considerDefaultExhaustiveForUnions: true,
          requireDefaultForNonUnion: true,
        },
      ],
      "import-x/no-extraneous-dependencies": [
        "error",
        {includeTypes: true, packageDir: import.meta.dirname},
      ],
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./app/common",
              from: "./app",
              except: ["./common"],
            },
            {
              target: "./app/main",
              from: "./app",
              except: ["./common", "./main"],
            },
            {
              target: "./app/renderer",
              from: "./app",
              except: ["./common", "./renderer", "./resources"],
            },
          ],
        },
      ],
      "import-x/order": [
        "error",
        {alphabetize: {order: "asc"}, "newlines-between": "always"},
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@sentry/electron",
              message:
                "Use @sentry/electron/main, @sentry/electron/renderer, or @sentry/core.",
            },
            {
              name: "electron",
              message:
                "Use electron/main, electron/renderer, or electron/common.",
            },
            {
              name: "electron/main",
              importNames: ["ipcMain"],
              message: "Use typed-ipc-main.",
            },
            {
              name: "electron/renderer",
              importNames: ["ipcRenderer"],
              message: "Use typed-ipc-renderer.",
            },
            {
              name: "electron-log",
              message: "Use electron-log/main or electron-log/renderer.",
            },
          ],
        },
      ],
      "no-warning-comments": "off",
      "sort-imports": ["error", {ignoreDeclarationSort: true}],
      strict: "error",
      "unicorn/consistent-boolean-name": "off",
      "unicorn/max-nested-calls": "off",
      "unicorn/no-await-expression-member": "off",
      "unicorn/no-return-array-push": "off",
      "unicorn/no-top-level-side-effects": "off",
      "unicorn/prefer-continue": "off",
      "unicorn/prefer-early-return": "off",
      "unicorn/prefer-top-level-await": "off",
    },
  },
  {
    files: ["app/common/**/*.{,c,m}[jt]s"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {paths: [...restrictedMainImports, ...restrictedRendererImports]},
      ],
    },
  },
  {
    files: ["app/main/**/*.{,c,m}[jt]s"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {paths: restrictedRendererImports},
      ],
    },
  },
  {
    files: ["app/renderer/**/*.{,c,m}[jt]s"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {paths: restrictedMainImports},
      ],
    },
  },
  {
    files: ["**/*.html"],
    rules: {
      "@html-eslint/attrs-newline": "off", // Incompatible with Prettier
      "@html-eslint/indent": "off", // Incompatible with Prettier
      "@html-eslint/no-extra-spacing-tags": "off", // Incompatible with Prettier
      "@html-eslint/require-closing-tags": "off", // Incompatible with Prettier
      "@html-eslint/require-meta-description": "off",
      "@html-eslint/require-open-graph-protocol": "off",
    },
  },
];
export default xoConfig;
