import fs from "node:fs";
import path from "node:path";

import {app, dialog} from "@electron/remote";
import * as Sentry from "@sentry/electron";
import {JsonDB} from "node-json-db";
import {DataError} from "node-json-db/dist/lib/Errors";
import {z} from "zod";

import * as EnterpriseUtil from "../../../common/enterprise-util.js";
import Logger from "../../../common/logger-util.js";
import * as Messages from "../../../common/messages.js";
import type {ServerConf} from "../../../common/types.js";
import {ipcRenderer} from "../typed-ipc-renderer.js";

const logger = new Logger({
  file: "domain-util.log",
});

// For historical reasons, we store this string in domain.json to denote a
// missing icon; it does not change with the actual icon location.
export const defaultIconSentinel = "../renderer/img/icon.png";

const serverConfSchema = z.object({
  url: z.string(),
  alias: z.string(),
  icon: z.string(),
});

let db!: JsonDB;

reloadDb();

// Migrate from old schema
try {
  const oldDomain = db.getObject<unknown>("/domain");
  if (typeof oldDomain === "string") {
    (async () => {
      await addDomain({
        alias: "Zulip",
        url: oldDomain,
      });
      db.delete("/domain");
    })();
  }
} catch (error: unknown) {
  if (!(error instanceof DataError)) throw error;
}

export function getDomains(): ServerConf[] {
  reloadDb();
  try {
    return serverConfSchema.array().parse(db.getObject<unknown>("/domains"));
  } catch (error: unknown) {
    if (!(error instanceof DataError)) throw error;
    return [];
  }
}

export function getDomain(index: number): ServerConf {
  reloadDb();
  return serverConfSchema.parse(db.getObject<unknown>(`/domains[${index}]`));
}

export function updateDomain(index: number, server: ServerConf): void {
  reloadDb();
  serverConfSchema.parse(server);
  db.push(`/domains[${index}]`, server, true);
}

export async function addDomain(server: {
  url: string;
  alias: string;
  icon?: string;
}): Promise<void> {
  if (server.icon) {
    const localIconUrl = await saveServerIcon(server.icon);
    server.icon = localIconUrl;
    serverConfSchema.parse(server);
    db.push("/domains[]", server, true);
    reloadDb();
  } else {
    server.icon = defaultIconSentinel;
    serverConfSchema.parse(server);
    db.push("/domains[]", server, true);
    reloadDb();
  }
}

export function removeDomains(): void {
  db.delete("/domains");
  reloadDb();
}

export function removeDomain(index: number): boolean {
  if (EnterpriseUtil.isPresetOrg(getDomain(index).url)) {
    return false;
  }

  db.delete(`/domains[${index}]`);
  reloadDb();
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
): Promise<ServerConf> {
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

async function getServerSettings(domain: string): Promise<ServerConf> {
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
): Promise<ServerConf> {
  // Does not promise successful update
  const serverConf = getDomain(index);
  const oldIcon = serverConf.icon;
  try {
    const newServerConf = await checkDomain(url, true);
    const localIconUrl = await saveServerIcon(newServerConf.icon);
    if (!oldIcon || localIconUrl !== defaultIconSentinel) {
      newServerConf.icon = localIconUrl;
      updateDomain(index, newServerConf);
      reloadDb();
    }

    return newServerConf;
  } catch (error: unknown) {
    logger.log("Could not update server icon.");
    logger.log(error);
    Sentry.captureException(error);
    return serverConf;
  }
}

function reloadDb(): void {
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

  db = new JsonDB(domainJsonPath, true, true);
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
