const path = require('path');
const electron = require('electron');
const fs = require('fs');

const ConfigUtil = require(__dirname + '/../renderer/js/utils/config-util.js');

class i18n {
	constructor() {
		this.app = electron.app ? electron.app : electron.remote.app;
		this.appLanguage = ConfigUtil.getConfigItem('spellcheckerLanguage');
		this.appLocale = path.join(__dirname, this.appLanguage + '.json');

		if (fs.existsSync(this.appLocale)) {
			this.loadedLanguage = JSON.parse(fs.readFileSync(this.appLocale, 'utf8'));
			console.log('translate into', this.appLanguage);
		} else {
			this.loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, 'en.json'), 'utf8'));
			console.log('no lang found');
		}
	}

	_(phrase) {
		let translation = this.loadedLanguage[phrase];
		if (translation === undefined) {
			translation = phrase;
		}
		return translation;
	}
}

// eslint-disable-next-line new-cap
module.exports = new i18n();
