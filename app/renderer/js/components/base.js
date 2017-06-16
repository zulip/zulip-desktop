'use strict';

class BaseComponent {
	generateNodeFromTemplate(template) {
		const wrapper = document.createElement('div');
		wrapper.innerHTML = template;
		return wrapper.firstElementChild;
	}
}

module.exports = BaseComponent;
