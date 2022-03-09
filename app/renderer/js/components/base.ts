import type {Html} from "../../../common/html.js";

export function generateNodeFromHtml(html: Html): Element {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html.html;

  if (wrapper.firstElementChild === null) {
    throw new Error("No element found in HTML");
  }

  return wrapper.firstElementChild;
}
