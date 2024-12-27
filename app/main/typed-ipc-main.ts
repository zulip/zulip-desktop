import {
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  type WebContents,
  ipcMain as untypedIpcMain, // eslint-disable-line no-restricted-imports
} from "electron/main";

import type {
  MainCall,
  MainMessage,
  RendererMessage,
} from "../common/typed-ipc.js";

type MainListener<Channel extends keyof MainMessage> =
  MainMessage[Channel] extends (...arguments_: infer Arguments) => infer Return
    ? (
        event: IpcMainEvent & {returnValue: Return},
        ...arguments_: Arguments
      ) => void
    : never;

type MainHandler<Channel extends keyof MainCall> = MainCall[Channel] extends (
  ...arguments_: infer Arguments
) => infer Return
  ? (
      event: IpcMainInvokeEvent,
      ...arguments_: Arguments
    ) => Return | Promise<Return>
  : never;

export const ipcMain: {
  on(
    channel: "forward-message",
    listener: <Channel extends keyof RendererMessage>(
      event: IpcMainEvent,
      channel: Channel,
      ...arguments_: Parameters<RendererMessage[Channel]>
    ) => void,
  ): void;
  on(
    channel: "forward-to",
    listener: <Channel extends keyof RendererMessage>(
      event: IpcMainEvent,
      webContentsId: number,
      channel: Channel,
      ...arguments_: Parameters<RendererMessage[Channel]>
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
  ...arguments_: Parameters<RendererMessage[Channel]>
): void {
  contents.send(channel, ...arguments_);
}

export function sendToFrame<Channel extends keyof RendererMessage>(
  contents: WebContents,
  frameId: number | [number, number],
  channel: Channel,
  ...arguments_: Parameters<RendererMessage[Channel]>
): void {
  contents.sendToFrame(frameId, channel, ...arguments_);
}
