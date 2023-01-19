import path from "node:path";

import i18n from "i18n";

import * as ConfigUtil from "./config-util.js";
import {publicPath} from "./paths.js";

i18n.configure({
  directory: path.join(publicPath, "translations/"),
  updateFiles: false,
});

/* Fetches the current appLocale from settings.json */
const appLocale = ConfigUtil.getConfigItem("appLanguage", "en");

/* If no locale present in the json, en is set default */
export function __(phrase: string): string {
  return i18n.__({phrase, locale: appLocale ?? "en"});
}
