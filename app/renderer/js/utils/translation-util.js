'use strict';
const path = require("path");
const electron = require("electron");
const i18n = require("i18n");
let instance = null;
let app = null;
/* To make the util runnable in both main and renderer process */
if (process.type === 'renderer') {
    app = electron.remote.app;
}
else {
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
    __(phrase) {
        return i18n.__({ phrase, locale: app.getLocale() ? app.getLocale() : 'en' });
    }
}
module.exports = new TranslationUtil();
