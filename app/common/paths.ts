import path from "node:path";
import process from "node:process";
import url from "node:url";

export const bundlePath = import.meta.dirname;

export const publicPath = import.meta.env.DEV
  ? path.join(bundlePath, "../../public")
  : path.join(bundlePath, "../renderer");

export const bundleUrl = import.meta.env.DEV
  ? process.env.ELECTRON_RENDERER_URL + "/"
  : url.pathToFileURL(publicPath + "/").href;

export const publicUrl = bundleUrl;
