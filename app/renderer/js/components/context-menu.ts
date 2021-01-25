import {remote, ContextMenuParams} from 'electron';

import * as t from '../utils/translation-util';

const {clipboard, Menu} = remote;

export const contextMenu = (webContents: Electron.WebContents, event: Event, props: ContextMenuParams) => {
	const isText = props.selectionText !== '';
	const isLink = props.linkURL !== '';
	const linkURL = isLink ? new URL(props.linkURL) : undefined;
	const isEmailAddress = isLink ? linkURL.protocol === 'mailto:' : undefined;

	const makeSuggestion = (suggestion: string) => ({
		label: suggestion,
		visible: true,
		async click() {
			await webContents.insertText(suggestion);
		}
	});

	let menuTemplate: Electron.MenuItemConstructorOptions[] = [{
		label: t.__('Add to Dictionary'),
		visible: props.isEditable && isText && props.misspelledWord.length > 0,
		click(_item) {
			webContents.session.addWordToSpellCheckerDictionary(props.misspelledWord);
		}
	}, {
		type: 'separator',
		visible: props.isEditable && isText && props.misspelledWord.length > 0
	}, {
		label: `${t.__('Look Up')} "${props.selectionText}"`,
		visible: process.platform === 'darwin' && isText,
		click(_item) {
			webContents.showDefinitionForSelection();
		}
	}, {
		type: 'separator',
		visible: process.platform === 'darwin' && isText
	}, {
		label: t.__('Cut'),
		visible: isText,
		enabled: props.isEditable,
		accelerator: 'CommandOrControl+X',
		click(_item) {
			webContents.cut();
		}
	}, {
		label: t.__('Copy'),
		accelerator: 'CommandOrControl+C',
		enabled: props.editFlags.canCopy,
		click(_item) {
			webContents.copy();
		}
	}, {
		label: t.__('Paste'), // Bug: Paste replaces text
		accelerator: 'CommandOrControl+V',
		enabled: props.isEditable,
		click() {
			webContents.paste();
		}
	}, {
		type: 'separator'
	}, {
		label: isEmailAddress ? t.__('Copy Email Address') : t.__('Copy Link'),
		visible: isLink,
		click(_item) {
			clipboard.write({
				bookmark: props.linkText,
				text: isEmailAddress ? linkURL.pathname : props.linkURL
			});
		}
	}, {
		label: t.__('Copy Image'),
		visible: props.mediaType === 'image',
		click(_item) {
			webContents.copyImageAt(props.x, props.y);
		}
	}, {
		label: t.__('Copy Image URL'),
		visible: props.mediaType === 'image',
		click(_item) {
			clipboard.write({
				bookmark: props.srcURL,
				text: props.srcURL
			});
		}
	}, {
		type: 'separator',
		visible: isLink || props.mediaType === 'image'
	}, {
		label: t.__('Services'),
		visible: process.platform === 'darwin',
		role: 'services'
	}];

	if (props.misspelledWord) {
		if (props.dictionarySuggestions.length > 0) {
			const suggestions: Electron.MenuItemConstructorOptions[] = props.dictionarySuggestions.map((suggestion: string) => makeSuggestion(suggestion));
			menuTemplate = suggestions.concat(menuTemplate);
		} else {
			menuTemplate.unshift({
				label: t.__('No Suggestion Found'),
				enabled: false
			});
		}
	}
	// Hide the invisible separators on Linux and Windows
	// Electron has a bug which ignores visible: false parameter for separator menuitems. So we remove them here.
	// https://github.com/electron/electron/issues/5869
	// https://github.com/electron/electron/issues/6906

	const filteredMenuTemplate = menuTemplate.filter(menuItem => menuItem.visible ?? true);
	const menu = Menu.buildFromTemplate(filteredMenuTemplate);
	menu.popup();
};
