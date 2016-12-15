const {app} = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const JsonDB = require('node-json-db');
const request = require('request');

const db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);
const data = db.getData('/');

console.log(data.domain);

// if (data.domain && window.location.href.indexOf(data.domain) === -1) {
// 	window.location.href = data.domain
// }
// require('electron-connect').client.create();

window.addDomain = function () {
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
		} else {
			document.getElementById('main').innerHTML = 'Connect';
			document.getElementById('server-status').innerHTML = 'Not a vaild Zulip Server.';
		}
	});
};

