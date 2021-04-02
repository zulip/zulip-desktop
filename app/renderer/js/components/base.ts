import type {HTML} from "../../../common/html";

export function generateNodeFromHTML(html: HTML): Element | null {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html.html;
  return wrapper.firstElementChild;
}
