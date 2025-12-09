/* eslint-disable @typescript-eslint/naming-convention */

import {defineConfig} from "electron-vite";

export default defineConfig({
  main: {
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          index: "app/main/index.ts",
        },
        external: ["electron", /^electron\//, /^gatemaker\//],
      },
    },
    resolve: {
      alias: {
        "zulip:remote": "electron/main",
      },
    },
  },
  preload: {
    build: {
      sourcemap: "inline",
      rollupOptions: {
        input: {
          preload: "app/renderer/js/preload.ts",
          renderer: "app/renderer/js/main.ts",
        },
        output: {
          format: "cjs",
        },
        external: ["electron", /^electron\//],
      },
      isolatedEntries: true,
    },
    resolve: {
      alias: {
        "zulip:remote": "@electron/remote",
      },
    },
  },
  renderer: {
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          renderer: "app/renderer/main.html",
          network: "app/renderer/network.html",
          about: "app/renderer/about.html",
          preference: "app/renderer/preference.html",
        },
      },
    },
    root: ".",
  },
});
