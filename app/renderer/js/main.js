'use strict';

const path = require("path");
const DomainUtil = require(path.resolve(('app/renderer/js/utils/domain-util.js')));
class ServerManagerView {
	constructor() {
		this.$tabsContainer = document.getElementById('tabs-container');

		const $actionsContainer = document.getElementById('actions-container');
		this.$addServerButton = $actionsContainer.querySelector('#add-action');
		this.$settingsButton = $actionsContainer.querySelector('#settings-action');
        this.$content = document.getElementById('content');

        this.isLoading = false;
        this.settingsTabIndex = -1;
	}

	init() {
		this.domainUtil = new DomainUtil();
		this.initTabs();
        this.initActions();
	}

	initTabs() {
		const servers = this.domainUtil.getDomains();
		for (let server of servers) {
			this.initTab(server);
		}
        
        this.activateTab(0);
	}

	initTab(tab) {
		const {
			alias,
			url
		} = tab;
		const icon = tab.icon || 'https://chat.zulip.org/static/images/logo/zulip-icon-128x128.271d0f6a0ca2.png';
        const tabTemplate = tab.template || `
                <div class="tab" domain="${url}">
                    <div class="server-tab" style="background-image: url(${icon});"></div>
                </div>`;
		const $tab = this.__insert_node(tabTemplate);
        const index = this.$tabsContainer.childNodes.length;
		this.$tabsContainer.appendChild($tab);        
		$tab.addEventListener('click', this.activateTab.bind(this, index));
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
        this.$webView.openDevTools();        
    }

	initActions() {
        this.$addServerButton.addEventListener('click', this.openSettings.bind(this));
	}

	addServer() {
        
	}

    openSettings() {
        if (this.settingsTabIndex != -1) {
            this.activateTab(this.settingsTabIndex);
            return;
        }
        const url = 'file:///' + path.resolve(('app/renderer/preference.html'));
        console.log(url);
        const settingsTabTemplate = `
                <div class="tab" domain="${url}">
                    <div class="server-tab settings-tab">
                        <i class="material-icons md-48">settings</i>
                    </div>
                </div>`;
		this.initTab({
            alias: 'Settings',
			url: url,
            template: settingsTabTemplate
        });

        this.settingsTabIndex = this.$tabsContainer.childNodes.length - 1;
        this.activateTab(this.settingsTabIndex);
    }

    activateTab(index) {
        if (this.isLoading) return;
        
        const $tab = this.$tabsContainer.childNodes[index];

        if (this.$activeTab) {
            if (this.$activeTab == $tab) {
                return;
            } else {
                this.$activeTab.classList.remove('active');
            }
        }

		$tab.classList.add('active');
        this.$activeTab = $tab;

        const domain = $tab.getAttribute('domain');
        if (this.$webView){
            this.startLoading(domain);
        } else {
            this.initWebView(domain);
        }
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
