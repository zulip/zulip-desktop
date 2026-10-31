import type {DataCollection} from "@sentry/core";

// Sentry v11 collects more data by default when dataCollection is unset;
// preserve the v10 defaults.
// https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md#senddefaultpii-is-replaced-by-datacollection
const denySensitive = {deny: ["forwarded", "-ip", "remote-", "via", "-user"]};

/* eslint-disable @typescript-eslint/naming-convention -- not our names */
export const dataCollection: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {request: denySensitive, response: denySensitive},
  httpBodies: [],
  urlQueryParams: denySensitive,
  genAI: {inputs: false, outputs: false},
  databaseQueryData: false,
  queues: false,
  graphQL: {document: false, variables: false},
};
/* eslint-enable @typescript-eslint/naming-convention */
