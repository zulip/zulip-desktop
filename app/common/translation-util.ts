import path from "node:path";

import i18n from "i18n";

import * as ConfigUtil from "./config-util.ts";
import {publicPath} from "./paths.ts";

i18n.configure({
  directory: path.join(publicPath, "translations/"),
  updateFiles: false,
});

/* Fetches the current appLocale from settings.json */
i18n.setLocale(ConfigUtil.getConfigItem("appLanguage", "en") ?? "en");

export const __ = i18n.__.bind(i18n);
export const __mf = i18n.__mf.bind(i18n);
