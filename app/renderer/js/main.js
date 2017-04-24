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
        this.activeTabIndex = -1;
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
			url,
            icon
		} = tab;
        const tabTemplate = tab.template || `
                <div class="tab" domain="${url}">
                    <div class="server-tab" style="background-image: url(${icon});"></div>
                </div>`;
		const $tab = this.__insert_node(tabTemplate);
        const index = this.$tabsContainer.childNodes.length;
		this.$tabsContainer.appendChild($tab);        
		$tab.addEventListener('click', this.activateTab.bind(this, index));
	}

    initWebView(url, index, nodeIntegration = false) {
        const webViewTemplate = `
            <webview 
                id="webview-${index}"
                class="loading"
                src="${url}"
                ${nodeIntegration? 'nodeIntegration': ''}
                disablewebsecurity
                preload="js/preload.js"
                webpreferences="allowRunningInsecureContent, javascript=yes">
            </webview>
        `;
        const $webView = this.__insert_node(webViewTemplate);
		this.$content.appendChild($webView);
        this.isLoading = true;
        $webView.addEventListener('dom-ready', this.endLoading.bind(this, index));
    }

    startLoading(url, index) {
        const $activeWebView = document.getElementById(`webview-${this.activeTabIndex}`);
        if ($activeWebView) {
            $activeWebView.classList.add('disabled');
        }
        const $webView = document.getElementById(`webview-${index}`);
        if (!$webView) {
            this.initWebView(url, index, this.settingsTabIndex == index);
        } else {
            $webView.classList.remove('disabled');
        }
    }

    endLoading(index) {
        const $webView = document.getElementById(`webview-${index}`);
        this.isLoading = false;
        $webView.classList.remove('loading');
        // $webView.openDevTools();
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

        if (this.activeTabIndex != -1) {
            if (this.activeTabIndex == index) {
                return;
            } else {
                this.__get_tab_at(this.activeTabIndex).classList.remove('active');
            }
        }

        const $tab = this.__get_tab_at(index);
		$tab.classList.add('active');

        const domain = $tab.getAttribute('domain');
        this.startLoading(domain, index);
        this.activeTabIndex = index;
    }

    __insert_node(html) {
        let wrapper= document.createElement('div');
        wrapper.innerHTML= html;
        return wrapper.firstElementChild;
    }

    __get_tab_at(index) {
        return this.$tabsContainer.childNodes[index];
    }
}

window.onload = () => {
	const serverManagerView = new ServerManagerView();
	serverManagerView.init();
}
