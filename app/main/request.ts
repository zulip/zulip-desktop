import { type Session, app } from "electron"; // Fixed: Import from 'electron'
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";

import * as Sentry from "@sentry/electron/main";

import Logger from "../common/logger-util"; // Fixed: Removed .ts extension for compatibility
import * as Messages from "../common/messages"; 
import type { ServerConfig } from "../common/types";

const logger = new Logger({ file: "domain-util.log" });

const generateFilePath = (url: string): string => {
  // FIXED: Wrapped in backticks (`)
  const directory = `${app.getPath("userData")}/server-icons`;
  const extension = path.extname(url).split("?")[0];
  let hash = 5381;
  let { length } = url;
  while (length) { hash = (hash * 33) ^ url.charCodeAt(--length); }
  if (!fs.existsSync(directory)) { fs.mkdirSync(directory); }
  // FIXED: Wrapped in backticks (`)
  return `${directory}/${hash >>> 0}${extension}`;
};

export const _getServerSettings = async (domain: string, session: Session): Promise<ServerConfig> => {
  try {
    const response = await session.fetch(domain + "/api/v1/server_settings");
    if (!response.ok) { 
      // This uses the custom message logic we fixed earlier
      throw new Error(Messages.invalidZulipServerError(domain)); 
    }
    const data: any = await response.json();
    return {
      icon: data.realm_icon.startsWith("/") ? data.realm_uri + data.realm_icon : data.realm_icon,
      url: data.realm_uri,
      alias: data.realm_name,
      zulipVersion: data.zulip_version || "unknown",
      zulipFeatureLevel: data.zulip_feature_level || 0,
    };
  } catch (err) {
    console.error("Failed to fetch server settings:", err);
    throw err;
  }
};

export const _saveServerIcon = async (url: string, session: Session): Promise<string | null> => {
  try {
    const response = await session.fetch(url);
    if (!response.ok) return null;
    const filePath = generateFilePath(url);
    await pipeline(Readable.fromWeb(response.body as ReadableStream<Uint8Array>), fs.createWriteStream(filePath));
    return filePath;
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
};

export const _isOnline = async (url: string, session: Session): Promise<boolean> => {
  try {
    // FIXED: Wrapped in backticks (`)
    const response = await session.fetch(`${url}/api/v1/server_settings`, { method: "HEAD" });
    return response.ok;
  } catch { return false; }
};