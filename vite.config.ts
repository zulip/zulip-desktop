/* eslint-disable @typescript-eslint/naming-convention */

import {defineConfig} from "vite";
import electron from "vite-plugin-electron";

export default defineConfig({
  plugins: [
    electron([
      {
        vite: {
          build: {
            lib: {
              entry: {
                index: "app/main",
              },
              formats: ["cjs"],
            },
            sourcemap: true,
            rollupOptions: {
              external: ["electron", /^electron\//, /^gatemaker\//],
              output: {
                entryFileNames: "[name].cjs",
              },
            },
            ssr: true,
          },
          resolve: {
            alias: {
              "zulip:remote": "electron/main",
            },
          },
          ssr: {
            noExternal: true,
          },
        },
      },
      {
        vite: {
          build: {
            lib: {
              entry: {
                preload: "app/renderer/js/preload.ts",
              },
              formats: ["cjs"],
            },
            sourcemap: "inline",
            rollupOptions: {
              external: ["electron", /^electron\//],
              output: {
                entryFileNames: "[name].cjs",
              },
            },
          },
        },
      },
      {
        vite: {
          build: {
            lib: {
              entry: {
                renderer: "app/renderer/js/main.ts",
              },
              formats: ["cjs"],
            },
            sourcemap: true,
            rollupOptions: {
              external: ["electron", /^electron\//],
              output: {
                entryFileNames: "[name].cjs",
              },
            },
          },
          resolve: {
            alias: {
              "zulip:remote": "@electron/remote",
            },
          },
        },
      },
    ]),
  ],
  build: {
    outDir: "dist-electron",
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
});
