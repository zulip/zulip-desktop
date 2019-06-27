import { remote } from 'electron';

import Logger = require('../utils/logger-util');

const logger = new Logger({
	file: 'errors.log',
	timestamp: true
});

// Do not change this
export const appId = 'org.zulip.zulip-electron';

export type BotListItem = [string, string];
const botsList: BotListItem[] = [];
let botsListLoaded = false;

// this function load list of bots from the server
// sync=True for a synchronous getJSON request
// in case botsList isn't already completely loaded when required in parseRely
export function loadBots(sync = false): void {
	const { $ } = window;
	botsList.length = 0;
	if (sync) {
		$.ajaxSetup({async: false});
	}
	$.getJSON('/json/users')
		.done((data: any) => {
			const { members } = data;
			members.forEach((membersRow: any) => {
				if (membersRow.is_bot) {
					const bot = `@${membersRow.full_name}`;
					const mention = `@**${bot.replace(/^@/, '')}**`;
					botsList.push([bot, mention]);
				}
			});
			botsListLoaded = true;
		})
		.fail((error: any) => {
			logger.log('Load bots request failed: ', error.responseText);
			logger.log('Load bots request status: ', error.statusText);
		});
	if (sync) {
		$.ajaxSetup({async: true});
	}
}

export function checkElements(...elements: any[]): boolean {
	let status = true;
	elements.forEach(element => {
		if (element === null || element === undefined) {
			status = false;
		}
	});
	return status;
}

export function customReply(reply: string): void {
	// server does not support notification reply yet.
	const buttonSelector = '.messagebox #send_controls button[type=submit]';
	const messageboxSelector = '.selected_message .messagebox .messagebox-border .messagebox-content';
	const textarea: HTMLInputElement = document.querySelector('#compose-textarea');
	const messagebox: HTMLButtonElement = document.querySelector(messageboxSelector);
	const sendButton: HTMLButtonElement = document.querySelector(buttonSelector);

	// sanity check for old server versions
	const elementsExists = checkElements(textarea, messagebox, sendButton);
	if (!elementsExists) {
		return;
	}

	textarea.value = reply;
	messagebox.click();
	sendButton.click();
}

const currentWindow = remote.getCurrentWindow();
const webContents = remote.getCurrentWebContents();
const webContentsId = webContents.id;

// this function will focus the server that sent
// the notification. Main function implemented in main.js
export function focusCurrentServer(): void {
	// TODO: TypeScript: currentWindow of type BrowserWindow doesn't
	// have a .send() property per typescript.
	(currentWindow as any).send('focus-webview-with-id', webContentsId);
}
// this function parses the reply from to notification
// making it easier to reply from notification eg
// @username in reply will be converted to @**username**
// #stream in reply will be converted to #**stream**
// bot mentions are not yet supported
export function parseReply(reply: string): string {
	const usersDiv = document.querySelectorAll('#user_presences li');
	const streamHolder = document.querySelectorAll('#stream_filters li');

	type UsersItem = BotListItem;
	type StreamsItem = BotListItem;
	const users: UsersItem[] = [];
	const streams: StreamsItem[] = [];

	usersDiv.forEach(userRow => {
		const anchor = userRow.querySelector('span a');
		if (anchor !== null) {
			const user = `@${anchor.textContent.trim()}`;
			const mention = `@**${user.replace(/^@/, '')}**`;
			users.push([user, mention]);
		}
	});

	streamHolder.forEach(stream => {
		const streamAnchor = stream.querySelector('div a');
		if (streamAnchor !== null) {
			const streamName = `#${streamAnchor.textContent.trim()}`;
			const streamMention = `#**${streamName.replace(/^#/, '')}**`;
			streams.push([streamName, streamMention]);
		}
	});

	users.forEach(([user, mention]) => {
		if (reply.includes(user)) {
			const regex = new RegExp(user, 'g');
			reply = reply.replace(regex, mention);
		}
	});

	streams.forEach(([stream, streamMention]) => {
		const regex = new RegExp(stream, 'g');
		reply = reply.replace(regex, streamMention);
	});

	// If botsList isn't completely loaded yet, make a synchronous getJSON request for list
	if (botsListLoaded === false) {
		loadBots(true);
	}

	// Iterate for every bot name and replace in reply
	// @botname with @**botname**
	botsList.forEach(([bot, mention]) => {
		if (reply.includes(bot)) {
			const regex = new RegExp(bot, 'g');
			reply = reply.replace(regex, mention);
		}
	});

	reply = reply.replace(/\\n/, '\n');
	return reply;
}

export function setupReply(id: string): void {
	const { narrow } = window;
	const narrowByTopic = narrow.by_topic || narrow.by_subject;
	narrowByTopic(id, { trigger: 'notification' });
}
