import {z} from "zod";

export const dndSettingsSchemata = {
  showNotification: z.boolean(),
  silent: z.boolean(),
  flashTaskbarOnMessage: z.boolean(),
};

export const configSchemata = {
  ...dndSettingsSchemata,
  appLanguage: z.string().nullable(),
  autoHideMenubar: z.boolean(),
  autoUpdate: z.boolean(),
  badgeOption: z.boolean(),
  betaUpdate: z.boolean(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  customCSS: z.string().or(z.literal(false)).nullable(),
  dnd: z.boolean(),
  dndPreviousSettings: z.object(dndSettingsSchemata).partial(),
  dockBouncing: z.boolean(),
  downloadsPath: z.string(),
  enableSpellchecker: z.boolean(),
  errorReporting: z.boolean(),
  lastActiveTab: z.number(),
  promptDownload: z.boolean(),
  proxyBypass: z.string(),
  whitelistedProtocols: z.string().array(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  proxyPAC: z.string(),
  proxyRules: z.string(),
  quitOnClose: z.boolean(),
  showSidebar: z.boolean(),
  spellcheckerLanguages: z.string().array().nullable(),
  startAtLogin: z.boolean(),
  startMinimized: z.boolean(),
  trayIcon: z.boolean(),
  useManualProxy: z.boolean(),
  useProxy: z.boolean(),
  useSystemProxy: z.boolean(),
};

export const enterpriseConfigSchemata = {
  ...configSchemata,
  presetOrganizations: z.string().array(),
};
