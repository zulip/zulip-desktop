'use strict';

import { SpellCheckHandler, ContextMenuListener, ContextMenuBuilder } from 'electron-spellchecker';

import ConfigUtil = require('./utils/config-util');
import Logger = require('./utils/logger-util');

const logger = new Logger({
	file: 'errors.log',
	timestamp: true
});

class SetupSpellChecker {
	SpellCheckHandler: typeof SpellCheckHandler;
	contextMenuListener: typeof ContextMenuListener;
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
		this.contextMenuListener = new ContextMenuListener((info: object) => {
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
