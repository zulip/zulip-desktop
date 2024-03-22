import type {DndSettings} from "./dnd-util.js";
import type {MenuProperties, ServerConfig} from "./types.js";

export type MainMessage = {
  "clear-app-settings": () => void;
  "configure-spell-checker": () => void;
  "fetch-user-agent": () => string;
  "focus-app": () => void;
  "focus-this-webview": () => void;
  "new-clipboard-key": () => {key: Uint8Array; sig: Uint8Array};
  "permission-callback": (permissionCallbackId: number, grant: boolean) => void;
  "quit-app": () => void;
  "realm-icon-changed": (serverURL: string, iconURL: string) => void;
  "realm-name-changed": (serverURL: string, realmName: string) => void;
  "reload-full-app": () => void;
  "save-last-tab": (index: number) => void;
  "switch-server-tab": (index: number) => void;
  "toggle-app": () => void;
  "toggle-badge-option": (newValue: boolean) => void;
  "toggle-menubar": (showMenubar: boolean) => void;
  toggleAutoLauncher: (AutoLaunchValue: boolean) => void;
  "unread-count": (unreadCount: number) => void;
  "update-badge": (messageCount: number) => void;
  "update-menu": (properties: MenuProperties) => void;
  "update-taskbar-icon": (data: string, text: string) => void;
};

export type MainCall = {
  "get-server-settings": (domain: string) => ServerConfig;
  "is-online": (url: string) => boolean;
  "poll-clipboard": (key: Uint8Array, sig: Uint8Array) => string | undefined;
  "save-server-icon": (iconURL: string) => string | null;
};

export type RendererMessage = {
  back: () => void;
  "copy-zulip-url": () => void;
  destroytray: () => void;
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
  "set-active": () => void;
  "set-idle": () => void;
  "show-keyboard-shortcuts": () => void;
  "show-notification-settings": () => void;
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
  toggletray: () => void;
  tray: (argument: number) => void;
  "update-realm-icon": (serverURL: string, iconURL: string) => void;
  "update-realm-name": (serverURL: string, realmName: string) => void;
  "webview-reload": () => void;
  zoomActualSize: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};
