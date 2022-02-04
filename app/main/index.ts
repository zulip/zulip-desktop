import electron, {app, dialog, session} from "electron";
import fs from "fs";
import path from "path";

import windowStateKeeper from "electron-window-state";

import * as ConfigUtil from "../common/config-util";
import {sentryInit} from "../common/sentry-util";
import type {RendererMessage} from "../common/typed-ipc";
import type {MenuProps} from "../common/types";

import {appUpdater} from "./autoupdater";
import * as BadgeSettings from "./badge-settings";
import * as AppMenu from "./menu";
import {_getServerSettings, _isOnline, _saveServerIcon} from "./request";
import {setAutoLaunch} from "./startup";
import {ipcMain, send} from "./typed-ipc-main";

const {GDK_BACKEND} = process.env;

let mainWindowState: windowStateKeeper.State;

// Prevent window being garbage collected
let mainWindow: Electron.BrowserWindow;
let badgeCount: number;

let isQuitting = false;

// Load this url in main window
const mainURL = "file://" + path.join(__dirname, "../renderer", "main.html");

const permissionCallbacks = new Map<number, (grant: boolean) => void>();
let nextPermissionCallbackId = 0;

const APP_ICON = path.join(__dirname, "../resources", "Icon");

const iconPath = (): string =>
  APP_ICON + (process.platform === "win32" ? ".ico" : ".png");

// Toggle the app window
const toggleApp = (): void => {
  if (!mainWindow.isVisible() || mainWindow.isMinimized()) {
    mainWindow.show();
  } else {
    mainWindow.hide();
  }
};

function createMainWindow(): Electron.BrowserWindow {
  // Load the previous state with fallback to defaults
  mainWindowState = windowStateKeeper({
    defaultWidth: 1100,
    defaultHeight: 720,
    path: `${app.getPath("userData")}/config`,
  });

  const win = new electron.BrowserWindow({
    // This settings needs to be saved in config
    title: "Zulip",
    icon: iconPath(),
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 500,
    minHeight: 400,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true,
      partition: "persist:webviewsession",
      webviewTag: true,
      worldSafeExecuteJavaScript: true,
    },
    show: false,
  });

  win.on("focus", () => {
    send(win.webContents, "focus");
  });

  (async () => win.loadURL(mainURL))();

  // Keep the app running in background on close event
  win.on("close", (event) => {
    if (ConfigUtil.getConfigItem("quitOnClose", false)) {
      app.quit();
    }

    if (!isQuitting) {
      event.preventDefault();

      if (process.platform === "darwin") {
        app.hide();
      } else {
        win.hide();
      }
    }
  });

  win.setTitle("Zulip");

  win.on("enter-full-screen", () => {
    send(win.webContents, "enter-fullscreen");
  });

  win.on("leave-full-screen", () => {
    send(win.webContents, "leave-fullscreen");
  });

  //  To destroy tray icon when navigate to a new URL
  win.webContents.on("will-navigate", (event) => {
    if (event) {
      send(win.webContents, "destroytray");
    }
  });

  // Let us register listeners on the window, so we can update the state
  // automatically (the listeners will be removed when the window is closed)
  // and restore the maximized or full screen state
  mainWindowState.manage(win);

  return win;
}

(async () => {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  await app.whenReady();

  if (process.env.GDK_BACKEND !== GDK_BACKEND) {
    console.warn(
      "Reverting GDK_BACKEND to work around https://github.com/electron/electron/issues/28436",
    );
    if (GDK_BACKEND === undefined) {
      delete process.env.GDK_BACKEND;
    } else {
      process.env.GDK_BACKEND = GDK_BACKEND;
    }
  }

  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      mainWindow.show();
    }
  });

  ipcMain.on(
    "permission-callback",
    (event: Event, permissionCallbackId: number, grant: boolean) => {
      permissionCallbacks.get(permissionCallbackId)?.(grant);
      permissionCallbacks.delete(permissionCallbackId);
    },
  );

  // This event is only available on macOS. Triggers when you click on the dock icon.
  app.on("activate", () => {
    mainWindow.show();
  });

  const ses = session.fromPartition("persist:webviewsession");
  ses.setUserAgent(`ZulipElectron/${app.getVersion()} ${ses.getUserAgent()}`);

  ipcMain.on("set-spellcheck-langs", () => {
    ses.setSpellCheckerLanguages(
      process.platform === "darwin"
        ? // Work around https://github.com/electron/electron/issues/30215.
          mainWindow.webContents.session.getSpellCheckerLanguages()
        : ConfigUtil.getConfigItem("spellcheckerLanguages", null) ?? [],
    );
  });

  AppMenu.setMenu({
    tabs: [],
  });
  mainWindow = createMainWindow();

  // Auto-hide menu bar on Windows + Linux
  if (process.platform !== "darwin") {
    const shouldHideMenu = ConfigUtil.getConfigItem("autoHideMenubar", false);
    mainWindow.autoHideMenuBar = shouldHideMenu;
    mainWindow.setMenuBarVisibility(!shouldHideMenu);
  }

  // Initialize sentry for main process
  const errorReporting = ConfigUtil.getConfigItem("errorReporting", true);
  if (errorReporting) {
    sentryInit();
  }

  const page = mainWindow.webContents;

  page.on("dom-ready", () => {
    if (ConfigUtil.getConfigItem("startMinimized", false)) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  ipcMain.on("fetch-user-agent", (event) => {
    event.returnValue = session
      .fromPartition("persist:webviewsession")
      .getUserAgent();
  });

  ipcMain.handle("get-server-settings", async (event, domain: string) =>
    _getServerSettings(domain, ses),
  );

  ipcMain.handle("save-server-icon", async (event, url: string) =>
    _saveServerIcon(url, ses),
  );

  ipcMain.handle("is-online", async (event, url: string) =>
    _isOnline(url, ses),
  );

  page.once("did-frame-finish-load", async () => {
    // Initiate auto-updates on MacOS and Windows
    if (ConfigUtil.getConfigItem("autoUpdate", true)) {
      await appUpdater();
    }
  });

  app.on(
    "certificate-error",
    (
      event: Event,
      webContents: Electron.WebContents,
      urlString: string,
      error: string,
    ) => {
      const url = new URL(urlString);
      dialog.showErrorBox(
        "Certificate error",
        `The server presented an invalid certificate for ${url.origin}:

${error}`,
      );
    },
  );

  page.session.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      const {origin} = new URL(details.requestingUrl);
      const permissionCallbackId = nextPermissionCallbackId++;
      permissionCallbacks.set(permissionCallbackId, callback);
      send(
        page,
        "permission-request",
        {
          webContentsId:
            webContents.id === mainWindow.webContents.id
              ? null
              : webContents.id,
          origin,
          permission,
        },
        permissionCallbackId,
      );
    },
  );

  // Temporarily remove this event
  // electron.powerMonitor.on('resume', () => {
  // 	mainWindow.reload();
  // 	send(page, 'destroytray');
  // });

  ipcMain.on("focus-app", () => {
    mainWindow.show();
  });

  ipcMain.on("quit-app", () => {
    app.quit();
  });

  // Reload full app not just webview, useful in debugging
  ipcMain.on("reload-full-app", () => {
    mainWindow.reload();
    send(page, "destroytray");
  });

  ipcMain.on("clear-app-settings", () => {
    mainWindowState.unmanage();
    app.relaunch();
    app.exit();
  });

  ipcMain.on("toggle-app", () => {
    toggleApp();
  });

  ipcMain.on("toggle-badge-option", () => {
    BadgeSettings.updateBadge(badgeCount, mainWindow);
  });

  ipcMain.on(
    "toggle-menubar",
    (_event: Electron.IpcMainEvent, showMenubar: boolean) => {
      mainWindow.autoHideMenuBar = showMenubar;
      mainWindow.setMenuBarVisibility(!showMenubar);
      send(page, "toggle-autohide-menubar", showMenubar, true);
    },
  );

  ipcMain.on(
    "update-badge",
    (_event: Electron.IpcMainEvent, messageCount: number) => {
      badgeCount = messageCount;
      BadgeSettings.updateBadge(badgeCount, mainWindow);
      send(page, "tray", messageCount);
    },
  );

  ipcMain.on(
    "update-taskbar-icon",
    (_event: Electron.IpcMainEvent, data: string, text: string) => {
      BadgeSettings.updateTaskbarIcon(data, text, mainWindow);
    },
  );

  ipcMain.on(
    "forward-message",
    <Channel extends keyof RendererMessage>(
      _event: Electron.IpcMainEvent,
      listener: Channel,
      ...parameters: Parameters<RendererMessage[Channel]>
    ) => {
      send(page, listener, ...parameters);
    },
  );

  ipcMain.on(
    "update-menu",
    (_event: Electron.IpcMainEvent, props: MenuProps) => {
      AppMenu.setMenu(props);
      if (props.activeTabIndex !== undefined) {
        const activeTab = props.tabs[props.activeTabIndex];
        mainWindow.setTitle(`Zulip - ${activeTab.webviewName}`);
      }
    },
  );

  ipcMain.on(
    "toggleAutoLauncher",
    async (_event: Electron.IpcMainEvent, AutoLaunchValue: boolean) => {
      await setAutoLaunch(AutoLaunchValue);
    },
  );

  ipcMain.on(
    "downloadFile",
    (_event: Electron.IpcMainEvent, url: string, downloadPath: string) => {
      page.downloadURL(url);
      page.session.once("will-download", async (_event: Event, item) => {
        if (ConfigUtil.getConfigItem("promptDownload", false)) {
          const showDialogOptions: electron.SaveDialogOptions = {
            defaultPath: path.join(downloadPath, item.getFilename()),
          };
          item.setSaveDialogOptions(showDialogOptions);
        } else {
          const getTimeStamp = (): number => {
            const date = new Date();
            return date.getTime();
          };

          const formatFile = (filePath: string): string => {
            const fileExtension = path.extname(filePath);
            const baseName = path.basename(filePath, fileExtension);
            return `${baseName}-${getTimeStamp()}${fileExtension}`;
          };

          const filePath = path.join(downloadPath, item.getFilename());

          // Update the name and path of the file if it already exists
          const updatedFilePath = path.join(downloadPath, formatFile(filePath));
          const setFilePath: string = fs.existsSync(filePath)
            ? updatedFilePath
            : filePath;
          item.setSavePath(setFilePath);
        }

        const updatedListener = (_event: Event, state: string): void => {
          switch (state) {
            case "interrupted": {
              // Can interrupted to due to network error, cancel download then
              console.log(
                "Download interrupted, cancelling and fallback to dialog download.",
              );
              item.cancel();
              break;
            }

            case "progressing": {
              if (item.isPaused()) {
                item.cancel();
              }

              // This event can also be used to show progress in percentage in future.
              break;
            }

            default: {
              console.info("Unknown updated state of download item");
            }
          }
        };

        item.on("updated", updatedListener);
        item.once("done", (_event: Event, state) => {
          if (state === "completed") {
            send(
              page,
              "downloadFileCompleted",
              item.getSavePath(),
              path.basename(item.getSavePath()),
            );
          } else {
            console.log("Download failed state:", state);
            send(page, "downloadFileFailed", state);
          }

          // To stop item for listening to updated events of this file
          item.removeListener("updated", updatedListener);
        });
      });
    },
  );

  ipcMain.on(
    "realm-name-changed",
    (_event: Electron.IpcMainEvent, serverURL: string, realmName: string) => {
      send(page, "update-realm-name", serverURL, realmName);
    },
  );

  ipcMain.on(
    "realm-icon-changed",
    (_event: Electron.IpcMainEvent, serverURL: string, iconURL: string) => {
      send(page, "update-realm-icon", serverURL, iconURL);
    },
  );

  // Using event.sender.send instead of page.send here to
  // make sure the value of errorReporting is sent only once on load.
  ipcMain.on("error-reporting", (event: Electron.IpcMainEvent) => {
    send(event.sender, "error-reporting-val", errorReporting);
  });

  ipcMain.on(
    "save-last-tab",
    (_event: Electron.IpcMainEvent, index: number) => {
      ConfigUtil.setConfigItem("lastActiveTab", index);
    },
  );

  ipcMain.on("focus-this-webview", (event: Electron.IpcMainEvent) => {
    send(page, "focus-webview-with-id", event.sender.id);
  });

  // Update user idle status for each realm after every 15s
  const idleCheckInterval = 15 * 1000; // 15 seconds
  setInterval(() => {
    // Set user idle if no activity in 1 second (idleThresholdSeconds)
    const idleThresholdSeconds = 1; // 1 second
    const idleState =
      electron.powerMonitor.getSystemIdleState(idleThresholdSeconds);
    if (idleState === "active") {
      send(page, "set-active");
    } else {
      send(page, "set-idle");
    }
  }, idleCheckInterval);
})();

app.on("before-quit", () => {
  isQuitting = true;
});

// Send crash reports
process.on("uncaughtException", (error) => {
  console.error(error);
  console.error(error.stack);
});
