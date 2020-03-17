import { ipcRenderer } from 'electron';

import BaseComponent from '../../components/base';

export default class BaseSection extends BaseComponent {
	// TODO: TypeScript - Here props should be object type
	generateSettingOption(props: any): void {
		const {$element, disabled, value, clickHandler} = props;

		$element.innerHTML = '';

		const $optionControl = this.generateNodeFromTemplate(this.generateOptionTemplate(value, disabled));
		$element.append($optionControl);

		if (!disabled) {
			$optionControl.addEventListener('click', clickHandler);
		}
	}

	generateOptionTemplate(settingOption: boolean, disabled: boolean): string {
		const label = disabled ? '<label class="disallowed" title="Setting locked by system administrator."/>' : '<label/>';
		if (settingOption) {
			return `
				<div class="action">
					<div class="switch">
					  <input class="toggle toggle-round" type="checkbox" checked disabled>
					  ${label}
					</div>
				</div>
			`;
		} else {
			return `
				<div class="action">
					<div class="switch">
					  <input class="toggle toggle-round" type="checkbox">
					  ${label}
					</div>
				</div>
			`;
		}
	}

	/* a method that in future can be used to create dropdown menus using <select> <option> tags.
		it needs an object which has ``key: value`` pairs and will return a string that can be appended to HTML
	*/
	generateSelectTemplate(options: {[key: string]: string}, className?: string, idName?: string): string {
		let select = `<select class='${className}' id='${idName}'>\n`;
		Object.keys(options).forEach(key => {
			select += `<option value="${key}">${options[key]}</option>\n`;
		});
		select += '</select>';
		return select;
	}

	reloadApp(): void {
		ipcRenderer.send('forward-message', 'reload-viewer');
	}
}
