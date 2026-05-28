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

type Toggle = {
  dnd: boolean;
  newSettings: Partial<DndSettings>;
};

export async function toggle(): Promise<Toggle> {
  const dnd = !(await ConfigUtil.getConfigItem("dnd", false));
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
      // eslint-disable-next-line no-await-in-loop
      oldSettings[settingName] = await ConfigUtil.getConfigItem(
        settingName,
        settingName !== "silent",
      );
      // New value of setting.
      newSettings[settingName] = settingName === "silent";
    }

    // Store old value in oldSettings.
    await ConfigUtil.setConfigItem("dndPreviousSettings", oldSettings);
  } else {
    newSettings = await ConfigUtil.getConfigItem("dndPreviousSettings", {
      showNotification: true,
      silent: false,
      ...(process.platform === "win32" && {flashTaskbarOnMessage: true}),
    });
  }

  for (const settingName of dndSettingList) {
    // eslint-disable-next-line no-await-in-loop
    await ConfigUtil.setConfigItem(settingName, newSettings[settingName]!);
  }

  await ConfigUtil.setConfigItem("dnd", dnd);
  return {dnd, newSettings};
}
