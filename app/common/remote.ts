import electron from "electron";

export const {app, dialog} =
  process.type === "renderer"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      (require("@electron/remote") as typeof import("@electron/remote"))
    : electron;
