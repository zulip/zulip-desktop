declare module 'electron' {
	// https://github.com/electron/typescript-definitions/issues/170
	interface IncomingMessage extends NodeJS.ReadableStream {}
}

declare module '@electron-elements/send-feedback' {
	class SendFeedback extends HTMLElement {
		customStyles: string;
		customStylesheet: string;
		titleLabel: string;
		titlePlaceholder: string;
		textareaLabel: string;
		textareaPlaceholder: string;
		buttonLabel: string;
		loaderSuccessText: string;
		logs: string[];
		useReporter: (reporter: string, data: Record<string, unknown>) => void;
	}
	export = SendFeedback;
}

declare module 'electron-connect';

declare module 'node-mac-notifier';

declare module '@yaireo/tagify';

interface ClipboardDecrypter {
	version: number;
	key: Uint8Array;
	pasted: Promise<string>;
}

interface ElectronBridge {
	send_event: (eventName: string | symbol, ...args: unknown[]) => void;
	on_event: (eventName: string, listener: ListenerType) => void;
	new_notification: (
		title: string,
		options: NotificationOptions | undefined,
		dispatch: (type: string, eventInit: EventInit) => boolean
	) => NotificationData;
	get_idle_on_system: () => boolean;
	get_last_active_on_system: () => number;
	get_send_notification_reply_message_supported: () => boolean;
	set_send_notification_reply_message_supported: (value: boolean) => void;
	decrypt_clipboard: (version: number) => ClipboardDecrypter;
}
