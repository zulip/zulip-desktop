import {dialog} from "@electron/remote";

import {html} from "../../../../common/html";
import * as LinkUtil from "../../../../common/link-util";
import * as t from "../../../../common/translation-util";
import {generateNodeFromHtml} from "../../components/base";
import {ipcRenderer} from "../../typed-ipc-renderer";
import * as DomainUtil from "../../utils/domain-util";

interface NewServerFormProps {
  $root: Element;
  onChange: () => void;
}

export function initNewServerForm({$root, onChange}: NewServerFormProps): void {
  const $newServerForm = generateNodeFromHtml(html`
    <div class="server-input-container">
      <div class="title">${t.__("Organization URL")}</div>
      <div class="add-server-info-row">
        <label class="setting-input-value">
          <input
            class="setting-input-add-server"
            autofocus
            placeholder="your-organization.zulipchat.com"
            style="width: 34ch"
          />
          <span class="add-server-domain"></span>
          <span class="server-url-size-calc"></span>
        </label>
      </div>
      <div class="server-center">
        <button id="connect">${t.__("Connect")}</button>
      </div>
      <div class="server-center">
        <div class="divider">
          <hr class="left" />
          ${t.__("OR")}
          <hr class="right" />
        </div>
      </div>
      <div class="server-center">
        <button id="open-create-org-link">
          ${t.__("Create a new organization")}
        </button>
      </div>
      <div class="server-center">
        <div class="server-network-option">
          <span id="open-network-settings"
            >${t.__("Network and Proxy Settings")}</span
          >
          <i class="material-icons open-network-button">open_in_new</i>
        </div>
      </div>
    </div>
  `);
  const $saveServerButton: HTMLButtonElement =
    $newServerForm.querySelector("#connect")!;
  $root.textContent = "";
  $root.append($newServerForm);
  const $newServerUrl: HTMLInputElement = $newServerForm.querySelector(
    "input.setting-input-add-server",
  )!;
  const $serverDomain: HTMLSpanElement = $newServerForm.querySelector(
    "span.add-server-domain",
  )!;
  const $urlSizeCalc: HTMLSpanElement = $newServerForm.querySelector(
    "span.server-url-size-calc",
  )!;
  const urlValidationPattern = /^[a-zA-Z\d-]*$/;

  async function submitFormHandler(): Promise<void> {
    $saveServerButton.textContent = "Connecting...";
    let serverConf;
    try {
      serverConf = await DomainUtil.checkDomain(
        await autoComplete($newServerUrl.value.trim()),
      );
    } catch (error: unknown) {
      $saveServerButton.textContent = "Connect";
      await dialog.showMessageBox({
        type: "error",
        message:
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : "Unknown error",
        buttons: ["OK"],
      });
      return;
    }

    await DomainUtil.addDomain(serverConf);
    onChange();
  }

  async function autoComplete(url: string): Promise<string> {
    const pattern = /^[a-zA-Z\d-]*$/;
    let serverUrl = url.trim();

    if (pattern.test(serverUrl)) {
      serverUrl = "https://" + serverUrl + ".zulipchat.com";
    }

    return serverUrl;
  }

  $saveServerButton.addEventListener("click", async () => {
    await submitFormHandler();
  });
  $newServerUrl.addEventListener("keypress", async (event) => {
    if (event.key === "Enter") {
      await submitFormHandler();
    }
  });
  $newServerUrl.addEventListener("input", async () => {
    const url = $newServerUrl.value;
    $urlSizeCalc.textContent = url;
    $newServerUrl.style.width = `${$urlSizeCalc.offsetWidth}px`;

    $serverDomain.textContent = urlValidationPattern.test(url)
      ? ".zulipchat.com"
      : "";
  });

  // Open create new org link in default browser
  const link = "https://zulip.com/new/";
  const externalCreateNewOrgElement = $root.querySelector(
    "#open-create-org-link",
  )!;
  externalCreateNewOrgElement.addEventListener("click", async () => {
    await LinkUtil.openBrowser(new URL(link));
  });

  const networkSettingsId = $root.querySelector(".server-network-option")!;
  networkSettingsId.addEventListener("click", () => {
    ipcRenderer.send("forward-message", "open-network-settings");
  });
}
