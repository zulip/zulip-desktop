import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {z} from "zod";
import {dialog} from "zulip:remote";

import {enterpriseConfigSchemata} from "./config-schemata.ts";
import Logger from "./logger-util.ts";

type EnterpriseConfig = {
  [Key in keyof typeof enterpriseConfigSchemata]: z.output<
    (typeof enterpriseConfigSchemata)[Key]
  >;
};

const logger = new Logger({
  file: "enterprise-util.log",
});

let isReloaded = false;
let configFile = false;
let isErrorShown = false;
let enterpriseSettings: Partial<EnterpriseConfig> = {};

reloadDatabase();

function reloadDatabase(): void {
  if (isReloaded) {
    return;
  }

  isReloaded = true;

  let enterpriseFile = "/etc/zulip-desktop-config/global_config.json";
  if (process.platform === "win32") {
    enterpriseFile = String.raw`C:\Program Files\Zulip-Desktop-Config\global_config.json`;
  }

  enterpriseFile = path.resolve(enterpriseFile);
  if (fs.existsSync(enterpriseFile)) {
    configFile = true;
    try {
      const file = fs.readFileSync(enterpriseFile, "utf8");
      const data: unknown = JSON.parse(file);
      enterpriseSettings = z
        .object(enterpriseConfigSchemata)
        .partial()
        .parse(data);
    } catch (error: unknown) {
      if (!isErrorShown) {
        dialog.showErrorBox(
          "Error loading global_config",
          "We encountered an error while reading global_config.json, please make sure the file contains valid JSON.",
        );
        isErrorShown = true;
      }

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
  if (!configFile) {
    return defaultValue;
  }

  const value = enterpriseSettings[key];
  return value === undefined ? defaultValue : (value as EnterpriseConfig[Key]);
}

export function configItemExists(key: keyof EnterpriseConfig): boolean {
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
