"use strict";

module.exports = {
  input: ["app/**/*.ts"],
  options: {
    debug: true,
    removeUnusedKeys: true,
    sort: true,
    func: {list: ["t.__"], extensions: [".ts"]},
    defaultLng: "en",
    defaultValue: (lng, ns, key) => (lng === "en" ? key : ""),
    resource: {
      loadPath: "public/translations/{{lng}}.json",
      savePath: "public/translations/{{lng}}.json",
      jsonIndent: "\t",
    },
    keySeparator: false,
    nsSeparator: false,
    context: false,
  },
};
