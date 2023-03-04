import process from "node:process";

import type {z} from "zod";

import type {dndSettingsSchemata} from "./config-schemata.js";
import * as ConfigUtil from "./config-util.js";

export type DndSettings = {
  [Key in keyof typeof dndSettingsSchemata]: z.output<
    (typeof dndSettingsSchemata)[Key]
  >;
};

type SettingName = keyof DndSettings;

type Toggle = {
  dnd: boolean;
  newSettings: Partial<DndSettings>;
};

export function toggle(): Toggle {
  const dnd = !ConfigUtil.getConfigItem("dnd", false);
  const dndSettingList: SettingName[] = ["showNotification", "silent"];
  if (process.platform === "win32") {
    dndSettingList.push("flashTaskbarOnMessage");
  }

  let newSettings: Partial<DndSettings>;
  if (dnd) {
    const oldSettings: Partial<DndSettings> = {};
    newSettings = {};

    // Iterate through the dndSettingList.
    for (const settingName of dndSettingList) {
      // Store the current value of setting.
      oldSettings[settingName] = ConfigUtil.getConfigItem(
        settingName,
        settingName !== "silent",
      );
      // New value of setting.
      newSettings[settingName] = settingName === "silent";
    }

    // Store old value in oldSettings.
    ConfigUtil.setConfigItem("dndPreviousSettings", oldSettings);
  } else {
    newSettings = ConfigUtil.getConfigItem("dndPreviousSettings", {
      showNotification: true,
      silent: false,
      ...(process.platform === "win32" && {flashTaskbarOnMessage: true}),
    });
  }

  for (const settingName of dndSettingList) {
    ConfigUtil.setConfigItem(settingName, newSettings[settingName]!);
  }

  ConfigUtil.setConfigItem("dnd", dnd);
  return {dnd, newSettings};
}
