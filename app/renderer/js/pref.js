'use strict';
const {remote} = require('electron');

document.getElementById('close-button').addEventListener('click', function (e) {
     let window = remote.getCurrentWindow();
     window.close();
});

function addDomain() {

        const request = require('request');
        const ipcRenderer = require('electron').ipcRenderer;
        const JsonDB = require('node-json-db');
        const db = new JsonDB('domain', true, true);
        let newDomain = document.getElementById('url').value;
        
        newDomain = newDomain.replace(/^https?:\/\//,'')
        
        const domain = 'https://' + newDomain;
        const checkDomain = domain + '/static/audio/zulip.ogg';

        request(checkDomain, function (error, response, body) {
            if (!error && response.statusCode !== 404) {
                document.getElementById('urladded').innerHTML = newDomain + '  Added';
                db.push('/domain', newDomain);
                ipcRenderer.send('new-domain', domain);
            }
            else{
                document.getElementById('urladded').innerHTML = "Not a vaild Zulip server";
            }
        })


}
