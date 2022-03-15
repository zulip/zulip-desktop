import type {IpcRendererEvent} from "electron/renderer";
import {
  ipcRenderer as untypedIpcRenderer, // eslint-disable-line no-restricted-imports
} from "electron/renderer";

import type {
  MainCall,
  MainMessage,
  RendererMessage,
} from "../../common/typed-ipc";

type RendererListener<Channel extends keyof RendererMessage> =
  RendererMessage[Channel] extends (...args: infer Args) => void
    ? (event: IpcRendererEvent, ...args: Args) => void
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
    ...args: Parameters<RendererMessage[Channel]>
  ): void;
  send<Channel extends keyof MainMessage>(
    channel: Channel,
    ...args: Parameters<MainMessage[Channel]>
  ): void;
  invoke<Channel extends keyof MainCall>(
    channel: Channel,
    ...args: Parameters<MainCall[Channel]>
  ): Promise<ReturnType<MainCall[Channel]>>;
  sendSync<Channel extends keyof MainMessage>(
    channel: Channel,
    ...args: Parameters<MainMessage[Channel]>
  ): ReturnType<MainMessage[Channel]>;
  postMessage<Channel extends keyof MainMessage>(
    channel: Channel,
    message: Parameters<MainMessage[Channel]> extends [infer Message]
      ? Message
      : never,
    transfer?: MessagePort[],
  ): void;
  sendTo<Channel extends keyof RendererMessage>(
    webContentsId: number,
    channel: Channel,
    ...args: Parameters<RendererMessage[Channel]>
  ): void;
  sendToHost<Channel extends keyof RendererMessage>(
    channel: Channel,
    ...args: Parameters<RendererMessage[Channel]>
  ): void;
} = untypedIpcRenderer;
