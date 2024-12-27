import {type Event, clipboard} from "electron/common";
import type {WebContents} from "electron/main";
import type {
  ContextMenuParams,
  MenuItemConstructorOptions,
} from "electron/renderer";
import process from "node:process";

import {Menu} from "@electron/remote";

import * as t from "../../../common/translation-util.js";

export const contextMenu = (
  webContents: WebContents,
  event: Event,
  properties: ContextMenuParams,
) => {
  const isText = properties.selectionText !== "";
  const isLink = properties.linkURL !== "";
  const linkUrl = isLink ? new URL(properties.linkURL) : undefined;

  const makeSuggestion = (suggestion: string) => ({
    label: suggestion,
    visible: true,
    async click() {
      await webContents.insertText(suggestion);
    },
  });

  let menuTemplate: MenuItemConstructorOptions[] = [
    {
      label: t.__("Add to Dictionary"),
      visible:
        properties.isEditable && isText && properties.misspelledWord.length > 0,
      click(_item) {
        webContents.session.addWordToSpellCheckerDictionary(
          properties.misspelledWord,
        );
      },
    },
    {
      type: "separator",
      visible:
        properties.isEditable && isText && properties.misspelledWord.length > 0,
    },
    {
      label: `${t.__("Look Up")} "${properties.selectionText}"`,
      visible: process.platform === "darwin" && isText,
      click(_item) {
        webContents.showDefinitionForSelection();
      },
    },
    {
      type: "separator",
      visible: process.platform === "darwin" && isText,
    },
    {
      label: t.__("Cut"),
      visible: isText,
      enabled: properties.isEditable,
      accelerator: "CommandOrControl+X",
      click(_item) {
        webContents.cut();
      },
    },
    {
      label: t.__("Copy"),
      accelerator: "CommandOrControl+C",
      enabled: properties.editFlags.canCopy,
      click(_item) {
        webContents.copy();
      },
    },
    {
      label: t.__("Paste"), // Bug: Paste replaces text
      accelerator: "CommandOrControl+V",
      enabled: properties.isEditable,
      click() {
        webContents.paste();
      },
    },
    {
      type: "separator",
    },
    {
      label:
        linkUrl?.protocol === "mailto:"
          ? t.__("Copy Email Address")
          : t.__("Copy Link"),
      visible: isLink,
      click(_item) {
        clipboard.write({
          bookmark: properties.linkText,
          text:
            linkUrl?.protocol === "mailto:"
              ? linkUrl.pathname
              : properties.linkURL,
        });
      },
    },
    {
      label: t.__("Copy Image"),
      visible: properties.mediaType === "image",
      click(_item) {
        webContents.copyImageAt(properties.x, properties.y);
      },
    },
    {
      label: t.__("Copy Image URL"),
      visible: properties.mediaType === "image",
      click(_item) {
        clipboard.write({
          bookmark: properties.srcURL,
          text: properties.srcURL,
        });
      },
    },
    {
      type: "separator",
      visible: isLink || properties.mediaType === "image",
    },
    {
      label: t.__("Services"),
      visible: process.platform === "darwin",
      role: "services",
    },
  ];

  if (properties.misspelledWord) {
    if (properties.dictionarySuggestions.length > 0) {
      const suggestions: MenuItemConstructorOptions[] =
        properties.dictionarySuggestions.map((suggestion: string) =>
          makeSuggestion(suggestion),
        );
      menuTemplate = [...suggestions, ...menuTemplate];
    } else {
      menuTemplate.unshift({
        label: t.__("No Suggestion Found"),
        enabled: false,
      });
    }
  }
  // Hide the invisible separators on Linux and Windows
  // Electron has a bug which ignores visible: false parameter for separator menu items. So we remove them here.
  // https://github.com/electron/electron/issues/5869
  // https://github.com/electron/electron/issues/6906

  const filteredMenuTemplate = menuTemplate.filter(
    (menuItem) => menuItem.visible ?? true,
  );
  const menu = Menu.buildFromTemplate(filteredMenuTemplate);
  menu.popup();
};
