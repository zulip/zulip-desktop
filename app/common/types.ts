import {z} from "zod";

// https://github.com/colinhacks/zod/discussions/5983
export const exactPartial = <Shape extends z.ZodRawShape>(
  schema: z.ZodObject<Shape>,
) =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  z.util.partial(z.ZodExactOptional, schema, undefined) as z.ZodObject<{
    -readonly [K in keyof Shape]: z.ZodExactOptional<Shape[K]>;
  }>;

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
  url: string;
  alias: string;
  icon: string;
  zulipVersion: string;
  zulipFeatureLevel: number;
};

export type TabRole = "server" | "function";
export type TabPage = "Settings" | "About";

export type TabData = {
  role: TabRole;
  page?: TabPage | undefined;
  label: string;
  index: number;
};
