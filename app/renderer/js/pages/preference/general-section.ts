import type {OpenDialogOptions} from "electron/renderer";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import * as remote from "@electron/remote";
import {app, dialog, session} from "@electron/remote";
import Tagify from "@yaireo/tagify";
import {z} from "zod";

import supportedLocales from "../../../../../public/translations/supported-locales.json";
import * as ConfigUtil from "../../../../common/config-util.ts";
import * as EnterpriseUtil from "../../../../common/enterprise-util.ts";
import {html} from "../../../../common/html.ts";
import * as t from "../../../../common/translation-util.ts";
import {ipcRenderer} from "../../typed-ipc-renderer.ts";

import {generateSelectHtml, generateSettingOption} from "./base-section.ts";

const currentBrowserWindow = remote.getCurrentWindow();

type GeneralSectionProperties = {
  $root: Element;
};

export async function initGeneralSection({
  $root,
}: GeneralSectionProperties): Promise<void> {
  const customCss = await ConfigUtil.getConfigItem("customCSS", "");
  const downloadsPath = await ConfigUtil.getConfigItem(
    "downloadsPath",
    app.getPath("downloads"),
  );
  $root.innerHTML = html`
    <div class="settings-pane">
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
            ${t.__("Show unread count badge on app icon")}
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
              ${customCss}
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
            <div class="download-folder-path">${downloadsPath}</div>
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

  await updateTrayOption();
  await updateBadgeOption();
  await updateSilentOption();
  await autoUpdateOption();
  await betaUpdateOption();
  await updateSidebarOption();
  await updateStartAtLoginOption();
  factoryReset();
  await showDesktopNotification();
  await enableSpellchecker();
  await minimizeOnStart();
  addCustomCss();
  await showCustomCssPath();
  removeCustomCss();
  downloadFolder();
  await updateQuitOnCloseOption();
  await updatePromptDownloadOption();
  await enableErrorReporting();
  await setLocale();
  await initSpellChecker();

  // Platform specific settings

  // Flashing taskbar on Windows
  if (process.platform === "win32") {
    await updateFlashTaskbar();
  }

  // Dock bounce on macOS
  if (process.platform === "darwin") {
    await updateDockBouncing();
  }

  // Auto hide menubar on Windows and Linux
  if (process.platform !== "darwin") {
    await updateMenubarOption();
  }

  async function updateTrayOption(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector("#tray-option .setting-control")!,
      value: await ConfigUtil.getConfigItem("trayIcon", true),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem("trayIcon", true));
        await ConfigUtil.setConfigItem("trayIcon", newValue);
        ipcRenderer.send("forward-message", "toggletray");
        await updateTrayOption();
      },
    });
  }

  async function updateMenubarOption(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector("#menubar-option .setting-control")!,
      value: await ConfigUtil.getConfigItem("autoHideMenubar", false),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem(
          "autoHideMenubar",
          false,
        ));
        await ConfigUtil.setConfigItem("autoHideMenubar", newValue);
        ipcRenderer.send("toggle-menubar", newValue);
        await updateMenubarOption();
      },
    });
  }

  async function updateBadgeOption(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector("#badge-option .setting-control")!,
      value: await ConfigUtil.getConfigItem("badgeOption", true),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem("badgeOption", true));
        await ConfigUtil.setConfigItem("badgeOption", newValue);
        ipcRenderer.send("toggle-badge-option", newValue);
        await updateBadgeOption();
      },
    });
  }

  async function updateDockBouncing(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector("#dock-bounce-option .setting-control")!,
      value: await ConfigUtil.getConfigItem("dockBouncing", true),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem(
          "dockBouncing",
          true,
        ));
        await ConfigUtil.setConfigItem("dockBouncing", newValue);
        await updateDockBouncing();
      },
    });
  }

  async function updateFlashTaskbar(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector("#flash-taskbar-option .setting-control")!,
      value: await ConfigUtil.getConfigItem("flashTaskbarOnMessage", true),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem(
          "flashTaskbarOnMessage",
          true,
        ));
        await ConfigUtil.setConfigItem("flashTaskbarOnMessage", newValue);
        await updateFlashTaskbar();
      },
    });
  }

  async function autoUpdateOption(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector("#autoupdate-option .setting-control")!,
      disabled: EnterpriseUtil.configItemExists("autoUpdate"),
      value: await ConfigUtil.getConfigItem("autoUpdate", true),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem("autoUpdate", true));
        await ConfigUtil.setConfigItem("autoUpdate", newValue);
        if (!newValue) {
          await ConfigUtil.setConfigItem("betaUpdate", false);
          await betaUpdateOption();
        }

        await autoUpdateOption();
      },
    });
  }

  async function betaUpdateOption(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector("#betaupdate-option .setting-control")!,
      value: await ConfigUtil.getConfigItem("betaUpdate", false),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem("betaUpdate", false));
        if (await ConfigUtil.getConfigItem("autoUpdate", true)) {
          await ConfigUtil.setConfigItem("betaUpdate", newValue);
          await betaUpdateOption();
        }
      },
    });
  }

  async function updateSilentOption(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector("#silent-option .setting-control")!,
      value: await ConfigUtil.getConfigItem("silent", false),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem("silent", true));
        await ConfigUtil.setConfigItem("silent", newValue);
        await updateSilentOption();
        ipcRenderer.send(
          "forward-to",
          currentBrowserWindow.webContents.id,
          "toggle-silent",
          newValue,
        );
      },
    });
  }

  async function showDesktopNotification(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector(
        "#show-notification-option .setting-control",
      )!,
      value: await ConfigUtil.getConfigItem("showNotification", true),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem(
          "showNotification",
          true,
        ));
        await ConfigUtil.setConfigItem("showNotification", newValue);
        await showDesktopNotification();
      },
    });
  }

  async function updateSidebarOption(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector("#sidebar-option .setting-control")!,
      value: await ConfigUtil.getConfigItem("showSidebar", true),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem("showSidebar", true));
        await ConfigUtil.setConfigItem("showSidebar", newValue);
        ipcRenderer.send("forward-message", "toggle-sidebar", newValue);
        await updateSidebarOption();
      },
    });
  }

  async function updateStartAtLoginOption(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector("#startAtLogin-option .setting-control")!,
      value: await ConfigUtil.getConfigItem("startAtLogin", false),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem(
          "startAtLogin",
          false,
        ));
        await ConfigUtil.setConfigItem("startAtLogin", newValue);
        ipcRenderer.send("toggleAutoLauncher", newValue);
        await updateStartAtLoginOption();
      },
    });
  }

  async function updateQuitOnCloseOption(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector("#quitOnClose-option .setting-control")!,
      value: await ConfigUtil.getConfigItem("quitOnClose", false),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem(
          "quitOnClose",
          false,
        ));
        await ConfigUtil.setConfigItem("quitOnClose", newValue);
        await updateQuitOnCloseOption();
      },
    });
  }

  async function enableSpellchecker(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector(
        "#enable-spellchecker-option .setting-control",
      )!,
      value: await ConfigUtil.getConfigItem("enableSpellchecker", true),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem(
          "enableSpellchecker",
          true,
        ));
        await ConfigUtil.setConfigItem("enableSpellchecker", newValue);
        ipcRenderer.send("configure-spell-checker");
        await enableSpellchecker();
        const spellcheckerLanguageInput: HTMLElement =
          $root.querySelector("#spellcheck-langs")!;
        const spellcheckerNote: HTMLElement = $root.querySelector("#note")!;
        spellcheckerLanguageInput.style.display =
          spellcheckerLanguageInput.style.display === "none" ? "" : "none";
        spellcheckerNote.style.display =
          spellcheckerNote.style.display === "none" ? "" : "none";
      },
    });
  }

  async function enableErrorReporting(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector(
        "#enable-error-reporting .setting-control",
      )!,
      value: await ConfigUtil.getConfigItem("errorReporting", true),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem(
          "errorReporting",
          true,
        ));
        await ConfigUtil.setConfigItem("errorReporting", newValue);
        await enableErrorReporting();
      },
    });
  }

  async function customCssDialog(): Promise<void> {
    const showDialogOptions: OpenDialogOptions = {
      title: t.__("Select file"),
      properties: ["openFile"],
      filters: [{name: t.__("CSS file"), extensions: ["css"]}],
    };

    const {filePaths, canceled} =
      await dialog.showOpenDialog(showDialogOptions);
    if (!canceled) {
      await ConfigUtil.setConfigItem("customCSS", filePaths[0]);
      ipcRenderer.send("forward-message", "hard-reload");
    }
  }

  async function setLocale(): Promise<void> {
    const langDiv: HTMLSelectElement = $root.querySelector(".lang-div")!;
    const langListHtml = generateSelectHtml(supportedLocales, "lang-menu");
    langDiv.innerHTML += langListHtml.html;
    // `langMenu` is the select-option dropdown menu formed after executing the previous command
    const langMenu: HTMLSelectElement = $root.querySelector(".lang-menu")!;

    // The next three lines set the selected language visible on the dropdown button
    let language = await ConfigUtil.getConfigItem("appLanguage", "en");
    language =
      language && langMenu.options.namedItem(language) ? language : "en";
    langMenu.options.namedItem(language)!.selected = true;

    langMenu.addEventListener("change", async () => {
      await ConfigUtil.setConfigItem("appLanguage", langMenu.value);
    });
  }

  async function minimizeOnStart(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector("#start-minimize-option .setting-control")!,
      value: await ConfigUtil.getConfigItem("startMinimized", false),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem(
          "startMinimized",
          false,
        ));
        await ConfigUtil.setConfigItem("startMinimized", newValue);
        await minimizeOnStart();
      },
    });
  }

  function addCustomCss(): void {
    const customCssButton = $root.querySelector(
      "#add-custom-css .custom-css-button",
    )!;
    customCssButton.addEventListener("click", async () => {
      await customCssDialog();
    });
  }

  async function showCustomCssPath(): Promise<void> {
    if (!(await ConfigUtil.getConfigItem("customCSS", null))) {
      const cssPath: HTMLElement = $root.querySelector("#remove-custom-css")!;
      cssPath.style.display = "none";
    }
  }

  function removeCustomCss(): void {
    const removeCssButton = $root.querySelector("#css-delete-action")!;
    removeCssButton.addEventListener("click", async () => {
      await ConfigUtil.setConfigItem("customCSS", "");
      ipcRenderer.send("forward-message", "hard-reload");
    });
  }

  async function downloadFolderDialog(): Promise<void> {
    const showDialogOptions: OpenDialogOptions = {
      title: t.__("Select Download Location"),
      properties: ["openDirectory"],
    };

    const {filePaths, canceled} =
      await dialog.showOpenDialog(showDialogOptions);
    if (!canceled) {
      await ConfigUtil.setConfigItem("downloadsPath", filePaths[0]);
      const downloadFolderPath: HTMLElement = $root.querySelector(
        ".download-folder-path",
      )!;
      downloadFolderPath.textContent = filePaths[0];
    }
  }

  function downloadFolder(): void {
    const downloadFolder = $root.querySelector(
      "#download-folder .download-folder-button",
    )!;
    downloadFolder.addEventListener("click", async () => {
      await downloadFolderDialog();
    });
  }

  async function updatePromptDownloadOption(): Promise<void> {
    generateSettingOption({
      $element: $root.querySelector("#prompt-download .setting-control")!,
      value: await ConfigUtil.getConfigItem("promptDownload", false),
      async clickHandler() {
        const newValue = !(await ConfigUtil.getConfigItem(
          "promptDownload",
          false,
        ));
        await ConfigUtil.setConfigItem("promptDownload", newValue);
        await updatePromptDownloadOption();
      },
    });
  }

  async function factoryResetSettings(): Promise<void> {
    const clearAppDataMessage = t.__(
      "When the application restarts, it will be as if you have just downloaded the Zulip app.",
    );
    const getAppPath = path.join(app.getPath("appData"), app.name);

    const {response} = await dialog.showMessageBox({
      type: "warning",
      buttons: [t.__("Yes"), t.__("No")],
      defaultId: 0,
      message: t.__("Are you sure?"),
      detail: clearAppDataMessage,
    });
    if (response === 0) {
      await fs.promises.rm(getAppPath, {recursive: true});
      setTimeout(() => {
        ipcRenderer.send("clear-app-settings");
      }, 1000);
    }
  }

  function factoryReset(): void {
    const factoryResetButton = $root.querySelector(
      "#factory-reset-option .factory-reset-button",
    )!;
    factoryResetButton.addEventListener("click", async () => {
      await factoryResetSettings();
    });
  }

  async function initSpellChecker(): Promise<void> {
    // The Electron API is a no-op on macOS and macOS default spellchecker is used.
    if (process.platform === "darwin") {
      const note: HTMLElement = $root.querySelector("#note")!;
      note.append(t.__("On macOS, the OS spellchecker is used."));
      note.append(document.createElement("br"));
      note.append(
        t.__(
          "Change the language from System Preferences → Keyboard → Text → Spelling.",
        ),
      );
    } else {
      const note: HTMLElement = $root.querySelector("#note")!;
      note.append(
        t.__("You can select a maximum of 3 languages for spellchecking."),
      );
      const spellDiv: HTMLElement = $root.querySelector("#spellcheck-langs")!;
      spellDiv.innerHTML += html`
        <div class="setting-description">${t.__("Spellchecker Languages")}</div>
        <div id="spellcheck-langs-value">
          <input name="spellcheck" placeholder="${t.__("Enter Languages")}" />
        </div>
      `.html;

      const availableLanguages = session.fromPartition(
        "persist:webviewsession",
      ).availableSpellCheckerLanguages;
      let languagePairs = new Map<string, string>();
      for (const l of availableLanguages) {
        const locale = new Intl.Locale(l.replaceAll("_", "-"));
        let displayName = new Intl.DisplayNames([locale], {
          type: "language",
        }).of(locale.language);
        if (displayName === undefined) continue;
        displayName = displayName.replace(/^./u, (firstChar) =>
          firstChar.toLocaleUpperCase(locale),
        );
        if (locale.script !== undefined)
          displayName += ` (${new Intl.DisplayNames([locale], {type: "script"}).of(locale.script)})`;
        if (locale.region !== undefined)
          displayName += ` (${new Intl.DisplayNames([locale], {type: "region"}).of(locale.region)})`;
        languagePairs.set(displayName, l);
      }

      languagePairs = new Map(
        [...languagePairs].sort((a, b) => a[0].localeCompare(b[1])),
      );

      const tagField: HTMLInputElement = $root.querySelector(
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
          position: "manual",
          classname: "settings-tagify-dropdown",
        },
      });
      tagify.DOM.input.addEventListener("focus", () => {
        tagify.dropdown.show();
        $root
          .querySelector("#spellcheck-langs-value")!
          .append(tagify.DOM.dropdown);
      });
      tagify.DOM.input.addEventListener("blur", () => {
        tagify.dropdown.hide(true);
        tagify.DOM.dropdown.remove();
      });

      const configuredLanguages: string[] = (
        (await ConfigUtil.getConfigItem("spellcheckerLanguages", null)) ?? []
      ).map(
        (code: string) =>
          [...languagePairs].find((pair) => pair[1] === code)![0],
      );
      tagify.addTags(configuredLanguages);

      tagField.addEventListener("change", async () => {
        if (tagField.value.length === 0) {
          await ConfigUtil.setConfigItem("spellcheckerLanguages", []);
          ipcRenderer.send("configure-spell-checker");
        } else {
          const data: unknown = JSON.parse(tagField.value);
          const spellLangs: string[] = z
            .array(z.object({value: z.string()}))
            .parse(data)
            .map((elt) => languagePairs.get(elt.value)!);
          await ConfigUtil.setConfigItem("spellcheckerLanguages", spellLangs);
          ipcRenderer.send("configure-spell-checker");
        }
      });
    }

    // Do not display the spellchecker input and note if it is disabled
    if (!(await ConfigUtil.getConfigItem("enableSpellchecker", true))) {
      const spellcheckerLanguageInput: HTMLElement =
        $root.querySelector("#spellcheck-langs")!;
      const spellcheckerNote: HTMLElement = $root.querySelector("#note")!;
      spellcheckerLanguageInput.style.display = "none";
      spellcheckerNote.style.display = "none";
    }
  }
}
