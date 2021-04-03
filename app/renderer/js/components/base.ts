import type {HTML} from "../../../common/html";

export function generateNodeFromHTML(html: HTML): Element {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html.html;

  if (wrapper.firstElementChild === null) {
    throw new Error("No element found in HTML");
  }

  return wrapper.firstElementChild;
}
