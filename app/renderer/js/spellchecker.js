'use strict';

const { SpellCheckHandler, ContextMenuListener, ContextMenuBuilder } = require('electron-spellchecker');

const ConfigUtil = require(__dirname + '/utils/config-util.js');
const Logger = require(__dirname + '/utils/logger-util.js');

const logger = new Logger({
	file: 'errors.log',
	timestamp: true
});

class SetupSpellChecker {
	init() {
		if (ConfigUtil.getConfigItem('enableSpellchecker')) {
			this.enableSpellChecker();
		}
		this.enableContextMenu();
	}

	enableSpellChecker() {
		try {
			this.SpellCheckHandler = new SpellCheckHandler();
		} catch (err) {
			logger.error(err);
		}
	}

	enableContextMenu() {
		if (this.SpellCheckHandler) {
			this.SpellCheckHandler.attachToInput();

			const userLanguage = ConfigUtil.getConfigItem('spellcheckerLanguage');

			this.SpellCheckHandler.switchLanguage(userLanguage);
		}

		const contextMenuBuilder = new ContextMenuBuilder(this.SpellCheckHandler);
		this.contextMenuListener = new ContextMenuListener(info => {
			contextMenuBuilder.showPopupMenu(info);
		});
	}

	unsubscribeSpellChecker() {
		// eslint-disable-next-line no-undef
		if (this.SpellCheckHandler) {
			this.SpellCheckHandler.unsubscribe();
		}
		if (this.contextMenuListener) {
			this.contextMenuListener.unsubscribe();
		}
	}
}

module.exports = new SetupSpellChecker();
