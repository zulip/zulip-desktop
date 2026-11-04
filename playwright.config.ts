import process from "node:process";

import {defineConfig} from "@playwright/test";

const isCi = process.env.CI === "true";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  workers: 1,
  retries: isCi ? 1 : 0,
  reporter: [["list"], ["html", {open: "never"}]],
  outputDir: "test-results",
  use: {
    trace: "on-first-retry",
  },
});
