'use strict';

const {ipcRenderer} = require('electron');

const BaseComponent = require(__dirname + '/../../components/base.js');

class BaseSection extends BaseComponent {
	generateSettingOption(props) {
		const {$element, value, clickHandler} = props;

		$element.innerHTML = '';

		const $optionControl = this.generateNodeFromTemplate(this.generateOptionTemplate(value));
		$element.appendChild($optionControl);

		$optionControl.addEventListener('click', clickHandler);
	}

	generateOptionTemplate(settingOption) {
		if (settingOption) {
			return `
				<div class="action green">
					<span>On</span>
				</div>
			`;
		} else {
			return `
				<div class="action red">
					<span>Off</span>
				</div>
			`;
		}
	}

	reloadApp() {
		ipcRenderer.send('forward-message', 'reload-viewer');
	}
}

module.exports = BaseSection;
