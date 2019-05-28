'use strict';

const { SpellCheckHandler, ContextMenuListener, ContextMenuBuilder } = require('electron-spellchecker');

const LanguageDetect = require('languagedetect');

const lngDetector = new LanguageDetect();

const ISO6391 = require('iso-639-1');

const ConfigUtil = require(__dirname + '/utils/config-util.js');
const Logger = require(__dirname + '/utils/logger-util.js');

const logger = new Logger({
	file: 'errors.log',
	timestamp: true
});

class SetupSpellChecker {
	init(input) {
		if (ConfigUtil.getConfigItem('enableSpellchecker')) {
			this.enableSpellChecker();
		}
		this.enableContextMenu(input);
	}

	enableSpellChecker() {
		try {
			this.SpellCheckHandler = new SpellCheckHandler();
		} catch (err) {
			logger.error(err);
		}
	}

	enableContextMenu(input) {
		if (this.SpellCheckHandler) {
			setTimeout(() => this.SpellCheckHandler.attachToInput(), 1000);
			const langname = lngDetector.detect(input, 1);
			const langcode = ISO6391.getCode(langname);
			this.SpellCheckHandler.switchLanguage(langcode);
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
