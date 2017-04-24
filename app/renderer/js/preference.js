'use strict';

const path = require("path");
const DomainUtil = require(path.resolve(('app/renderer/js/utils/domain-util.js')));
class PreferenceView {
    constructor() {
        this.$newServerButton = document.getElementById('new-server-action');
        this.$saveServerButton = document.getElementById('save-server-action');
        this.$serverInfoContainer = document.querySelector('.server-info-container');        
    }

    init() {
       this.domainUtil = new DomainUtil();
       this.initServers();
    }

    initServers() {
        const servers = this.domainUtil.getDomains();
		for (let server of servers) {
			this.initServer(server);
		}
    }

    initServer(server) {
        const {
			alias,
			url,
            icon
		} = server;
        const serverInfoTemplate = `
                <div class="server-info">
                    <div class="server-info-left">
                        <img class="server-info-icon" src="${icon}"/>
                    </div>
                    <div class="server-info-right">
                        <div class="server-info-row">
                            <span class="server-info-key">Name</span>
                            <input class="server-info-value" value="${alias}"/>
                        </div>
                        <div class="server-info-row">
                            <span class="server-info-key">Url</span>
                            <input class="server-info-value" value="${url}"/>
                        </div>
                        <div class="server-info-row">
                            <span class="server-info-key">Icon</span>
                            <input class="server-info-value" value="${icon}"/>
                        </div>
                    </div>
                </div>`;
        this.$serverInfoContainer.appendChild(this.__insert_node(serverInfoTemplate));
    }

    __insert_node(html) {
        let wrapper= document.createElement('div');
        wrapper.innerHTML= html;
        return wrapper.firstElementChild;
    }
}

window.onload = () => {
	const preferenceView = new PreferenceView();
	preferenceView.init();
}
