'use strict';

import { ipcRenderer } from 'electron';

import Tab = require('./tab');
import SystemUtil = require('../utils/system-util');

class ServerTab extends Tab {
	$badge: Element;

	template(): string {
		return `<div class="tab" data-tab-id="${this.props.tabIndex}">
					<div class="server-tooltip" style="display:none">${this.props.name}</div>
					<div class="server-tab-badge"></div>
					<div class="server-tab">
					<img class="server-icons" src='${this.props.icon}'/>
					</div>
					<div class="server-tab-shortcut">${this.generateShortcutText()}</div>
				</div>`;
	}

	// TODO: Typescript - This type for props should be TabProps
	constructor(props: any) {
		super(props);
		this.init();
	}

	init(): void {
		this.$el = this.generateNodeFromTemplate(this.template());
		this.props.$root.append(this.$el);
		this.registerListeners();
		this.$badge = this.$el.querySelectorAll('.server-tab-badge')[0];
	}

	updateBadge(count: number): void {
		if (count > 0) {
			const formattedCount = count > 999 ? '1K+' : count.toString();
			this.$badge.innerHTML = formattedCount;
			this.$badge.classList.add('active');
		} else {
			this.$badge.classList.remove('active');
		}
	}

	generateShortcutText(): string {
		// Only provide shortcuts for server [0..10]
		if (this.props.index >= 10) {
			return '';
		}

		const shownIndex = this.props.index + 1;

		let shortcutText = '';

		if (SystemUtil.getOS() === 'Mac') {
			shortcutText = `⌘ ${shownIndex}`;
		} else {
			shortcutText = `Ctrl+${shownIndex}`;
		}

		// Array index == Shown index - 1
		ipcRenderer.send('switch-server-tab', shownIndex - 1);

		return shortcutText;
	}
}

export = ServerTab;
