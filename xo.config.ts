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
    prettier: true,
    space: true,
    settings: {
      "import-x/resolver": "typescript",
      n: {
        resolvePaths: [import.meta.dirname],
        typescriptExtensionMap: [],
      },
    },
    rules: {
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
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        {
          considerDefaultExhaustiveForUnions: true,
          requireDefaultForNonUnion: true,
        },
      ],
      "arrow-body-style": "error",
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
      "import-x/unambiguous": "error",
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
      "unicorn/no-await-expression-member": "off",
      "unicorn/prefer-module": "off",
      "unicorn/prefer-top-level-await": "off",
    },
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      "import-x/unambiguous": "off",
    },
  },
  {
    files: ["app/common/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {paths: [...restrictedMainImports, ...restrictedRendererImports]},
      ],
    },
  },
  {
    files: ["app/main/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {paths: restrictedRendererImports},
      ],
    },
  },
  {
    files: ["app/renderer/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {paths: restrictedMainImports},
      ],
    },
  },
];
export default xoConfig;
