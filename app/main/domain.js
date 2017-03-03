const {
	app
} = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const JsonDB = require('node-json-db');
const request = require('request');

const db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);
const data = db.getData('/');

console.log(data.domain);
//console.log(app.getPath('userData'));

// if (data.domain && window.location.href.indexOf(data.domain) === -1) {
// 	window.location.href = data.domain
// }
// require('electron-connect').client.create();

window.addDomain = function() {
	document.getElementById('main').innerHTML = 'checking...';

	let newDomain = document.getElementById('url').value;
	newDomain = newDomain.replace(/^https?:\/\//, '');
	newDomain = newDomain.replace(/^http?:\/\//, '');


	if (newDomain.indexOf("localhost:") >= 0) {
		const domain = 'http://' + newDomain;
		request(domain, (error, response, body) => {
			console.log(response);
			if (!error && response.statusCode == "200") {
				if (response.headers.server == "WSGIServer/0.1 Python/2.7.6" && (body.indexOf("Zulip Dev") || body.indexOf("zulip.com"))) {
					document.getElementById('main').innerHTML = 'Connect';
					db.push('/domain', domain);
					ipcRenderer.send('new-domain', domain);
				} else {
					document.getElementById('main').innerHTML = 'Connect';
					document.getElementById('server-status').innerHTML = 'Not a valid Zulip Server.';

				}
			} else {
				document.getElementById('main').innerHTML = 'Connect';
				document.getElementById('server-status').innerHTML = 'Not a valid Zulip Server.';
			}
		});
	} else {

		const domain = 'https://' + newDomain;
		const checkDomain = domain + '/static/audio/zulip.ogg';

		request(checkDomain, (error, response, body) => {

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



};
