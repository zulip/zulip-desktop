import path from "node:path";

import i18n from "i18n";

import * as ConfigUtil from "./config-util.ts";
import {publicPath} from "./paths.ts";

i18n.configure({
  directory: path.join(publicPath, "translations/"),
  updateFiles: false,
});

/* Fetches the current appLocale from settings.json */
// Fire-and-forget: i18n uses the default locale until the database resolves.
void (async () => {
  i18n.setLocale((await ConfigUtil.getConfigItem("appLanguage", "en")) ?? "en");
})();

export {__, __mf} from "i18n";
