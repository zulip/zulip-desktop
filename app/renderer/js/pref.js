'use strict';
// eslint-disable-next-line import/no-extraneous-dependencies
const {
	remote
} = require('electron');

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
window.prefDomain = function () {
	const request = require('request');
	// eslint-disable-next-line import/no-extraneous-dependencies
	const ipcRenderer = require('electron').ipcRenderer;
	const JsonDB = require('node-json-db');
	// eslint-disable-next-line import/no-extraneous-dependencies
	const {
		app
	} = require('electron').remote;

	const db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);

	let newDomain = document.getElementById('url').value;
	newDomain = newDomain.replace(/^https?:\/\//, '');
	newDomain = newDomain.replace(/^http?:\/\//, '');

	if (newDomain === '') {
		document.getElementById('urladded').innerHTML = 'Please input a value';
	} else {
		document.getElementById('main').innerHTML = 'Checking...';
		if (newDomain.indexOf('localhost:') >= 0) {
			const domain = 'http://' + newDomain;
			request(domain, (error, response, body) => {
				if (!error && response.statusCode === 200) {
					if (response.headers.server === 'WSGIServer/0.1 Python/2.7.6' && (body.indexOf('Zulip Dev') || body.indexOf('zulip.com'))) {
						document.getElementById('main').innerHTML = 'Switch';
						document.getElementById('urladded').innerHTML = 'Switched to ' + newDomain;
						db.push('/domain', domain);
						ipcRenderer.send('new-domain', domain);
					} else {
						document.getElementById('main').innerHTML = 'Switch';
						document.getElementById('urladded').innerHTML = 'Not a valid Zulip Local Server.';
					}
				} else {
					document.getElementById('main').innerHTML = 'Switch';
					document.getElementById('urladded').innerHTML = 'Not a valid Zulip Local Server.';
				}
			});
		} else {
			const domain = 'https://' + newDomain;
			const checkDomain = domain + '/static/audio/zulip.ogg';

			request(checkDomain, (error, response) => {
				if (!error && response.statusCode !== 404) {
					document.getElementById('main').innerHTML = 'Switch';
					document.getElementById('urladded').innerHTML = 'Switched to ' + newDomain;
					db.push('/domain', domain);
					ipcRenderer.send('new-domain', domain);
				} else {
					document.getElementById('pic').style.display = 'none';
					document.getElementById('main').innerHTML = 'Switch';
					document.getElementById('urladded').innerHTML = 'Not a valid Zulip Server.';
				}
			});
		}
	}
};
