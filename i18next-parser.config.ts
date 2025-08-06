import type {UserConfig} from "i18next-parser";

const config: UserConfig = {
  createOldCatalogs: false,
  defaultValue: (locale, namespace, key, value) =>
    locale === "en" ? key! : value!,
  indentation: "\t" as unknown as number,
  input: ["app/**/*.ts"],
  keySeparator: false,
  lexers: {
    ts: [{lexer: "JavascriptLexer", functions: ["t.__"]}],
  },
  locales: ["en"],
  namespaceSeparator: false,
  output: "public/translations/$LOCALE.json",
  sort: (a, b) => (a < b ? -1 : a > b ? 1 : 0),
};
export default config;
