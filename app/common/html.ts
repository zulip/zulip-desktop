import {htmlEscape} from "escape-goat";

export class Html {
  html: string;

  constructor({html: contentHtml}: {html: string}) {
    this.html = contentHtml;
  }

  join(htmls: readonly Html[]): Html {
    return new Html({html: htmls.map((item) => item.html).join(this.html)});
  }
}

export function html(
  template: TemplateStringsArray,
  ...values: unknown[]
): Html {
  let outHtml = template[0]!;
  for (const [index, value] of values.entries()) {
    outHtml += value instanceof Html ? value.html : htmlEscape(String(value));
    outHtml += template[index + 1];
  }

  return new Html({html: outHtml});
}
