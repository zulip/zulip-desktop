import electron from "electron";

export const {app, dialog} =
  process.type === "renderer" ? electron.remote : electron;
