import {ipcRenderer} from 'electron';

import escape from 'escape-html';

import BaseComponent from '../../components/base';

interface BaseSectionProps {
	$element: HTMLElement;
	disabled?: boolean;
	value: boolean;
	clickHandler: () => void;
}

export default class BaseSection extends BaseComponent {
	generateSettingOption(props: BaseSectionProps): void {
		const {$element, disabled, value, clickHandler} = props;

		$element.innerHTML = '';

		const $optionControl = this.generateNodeFromTemplate(this.generateOptionTemplate(value, disabled));
		$element.append($optionControl);

		if (!disabled) {
			$optionControl.addEventListener('click', clickHandler);
		}
	}

	generateOptionTemplate(settingOption: boolean, disabled?: boolean): string {
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
		}

		return `
				<div class="action">
					<div class="switch">
					  <input class="toggle toggle-round" type="checkbox">
					  ${label}
					</div>
				</div>
			`;
	}

	/* A method that in future can be used to create dropdown menus using <select> <option> tags.
		it needs an object which has ``key: value`` pairs and will return a string that can be appended to HTML
	*/
	generateSelectTemplate(options: {[key: string]: string}, className?: string, idName?: string): string {
		let select = `<select class="${escape(className)}" id="${escape(idName)}">\n`;
		Object.keys(options).forEach(key => {
			select += `<option name="${escape(key)}" value="${escape(key)}">${escape(options[key])}</option>\n`;
		});
		select += '</select>';
		return select;
	}

	reloadApp(): void {
		ipcRenderer.send('forward-message', 'reload-viewer');
	}
}
