import {htmlEscape} from "escape-goat";

export class Html {
  html: string;

  constructor({html}: {html: string}) {
    this.html = html;
  }

  join(htmls: readonly Html[]): Html {
    return new Html({html: htmls.map((html) => html.html).join(this.html)});
  }
}

export function html(
  template: TemplateStringsArray,
  ...values: unknown[]
): Html {
  let html = template[0];
  for (const [index, value] of values.entries()) {
    html += value instanceof Html ? value.html : htmlEscape(String(value));
    html += template[index + 1];
  }

  return new Html({html});
}
