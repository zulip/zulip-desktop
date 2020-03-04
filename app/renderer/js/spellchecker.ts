'use strict';

import type { Subject } from 'rxjs';
import { SpellCheckHandler, ContextMenuListener, ContextMenuBuilder } from 'electron-spellchecker';

import ConfigUtil = require('./utils/config-util');
import Logger = require('./utils/logger-util');

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

class SetupSpellChecker {
	SpellCheckHandler: SpellCheckHandler;
	contextMenuListener: ContextMenuListener;
	init(serverLanguage: string): void {
		if (ConfigUtil.getConfigItem('enableSpellchecker')) {
			this.enableSpellChecker();
		}
		this.enableContextMenu(serverLanguage);
	}

	enableSpellChecker(): void {
		try {
			this.SpellCheckHandler = new SpellCheckHandler();
		} catch (err) {
			logger.error(err);
		}
	}

	enableContextMenu(serverLanguage: string): void {
		if (this.SpellCheckHandler) {
			this.SpellCheckHandler.attachToInput();
			this.SpellCheckHandler.switchLanguage(serverLanguage);
			this.SpellCheckHandler.currentSpellcheckerChanged.subscribe(() => {
				this.SpellCheckHandler.switchLanguage(this.SpellCheckHandler.currentSpellcheckerLanguage);
			});
		}

		const contextMenuBuilder = new ContextMenuBuilder(this.SpellCheckHandler);
		this.contextMenuListener = new ContextMenuListener(info => {
			contextMenuBuilder.showPopupMenu(info);
		});
	}

	unsubscribeSpellChecker(): void {
		if (this.SpellCheckHandler) {
			this.SpellCheckHandler.unsubscribe();
		}
		if (this.contextMenuListener) {
			this.contextMenuListener.unsubscribe();
		}
	}
}

export = new SetupSpellChecker();
