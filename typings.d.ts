declare module '@electron-elements/send-feedback' {
	class SendFeedback extends HTMLElement {
		customStyles: string;
		titleLabel: string;
		titlePlaceholder: string;
		textareaLabel: string;
		textareaPlaceholder: string;
		buttonLabel: string;
		loaderSuccessText: string;
		logs: string[];
		useReporter: (reporter: string, data: object) => void;
	}
	export = SendFeedback;
}

declare module 'node-mac-notifier';
