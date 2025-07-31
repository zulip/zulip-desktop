import {dialog} from "@electron/remote";

import {html} from "../../../../common/html.ts";
import * as LinkUtil from "../../../../common/link-util.ts";
import * as t from "../../../../common/translation-util.ts";
import {generateNodeFromHtml} from "../../components/base.ts";
import {ipcRenderer} from "../../typed-ipc-renderer.ts";
import * as DomainUtil from "../../utils/domain-util.ts";

type NewServerFormProperties = {
  $root: Element;
  onChange: () => void;
};

export function initNewServerForm({
  $root,
  onChange,
}: NewServerFormProperties): void {
  const $newServerForm = generateNodeFromHtml(html`
    <div class="server-input-container">
      <div class="title">${t.__("Organization URL")}</div>
      <div class="add-server-info-row">
        <input
          class="setting-input-value"
          autofocus
          placeholder="${t.__(
            "your-organization.zulipchat.com or zulip.your-organization.com",
          )}"
        />
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
    "input.setting-input-value",
  )!;

  async function submitFormHandler(): Promise<void> {
    $saveServerButton.textContent = t.__("Connecting…");
    let serverConfig;
    try {
      serverConfig = await DomainUtil.checkDomain($newServerUrl.value.trim());
    } catch (error: unknown) {
      $saveServerButton.textContent = t.__("Connect");
      await dialog.showMessageBox({
        type: "error",
        message:
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : t.__("Unknown error"),
        buttons: [t.__("OK")],
      });
      return;
    }

    await DomainUtil.addDomain(serverConfig);
    onChange();
  }

  $saveServerButton.addEventListener("click", async () => {
    await submitFormHandler();
  });
  $newServerUrl.addEventListener("keypress", async (event) => {
    if (event.key === "Enter") {
      await submitFormHandler();
    }
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
