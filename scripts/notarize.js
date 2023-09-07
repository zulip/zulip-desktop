import * as path from "node:path";
import * as process from "node:process";
import { notarize, NotarizeOptions } from "@electron/notarize";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "/../.env") });

export default async function notarizeApp(context: NotarizeContext): Promise<void> {
  const { electronPlatformName, appOutDir, packager } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }

  const appName = packager.appInfo.productFilename;

  const notarizeOptions: NotarizeOptions = {
    appBundleId: "org.zulip.zulip-electron",
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID || "",
    appleIdPassword: process.env.APPLE_ID_PASS || "",
    ascProvider: process.env.ASC_PROVIDER || "", // Team short name
  };

  try {
    await notarize(notarizeOptions);
  } catch (error) {
    console.error("Error notarizing the app:", error);
  }
}

interface NotarizeContext {
  electronPlatformName: string;
  appOutDir: string;
  packager: {
    appInfo: {
      productFilename: string;
    };
  };
}
