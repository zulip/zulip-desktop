/* eslint-disable @typescript-eslint/naming-convention */

import {defineConfig} from "i18next-cli";

export default defineConfig({
  locales: ["en"],
  extract: {
    input: ["app/**/*.ts"],
    output: "public/translations/{{language}}.json",
    functions: ["t.__", "t.__mf"],
    defaultNS: false,
    keySeparator: false,
    nsSeparator: false,
    sort: (a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
    indentation: "\t",
  },
});
