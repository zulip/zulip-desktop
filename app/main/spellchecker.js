const {SpellCheckHandler, ContextMenuListener, ContextMenuBuilder} = require('electron-spellchecker');

// Implement spellcheck using electron api

window.spellCheckHandler = new SpellCheckHandler();
window.spellCheckHandler.attachToInput();

// Start off as US English
window.spellCheckHandler.switchLanguage('en-US');

let contextMenuBuilder = new ContextMenuBuilder(window.spellCheckHandler);
let contextMenuListener = new ContextMenuListener((info) => {
  contextMenuBuilder.showPopupMenu(info);
});

// Clean up events after you navigate away from this page;
// otherwise, you may experience errors
window.addEventListener('beforeunload', function() {
    spellCheckHandler.unsubscribe();
    contextMenuListener.unsubscribe();
});