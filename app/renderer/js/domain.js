const {app} = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const JsonDB = require('node-json-db');
const request = require('request');

const db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);
const data = db.getData('/');

if(!data.certifiedURL) {
		db.push("/certifiedURL",[]);
}

let URL_List = db.getData('/certifiedURL');
let URL_Length = URL_List.length;


const checkURL = domain => {

	for ( var i = 0; i < URL_Length; i++) {
		if (URL_List[i].domain === domain);
		return true;
		break;
	}
	return false;

};


window.addDomain = function () {
	const el = sel => {
		return document.querySelector(sel);
	};

	const $el = {
		error: el('#error'),
		main: el('#main'),
		section: el('section')
	};

	const event = sel => {
		return {
			on: (event, callback) => {
				document.querySelector(sel).addEventListener(event, callback);
			}
		};
	};

	const displayError = msg => {
		$el.error.innerText = msg;
		$el.error.classList.add('show');
		$el.section.classList.add('shake');
	};

	let newDomain = document.getElementById('url').value;
	newDomain = newDomain.replace(/^https?:\/\//, '');
	if (newDomain === '') {
		displayError('Please input a valid URL.');
	} else {
		el('#main').innerHTML = 'Checking...';
		if (newDomain.indexOf('localhost:') >= 0) {
			const domain = 'http://' + newDomain;
			const checkDomain = domain + '/static/audio/zulip.ogg';
			request(checkDomain, (error, response) => {
				if (!error && response.statusCode !== 404) {
					document.getElementById('main').innerHTML = 'Connect';
					db.push('/domain', domain);
					ipcRenderer.send('new-domain', domain);
				} else {
					$el.main.innerHTML = 'Connect';
					displayError('Not a valid Zulip local server');
				}
			});
			//	});
		} else {
			const domain = 'https://' + newDomain;
			const checkDomain = domain + '/static/audio/zulip.ogg';

			request(checkDomain, (error, response) => {
				if (!error && response.statusCode !== 404) {
					$el.main.innerHTML = 'Connect';
					db.push('/domain', domain);
					ipcRenderer.send('new-domain', domain);
				} else if (error.toString().indexOf('Error: self signed certificate') >= 0) {
 						if(checkURL(domain)) {
							$el.main.innerHTML = 'Connect';
						  db.push('/domain', domain);
						  ipcRenderer.send('new-domain', domain);
					 } else {
						 $el.main.innerHTML = 'Connect';
   					 ipcRenderer.send('certificate-err', domain);
					 }
				} else {
					$el.main.innerHTML = 'Connect';
					displayError('Not a valid Zulip server');
				}
			});
		}
	}

	event('#url').on('input', () => {
		el('#error').classList.remove('show');
	});

	event('section').on('animationend', function () {
		this.classList.remove('shake');
	});
};
