/* global app */
// eslint-disable-next-line no-unused-vars
function addDomain() {
	const request = require('request');
	const ipcRenderer = require('electron').ipcRenderer;
	const JsonDB = require('node-json-db');

	const db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);

	document.getElementById('main').innerHTML = 'checking...';

	let newDomain = document.getElementById('url').value;
	newDomain = newDomain.replace(/^https?:\/\//, '');

	const domain = 'https://' + newDomain;
	const checkDomain = domain + '/static/audio/zulip.ogg';

	request(checkDomain, (error, response) => {
		if (!error && response.statusCode !== 404) {
			document.getElementById('main').innerHTML = 'Connect';
			db.push('/domain', domain);
			ipcRenderer.send('new-domain', domain);
			// window.location.href = domain;
		} else {
			document.getElementById('main').innerHTML = 'Connect';
			document.getElementById('server-status').innerHTML = 'Not a vaild Zulip Server.';
		}
	});
}

