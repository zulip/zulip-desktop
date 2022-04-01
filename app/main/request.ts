import type {ClientRequest, IncomingMessage, Session} from "electron/main";
import {app, net} from "electron/main";
import fs from "node:fs";
import path from "node:path";
import stream from "node:stream";
import util from "node:util";

import * as Sentry from "@sentry/electron";
import getStream from "get-stream";
import * as z from "zod";

import Logger from "../common/logger-util";
import * as Messages from "../common/messages";
import type {ServerConf} from "../common/types";

export async function fetchResponse(
  request: ClientRequest,
): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    request.on("response", resolve);
    request.on("abort", () => {
      reject(new Error("Request aborted"));
    });
    request.on("error", reject);
    request.end();
  });
}

const pipeline = util.promisify(stream.pipeline);

/* Request: domain-util */

const defaultIconUrl = "../renderer/img/icon.png";

const logger = new Logger({
  file: "domain-util.log",
});

const generateFilePath = (url: string): string => {
  const dir = `${app.getPath("userData")}/server-icons`;
  const extension = path.extname(url).split("?")[0];

  let hash = 5381;
  let {length} = url;

  while (length) {
    // eslint-disable-next-line no-bitwise, unicorn/prefer-code-point
    hash = (hash * 33) ^ url.charCodeAt(--length);
  }

  // Create 'server-icons' directory if not existed
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // eslint-disable-next-line no-bitwise
  return `${dir}/${hash >>> 0}${extension}`;
};

export const _getServerSettings = async (
  domain: string,
  session: Session,
): Promise<ServerConf> => {
  const response = await fetchResponse(
    net.request({
      url: domain + "/api/v1/server_settings",
      session,
    }),
  );
  if (response.statusCode !== 200) {
    throw new Error(Messages.invalidZulipServerError(domain));
  }

  const data: unknown = JSON.parse(await getStream(response));
  /* eslint-disable @typescript-eslint/naming-convention */
  const {realm_name, realm_uri, realm_icon} = z
    .object({
      realm_name: z.string(),
      realm_uri: z.string(),
      realm_icon: z.string(),
    })
    .parse(data);
  /* eslint-enable @typescript-eslint/naming-convention */

  return {
    // Some Zulip Servers use absolute URL for server icon whereas others use relative URL
    // Following check handles both the cases
    icon: realm_icon.startsWith("/") ? realm_uri + realm_icon : realm_icon,
    url: realm_uri,
    alias: realm_name,
  };
};

export const _saveServerIcon = async (
  url: string,
  session: Session,
): Promise<string> => {
  try {
    const response = await fetchResponse(net.request({url, session}));
    if (response.statusCode !== 200) {
      logger.log("Could not get server icon.");
      return defaultIconUrl;
    }

    const filePath = generateFilePath(url);
    await pipeline(response, fs.createWriteStream(filePath));
    return filePath;
  } catch (error: unknown) {
    logger.log("Could not get server icon.");
    logger.log(error);
    Sentry.captureException(error);
    return defaultIconUrl;
  }
};

/* Request: reconnect-util */

export const _isOnline = async (
  url: string,
  session: Session,
): Promise<boolean> => {
  try {
    const response = await fetchResponse(
      net.request({
        method: "HEAD",
        url: `${url}/api/v1/server_settings`,
        session,
      }),
    );
    const isValidResponse =
      response.statusCode >= 200 && response.statusCode < 400;
    return isValidResponse;
  } catch (error: unknown) {
    logger.log(error);
    return false;
  }
};
