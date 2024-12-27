import {type Session, app} from "electron/main";
import fs from "node:fs";
import path from "node:path";
import {Readable} from "node:stream";
import {pipeline} from "node:stream/promises";
import type {ReadableStream} from "node:stream/web";

import * as Sentry from "@sentry/electron/main";
import {z} from "zod";

import Logger from "../common/logger-util.js";
import * as Messages from "../common/messages.js";
import type {ServerConfig} from "../common/types.js";

/* Request: domain-util */

const logger = new Logger({
  file: "domain-util.log",
});

const generateFilePath = (url: string): string => {
  const directory = `${app.getPath("userData")}/server-icons`;
  const extension = path.extname(url).split("?")[0];

  let hash = 5381;
  let {length} = url;

  while (length) {
    // eslint-disable-next-line no-bitwise, unicorn/prefer-code-point
    hash = (hash * 33) ^ url.charCodeAt(--length);
  }

  // Create 'server-icons' directory if not existed
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }

  // eslint-disable-next-line no-bitwise
  return `${directory}/${hash >>> 0}${extension}`;
};

export const _getServerSettings = async (
  domain: string,
  session: Session,
): Promise<ServerConfig> => {
  const response = await session.fetch(domain + "/api/v1/server_settings");
  if (!response.ok) {
    throw new Error(Messages.invalidZulipServerError(domain));
  }

  const data: unknown = await response.json();
  /* eslint-disable @typescript-eslint/naming-convention */
  const {
    realm_name,
    realm_uri,
    realm_icon,
    zulip_version,
    zulip_feature_level,
  } = z
    .object({
      realm_name: z.string(),
      realm_uri: z.string().url(),
      realm_icon: z.string(),
      zulip_version: z.string().default("unknown"),
      zulip_feature_level: z.number().default(0),
    })
    .parse(data);
  /* eslint-enable @typescript-eslint/naming-convention */

  return {
    // Some Zulip Servers use absolute URL for server icon whereas others use relative URL
    // Following check handles both the cases
    icon: realm_icon.startsWith("/") ? realm_uri + realm_icon : realm_icon,
    url: realm_uri,
    alias: realm_name,
    zulipVersion: zulip_version,
    zulipFeatureLevel: zulip_feature_level,
  };
};

export const _saveServerIcon = async (
  url: string,
  session: Session,
): Promise<string | null> => {
  try {
    const response = await session.fetch(url);
    if (!response.ok) {
      logger.log("Could not get server icon.");
      return null;
    }

    const filePath = generateFilePath(url);
    await pipeline(
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>),
      fs.createWriteStream(filePath),
    );
    return filePath;
  } catch (error: unknown) {
    logger.log("Could not get server icon.");
    logger.log(error);
    Sentry.captureException(error);
    return null;
  }
};

/* Request: reconnect-util */

export const _isOnline = async (
  url: string,
  session: Session,
): Promise<boolean> => {
  try {
    const response = await session.fetch(`${url}/api/v1/server_settings`, {
      method: "HEAD",
    });
    return response.ok;
  } catch (error: unknown) {
    logger.log(error);
    return false;
  }
};
