/* eslint-disable @typescript-eslint/naming-convention */

import * as path from "node:path";

import {defineConfig} from "vite";
import electron from "vite-plugin-electron";

let resolvePreload: () => void;
let resolveRenderer: () => void;
const whenPreload = new Promise<void>((resolve) => {
  resolvePreload = resolve;
});
const whenRenderer = new Promise<void>((resolve) => {
  resolveRenderer = resolve;
});

export default defineConfig({
  plugins: [
    electron([
      {
        entry: {
          index: "app/main",
        },
        async onstart({startup}) {
          await whenPreload;
          await whenRenderer;
          await startup();
        },
        vite: {
          build: {
            sourcemap: true,
            rollupOptions: {
              external: ["electron", /^electron\//, /^gatemaker\//],
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
        entry: {
          preload: "app/renderer/js/preload.ts",
        },
        onstart() {
          resolvePreload();
        },
        vite: {
          build: {
            sourcemap: "inline",
            rollupOptions: {
              external: ["electron", /^electron\//],
            },
          },
        },
      },
      {
        entry: {
          renderer: "app/renderer/js/main.ts",
        },
        onstart() {
          resolveRenderer();
        },
        vite: {
          build: {
            sourcemap: true,
            rollupOptions: {
              external: ["electron", /^electron\//],
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
        renderer: path.join(__dirname, "app/renderer/main.html"),
        network: path.join(__dirname, "app/renderer/network.html"),
        about: path.join(__dirname, "app/renderer/about.html"),
        preference: path.join(__dirname, "app/renderer/preference.html"),
      },
    },
  },
});
