import {ipcRenderer} from "../typed-ipc-renderer";

// This function will focus the server that sent
// the notification. Main function implemented in main.js
export function focusCurrentServer(): void {
  ipcRenderer.send("focus-this-webview");
}
