import type {OpenDialogOptions} from "electron";
import {remote} from "electron";
import fs from "fs";
import path from "path";

import Tagify from "@yaireo/tagify";
import ISO6391 from "iso-639-1";
import * as z from "zod";

import * as ConfigUtil from "../../../../common/config-util";
import * as EnterpriseUtil from "../../../../common/enterprise-util";
import {html} from "../../../../common/html";
import * as t from "../../../../common/translation-util";
import supportedLocales from "../../../../translations/supported-locales.json";
import {ipcRenderer} from "../../typed-ipc-renderer";

import {
  exitSettings,
  generateSelectHTML,
  generateSettingOption,
} from "./base-section";

const {app, dialog, session} = remote;
const currentBrowserWindow = remote.getCurrentWindow();

interface GeneralSectionProps {
  $root: Element;
}

export function initGeneralSection(props: GeneralSectionProps): void {
  props.$root.innerHTML = html`
    <div class="settings-pane">
      <span class="exit-sign">×</span>
      <div class="title">${t.__("Appearance")}</div>
      <div id="appearance-option-settings" class="settings-card">
        <div class="setting-row" id="tray-option">
          <div class="setting-description">
            ${t.__("Show app icon in system tray")}
          </div>
          <div class="setting-control"></div>
        </div>
        <div
          class="setting-row"
          id="menubar-option"
          style="display:${process.platform === "darwin" ? "none" : ""}"
        >
          <div class="setting-description">
            ${t.__("Auto hide menu bar (Press Alt key to display)")}
          </div>
          <div class="setting-control"></div>
        </div>
        <div class="setting-row" id="sidebar-option">
          <div class="setting-description">
            ${t.__("Show sidebar")} (<span class="code"
              >${process.platform === "darwin"
                ? "Cmd+Shift+S"
                : "Ctrl+Shift+S"}</span
            >)
          </div>
          <div class="setting-control"></div>
        </div>
        <div class="setting-row" id="badge-option">
          <div class="setting-description">
            ${t.__("Show app unread badge")}
          </div>
          <div class="setting-control"></div>
        </div>
        <div
          class="setting-row"
          id="dock-bounce-option"
          style="display:${process.platform === "darwin" ? "" : "none"}"
        >
          <div class="setting-description">
            ${t.__("Bounce dock on new private message")}
          </div>
          <div class="setting-control"></div>
        </div>
        <div
          class="setting-row"
          id="flash-taskbar-option"
          style="display:${process.platform === "win32" ? "" : "none"}"
        >
          <div class="setting-description">
            ${t.__("Flash taskbar on new message")}
          </div>
          <div class="setting-control"></div>
        </div>
      </div>
      <div class="title">${t.__("Desktop Notifications")}</div>
      <div class="settings-card">
        <div class="setting-row" id="show-notification-option">
          <div class="setting-description">
            ${t.__("Show desktop notifications")}
          </div>
          <div class="setting-control"></div>
        </div>
        <div class="setting-row" id="silent-option">
          <div class="setting-description">
            ${t.__("Mute all sounds from Zulip")}
          </div>
          <div class="setting-control"></div>
        </div>
      </div>
      <div class="title">${t.__("App Updates")}</div>
      <div class="settings-card">
        <div class="setting-row" id="autoupdate-option">
          <div class="setting-description">${t.__("Enable auto updates")}</div>
          <div class="setting-control"></div>
        </div>
        <div class="setting-row" id="betaupdate-option">
          <div class="setting-description">${t.__("Get beta updates")}</div>
          <div class="setting-control"></div>
        </div>
      </div>
      <div class="title">${t.__("Functionality")}</div>
      <div class="settings-card">
        <div class="setting-row" id="startAtLogin-option">
          <div class="setting-description">${t.__("Start app at login")}</div>
          <div class="setting-control"></div>
        </div>
        <div class="setting-row" id="start-minimize-option">
          <div class="setting-description">
            ${t.__("Always start minimized")}
          </div>
          <div class="setting-control"></div>
        </div>
        <div class="setting-row" id="quitOnClose-option">
          <div class="setting-description">
            ${t.__("Quit when the window is closed")}
          </div>
          <div class="setting-control"></div>
        </div>
        <div class="setting-row" id="enable-spellchecker-option">
          <div class="setting-description">
            ${t.__("Enable spellchecker (requires restart)")}
          </div>
          <div class="setting-control"></div>
        </div>
        <div
          class="setting-row"
          id="spellcheck-langs"
          style="display:${process.platform === "darwin" ? "none" : ""}"
        ></div>
        <div class="setting-row" id="note"></div>
      </div>

      <div class="title">${t.__("Advanced")}</div>
      <div class="settings-card">
        <div class="setting-row" id="enable-error-reporting">
          <div class="setting-description">
            ${t.__("Enable error reporting (requires restart)")}
          </div>
          <div class="setting-control"></div>
        </div>

        <div class="setting-row" id="app-language">
          <div class="setting-description">
            ${t.__("App language (requires restart)")}
          </div>
          <div id="lang-div" class="lang-div"></div>
        </div>

        <div class="setting-row" id="add-custom-css">
          <div class="setting-description">${t.__("Add custom CSS")}</div>
          <button class="custom-css-button green">${t.__("Upload")}</button>
        </div>
        <div class="setting-row" id="remove-custom-css">
          <div class="setting-description">
            <div class="selected-css-path" id="custom-css-path">
              ${ConfigUtil.getConfigItem("customCSS", "")}
            </div>
          </div>
          <div class="action red" id="css-delete-action">
            <i class="material-icons">indeterminate_check_box</i>
            <span>${t.__("Delete")}</span>
          </div>
        </div>
        <div class="setting-row" id="download-folder">
          <div class="setting-description">
            ${t.__("Default download location")}
          </div>
          <button class="download-folder-button green">
            ${t.__("Change")}
          </button>
        </div>
        <div class="setting-row">
          <div class="setting-description">
            <div class="download-folder-path">
              ${ConfigUtil.getConfigItem(
                "downloadsPath",
                app.getPath("downloads"),
              )}
            </div>
          </div>
        </div>
        <div class="setting-row" id="prompt-download">
          <div class="setting-description">
            ${t.__("Ask where to save files before downloading")}
          </div>
          <div class="setting-control"></div>
        </div>
      </div>
      <div class="title">${t.__("Factory Reset Data")}</div>
      <div class="settings-card">
        <div class="setting-row" id="factory-reset-option">
          <div class="setting-description">
            ${t.__(
              "Reset the application, thus deleting all the connected organizations and accounts.",
            )}
          </div>
          <button class="factory-reset-button red w-150">
            ${t.__("Factory Reset")}
          </button>
        </div>
      </div>
    </div>
  `.html;

  exitSettings();
  updateTrayOption();
  updateBadgeOption();
  updateSilentOption();
  autoUpdateOption();
  betaUpdateOption();
  updateSidebarOption();
  updateStartAtLoginOption();
  factoryReset();
  showDesktopNotification();
  enableSpellchecker();
  minimizeOnStart();
  addCustomCSS();
  showCustomCSSPath();
  removeCustomCSS();
  downloadFolder();
  updateQuitOnCloseOption();
  updatePromptDownloadOption();
  enableErrorReporting();
  setLocale();
  initSpellChecker();

  // Platform specific settings

  // Flashing taskbar on Windows
  if (process.platform === "win32") {
    updateFlashTaskbar();
  }

  // Dock bounce on macOS
  if (process.platform === "darwin") {
    updateDockBouncing();
  }

  // Auto hide menubar on Windows and Linux
  if (process.platform !== "darwin") {
    updateMenubarOption();
  }

  function updateTrayOption(): void {
    generateSettingOption({
      $element: document.querySelector("#tray-option .setting-control")!,
      value: ConfigUtil.getConfigItem("trayIcon", true),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("trayIcon", true);
        ConfigUtil.setConfigItem("trayIcon", newValue);
        ipcRenderer.send("forward-message", "toggletray");
        updateTrayOption();
      },
    });
  }

  function updateMenubarOption(): void {
    generateSettingOption({
      $element: document.querySelector("#menubar-option .setting-control")!,
      value: ConfigUtil.getConfigItem("autoHideMenubar", false),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("autoHideMenubar", false);
        ConfigUtil.setConfigItem("autoHideMenubar", newValue);
        ipcRenderer.send("toggle-menubar", newValue);
        updateMenubarOption();
      },
    });
  }

  function updateBadgeOption(): void {
    generateSettingOption({
      $element: document.querySelector("#badge-option .setting-control")!,
      value: ConfigUtil.getConfigItem("badgeOption", true),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("badgeOption", true);
        ConfigUtil.setConfigItem("badgeOption", newValue);
        ipcRenderer.send("toggle-badge-option", newValue);
        updateBadgeOption();
      },
    });
  }

  function updateDockBouncing(): void {
    generateSettingOption({
      $element: document.querySelector("#dock-bounce-option .setting-control")!,
      value: ConfigUtil.getConfigItem("dockBouncing", true),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("dockBouncing", true);
        ConfigUtil.setConfigItem("dockBouncing", newValue);
        updateDockBouncing();
      },
    });
  }

  function updateFlashTaskbar(): void {
    generateSettingOption({
      $element: document.querySelector(
        "#flash-taskbar-option .setting-control",
      )!,
      value: ConfigUtil.getConfigItem("flashTaskbarOnMessage", true),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem(
          "flashTaskbarOnMessage",
          true,
        );
        ConfigUtil.setConfigItem("flashTaskbarOnMessage", newValue);
        updateFlashTaskbar();
      },
    });
  }

  function autoUpdateOption(): void {
    generateSettingOption({
      $element: document.querySelector("#autoupdate-option .setting-control")!,
      disabled: EnterpriseUtil.configItemExists("autoUpdate"),
      value: ConfigUtil.getConfigItem("autoUpdate", true),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("autoUpdate", true);
        ConfigUtil.setConfigItem("autoUpdate", newValue);
        if (!newValue) {
          ConfigUtil.setConfigItem("betaUpdate", false);
          betaUpdateOption();
        }

        autoUpdateOption();
      },
    });
  }

  function betaUpdateOption(): void {
    generateSettingOption({
      $element: document.querySelector("#betaupdate-option .setting-control")!,
      value: ConfigUtil.getConfigItem("betaUpdate", false),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("betaUpdate", false);
        if (ConfigUtil.getConfigItem("autoUpdate", true)) {
          ConfigUtil.setConfigItem("betaUpdate", newValue);
          betaUpdateOption();
        }
      },
    });
  }

  function updateSilentOption(): void {
    generateSettingOption({
      $element: document.querySelector("#silent-option .setting-control")!,
      value: ConfigUtil.getConfigItem("silent", false),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("silent", true);
        ConfigUtil.setConfigItem("silent", newValue);
        updateSilentOption();
        ipcRenderer.sendTo(
          currentBrowserWindow.webContents.id,
          "toggle-silent",
          newValue,
        );
      },
    });
  }

  function showDesktopNotification(): void {
    generateSettingOption({
      $element: document.querySelector(
        "#show-notification-option .setting-control",
      )!,
      value: ConfigUtil.getConfigItem("showNotification", true),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("showNotification", true);
        ConfigUtil.setConfigItem("showNotification", newValue);
        showDesktopNotification();
      },
    });
  }

  function updateSidebarOption(): void {
    generateSettingOption({
      $element: document.querySelector("#sidebar-option .setting-control")!,
      value: ConfigUtil.getConfigItem("showSidebar", true),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("showSidebar", true);
        ConfigUtil.setConfigItem("showSidebar", newValue);
        ipcRenderer.send("forward-message", "toggle-sidebar", newValue);
        updateSidebarOption();
      },
    });
  }

  function updateStartAtLoginOption(): void {
    generateSettingOption({
      $element: document.querySelector(
        "#startAtLogin-option .setting-control",
      )!,
      value: ConfigUtil.getConfigItem("startAtLogin", false),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("startAtLogin", false);
        ConfigUtil.setConfigItem("startAtLogin", newValue);
        ipcRenderer.send("toggleAutoLauncher", newValue);
        updateStartAtLoginOption();
      },
    });
  }

  function updateQuitOnCloseOption(): void {
    generateSettingOption({
      $element: document.querySelector("#quitOnClose-option .setting-control")!,
      value: ConfigUtil.getConfigItem("quitOnClose", false),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("quitOnClose", false);
        ConfigUtil.setConfigItem("quitOnClose", newValue);
        updateQuitOnCloseOption();
      },
    });
  }

  function enableSpellchecker(): void {
    generateSettingOption({
      $element: document.querySelector(
        "#enable-spellchecker-option .setting-control",
      )!,
      value: ConfigUtil.getConfigItem("enableSpellchecker", true),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("enableSpellchecker", true);
        ConfigUtil.setConfigItem("enableSpellchecker", newValue);
        enableSpellchecker();
        const spellcheckerLanguageInput: HTMLElement =
          document.querySelector("#spellcheck-langs")!;
        const spellcheckerNote: HTMLElement = document.querySelector("#note")!;
        spellcheckerLanguageInput.style.display =
          spellcheckerLanguageInput.style.display === "none" ? "" : "none";
        spellcheckerNote.style.display =
          spellcheckerNote.style.display === "none" ? "" : "none";
      },
    });
  }

  function enableErrorReporting(): void {
    generateSettingOption({
      $element: document.querySelector(
        "#enable-error-reporting .setting-control",
      )!,
      value: ConfigUtil.getConfigItem("errorReporting", true),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("errorReporting", true);
        ConfigUtil.setConfigItem("errorReporting", newValue);
        enableErrorReporting();
      },
    });
  }

  async function customCssDialog(): Promise<void> {
    const showDialogOptions: OpenDialogOptions = {
      title: "Select file",
      properties: ["openFile"],
      filters: [{name: "CSS file", extensions: ["css"]}],
    };

    const {filePaths, canceled} = await dialog.showOpenDialog(
      showDialogOptions,
    );
    if (!canceled) {
      ConfigUtil.setConfigItem("customCSS", filePaths[0]);
      ipcRenderer.send("forward-message", "hard-reload");
    }
  }

  function setLocale(): void {
    const langDiv: HTMLSelectElement = document.querySelector(".lang-div")!;
    const langListHTML = generateSelectHTML(supportedLocales, "lang-menu");
    langDiv.innerHTML += langListHTML.html;
    // `langMenu` is the select-option dropdown menu formed after executing the previous command
    const langMenu: HTMLSelectElement = document.querySelector(".lang-menu")!;

    // The next three lines set the selected language visible on the dropdown button
    let language = ConfigUtil.getConfigItem("appLanguage", "en");
    language =
      language && langMenu.options.namedItem(language) ? language : "en";
    langMenu.options.namedItem(language)!.selected = true;

    langMenu.addEventListener("change", () => {
      ConfigUtil.setConfigItem("appLanguage", langMenu.value);
    });
  }

  function minimizeOnStart(): void {
    generateSettingOption({
      $element: document.querySelector(
        "#start-minimize-option .setting-control",
      )!,
      value: ConfigUtil.getConfigItem("startMinimized", false),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("startMinimized", false);
        ConfigUtil.setConfigItem("startMinimized", newValue);
        minimizeOnStart();
      },
    });
  }

  function addCustomCSS(): void {
    const customCSSButton = document.querySelector(
      "#add-custom-css .custom-css-button",
    )!;
    customCSSButton.addEventListener("click", async () => {
      await customCssDialog();
    });
  }

  function showCustomCSSPath(): void {
    if (!ConfigUtil.getConfigItem("customCSS", null)) {
      const cssPATH: HTMLElement =
        document.querySelector("#remove-custom-css")!;
      cssPATH.style.display = "none";
    }
  }

  function removeCustomCSS(): void {
    const removeCSSButton = document.querySelector("#css-delete-action")!;
    removeCSSButton.addEventListener("click", () => {
      ConfigUtil.setConfigItem("customCSS", "");
      ipcRenderer.send("forward-message", "hard-reload");
    });
  }

  async function downloadFolderDialog(): Promise<void> {
    const showDialogOptions: OpenDialogOptions = {
      title: "Select Download Location",
      properties: ["openDirectory"],
    };

    const {filePaths, canceled} = await dialog.showOpenDialog(
      showDialogOptions,
    );
    if (!canceled) {
      ConfigUtil.setConfigItem("downloadsPath", filePaths[0]);
      const downloadFolderPath: HTMLElement = document.querySelector(
        ".download-folder-path",
      )!;
      downloadFolderPath.textContent = filePaths[0];
    }
  }

  function downloadFolder(): void {
    const downloadFolder = document.querySelector(
      "#download-folder .download-folder-button",
    )!;
    downloadFolder.addEventListener("click", async () => {
      await downloadFolderDialog();
    });
  }

  function updatePromptDownloadOption(): void {
    generateSettingOption({
      $element: document.querySelector("#prompt-download .setting-control")!,
      value: ConfigUtil.getConfigItem("promptDownload", false),
      clickHandler: () => {
        const newValue = !ConfigUtil.getConfigItem("promptDownload", false);
        ConfigUtil.setConfigItem("promptDownload", newValue);
        updatePromptDownloadOption();
      },
    });
  }

  async function factoryResetSettings(): Promise<void> {
    const clearAppDataMessage =
      "When the application restarts, it will be as if you have just downloaded Zulip app.";
    const getAppPath = path.join(app.getPath("appData"), app.name);

    const {response} = await dialog.showMessageBox({
      type: "warning",
      buttons: ["YES", "NO"],
      defaultId: 0,
      message: "Are you sure?",
      detail: clearAppDataMessage,
    });
    if (response === 0) {
      await fs.promises.rmdir(getAppPath, {recursive: true});
      setTimeout(() => {
        ipcRenderer.send("clear-app-settings");
      }, 1000);
    }
  }

  function factoryReset(): void {
    const factoryResetButton = document.querySelector(
      "#factory-reset-option .factory-reset-button",
    )!;
    factoryResetButton.addEventListener("click", async () => {
      await factoryResetSettings();
    });
  }

  function initSpellChecker(): void {
    // The elctron API is a no-op on macOS and macOS default spellchecker is used.
    if (process.platform === "darwin") {
      const note: HTMLElement = document.querySelector("#note")!;
      note.append(t.__("On macOS, the OS spellchecker is used."));
      note.append(document.createElement("br"));
      note.append(
        t.__(
          "Change the language from System Preferences → Keyboard → Text → Spelling.",
        ),
      );
    } else {
      const note: HTMLElement = document.querySelector("#note")!;
      note.append(
        t.__("You can select a maximum of 3 languages for spellchecking."),
      );
      const spellDiv: HTMLElement =
        document.querySelector("#spellcheck-langs")!;
      spellDiv.innerHTML += html`
        <div class="setting-description">${t.__("Spellchecker Languages")}</div>
        <input name="spellcheck" placeholder="Enter Languages" />
      `.html;

      const availableLanguages = session.fromPartition(
        "persist:webviewsession",
      ).availableSpellCheckerLanguages;
      let languagePairs: Map<string, string> = new Map();
      for (const l of availableLanguages) {
        if (ISO6391.validate(l)) {
          languagePairs.set(ISO6391.getName(l), l);
        }
      }

      // Manually set names for languages not available in ISO6391
      languagePairs.set("English (AU)", "en-AU");
      languagePairs.set("English (CA)", "en-CA");
      languagePairs.set("English (GB)", "en-GB");
      languagePairs.set("English (US)", "en-US");
      languagePairs.set("Spanish (Latin America)", "es-419");
      languagePairs.set("Spanish (Argentina)", "es-AR");
      languagePairs.set("Spanish (Mexico)", "es-MX");
      languagePairs.set("Spanish (US)", "es-US");
      languagePairs.set("Portuguese (Brazil)", "pt-BR");
      languagePairs.set("Portuguese (Portugal)", "pt-PT");
      languagePairs.set("Serbo-Croatian", "sh");

      languagePairs = new Map(
        [...languagePairs].sort((a, b) => (a[0] < b[0] ? -1 : 1)),
      );

      const tagField: HTMLInputElement = document.querySelector(
        "input[name=spellcheck]",
      )!;
      const tagify = new Tagify(tagField, {
        whitelist: [...languagePairs.keys()],
        enforceWhitelist: true,
        maxTags: 3,
        dropdown: {
          enabled: 0,
          maxItems: Number.POSITIVE_INFINITY,
          closeOnSelect: false,
          highlightFirst: true,
        },
      });

      const configuredLanguages: string[] = (
        ConfigUtil.getConfigItem("spellcheckerLanguages", null) ?? []
      ).map(
        (code: string) =>
          [...languagePairs].find((pair) => pair[1] === code)![0],
      );
      tagify.addTags(configuredLanguages);

      tagField.addEventListener("change", () => {
        if (tagField.value.length === 0) {
          ConfigUtil.setConfigItem("spellcheckerLanguages", []);
          ipcRenderer.send("set-spellcheck-langs");
        } else {
          const data: unknown = JSON.parse(tagField.value);
          const spellLangs: string[] = z
            .array(z.object({value: z.string()}))
            .parse(data)
            .map((elt) => languagePairs.get(elt.value)!);
          ConfigUtil.setConfigItem("spellcheckerLanguages", spellLangs);
          ipcRenderer.send("set-spellcheck-langs");
        }
      });
    }

    // Do not display the spellchecker input and note if it is disabled
    if (!ConfigUtil.getConfigItem("enableSpellchecker", true)) {
      const spellcheckerLanguageInput: HTMLElement =
        document.querySelector("#spellcheck-langs")!;
      const spellcheckerNote: HTMLElement = document.querySelector("#note")!;
      spellcheckerLanguageInput.style.display = "none";
      spellcheckerNote.style.display = "none";
    }
  }
}
