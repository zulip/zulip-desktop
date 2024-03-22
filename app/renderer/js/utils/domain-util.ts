import fs from "node:fs";
import path from "node:path";

import {app, dialog} from "@electron/remote";
import * as Sentry from "@sentry/electron/renderer";
import {JsonDB} from "node-json-db";
import {DataError} from "node-json-db/dist/lib/Errors";
import {z} from "zod";

import * as EnterpriseUtil from "../../../common/enterprise-util.js";
import Logger from "../../../common/logger-util.js";
import * as Messages from "../../../common/messages.js";
import * as t from "../../../common/translation-util.js";
import type {ServerConfig} from "../../../common/types.js";
import defaultIcon from "../../img/icon.png";
import {ipcRenderer} from "../typed-ipc-renderer.js";

const logger = new Logger({
  file: "domain-util.log",
});

// For historical reasons, we store this string in domain.json to denote a
// missing icon; it does not change with the actual icon location.
export const defaultIconSentinel = "../renderer/img/icon.png";

const serverConfigSchema = z.object({
  url: z.string().url(),
  alias: z.string(),
  icon: z.string(),
  zulipVersion: z.string().default("unknown"),
  zulipFeatureLevel: z.number().default(0),
});

let database!: JsonDB;

reloadDatabase();

// Migrate from old schema
try {
  const oldDomain = database.getObject<unknown>("/domain");
  if (typeof oldDomain === "string") {
    (async () => {
      await addDomain({
        alias: "Zulip",
        url: oldDomain,
      });
      database.delete("/domain");
    })();
  }
} catch (error: unknown) {
  if (!(error instanceof DataError)) throw error;
}

export function getDomains(): ServerConfig[] {
  reloadDatabase();
  try {
    return serverConfigSchema
      .array()
      .parse(database.getObject<unknown>("/domains"));
  } catch (error: unknown) {
    if (!(error instanceof DataError)) throw error;
    return [];
  }
}

export function getDomain(index: number): ServerConfig {
  reloadDatabase();
  return serverConfigSchema.parse(
    database.getObject<unknown>(`/domains[${index}]`),
  );
}

export function updateDomain(index: number, server: ServerConfig): void {
  reloadDatabase();
  serverConfigSchema.parse(server);
  database.push(`/domains[${index}]`, server, true);
}

export async function addDomain(server: {
  url: string;
  alias: string;
  icon?: string;
}): Promise<void> {
  if (server.icon) {
    const localIconUrl = await saveServerIcon(server.icon);
    server.icon = localIconUrl;
    serverConfigSchema.parse(server);
    database.push("/domains[]", server, true);
    reloadDatabase();
  } else {
    server.icon = defaultIconSentinel;
    serverConfigSchema.parse(server);
    database.push("/domains[]", server, true);
    reloadDatabase();
  }
}

export function removeDomains(): void {
  database.delete("/domains");
  reloadDatabase();
}

export function removeDomain(index: number): boolean {
  if (EnterpriseUtil.isPresetOrg(getDomain(index).url)) {
    return false;
  }

  database.delete(`/domains[${index}]`);
  reloadDatabase();
  return true;
}

// Check if domain is already added
export function duplicateDomain(domain: string): boolean {
  domain = formatUrl(domain);
  return getDomains().some((server) => server.url === domain);
}

export async function checkDomain(
  domain: string,
  silent = false,
): Promise<ServerConfig> {
  if (!silent && duplicateDomain(domain)) {
    // Do not check duplicate in silent mode
    throw new Error("This server has been added.");
  }

  domain = formatUrl(domain);

  try {
    return await getServerSettings(domain);
  } catch {
    throw new Error(Messages.invalidZulipServerError(domain));
  }
}

async function getServerSettings(domain: string): Promise<ServerConfig> {
  return ipcRenderer.invoke("get-server-settings", domain);
}

export async function saveServerIcon(iconURL: string): Promise<string> {
  return (
    (await ipcRenderer.invoke("save-server-icon", iconURL)) ??
    defaultIconSentinel
  );
}

export async function updateSavedServer(
  url: string,
  index: number,
): Promise<ServerConfig> {
  // Does not promise successful update
  const serverConfig = getDomain(index);
  const oldIcon = serverConfig.icon;
  try {
    const newServerConfig = await checkDomain(url, true);
    const localIconUrl = await saveServerIcon(newServerConfig.icon);
    if (!oldIcon || localIconUrl !== defaultIconSentinel) {
      newServerConfig.icon = localIconUrl;
      updateDomain(index, newServerConfig);
      reloadDatabase();
    }

    return newServerConfig;
  } catch (error: unknown) {
    logger.log("Could not update server icon.");
    logger.log(error);
    Sentry.captureException(error);
    return serverConfig;
  }
}

function reloadDatabase(): void {
  const domainJsonPath = path.join(
    app.getPath("userData"),
    "config/domain.json",
  );
  try {
    const file = fs.readFileSync(domainJsonPath, "utf8");
    JSON.parse(file);
  } catch (error: unknown) {
    if (fs.existsSync(domainJsonPath)) {
      fs.unlinkSync(domainJsonPath);
      dialog.showErrorBox(
        "Error saving new organization",
        "There seems to be error while saving new organization, " +
          "you may have to re-add your previous organizations back.",
      );
      logger.error("Error while JSON parsing domain.json: ");
      logger.error(error);
      Sentry.captureException(error);
    }
  }

  database = new JsonDB(domainJsonPath, true, true);
}

export function formatUrl(domain: string): string {
  if (domain.startsWith("http://") || domain.startsWith("https://")) {
    return domain;
  }

  if (domain.startsWith("localhost:")) {
    return `http://${domain}`;
  }

  return `https://${domain}`;
}

export function getUnsupportedMessage(
  server: ServerConfig,
): string | undefined {
  if (server.zulipFeatureLevel < 65 /* Zulip Server 4.0 */) {
    const realm = new URL(server.url).hostname;
    return t.__(
      "{{{server}}} runs an outdated Zulip Server version {{{version}}}. It may not fully work in this app.",
      {server: realm, version: server.zulipVersion},
    );
  }

  return undefined;
}

export function iconAsUrl(iconPath: string): string {
  if (iconPath === defaultIconSentinel) return defaultIcon;

  try {
    return `data:application/octet-stream;base64,${fs.readFileSync(
      iconPath,
      "base64",
    )}`;
  } catch {
    return defaultIcon;
  }
}
