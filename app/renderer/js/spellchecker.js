'use strict';

const {SpellCheckHandler, ContextMenuListener, ContextMenuBuilder} = require('electron-spellchecker');

function spellChecker() {
	// Implement spellcheck using electron api
	window.spellCheckHandler = new SpellCheckHandler();
	window.spellCheckHandler.attachToInput();

	// Start off as US English
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
