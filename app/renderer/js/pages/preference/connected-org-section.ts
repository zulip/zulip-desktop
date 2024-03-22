import {html} from "../../../../common/html.js";
import * as t from "../../../../common/translation-util.js";
import {ipcRenderer} from "../../typed-ipc-renderer.js";
import * as DomainUtil from "../../utils/domain-util.js";

import {reloadApp} from "./base-section.js";
import {initFindAccounts} from "./find-accounts.js";
import {initServerInfoForm} from "./server-info-form.js";

type ConnectedOrgSectionProperties = {
  $root: Element;
};

export function initConnectedOrgSection({
  $root,
}: ConnectedOrgSectionProperties): void {
  $root.textContent = "";

  const servers = DomainUtil.getDomains();
  $root.innerHTML = html`
    <div class="settings-pane" id="server-settings-pane">
      <div class="page-title">${t.__("Connected organizations")}</div>
      <div class="title" id="existing-servers">
        ${t.__("All the connected organizations will appear here.")}
      </div>
      <div id="server-info-container"></div>
      <div id="new-org-button">
        <button class="green sea w-250">
          ${t.__("Connect to another organization")}
        </button>
      </div>
      <div class="page-title">${t.__("Find accounts by email")}</div>
      <div id="find-accounts-container"></div>
    </div>
  `.html;

  const $serverInfoContainer = $root.querySelector("#server-info-container")!;
  const $existingServers = $root.querySelector("#existing-servers")!;
  const $newOrgButton: HTMLButtonElement =
    $root.querySelector("#new-org-button")!;
  const $findAccountsContainer = $root.querySelector(
    "#find-accounts-container",
  )!;

  const noServerText = t.__(
    "All the connected organizations will appear here.",
  );
  // Show noServerText if no servers are there otherwise hide it
  $existingServers.textContent = servers.length === 0 ? noServerText : "";

  for (const [i, server] of servers.entries()) {
    initServerInfoForm({
      $root: $serverInfoContainer,
      server,
      index: i,
      onChange: reloadApp,
    });
  }

  $newOrgButton.addEventListener("click", () => {
    ipcRenderer.send("forward-message", "open-org-tab");
  });

  initFindAccounts({
    $root: $findAccountsContainer,
  });
}
