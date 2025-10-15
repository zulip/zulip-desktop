import assert from "node:assert";
import {randomBytes} from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {app, dialog} from "@electron/remote";
import * as Sentry from "@sentry/electron/renderer";
import {JsonDB} from "node-json-db";
import {DataError} from "node-json-db/dist/lib/Errors.js";
import {z} from "zod";

import * as EnterpriseUtil from "../../../common/enterprise-util.ts";
import Logger from "../../../common/logger-util.ts";
import * as Messages from "../../../common/messages.ts";
import * as t from "../../../common/translation-util.ts";
import type {ServerConfig, ServerSettings} from "../../../common/types.ts";
import defaultIcon from "../../img/icon.png";
import {ipcRenderer} from "../typed-ipc-renderer.ts";

const logger = new Logger({
  file: "domain-util.log",
});

export function generateDomainId(): string {
  return randomBytes(5).toString("hex");
}

// For historical reasons, we store this string in domain.json to denote a
// missing icon; it does not change with the actual icon location.
export const defaultIconSentinel = "../renderer/img/icon.png";

const storedServerSchema = z.object({
  id: z.string().optional(),
  url: z.url(),
  alias: z.string(),
  icon: z.string(),
  zulipVersion: z.string().default("unknown"),
  zulipFeatureLevel: z.number().default(0),
});

const serverConfigSchema = storedServerSchema.extend({
  id: z.string(),
});

function addServerId(server: z.infer<typeof storedServerSchema>): ServerConfig {
  assert.ok(server.id === undefined);
  return serverConfigSchema.parse({
    ...server,
    id: generateDomainId(),
  });
}

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

export function getDomainById(id: string): ServerConfig | undefined {
  return getDomains().find((server) => server.id === id);
}

export function updateDomainById(id: string, server: ServerConfig): void {
  const index = getDomains().findIndex((domain) => domain.id === id);
  assert.ok(index !== -1, `Domain with id ${id} not found`);
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
  } else {
    server.icon = defaultIconSentinel;
  }

  const serverWithId = addServerId(storedServerSchema.parse(server));
  database.push("/domains[]", serverWithId, true);
  reloadDatabase();
}

export function removeDomains(): void {
  database.delete("/domains");
  reloadDatabase();
}

export function removeDomainById(id: string): boolean {
  const index = getDomains().findIndex((domain) => domain.id === id);
  if (index === -1) {
    return false;
  }

  if (EnterpriseUtil.isPresetOrg(getDomainById(id)!.url)) {
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
): Promise<ServerSettings> {
  if (!silent && duplicateDomain(domain)) {
    // Do not check duplicate in silent mode
    throw new Error("This server has been added.");
  }

  domain = formatUrl(domain);

  try {
    return storedServerSchema.parse(await getServerSettings(domain));
  } catch {
    throw new Error(Messages.invalidZulipServerError(domain));
  }
}

async function getServerSettings(domain: string): Promise<ServerSettings> {
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
  id: string,
): Promise<ServerConfig> {
  // Does not promise successful update
  const serverConfig = getDomainById(id)!;
  const oldIcon = serverConfig.icon;
  try {
    const newServerSetting = await checkDomain(url, true);
    const newServerConfig: ServerConfig = {
      ...newServerSetting,
      id: serverConfig.id,
    };
    const localIconUrl = await saveServerIcon(newServerConfig.icon);
    if (!oldIcon || localIconUrl !== defaultIconSentinel) {
      newServerConfig.icon = localIconUrl;
      updateDomainById(id, newServerConfig);
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

function ensureDomainIds(): void {
  try {
    const domains = storedServerSchema
      .array()
      .parse(database.getObject<unknown>("/domains"));

    let changed = false;

    const updatedDomains = domains.map((server) => {
      if (server.id === undefined) {
        changed = true;
        server = addServerId(server);
      }

      return server;
    });

    if (changed) {
      database.push("/domains", updatedDomains, true);
    }
  } catch (error: unknown) {
    if (!(error instanceof DataError)) throw error;
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
        t.__("Error saving new organization"),
        t.__(
          "There was an error while saving the new organization. You may have to add your previous organizations again.",
        ),
      );
      logger.error("Error while JSON parsing domain.json: ");
      logger.error(error);
      Sentry.captureException(error);
    }
  }

  database = new JsonDB(domainJsonPath, true, true);
  ensureDomainIds();
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
