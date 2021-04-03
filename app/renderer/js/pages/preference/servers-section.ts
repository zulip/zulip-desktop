import {html} from "../../../../common/html";
import * as t from "../../../../common/translation-util";

import {reloadApp} from "./base-section";
import {initNewServerForm} from "./new-server-form";

interface ServersSectionProps {
  $root: Element;
}

export function initServersSection(props: ServersSectionProps): void {
  props.$root.textContent = "";

  props.$root.innerHTML = html`
    <div class="add-server-modal">
      <div class="modal-container">
        <div class="settings-pane" id="server-settings-pane">
          <div class="page-title">${t.__("Add a Zulip organization")}</div>
          <div id="new-server-container"></div>
        </div>
      </div>
    </div>
  `.html;
  const $newServerContainer = document.querySelector("#new-server-container")!;

  initNewServerForm({
    $root: $newServerContainer,
    onChange: reloadApp,
  });
}
