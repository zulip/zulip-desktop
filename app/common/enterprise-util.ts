import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {z} from "zod";

import {enterpriseConfigSchemata} from "./config-schemata.js";
import Logger from "./logger-util.js";

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
  let enterpriseFile = "/etc/zulip-desktop-config/global_config.json";
  if (process.platform === "win32") {
    enterpriseFile =
      "C:\\Program Files\\Zulip-Desktop-Config\\global_config.json";
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
  return value === undefined ? defaultValue : (value as EnterpriseConfig[Key]);
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
