import process from "node:process";

import type {z} from "zod";

import type {dndSettingsSchemata} from "./config-schemata.ts";
import * as ConfigUtil from "./config-util.ts";

export type DndSettings = {
  [Key in keyof typeof dndSettingsSchemata]: z.output<
    (typeof dndSettingsSchemata)[Key]
  >;
};

type SettingName = keyof DndSettings;

export type Toggle = {
  dnd: boolean;
  newSettings: Partial<DndSettings>;
};

export function toggle(): Toggle {
  const dnd = !ConfigUtil.getConfigItem("dnd", false);
  const dndSettingList: SettingName[] = [
    "showNotification",
    "silent",
    ...(process.platform === "win32"
      ? (["flashTaskbarOnMessage"] as const)
      : []),
  ];

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

export function set(targetDnd: boolean): Toggle {
  const currentDnd = ConfigUtil.getConfigItem("dnd", false);
  if (targetDnd === currentDnd) {
    const dndSettingList: SettingName[] = [
      "showNotification",
      "silent",
      ...(process.platform === "win32"
        ? (["flashTaskbarOnMessage"] as const)
        : []),
    ];
    const currentSettings: Partial<DndSettings> = {};
    for (const settingName of dndSettingList) {
      currentSettings[settingName] = ConfigUtil.getConfigItem(
        settingName,
        settingName !== "silent",
      );
    }

    return {dnd: targetDnd, newSettings: currentSettings};
  }

  return toggle();
}
