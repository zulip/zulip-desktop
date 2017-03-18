const {app} = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const JsonDB = require('node-json-db');
const request = require('request');

const db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);
const data = db.getData('/');

console.log(data.domain);
window.addDomain = function () {
	let newDomain = document.getElementById('url').value;
	newDomain = newDomain.replace(/^https?:\/\//, '');
	newDomain = newDomain.replace(/^http?:\/\//, '');
	if (newDomain === '') {
		document.getElementById('server-status').innerHTML = 'Please input a value';
	} else {
		document.getElementById('main').innerHTML = 'Checking...';
		if (newDomain.indexOf('localhost:') >= 0) {
			const domain = 'http://' + newDomain;
			const checkDomain = domain + '/static/audio/zulip.ogg';
			request(checkDomain, (error, response) => {
				if (!error && response.statusCode !== 404) {
					document.getElementById('main').innerHTML = 'Connect';
					db.push('/domain', domain);
					ipcRenderer.send('new-domain', domain);
				} else {
					document.getElementById('main').innerHTML = 'Connect';
					document.getElementById('server-status').innerHTML = 'Not a valid Zulip Local Server.';
				}
			});
			//	});
		} else {
			const domain = 'https://' + newDomain;
			const checkDomain = domain + '/static/audio/zulip.ogg';

			request(checkDomain, (error, response) => {
				if (!error && response.statusCode !== 404) {
					document.getElementById('main').innerHTML = 'Connect';
					db.push('/domain', domain);
					ipcRenderer.send('new-domain', domain);
				} else {
					document.getElementById('main').innerHTML = 'Connect';
					document.getElementById('server-status').innerHTML = 'Not a valid Zulip Server.';
				}
			});
		}
	}
};
