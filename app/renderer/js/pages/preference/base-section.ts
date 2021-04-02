import {ipcRenderer} from "electron";

import type {HTML} from "../../../../common/html";
import {html} from "../../../../common/html";
import {generateNodeFromHTML} from "../../components/base";

interface BaseSectionProps {
  $element: HTMLElement;
  disabled?: boolean;
  value: boolean;
  clickHandler: () => void;
}

export default class BaseSection {
  generateSettingOption(props: BaseSectionProps): void {
    const {$element, disabled, value, clickHandler} = props;

    $element.textContent = "";

    const $optionControl = generateNodeFromHTML(
      this.generateOptionHTML(value, disabled),
    );
    $element.append($optionControl);

    if (!disabled) {
      $optionControl.addEventListener("click", clickHandler);
    }
  }

  generateOptionHTML(settingOption: boolean, disabled?: boolean): HTML {
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
            <input
              class="toggle toggle-round"
              type="checkbox"
              checked
              disabled
            />
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
  generateSelectHTML(
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

  reloadApp(): void {
    ipcRenderer.send("forward-message", "reload-viewer");
  }
}
