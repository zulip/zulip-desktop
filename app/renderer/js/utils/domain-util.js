'use strict';

const {app} = require('electron').remote;
const JsonDB = require('node-json-db');

class DomainUtil {
    constructor() {
        this.db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);
    }

    getDomains() {
        return this.db.getData('/domains');
    }

    addDomain() {
        const servers = {
            url: 'https://chat.zulip.org',
            alias: 'Zulip 2333',
            icon: 'https://chat.zulip.org/static/images/logo/zulip-icon-128x128.271d0f6a0ca2.png'
        }
        this.db.push("/domains[]", servers, true);
    }

    removeDomains() {
        this.db.delete("/domains");
    }
}

module.exports = DomainUtil;