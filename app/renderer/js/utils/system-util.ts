import {ipcRenderer} from "../typed-ipc-renderer.js";

export const connectivityError: string[] = [
  "ERR_INTERNET_DISCONNECTED",
  "ERR_PROXY_CONNECTION_FAILED",
  "ERR_CONNECTION_RESET",
  "ERR_NOT_CONNECTED",
  "ERR_NAME_NOT_RESOLVED",
  "ERR_NETWORK_CHANGED",
];

const userAgent = ipcRenderer.sendSync("fetch-user-agent");

export function getUserAgent(): string {
  return userAgent;
}
