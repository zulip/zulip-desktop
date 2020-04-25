import type { Subject } from 'rxjs';
import { SpellCheckHandler, ContextMenuListener, ContextMenuBuilder } from 'electron-spellchecker';

import * as ConfigUtil from './utils/config-util';
import Logger from './utils/logger-util';

declare module 'electron-spellchecker' {
	interface SpellCheckHandler {
		currentSpellcheckerChanged: Subject<true>;
		currentSpellcheckerLanguage: string;
	}
}

const logger = new Logger({
	file: 'errors.log',
	timestamp: true
});

let spellCheckHandler: SpellCheckHandler;
let contextMenuListener: ContextMenuListener;

export function init(serverLanguage: string): void {
	if (ConfigUtil.getConfigItem('enableSpellchecker')) {
		enableSpellChecker();
	}
	enableContextMenu(serverLanguage);
}

function enableSpellChecker(): void {
	try {
		spellCheckHandler = new SpellCheckHandler();
	} catch (error) {
		logger.error(error);
	}
}

function enableContextMenu(serverLanguage: string): void {
	if (spellCheckHandler) {
		spellCheckHandler.attachToInput();
		spellCheckHandler.switchLanguage(serverLanguage);
		spellCheckHandler.currentSpellcheckerChanged.subscribe(() => {
			spellCheckHandler.switchLanguage(spellCheckHandler.currentSpellcheckerLanguage);
		});
	}

	const contextMenuBuilder = new ContextMenuBuilder(spellCheckHandler);
	contextMenuListener = new ContextMenuListener(info => {
		contextMenuBuilder.showPopupMenu(info);
	});
}

export function unsubscribeSpellChecker(): void {
	if (spellCheckHandler) {
		spellCheckHandler.unsubscribe();
	}
	if (contextMenuListener) {
		contextMenuListener.unsubscribe();
	}
}
