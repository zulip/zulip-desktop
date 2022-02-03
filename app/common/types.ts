export interface MenuProps {
  tabs: TabData[];
  activeTabIndex?: number;
  enableMenu?: boolean;
}

export type NavItem =
  | "General"
  | "Network"
  | "AddServer"
  | "Organizations"
  | "Shortcuts";

export interface ServerConf {
  url: string;
  alias: string;
  icon: string;
}

export type TabRole = "server" | "function";

export interface TabData {
  role: TabRole;
  name: string;
  index: number;
}
