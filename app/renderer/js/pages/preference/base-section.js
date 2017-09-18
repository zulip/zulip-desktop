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
				<div class="onoffswitch">
					<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox"  checked>
					<label class="onoffswitch-label" for="myonoffswitch">
					        <span class="onoffswitch-inner"></span>
					        <span class="onoffswitch-switch"></span>
					 </label>
			</div>
			`;
		} else {
			return `
			<div class="onoffswitch">
					<label class="onoffswitch-label" for="myonoffswitch">
					    <input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" >

					        <span class="onoffswitch-inner "></span>
					        <span class="onoffswitch-switch"></span>
					 </label>
			</div>
			`;
		}
	}

	reloadApp() {
		ipcRenderer.send('forward-message', 'reload-viewer');
	}
}

module.exports = BaseSection;
