import {ipcRenderer} from "./typed-ipc-renderer.js";

// This helper is exposed via electron_bridge for use in the social
// login flow.
//
// It consists of a key and a promised token.  The in-app page sends
// the key to the server, and opens the user’s browser to a page where
// they can log in and get a token encrypted to that key.  When the
// user copies the encrypted token from their browser to the
// clipboard, we decrypt it and resolve the promise.  The in-app page
// then uses the decrypted token to log the user in within the app.
//
// The encryption is authenticated (AES-GCM) to guarantee that we
// don’t leak anything from the user’s clipboard other than the token
// intended for us.

export type ClipboardDecrypter = {
  version: number;
  key: Uint8Array;
  pasted: Promise<string>;
};

export class ClipboardDecrypterImplementation implements ClipboardDecrypter {
  version: number;
  key: Uint8Array;
  pasted: Promise<string>;

  constructor(_: number) {
    // At this time, the only version is 1.
    this.version = 1;
    const {key, sig} = ipcRenderer.sendSync("new-clipboard-key");
    this.key = key;
    this.pasted = new Promise((resolve) => {
      let interval: NodeJS.Timeout | null = null;
      const startPolling = () => {
        if (interval === null) {
          interval = setInterval(poll, 1000);
        }

        void poll();
      };

      const stopPolling = () => {
        if (interval !== null) {
          clearInterval(interval);
          interval = null;
        }
      };

      const poll = async () => {
        const plaintext = await ipcRenderer.invoke("poll-clipboard", key, sig);
        if (plaintext === undefined) return;

        window.removeEventListener("focus", startPolling);
        window.removeEventListener("blur", stopPolling);
        stopPolling();
        resolve(plaintext);
      };

      window.addEventListener("focus", startPolling);
      window.addEventListener("blur", stopPolling);
      if (document.hasFocus()) {
        startPolling();
      }
    });
  }
}
