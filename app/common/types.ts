export type MenuProperties = {
  tabs: TabData[];
  activeTabIndex?: number;
  enableMenu?: boolean;
};

export type NavigationItem =
  | "General"
  | "Network"
  | "AddServer"
  | "Organizations"
  | "Shortcuts";

export type ServerConfig = {
  id: string;
  url: string;
  alias: string;
  icon: string;
  zulipVersion: string;
  zulipFeatureLevel: number;
};

export type ServerSettings = Omit<ServerConfig, "id">;

export type TabRole = "server" | "function";
export type TabPage = "Settings" | "About";

export type TabData = {
  role: TabRole;
  page?: TabPage;
  label: string;
  index: number;
  id: string;
  serverId?: string;
};
