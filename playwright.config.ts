import {defineConfig} from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: /test-.*\.ts/,
  reporter: "html",
  workers: 1,
});
