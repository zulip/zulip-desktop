declare namespace Electron {
  // https://github.com/electron/typescript-definitions/issues/170
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface IncomingMessage extends NodeJS.ReadableStream {}
}
