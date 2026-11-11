import type {Config} from "./config-util.ts";
import type {DndSettings} from "./dnd-util.ts";
import type {MenuProperties, ServerConfig} from "./types.ts";

export type DownloadEntry = Config["recentDownloads"][number] & {
  progress?: number | null;
  highlighted?: boolean;
};

export type MainMessage = {
  "clear-app-settings": () => void;
  "configure-spell-checker": () => void;
  "copy-text": (text: string) => void;
  "fetch-user-agent": () => string;
  "focus-this-webview": () => void;
  "new-clipboard-key": () => {key: Uint8Array; sig: Uint8Array};
  "permission-callback": (permissionCallbackId: number, grant: boolean) => void;
  "realm-icon-changed": (serverURL: string, iconURL: string) => void;
  "realm-name-changed": (serverURL: string, realmName: string) => void;
  "reload-full-app": () => void;
  "save-last-tab": (index: number) => void;
  "switch-server-tab": (index: number) => void;
  "toggle-badge-option": (newValue: boolean) => void;
  "toggle-menubar": (showMenubar: boolean) => void;
  "toggle-tray": (showTray: boolean) => void;
  toggleAutoLauncher: (AutoLaunchValue: boolean) => void;
  "unread-count": (unreadCount: number) => void;
  "update-badge": (messageCount: number) => void;
  "update-menu": (properties: MenuProperties) => void;
  "update-taskbar-icon": (data: string, text: string) => void;
  "update-tray-icon": (unreadCount: number, data: string) => void;
};

export type MainCall = {
  "clear-recent-downloads": () => void;
  "delete-download": (filePath: string) => void;
  "get-recent-downloads": () => DownloadEntry[];
  "get-server-settings": (domain: string) => ServerConfig;
  "is-online": (url: string) => boolean;
  "open-download": (filePath: string) => string;
  "poll-clipboard": (key: Uint8Array, sig: Uint8Array) => string | undefined;
  "reveal-download": (filePath: string) => void;
  "save-server-icon": (iconURL: string) => string | null;
};

export type RendererMessage = {
  back: () => void;
  "copy-zulip-url": () => void;
  "downloads-updated": (downloads: DownloadEntry[], show: boolean) => void;
  "enter-fullscreen": () => void;
  focus: () => void;
  "focus-webview-with-id": (webviewId: number) => void;
  forward: () => void;
  "hard-reload": () => void;
  "leave-fullscreen": () => void;
  "log-out": () => void;
  logout: () => void;
  "new-server": () => void;
  "open-about": () => void;
  "open-help": () => void;
  "open-network-settings": () => void;
  "open-org-tab": () => void;
  "open-settings": () => void;
  "permission-request": (
    options: {webContentsId: number | null; origin: string; permission: string},
    rendererCallbackId: number,
  ) => void;
  "play-ding-sound": () => void;
  "reload-current-viewer": () => void;
  "reload-proxy": (showAlert: boolean) => void;
  "reload-viewer": () => void;
  "render-taskbar-icon": (messageCount: number) => void;
  "render-tray-icon": (unreadCount: number) => void;
  "set-active": () => void;
  "set-idle": () => void;
  "show-keyboard-shortcuts": () => void;
  "show-notification-settings": () => void;
  "show-recent-downloads": () => void;
  "switch-server-tab": (index: number) => void;
  "tab-devtools": () => void;
  "toggle-autohide-menubar": (
    autoHideMenubar: boolean,
    updateMenu: boolean,
  ) => void;
  "toggle-dnd": (state: boolean, newSettings: Partial<DndSettings>) => void;
  "toggle-sidebar": (show: boolean) => void;
  "toggle-silent": (state: boolean) => void;
  "toggle-tray": (state: boolean) => void;
  "update-realm-icon": (serverURL: string, iconURL: string) => void;
  "update-realm-name": (serverURL: string, realmName: string) => void;
  "webview-reload": () => void;
  zoomActualSize: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};
