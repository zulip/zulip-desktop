import path from "node:path";

import i18n from "i18n";

import * as ConfigUtil from "./config-util.js";
import {publicPath} from "./paths.js";

i18n.configure({
  directory: path.join(publicPath, "translations/"),
  updateFiles: false,
});

/* Fetches the current appLocale from settings.json */
i18n.setLocale(ConfigUtil.getConfigItem("appLanguage", "en") ?? "en");

export {__} from "i18n";
