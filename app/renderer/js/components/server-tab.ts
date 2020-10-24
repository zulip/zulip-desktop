import {ipcRenderer} from 'electron';

import {htmlEscape} from 'escape-goat';

import * as SystemUtil from '../utils/system-util';

import Tab, {TabProps} from './tab';

export default class ServerTab extends Tab {
	$badge: Element;

	constructor(props: TabProps) {
		super(props);
		this.init();
	}

	templateHTML(): string {
		return htmlEscape`
			<div class="tab" data-tab-id="${this.props.tabIndex}">
				<div class="server-tooltip" style="display:none">${this.props.name}</div>
				<div class="server-tab-badge"></div>
				<div class="server-tab">
					<img class="server-icons" src="${this.props.icon}"/>
				</div>
				<div class="server-tab-shortcut">${this.generateShortcutText()}</div>
			</div>
		`;
	}

	init(): void {
		this.$el = this.generateNodeFromHTML(this.templateHTML());
		this.props.$root.append(this.$el);
		this.registerListeners();
		this.$badge = this.$el.querySelectorAll('.server-tab-badge')[0];
	}

	updateBadge(count: number): void {
		if (count > 0) {
			const formattedCount = count > 999 ? '1K+' : count.toString();
			this.$badge.textContent = formattedCount;
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

		shortcutText = SystemUtil.getOS() === 'Mac' ? `⌘ ${shownIndex}` : `Ctrl+${shownIndex}`;

		// Array index == Shown index - 1
		ipcRenderer.send('switch-server-tab', shownIndex - 1);

		return shortcutText;
	}
}
