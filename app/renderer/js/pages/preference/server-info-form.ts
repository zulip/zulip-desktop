import {dialog} from "@electron/remote";

import {html} from "../../../../common/html.js";
import * as Messages from "../../../../common/messages.js";
import * as t from "../../../../common/translation-util.js";
import type {ServerConf} from "../../../../common/types.js";
import {generateNodeFromHTML} from "../../components/base.js";
import {ipcRenderer} from "../../typed-ipc-renderer.js";
import * as DomainUtil from "../../utils/domain-util.js";

interface ServerInfoFormProps {
  $root: Element;
  server: ServerConf;
  index: number;
  onChange: () => void;
}

export function initServerInfoForm(props: ServerInfoFormProps): void {
  const $serverInfoForm = generateNodeFromHTML(html`
    <div class="settings-card">
      <div class="server-info-left">
        <img class="server-info-icon" src="${props.server.icon}" />
        <div class="server-info-row">
          <span class="server-info-alias">${props.server.alias}</span>
          <i class="material-icons open-tab-button">open_in_new</i>
        </div>
      </div>
      <div class="server-info-right">
        <div class="server-info-row server-url">
          <span class="server-url-info" title="${props.server.url}"
            >${props.server.url}</span
          >
        </div>
        <div class="server-info-row">
          <div class="action red server-delete-action">
            <span>${t.__("Disconnect")}</span>
          </div>
        </div>
      </div>
    </div>
  `);
  const $serverInfoAlias = $serverInfoForm.querySelector(".server-info-alias")!;
  const $serverIcon = $serverInfoForm.querySelector(".server-info-icon")!;
  const $deleteServerButton = $serverInfoForm.querySelector(
    ".server-delete-action",
  )!;
  const $openServerButton = $serverInfoForm.querySelector(".open-tab-button")!;
  props.$root.append($serverInfoForm);

  $deleteServerButton.addEventListener("click", async () => {
    const {response} = await dialog.showMessageBox({
      type: "warning",
      buttons: [t.__("YES"), t.__("NO")],
      defaultId: 0,
      message: t.__("Are you sure you want to disconnect this organization?"),
    });
    if (response === 0) {
      if (DomainUtil.removeDomain(props.index)) {
        ipcRenderer.send("reload-full-app");
      } else {
        const {title, content} = Messages.orgRemovalError(
          DomainUtil.getDomain(props.index).url,
        );
        dialog.showErrorBox(title, content);
      }
    }
  });

  $openServerButton.addEventListener("click", () => {
    ipcRenderer.send("forward-message", "switch-server-tab", props.index);
  });

  $serverInfoAlias.addEventListener("click", () => {
    ipcRenderer.send("forward-message", "switch-server-tab", props.index);
  });

  $serverIcon.addEventListener("click", () => {
    ipcRenderer.send("forward-message", "switch-server-tab", props.index);
  });
}
