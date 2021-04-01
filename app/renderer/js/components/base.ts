import type {HTML} from '../../../common/html';

export default class BaseComponent {
	generateNodeFromHTML(html: HTML): Element | null {
		const wrapper = document.createElement('div');
		wrapper.innerHTML = html.html;
		return wrapper.firstElementChild;
	}
}
