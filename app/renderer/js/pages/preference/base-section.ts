'use strict';

import { ipcRenderer } from 'electron';

import BaseComponent = require('../../components/base');

class BaseSection extends BaseComponent {
	// TODO: TypeScript - Here props should be object type
	generateSettingOption(props: any): void {
		const {$element, value, clickHandler} = props;

		$element.innerHTML = '';

		const $optionControl = this.generateNodeFromTemplate(this.generateOptionTemplate(value));
		$element.append($optionControl);

		$optionControl.addEventListener('click', clickHandler);
	}

	generateOptionTemplate(settingOption: boolean): string {
		if (settingOption) {
			return `
				<div class="action">
					<div class="switch">
					  <input class="toggle toggle-round" type="checkbox" checked>
					  <label></label>
					</div>
				</div>
			`;
		} else {
			return `
				<div class="action">
					<div class="switch">
					  <input class="toggle toggle-round" type="checkbox">
					  <label></label>
					</div>
				</div>
			`;
		}
	}

	reloadApp(): void {
		ipcRenderer.send('forward-message', 'reload-viewer');
	}
}

export = BaseSection;
