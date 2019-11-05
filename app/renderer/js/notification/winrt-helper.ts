import {
	customReply, focusCurrentServer, parseReply, setupReply
} from './helpers';

declare const window: ZulipWebWindow;

export function notificationHandler(response: string, tag: string): void {
	response = parseReply(response);
	focusCurrentServer();
	if (window.electron_bridge.send_notification_reply_message_supported) {
		window.electron_bridge.send_event('send_notification_reply_message', tag, response);
		return;
	}
	setupReply(tag);
	customReply(response);
}