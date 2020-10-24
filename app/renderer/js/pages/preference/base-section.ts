import {ipcRenderer} from 'electron';

import {htmlEscape} from 'escape-goat';

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

		$element.textContent = '';

		const $optionControl = this.generateNodeFromHTML(this.generateOptionHTML(value, disabled));
		$element.append($optionControl);

		if (!disabled) {
			$optionControl.addEventListener('click', clickHandler);
		}
	}

	generateOptionHTML(settingOption: boolean, disabled?: boolean): string {
		const labelHTML = disabled ? '<label class="disallowed" title="Setting locked by system administrator."></label>' : '<label></label>';
		if (settingOption) {
			return htmlEscape`
				<div class="action">
					<div class="switch">
						<input class="toggle toggle-round" type="checkbox" checked disabled>
						` + labelHTML + htmlEscape`
					</div>
				</div>
			`;
		}

		return htmlEscape`
			<div class="action">
				<div class="switch">
					<input class="toggle toggle-round" type="checkbox">
					` + labelHTML + htmlEscape`
				</div>
			</div>
		`;
	}

	/* A method that in future can be used to create dropdown menus using <select> <option> tags.
		it needs an object which has ``key: value`` pairs and will return a string that can be appended to HTML
	*/
	generateSelectHTML(options: Record<string, string>, className?: string, idName?: string): string {
		let html = htmlEscape`<select class="${className}" id="${idName}">\n`;
		Object.keys(options).forEach(key => {
			html += htmlEscape`<option name="${key}" value="${key}">${options[key]}</option>\n`;
		});
		html += '</select>';
		return html;
	}

	reloadApp(): void {
		ipcRenderer.send('forward-message', 'reload-viewer');
	}
}
