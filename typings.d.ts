declare module "zulip:remote" {
  export const {
    app,
    dialog,
  }: typeof import("electron/main") | typeof import("@electron/remote");
}
