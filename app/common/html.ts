import {htmlEscape} from 'escape-goat';

export class HTML {
	html: string;

	constructor({html}: {html: string}) {
		this.html = html;
	}

	join(htmls: readonly HTML[]): HTML {
		return new HTML({html: htmls.map(html => html.html).join(this.html)});
	}
}

export function html(
	template: TemplateStringsArray,
	...values: unknown[]
): HTML {
	let html = template[0];
	for (const [index, value] of values.entries()) {
		html += value instanceof HTML ? value.html : htmlEscape(String(value));
		html += template[index + 1];
	}

	return new HTML({html});
}
