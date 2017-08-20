'use strict';

const BaseSection = require(__dirname + '/base-section.js');
const ConfigUtil = require(__dirname + '/../../utils/config-util.js');

class NetworkSection extends BaseSection {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
            <div class="settings-pane">
                <div class="title">Proxy</div>
                <div id="appearance-option-settings" class="settings-card">
					<div class="setting-row" id="use-proxy-option">
						<div class="setting-description">Connect servers through a proxy (requires reload)</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="sidebar-option">
						<span class="setting-input-key">PAC script</span>
						<input class="setting-input-value" placeholder=""/>
					</div>
					<div class="setting-row" id="sidebar-option">
						<span class="setting-input-key">Proxy rules</span>
						<input class="setting-input-value" placeholder=""/>
					</div>
					<div class="setting-row" id="sidebar-option">
						<span class="setting-input-key">Proxy bypass rules</span>
						<input class="setting-input-value" placeholder=""/>
					</div>
				</div>
            </div>
		`;
	}

	init() {
		this.props.$root.innerHTML = this.template();
		this.updateTrayOption();
	}

	updateTrayOption() {
		this.generateSettingOption({
			$element: document.querySelector('#use-proxy-option .setting-control'),
			value: ConfigUtil.getConfigItem('useProxy', true),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('useProxy');
				ConfigUtil.setConfigItem('useProxy', newValue);
				this.updateTrayOption();
			}
		});
	}
}

module.exports = NetworkSection;
