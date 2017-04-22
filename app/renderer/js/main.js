'use strict';

const path = require("path");
const DomainUtil = require(path.resolve(('app/renderer/js/utils/domain-util.js')));
class ServerManagerView {
	constructor() {
		this.$serversContainer = document.getElementById('servers-container');

		const $actionsContainer = document.getElementById('actions-container');
		this.$addServerButton = $actionsContainer.querySelector('#add-action');
		this.$settingsButton = $actionsContainer.querySelector('#settings-action');
        this.$content = document.getElementById('content');

        this.isLoading = false;
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

        const $firstServerButton = this.$serversContainer.firstChild;
		$firstServerButton.classList.add('active');
        this.$activeServerButton = $firstServerButton;
        this.initWebView($firstServerButton.getAttribute('domain'));
	}

	initServer(server) {
		const {
			alias,
			url
		} = server;
		const icon = server.icon || 'https://chat.zulip.org/static/images/logo/zulip-icon-128x128.271d0f6a0ca2.png';
		const serverButtonTemplate = `
                <div class="server-button" domain="${url}">
                    <div class="server-name" style="background-image: url(${icon});"></div>
                </div>`;
		const $serverButton = this.__insert_node(serverButtonTemplate);
		this.$serversContainer.appendChild($serverButton);
		$serverButton.addEventListener('click', () => {
            if (this.isLoading || this.$activeServerButton == $serverButton) return;

            this.$activeServerButton.classList.remove('active');
            $serverButton.classList.add('active');
            const url = $serverButton.getAttribute('domain');
            this.$activeServerButton = $serverButton;
            this.startLoading(url);
		});
	}

    initWebView(url) {
        const webViewTemplate = `
            <webview 
                id="webview"
                class="loading"
                src="${url}" 
                disablewebsecurity 
                preload="js/preload.js"
                webpreferences="allowRunningInsecureContent, javascript=yes">
            </webview>
        `;
        this.$webView = this.__insert_node(webViewTemplate);
		this.$content.appendChild(this.$webView);
        this.$webView.addEventListener('dom-ready', this.endLoading.bind(this));
    }

    startLoading(url) {
        this.$webView.loadURL(url);
        this.isLoading = true;
        this.$webView.classList.add('loading');
    }

    endLoading() {
        this.isLoading = false;
        this.$webView.classList.remove('loading');
    }

	initActions() {

	}

	addServer() {

	}

    openSettings() {
        
    }

    __insert_node(html) {
        let wrapper= document.createElement('div');
        wrapper.innerHTML= html;
        return wrapper.firstElementChild;
    }
}

window.onload = () => {
	const serverManagerView = new ServerManagerView();
	serverManagerView.init();
}
