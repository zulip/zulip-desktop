import {html} from "../../../../common/html";
import * as t from "../../../../common/translation-util";
import {ipcRenderer} from "../../typed-ipc-renderer";
import * as DomainUtil from "../../utils/domain-util";

import {reloadApp} from "./base-section";
import {initFindAccounts} from "./find-accounts";
import {initServerInfoForm} from "./server-info-form";

interface ConnectedOrgSectionProps {
  $root: Element;
}

export function initConnectedOrgSection(props: ConnectedOrgSectionProps): void {
  props.$root.textContent = "";

  const servers = DomainUtil.getDomains();
  props.$root.innerHTML = html`
    <div class="settings-pane" id="server-settings-pane">
      <div class="page-title">${t.__("Connected organizations")}</div>
      <div class="title" id="existing-servers">
        ${t.__("All the connected orgnizations will appear here.")}
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

  const $serverInfoContainer = document.querySelector(
    "#server-info-container",
  )!;
  const $existingServers = document.querySelector("#existing-servers")!;
  const $newOrgButton: HTMLButtonElement =
    document.querySelector("#new-org-button")!;
  const $findAccountsContainer = document.querySelector(
    "#find-accounts-container",
  )!;

  const noServerText = t.__("All the connected orgnizations will appear here");
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
