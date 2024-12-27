import {
  type IpcRendererEvent,
  ipcRenderer as untypedIpcRenderer, // eslint-disable-line no-restricted-imports
} from "electron/renderer";

import type {
  MainCall,
  MainMessage,
  RendererMessage,
} from "../../common/typed-ipc.js";

type RendererListener<Channel extends keyof RendererMessage> =
  RendererMessage[Channel] extends (...arguments_: infer Arguments) => void
    ? (event: IpcRendererEvent, ...arguments_: Arguments) => void
    : never;

export const ipcRenderer: {
  on<Channel extends keyof RendererMessage>(
    channel: Channel,
    listener: RendererListener<Channel>,
  ): void;
  once<Channel extends keyof RendererMessage>(
    channel: Channel,
    listener: RendererListener<Channel>,
  ): void;
  off<Channel extends keyof RendererMessage>(
    channel: Channel,
    listener: RendererListener<Channel>,
  ): void;
  removeListener<Channel extends keyof RendererMessage>(
    channel: Channel,
    listener: RendererListener<Channel>,
  ): void;
  removeAllListeners(channel: keyof RendererMessage): void;
  send<Channel extends keyof RendererMessage>(
    channel: "forward-message",
    rendererChannel: Channel,
    ...arguments_: Parameters<RendererMessage[Channel]>
  ): void;
  send<Channel extends keyof RendererMessage>(
    channel: "forward-to",
    webContentsId: number,
    rendererChannel: Channel,
    ...arguments_: Parameters<RendererMessage[Channel]>
  ): void;
  send<Channel extends keyof MainMessage>(
    channel: Channel,
    ...arguments_: Parameters<MainMessage[Channel]>
  ): void;
  invoke<Channel extends keyof MainCall>(
    channel: Channel,
    ...arguments_: Parameters<MainCall[Channel]>
  ): Promise<ReturnType<MainCall[Channel]>>;
  sendSync<Channel extends keyof MainMessage>(
    channel: Channel,
    ...arguments_: Parameters<MainMessage[Channel]>
  ): ReturnType<MainMessage[Channel]>;
  postMessage<Channel extends keyof MainMessage>(
    channel: Channel,
    message: Parameters<MainMessage[Channel]> extends [infer Message]
      ? Message
      : never,
    transfer?: MessagePort[],
  ): void;
  sendToHost<Channel extends keyof RendererMessage>(
    channel: Channel,
    ...arguments_: Parameters<RendererMessage[Channel]>
  ): void;
} = untypedIpcRenderer;
