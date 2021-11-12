import type {DNDSettings} from "./dnd-util";
import type {MenuProps, NavItem, ServerConf} from "./types";

export interface MainMessage {
  "clear-app-settings": () => void;
  downloadFile: (url: string, downloadPath: string) => void;
  "error-reporting": () => void;
  "fetch-user-agent": () => string;
  "focus-app": () => void;
  "permission-callback": (permissionCallbackId: number, grant: boolean) => void;
  "quit-app": () => void;
  "realm-icon-changed": (serverURL: string, iconURL: string) => void;
  "realm-name-changed": (serverURL: string, realmName: string) => void;
  "reload-full-app": () => void;
  "save-last-tab": (index: number) => void;
  "set-spellcheck-langs": () => void;
  "switch-server-tab": (index: number) => void;
  "toggle-app": () => void;
  "toggle-badge-option": (newValue: boolean) => void;
  "toggle-menubar": (showMenubar: boolean) => void;
  toggleAutoLauncher: (AutoLaunchValue: boolean) => void;
  "unread-count": (unreadCount: number) => void;
  "update-badge": (messageCount: number) => void;
  "update-menu": (props: MenuProps) => void;
  "update-taskbar-icon": (data: string, text: string) => void;
}

export interface MainCall {
  "get-server-settings": (domain: string) => ServerConf;
  "is-online": (url: string) => boolean;
  "save-server-icon": (iconURL: string) => string;
}

export interface RendererMessage {
  back: () => void;
  "copy-zulip-url": () => void;
  destroytray: () => void;
  downloadFileCompleted: (filePath: string, fileName: string) => void;
  downloadFileFailed: (state: string) => void;
  "enter-fullscreen": () => void;
  "error-reporting-val": (errorReporting: boolean) => void;
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
  "reload-current-viewer": () => void;
  "reload-proxy": (showAlert: boolean) => void;
  "reload-viewer": () => void;
  "render-taskbar-icon": (messageCount: number) => void;
  "set-active": () => void;
  "set-idle": () => void;
  "show-keyboard-shortcuts": () => void;
  "show-network-error": (index: number) => void;
  "show-notification-settings": () => void;
  "switch-server-tab": (index: number) => void;
  "switch-settings-nav": (navItem: NavItem) => void;
  "tab-devtools": () => void;
  "toggle-autohide-menubar": (
    autoHideMenubar: boolean,
    updateMenu: boolean,
  ) => void;
  "toggle-dnd": (state: boolean, newSettings: Partial<DNDSettings>) => void;
  "toggle-menubar-setting": (state: boolean) => void;
  "toggle-sidebar": (show: boolean) => void;
  "toggle-sidebar-setting": (state: boolean) => void;
  "toggle-silent": (state: boolean) => void;
  "toggle-tray": (state: boolean) => void;
  toggletray: () => void;
  tray: (arg: number) => void;
  "update-realm-icon": (serverURL: string, iconURL: string) => void;
  "update-realm-name": (serveRURL: string, realmName: string) => void;
  "webview-reload": () => void;
  "exit-settings": () => void;
  zoomActualSize: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}
