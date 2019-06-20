'use strict';

class BaseComponent {
	generateNodeFromTemplate(template: string): Element | null {
		const wrapper = document.createElement('div');
		wrapper.innerHTML = template;
		return wrapper.firstElementChild;
	}
}

export = BaseComponent;
