'use strict';

const path = require("path");
const DomainUtil = require(path.resolve(('app/renderer/js/utils/domain-util.js')));
class ServerManagerView {
    constructor() {
        this.serverButtonTemplate = `
            <div class="server-button active">
                <div class="server-name" style="background-image: url();"></div>
            </div>`;
        this.$serversContainer = document.getElementById('servers-container');

        const $actionsContainer = document.getElementById('actions-container');
        this.$addServerButton = $actionsContainer.querySelector('#add-action');
        this.$settingsButton = $actionsContainer.querySelector('#settings-action');
    }
    
    init() {
        this.domainUtil = new DomainUtil();
        console.log(this.domainUtil.getDomains());
    }

    initServers() {
        
    }

    initActions() {

    }

    addServer() {

    }
}

window.onload = () => {
    const serverManagerView = new ServerManagerView();
    serverManagerView.init();
}