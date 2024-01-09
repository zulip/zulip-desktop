import type {
  IpcMainEvent,
  IpcMainInvokeEvent,
  WebContents,
} from "electron/main";
import {
  ipcMain as untypedIpcMain, // eslint-disable-line no-restricted-imports
} from "electron/main";

import type {
  MainCall,
  MainMessage,
  RendererMessage,
} from "../common/typed-ipc.js";

type MainListener<Channel extends keyof MainMessage> =
  MainMessage[Channel] extends (...args: infer Args) => infer Return
    ? (event: IpcMainEvent & {returnValue: Return}, ...args: Args) => void
    : never;

type MainHandler<Channel extends keyof MainCall> = MainCall[Channel] extends (
  ...args: infer Args
) => infer Return
  ? (event: IpcMainInvokeEvent, ...args: Args) => Return | Promise<Return>
  : never;

export const ipcMain: {
  on(
    channel: "forward-message",
    listener: <Channel extends keyof RendererMessage>(
      event: IpcMainEvent,
      channel: Channel,
      ...args: Parameters<RendererMessage[Channel]>
    ) => void,
  ): void;
  on(
    channel: "forward-to",
    listener: <Channel extends keyof RendererMessage>(
      event: IpcMainEvent,
      webContentsId: number,
      channel: Channel,
      ...args: Parameters<RendererMessage[Channel]>
    ) => void,
  ): void;
  on<Channel extends keyof MainMessage>(
    channel: Channel,
    listener: MainListener<Channel>,
  ): void;
  once<Channel extends keyof MainMessage>(
    channel: Channel,
    listener: MainListener<Channel>,
  ): void;
  removeListener<Channel extends keyof MainMessage>(
    channel: Channel,
    listener: MainListener<Channel>,
  ): void;
  removeAllListeners(channel?: keyof MainMessage): void;
  handle<Channel extends keyof MainCall>(
    channel: Channel,
    handler: MainHandler<Channel>,
  ): void;
  handleOnce<Channel extends keyof MainCall>(
    channel: Channel,
    handler: MainHandler<Channel>,
  ): void;
  removeHandler(channel: keyof MainCall): void;
} = untypedIpcMain;

export function send<Channel extends keyof RendererMessage>(
  contents: WebContents,
  channel: Channel,
  ...args: Parameters<RendererMessage[Channel]>
): void {
  contents.send(channel, ...args);
}

export function sendToFrame<Channel extends keyof RendererMessage>(
  contents: WebContents,
  frameId: number | [number, number],
  channel: Channel,
  ...args: Parameters<RendererMessage[Channel]>
): void {
  contents.sendToFrame(frameId, channel, ...args);
}
