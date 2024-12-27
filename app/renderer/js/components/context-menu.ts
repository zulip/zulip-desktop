import type {Event} from "electron/common";
import {clipboard} from "electron/common";
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
  props: ContextMenuParams,
) => {
  const isText = props.selectionText !== "";
  const isLink = props.linkURL !== "";
  const linkUrl = isLink ? new URL(props.linkURL) : undefined;

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
      visible: props.isEditable && isText && props.misspelledWord.length > 0,
      click(_item) {
        webContents.session.addWordToSpellCheckerDictionary(
          props.misspelledWord,
        );
      },
    },
    {
      type: "separator",
      visible: props.isEditable && isText && props.misspelledWord.length > 0,
    },
    {
      label: `${t.__("Look Up")} "${props.selectionText}"`,
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
      enabled: props.isEditable,
      accelerator: "CommandOrControl+X",
      click(_item) {
        webContents.cut();
      },
    },
    {
      label: t.__("Copy"),
      accelerator: "CommandOrControl+C",
      enabled: props.editFlags.canCopy,
      click(_item) {
        webContents.copy();
      },
    },
    {
      label: t.__("Paste"), // Bug: Paste replaces text
      accelerator: "CommandOrControl+V",
      enabled: props.isEditable,
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
          bookmark: props.linkText,
          text:
            linkUrl?.protocol === "mailto:" ? linkUrl.pathname : props.linkURL,
        });
      },
    },
    {
      label: t.__("Copy Image"),
      visible: props.mediaType === "image",
      click(_item) {
        webContents.copyImageAt(props.x, props.y);
      },
    },
    {
      label: t.__("Copy Image URL"),
      visible: props.mediaType === "image",
      click(_item) {
        clipboard.write({
          bookmark: props.srcURL,
          text: props.srcURL,
        });
      },
    },
    {
      type: "separator",
      visible: isLink || props.mediaType === "image",
    },
    {
      label: t.__("Services"),
      visible: process.platform === "darwin",
      role: "services",
    },
  ];

  if (props.misspelledWord) {
    if (props.dictionarySuggestions.length > 0) {
      const suggestions: MenuItemConstructorOptions[] =
        props.dictionarySuggestions.map((suggestion: string) =>
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
