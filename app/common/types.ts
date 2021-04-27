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

export interface TabData {
  role: string;
  name: string;
  index: number;
  webviewName: string;
}
