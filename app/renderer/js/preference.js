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
       this.initActions();
    }

    initServers() {
        this.$serverInfoContainer.innerHTML = '';
        this.initNewServerForm();
        const servers = this.domainUtil.getDomains();
		for (let i in servers) {
			this.initServer(servers[i], i);
		}
    }

    initServer(server, index) {
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
                            <input class="server-info-value" disabled value="${alias}"/>
                        </div>
                        <div class="server-info-row">
                            <span class="server-info-key">Url</span>
                            <input class="server-info-value" disabled value="${url}"/>
                        </div>
                        <div class="server-info-row">
                            <span class="server-info-key">Icon</span>
                            <input class="server-info-value" disabled value="${icon}"/>
                        </div>
                        <div class="server-info-row">
                            <span class="server-info-key">Actions</span>
                            <div class="action server-info-value" id="delete-server-action-${index}">
                                <i class="material-icons">indeterminate_check_box</i>
                                <span>Delete</span>
                            </div>
                        </div>
                    </div>
                </div>`;
        this.$serverInfoContainer.appendChild(this.__insert_node(serverInfoTemplate));
        document.getElementById(`delete-server-action-${index}`).addEventListener('click', () => {
            this.domainUtil.removeDomain(index);
            this.initServers();
        });
    }

    initNewServerForm() {
        const newServerFormTemplate = `
                <div class="server-info active hidden">
                    <div class="server-info-left">
                        <img class="server-info-icon" src="https://chat.zulip.org/static/images/logo/zulip-icon-128x128.271d0f6a0ca2.png"/>
                    </div>
                    <div class="server-info-right">
                        <div class="server-info-row">
                            <span class="server-info-key">Name</span>
                            <input class="server-info-value" placeholder="(Required)"/>
                        </div>
                        <div class="server-info-row">
                            <span class="server-info-key">Url</span>
                            <input class="server-info-value" placeholder="(Required)"/>
                        </div>
                        <div class="server-info-row">
                            <span class="server-info-key">Icon</span>
                            <input class="server-info-value" placeholder="(Optional)"/>
                        </div>
                    </div>
                </div>
        `;
        this.$serverInfoContainer.appendChild(this.__insert_node(newServerFormTemplate));

        this.$newServerForm = document.querySelector('.server-info.active');
        this.$newServerAlias = this.$newServerForm.querySelectorAll('input.server-info-value')[0];
        this.$newServerUrl = this.$newServerForm.querySelectorAll('input.server-info-value')[1];
        this.$newServerIcon = this.$newServerForm.querySelectorAll('input.server-info-value')[2];
    }

    initActions() {
        this.$newServerButton.addEventListener('click', () => {
            this.$newServerForm.classList.remove('hidden');
            this.$saveServerButton.classList.remove('hidden');
            this.$newServerButton.classList.add('hidden');
        });
        this.$saveServerButton.addEventListener('click', () => {
            this.domainUtil.checkDomain(this.$newServerUrl.value).then((domain) => {
                const server = {
                    alias: this.$newServerAlias.value,
                    url: domain,
                    icon: this.$newServerIcon.value
                };
                this.domainUtil.addDomain(server);
                this.$saveServerButton.classList.add('hidden');
                this.$newServerButton.classList.remove('hidden');
                this.$newServerForm.classList.add('hidden');

                this.initServers();
            }, (errorMessage) => {
                alert(errorMessage);
            });
        });
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
