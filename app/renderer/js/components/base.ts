export default class BaseComponent {
	generateNodeFromHTML(html: string): Element | null {
		const wrapper = document.createElement('div');
		wrapper.innerHTML = html;
		return wrapper.firstElementChild;
	}
}
