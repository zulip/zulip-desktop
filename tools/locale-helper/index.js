const translate = require('google-translate-api');
const path = require('path');
const fs = require('fs');

const translationDir = path.resolve(__dirname, '../../app/translations');

function writeJSON(file, data) {
    const filePath = path.resolve(translationDir, file);
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, '\t')}\n`, 'utf8');
}

const { phrases } = require('./locale-template');
const supportedLocales = require('./supported-locales');

phrases.sort();
for (let locale in supportedLocales) {
    console.log(`fetching translation for: ${supportedLocales[locale]} - ${locale}..`);
    translate(phrases.join('\n'), { to: locale })
        .then(res => {
            const localeFile = `${locale}.json`;
            const translatedText = res.text.split('\n');
            const translationJSON = {};
            phrases.forEach((phrase, index) => {
               translationJSON[phrase] = translatedText[index];
            });

            writeJSON(localeFile, translationJSON);
            console.log(`create: ${localeFile}`);
        });
}
