'use strict';
const electron = require('electron');
const ipcRenderer = require('electron').ipcRenderer;
const webFrame = require('electron').webFrame;

// Implement spellcheck using electron api 
webFrame.setSpellCheckProvider("en-US", false, {
    spellCheck: function(text) {      
        var res = ipcRenderer.sendSync('checkspell', text);
        return res != null? res : true;
    }
});
