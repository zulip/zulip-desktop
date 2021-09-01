declare namespace Electron {
  // https://github.com/electron/typescript-definitions/issues/170
  interface IncomingMessage extends NodeJS.ReadableStream {}
}
