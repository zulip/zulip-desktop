'use strict';

import path = require('path');
import electron = require('electron');
import i18n = require('i18n');

let instance: TranslationUtil = null;
let app: Electron.App = null;

/* To make the util runnable in both main and renderer process */
if (process.type === 'renderer') {
	app = electron.remote.app;
} else {
	app = electron.app;
}

class TranslationUtil {
	constructor() {
		if (instance) {
			return this;
		}

		instance = this;
		i18n.configure({
			directory: path.join(__dirname, '../../../translations/'),
			register: this
		});
	}

	__(phrase: string): string {
		return i18n.__({ phrase, locale: app.getLocale() });
	}
}

export = new TranslationUtil();
