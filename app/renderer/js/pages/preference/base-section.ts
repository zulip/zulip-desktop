import type {HTML} from "../../../../common/html";
import {html} from "../../../../common/html";
import {generateNodeFromHTML} from "../../components/base";
import {ipcRenderer} from "../../typed-ipc-renderer";

interface BaseSectionProps {
  $element: HTMLElement;
  disabled?: boolean;
  value: boolean;
  clickHandler: () => void;
}

export function generateSettingOption(props: BaseSectionProps): void {
  const {$element, disabled, value, clickHandler} = props;

  $element.textContent = "";

  const $optionControl = generateNodeFromHTML(
    generateOptionHTML(value, disabled),
  );
  $element.append($optionControl);

  if (!disabled) {
    $optionControl.addEventListener("click", clickHandler);
  }
}

export function generateOptionHTML(
  settingOption: boolean,
  disabled?: boolean,
): HTML {
  const labelHTML = disabled
    ? html`<label
        class="disallowed"
        title="Setting locked by system administrator."
      ></label>`
    : html`<label></label>`;
  if (settingOption) {
    return html`
      <div class="action">
        <div class="switch">
          <input class="toggle toggle-round" type="checkbox" checked disabled />
          ${labelHTML}
        </div>
      </div>
    `;
  }

  return html`
    <div class="action">
      <div class="switch">
        <input class="toggle toggle-round" type="checkbox" />
        ${labelHTML}
      </div>
    </div>
  `;
}

/* A method that in future can be used to create dropdown menus using <select> <option> tags.
     it needs an object which has ``key: value`` pairs and will return a string that can be appended to HTML
  */
export function generateSelectHTML(
  options: Record<string, string>,
  className?: string,
  idName?: string,
): HTML {
  const optionsHTML = html``.join(
    Object.keys(options).map(
      (key) => html`
        <option name="${key}" value="${key}">${options[key]}</option>
      `,
    ),
  );
  return html`
    <select class="${className}" id="${idName}">
      ${optionsHTML}
    </select>
  `;
}

export function reloadApp(): void {
  ipcRenderer.send("forward-message", "reload-viewer");
}

export function exitSettings(): void {
  const exitButton = document.querySelector(".exit-sign")!;
  exitButton.addEventListener("click", async () => {
    ipcRenderer.send("forward-message", "exit-settings");
  });
}
