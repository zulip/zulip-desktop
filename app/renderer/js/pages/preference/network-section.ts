import * as ConfigUtil from "../../../../common/config-util.js";
import {html} from "../../../../common/html.js";
import * as t from "../../../../common/translation-util.js";
import {ipcRenderer} from "../../typed-ipc-renderer.js";

import {generateSettingOption} from "./base-section.js";

type NetworkSectionProperties = {
  $root: Element;
};

export function initNetworkSection({$root}: NetworkSectionProperties): void {
  $root.innerHTML = html`
    <div class="settings-pane">
      <div class="title">${t.__("Proxy")}</div>
      <div id="appearance-option-settings" class="settings-card">
        <div class="setting-row" id="use-system-settings">
          <div class="setting-description">
            ${t.__("Use system proxy settings (requires restart)")}
          </div>
          <div class="setting-control"></div>
        </div>
        <div class="setting-row" id="use-manual-settings">
          <div class="setting-description">
            ${t.__("Manual proxy configuration")}
          </div>
          <div class="setting-control"></div>
        </div>
        <div class="manual-proxy-block">
          <div class="setting-row" id="proxy-pac-option">
            <span class="setting-input-key">PAC ${t.__("script")}</span>
            <input
              class="setting-input-value"
              placeholder="e.g. foobar.com/pacfile.js"
            />
          </div>
          <div class="setting-row" id="proxy-rules-option">
            <span class="setting-input-key">${t.__("Proxy rules")}</span>
            <input
              class="setting-input-value"
              placeholder="e.g. http=foopy:80;ftp=foopy2"
            />
          </div>
          <div class="setting-row" id="proxy-bypass-option">
            <span class="setting-input-key">${t.__("Proxy bypass rules")}</span>
            <input class="setting-input-value" placeholder="e.g. foobar.com" />
          </div>
          <div class="setting-row">
            <div class="action green" id="proxy-save-action">
              <span>${t.__("Save")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `.html;

  const $proxyPac: HTMLInputElement = $root.querySelector(
    "#proxy-pac-option .setting-input-value",
  )!;
  const $proxyRules: HTMLInputElement = $root.querySelector(
    "#proxy-rules-option .setting-input-value",
  )!;
  const $proxyBypass: HTMLInputElement = $root.querySelector(
    "#proxy-bypass-option .setting-input-value",
  )!;
  const $proxySaveAction = $root.querySelector("#proxy-save-action")!;
  const $manualProxyBlock = $root.querySelector(".manual-proxy-block")!;

  toggleManualProxySettings(ConfigUtil.getConfigItem("useManualProxy", false));
  updateProxyOption();

  $proxyPac.value = ConfigUtil.getConfigItem("proxyPAC", "");
  $proxyRules.value = ConfigUtil.getConfigItem("proxyRules", "");
  $proxyBypass.value = ConfigUtil.getConfigItem("proxyBypass", "");

  $proxySaveAction.addEventListener("click", () => {
    ConfigUtil.setConfigItem("proxyPAC", $proxyPac.value);
    ConfigUtil.setConfigItem("proxyRules", $proxyRules.value);
    ConfigUtil.setConfigItem("proxyBypass", $proxyBypass.value);

    ipcRenderer.send("forward-message", "reload-proxy", true);
  });

  function toggleManualProxySettings(option: boolean): void {
    $manualProxyBlock.classList.toggle("hidden", !option);
  }

  function updateProxyOption(): void {
    generateSettingOption({
      $element: $root.querySelector("#use-system-settings .setting-control")!,
      value: ConfigUtil.getConfigItem("useSystemProxy", false),
      clickHandler() {
        const newValue = !ConfigUtil.getConfigItem("useSystemProxy", false);
        const manualProxyValue = ConfigUtil.getConfigItem(
          "useManualProxy",
          false,
        );
        if (manualProxyValue && newValue) {
          ConfigUtil.setConfigItem("useManualProxy", !manualProxyValue);
          toggleManualProxySettings(!manualProxyValue);
        }

        if (!newValue) {
          // Remove proxy system proxy settings
          ConfigUtil.setConfigItem("proxyRules", "");
          ipcRenderer.send("forward-message", "reload-proxy", false);
        }

        ConfigUtil.setConfigItem("useSystemProxy", newValue);
        updateProxyOption();
      },
    });
    generateSettingOption({
      $element: $root.querySelector("#use-manual-settings .setting-control")!,
      value: ConfigUtil.getConfigItem("useManualProxy", false),
      clickHandler() {
        const newValue = !ConfigUtil.getConfigItem("useManualProxy", false);
        const systemProxyValue = ConfigUtil.getConfigItem(
          "useSystemProxy",
          false,
        );
        toggleManualProxySettings(newValue);
        if (systemProxyValue && newValue) {
          ConfigUtil.setConfigItem("useSystemProxy", !systemProxyValue);
        }

        ConfigUtil.setConfigItem("proxyRules", "");
        ConfigUtil.setConfigItem("useManualProxy", newValue);
        // Reload app only when turning manual proxy off, hence !newValue
        ipcRenderer.send("forward-message", "reload-proxy", !newValue);
        updateProxyOption();
      },
    });
  }
}
