'use strict';

export default class BaseComponent {
	generateNodeFromTemplate(template: string): Element | null {
		const wrapper = document.createElement('div');
		wrapper.innerHTML = template;
		return wrapper.firstElementChild;
	}
}
