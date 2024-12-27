import {app} from "electron/main";

import * as Sentry from "@sentry/electron/main";

import {getConfigItem} from "../common/config-util.js";

export const sentryInit = (): void => {
  Sentry.init({
    dsn: "https://628dc2f2864243a08ead72e63f94c7b1@o48127.ingest.sentry.io/204668",

    // Don't report errors in development or if disabled by the user.
    beforeSend: (event) =>
      app.isPackaged && getConfigItem("errorReporting", true) ? event : null,

    // We should ignore this error since it's harmless and we know the reason behind this
    // This error mainly comes from the console logs.
    // This is a temp solution until Sentry supports disabling the console logs
    ignoreErrors: ["does not appear to be a valid Zulip server"],

    /// sendTimeout: 30 // wait 30 seconds before considering the sending capture to have failed, default is 1 second
  });
};
