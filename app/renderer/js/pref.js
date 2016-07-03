'use strict';
const {remote} = require('electron');

document.getElementById('close-button').addEventListener('click', function (e) {
     let window = remote.getCurrentWindow();
     window.close();
});

function addDomain() {

        const ipcRenderer = require('electron').ipcRenderer;
        const JsonDB = require('node-json-db');
        const db = new JsonDB('domain', true, true);
        const newDomain = document.getElementById('url').value;
        const domain = 'https://' + newDomain;

        document.getElementById('urladded').innerHTML = newDomain + '  Added';
        db.push('/domain', newDomain);
        ipcRenderer.send('new-domain', domain);
}
