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

// Handle zooming functionality

window.zoomIn = function () {
  webFrame.setZoomFactor(webFrame.getZoomFactor() + 0.1);
};

window.zoomOut = function () {
  webFrame.setZoomFactor(webFrame.getZoomFactor() - 0.1);
};

window.zoomActualSize = function() {
  webFrame.setZoomFactor(1);
};