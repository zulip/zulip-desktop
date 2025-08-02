"use strict";

module.exports = {
  createOldCatalogs: false,
  defaultValue: (locale, namespace, key, value) =>
    locale === "en" ? key : value,
  indentation: "\t",
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
