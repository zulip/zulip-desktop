import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {z} from "zod";
import {dialog} from "zulip:remote";

import {enterpriseConfigSchemata} from "./config-schemata.ts";
import Logger from "./logger-util.ts";
import {exactPartial} from "./types.ts";

type EnterpriseConfig = {
  [Key in keyof typeof enterpriseConfigSchemata]: z.output<
    (typeof enterpriseConfigSchemata)[Key]
  >;
};

const logger = new Logger({
  file: "enterprise-util.log",
});

let enterpriseSettings: Partial<EnterpriseConfig>;
let configFile: boolean;

reloadDatabase();

function reloadDatabase(): void {
  let enterpriseFile =
    process.platform === "win32"
      ? String.raw`C:\Program Files\Zulip-Desktop-Config\global_config.json`
      : "/etc/zulip-desktop-config/global_config.json";

  enterpriseFile = path.resolve(enterpriseFile);
  if (fs.existsSync(enterpriseFile)) {
    configFile = true;
    try {
      const file = fs.readFileSync(enterpriseFile, "utf8");
      const data: unknown = JSON.parse(file);
      enterpriseSettings = exactPartial(
        z.object(enterpriseConfigSchemata),
      ).parse(data);
    } catch (error: unknown) {
      dialog.showErrorBox(
        "Error loading global_config",
        "We encountered an error while reading global_config.json, please make sure the file contains valid JSON.",
      );
      logger.log("Error while JSON parsing global_config.json: ");
      logger.log(error);
    }
  } else {
    configFile = false;
  }
}

export function hasConfigFile(): boolean {
  return configFile;
}

export function getConfigItem<Key extends keyof EnterpriseConfig>(
  key: Key,
  defaultValue: EnterpriseConfig[Key],
): EnterpriseConfig[Key] {
  reloadDatabase();
  if (!configFile) {
    return defaultValue;
  }

  const value = enterpriseSettings[key];
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  return value === undefined ? defaultValue : value;
}

export function configItemExists(key: keyof EnterpriseConfig): boolean {
  reloadDatabase();
  if (!configFile) {
    return false;
  }

  return enterpriseSettings[key] !== undefined;
}

export function isPresetOrg(url: string): boolean {
  if (!configFile || !configItemExists("presetOrganizations")) {
    return false;
  }

  const presetOrgs = enterpriseSettings.presetOrganizations;
  if (!Array.isArray(presetOrgs)) {
    throw new TypeError("Expected array for presetOrgs");
  }

  for (const org of presetOrgs) {
    if (url.includes(org)) {
      return true;
    }
  }

  return false;
}
