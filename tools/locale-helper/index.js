'use strict';
const translate = require('@vitalets/google-translate-api');
const path = require('path');
const fs = require('fs');

const translationDir = path.resolve(__dirname, '../../app/translations');

function writeJSON(file, data) {
	const filePath = path.resolve(translationDir, file);
	fs.writeFileSync(filePath, `${JSON.stringify(data, null, '\t')}\n`, 'utf8');
}

const {phrases} = require('./locale-template');
const supportedLocales = require('./supported-locales.json');

phrases.sort();
for (const [locale, name] of Object.entries(supportedLocales)) {
	console.log(`fetching translation for: ${name} - ${locale}..`);
	(async () => {
		try {
			const result = await translate(phrases.join('\n'), {to: locale});
			const localeFile = `${locale}.json`;
			const translatedText = result.text.split('\n');
			const translationJSON = {};
			phrases.forEach((phrase, index) => {
				translationJSON[phrase] = translatedText[index];
			});

			writeJSON(localeFile, translationJSON);
			console.log(`create: ${localeFile}`);
		} catch (error) {
			console.error(error);
		}
	})();
}
