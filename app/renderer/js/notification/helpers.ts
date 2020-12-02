import {remote} from 'electron';

// Do not change this
export const appId = 'org.zulip.zulip-electron';

const currentWindow = remote.getCurrentWindow();
const webContents = remote.getCurrentWebContents();
const webContentsId = webContents.id;

// This function will focus the server that sent
// the notification. Main function implemented in main.js
export function focusCurrentServer(): void {
	currentWindow.webContents.send('focus-webview-with-id', webContentsId);
}
