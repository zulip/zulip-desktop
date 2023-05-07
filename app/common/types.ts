export type MenuProps = {
  tabs: TabData[];
  activeTabIndex?: number;
  enableMenu?: boolean;
};

export type NavItem =
  | "General"
  | "Network"
  | "AddServer"
  | "Organizations"
  | "Shortcuts";

export type ServerConf = {
  url: string;
  alias: string;
  icon: string;
  zulipVersion: string;
  zulipFeatureLevel: number;
};

export type TabRole = "server" | "function";

export type TabData = {
  role: TabRole;
  name: string;
  index: number;
};
