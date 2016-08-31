'use strict';
const {remote} = require('electron');

const prefWindow = remote.getCurrentWindow();

document.getElementById('close-button').addEventListener('click', () => {
	prefWindow.close();
});

document.addEventListener('keydown', event => {
	if (event.key === 'Escape' || event.keyCode === 27) {
		prefWindow.close();
	}
});
// eslint-disable-next-line no-unused-vars
function addDomain() {
	const request = require('request');
	const ipcRenderer = require('electron').ipcRenderer;
	const JsonDB = require('node-json-db');
	const {app} = require('electron').remote;

	const db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);
	document.getElementById('main').innerHTML = 'checking...';
	document.getElementById('pic').style.display = 'block';

	let newDomain = document.getElementById('url').value;
	newDomain = newDomain.replace(/^https?:\/\//, '');

	const domain = 'https://' + newDomain;
	const checkDomain = domain + '/static/audio/zulip.ogg';

	request(checkDomain, (error, response) => {
		if (!error && response.statusCode !== 404) {
			document.getElementById('pic').style.display = 'none';
			document.getElementById('main').innerHTML = 'Switch';
			document.getElementById('urladded').innerHTML = 'Switched to ' + newDomain;
			db.push('/domain', domain);
			ipcRenderer.send('new-domain', domain);
		} else {
			document.getElementById('pic').style.display = 'none';
			document.getElementById('main').innerHTML = 'Switch';
			document.getElementById('urladded').innerHTML = 'Not a vaild Zulip server.';
		}
	});
}
