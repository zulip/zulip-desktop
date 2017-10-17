'use strict';

const { SpellCheckHandler, ContextMenuListener, ContextMenuBuilder } = require('electron-spellchecker');

const ConfigUtil = require(__dirname + '/utils/config-util.js');

function spellChecker() {
	// Implement spellcheck using electron api
	window.spellCheckHandler = new SpellCheckHandler();
	window.spellCheckHandler.attachToInput();

	const userLanguage = ConfigUtil.getConfigItem('spellcheckerLanguage');

	// eslint-disable-next-line no-unused-expressions
	process.platform === 'darwin' ?
		// On macOS, spellchecker fails to auto-detect the lanugage user is typing in
		// that's why we need to mention it explicitly
		window.spellCheckHandler.switchLanguage(userLanguage) :
		// On Linux and Windows, spellchecker can automatically detects the language the user is typing in
		// and silently switches on the fly; thus we can start off as US English
		window.spellCheckHandler.switchLanguage('en-US');

	const contextMenuBuilder = new ContextMenuBuilder(window.spellCheckHandler);
	const contextMenuListener = new ContextMenuListener(info => {
		contextMenuBuilder.showPopupMenu(info);
	});

	// Clean up events after you navigate away from this page;
	// otherwise, you may experience errors
	window.addEventListener('beforeunload', () => {
		// eslint-disable-next-line no-undef
		spellCheckHandler.unsubscribe();
		contextMenuListener.unsubscribe();
	});
}

module.exports = {
	spellChecker
};
