import * as LinkUtil from '../../utils/link-util';
import * as t from '../../utils/translation-util';

import BaseSection from './base-section';

interface ShortcutsSectionProps {
	$root: Element;
}

export default class ShortcutsSection extends BaseSection {
	props: ShortcutsSectionProps;
	constructor(props: ShortcutsSectionProps) {
		super();
		this.props = props;
	}

	// TODO - Deduplicate templateMac and templateWinLin functions. In theory
	// they both should be the same the only thing different should be the userOSKey
	// variable but there seems to be inconsistences between both function, one has more
	// lines though one may just be using more new lines and other thing is the use of +.
	templateMac(): string {
		const userOSKey = '⌘';

		return `
						<div class="settings-pane">
						<div class="settings-card tip"><p><b><i class="material-icons md-14">settings</i>${t.__('Tip')}:  </b>${t.__('These desktop app shortcuts extend the Zulip webapp\'s')} <span id="open-hotkeys-link"> ${t.__('keyboard shortcuts')}</span>.</p></div>
							<div class="title">${t.__('Application Shortcuts')}</div>
							<div class="settings-card">
								<table>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>,</kbd></td>
										<td>${t.__('Settings')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>K</kbd></td>
										<td>${t.__('Keyboard Shortcuts')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd></td>
										<td>${t.__('Toggle Do Not Disturb')}</td>
									</tr>
									<tr>
										<td><kbd>Shift</kbd><kbd>${userOSKey}</kbd><kbd>D</kbd></td>
										<td>${t.__('Reset App Settings')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>L</kbd></td>
										<td>${t.__('Log Out')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>H</kbd></td>
										<td>${t.__('Hide Zulip')}</td>
									</tr>
									<tr>
										<td><kbd>Option</kbd><kbd>${userOSKey}</kbd><kbd>H</kbd></td>
										<td>${t.__('Hide Others')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>Q</kbd></td>
										<td>${t.__('Quit Zulip')}</td>
									</tr>
								</table>
								<div class="setting-control"></div>
							</div>
							<div class="title">${t.__('Edit Shortcuts')}</div>
							<div class="settings-card">
								<table>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>Z</kbd></td>
										<td>${t.__('Undo')}</td>
									</tr>
									<tr>
										<td><kbd>Shift</kbd><kbd>${userOSKey}</kbd><kbd>Z</kbd></td>
										<td>${t.__('Redo')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>X</kbd></td>
										<td>${t.__('Cut')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>C</kbd></td>
										<td>${t.__('Copy')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>V</kbd></td>
										<td>${t.__('Paste')}</td>
									</tr>
									<tr>
										<td><kbd>Shift</kbd><kbd>${userOSKey}</kbd><kbd>V</kbd></td>
										<td>${t.__('Paste and Match Style')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>A</kbd></td>
										<td>${t.__('Select All')}</td>
									</tr>
									<tr>
										<td><kbd>Control</kbd><kbd>${userOSKey}</kbd><kbd>Space</kbd></td>
										<td>${t.__('Emoji & Symbols')}</td>
									</tr>
								</table>
								<div class="setting-control"></div>
							</div>
							<div class="title">${t.__('View Shortcuts')}</div>
							<div class="settings-card">
								<table>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>R</kbd></td>
										<td>${t.__('Reload')}</td>
									</tr>
									<tr>
										<td><kbd>Shift</kbd><kbd>${userOSKey}</kbd><kbd>R</kbd></td>
										<td>${t.__('Hard Reload')}</td>
									</tr>
									<tr>
										<td><kbd>Control</kbd><kbd>${userOSKey}</kbd><kbd>F</kbd></td>
										<td>${t.__('Enter Full Screen')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>+</kbd></td>
										<td>${t.__('Zoom In')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>-</kbd></td>
										<td>${t.__('Zoom Out')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>0</kbd></td>
										<td>${t.__('Actual Size')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd></td>
										<td>${t.__('Toggle Sidebar')}</td>
									</tr>
									<tr>
										<td><kbd>Option</kbd><kbd>${userOSKey}</kbd><kbd>I</kbd></td>
										<td>${t.__('Toggle DevTools for Zulip App')}</td>
									</tr>
									<tr>
										<td><kbd>Option</kbd><kbd>${userOSKey}</kbd><kbd>U</kbd></td>
										<td>${t.__('Toggle DevTools for Active Tab')}</td>
									</tr>
									<tr>
										<td><kbd>Ctrl</kbd> + <kbd>Tab</kbd></td>
										<td>${t.__('Switch to Next Organization')}</td>
									</tr>
									<tr>
										<td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Tab</kbd></td>
										<td>${t.__('Switch to Previous Organization')}</td>
									</tr>
								</table>
								<div class="setting-control"></div>
							</div>
							<div class="title">${t.__('History Shortcuts')}</div>
							<div class="settings-card">
								<table>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>←</kbd></td>
										<td>${t.__('Back')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>→</kbd></td>
										<td>${t.__('Forward')}</td>
									</tr>
								</table>
								<div class="setting-control"></div>
							</div>
							<div class="title">Window Shortcuts</div>
							<div class="settings-card">
								<table>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>M</kbd></td>
										<td>${t.__('Minimize')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd><kbd>W</kbd></td>
										<td>${t.__('Close')}</td>
									</tr>
								</table>
								<div class="setting-control"></div>
							</div>
						</div>
		`;
	}

	templateWinLin(): string {
		const userOSKey = 'Ctrl';

		return `
						<div class="settings-pane">
						<div class="settings-card tip"><p><b><i class="material-icons md-14">settings</i>${t.__('Tip')}:  </b>${t.__('These desktop app shortcuts extend the Zulip webapp\'s')} <span id="open-hotkeys-link"> ${t.__('keyboard shortcuts')}</span>.</p></div>
							<div class="title">${t.__('Application Shortcuts')}</div>
							<div class="settings-card">
								<table>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>,</kbd></td>
										<td>${t.__('Settings')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>K</kbd></td>
										<td>${t.__('Keyboard Shortcuts')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd></td>
										<td>${t.__('Toggle Do Not Disturb')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>L</kbd></td>
										<td>${t.__('Log Out')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>Q</kbd></td>
										<td>${t.__('Quit Zulip')}</td>
									</tr>
								</table>
								<div class="setting-control"></div>
							</div>
							<div class="title">${t.__('Edit Shortcuts')}</div>
							<div class="settings-card">
								<table>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>Z</kbd></td>
										<td>${t.__('Undo')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>Y</kbd></td>
										<td>${t.__('Redo')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>X</kbd></td>
										<td>${t.__('Cut')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>C</kbd></td>
										<td>${t.__('Copy')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>V</kbd></td>
										<td>${t.__('Paste')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd></td>
										<td>${t.__('Paste and Match Style')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>A</kbd></td>
										<td>${t.__('Select All')}</td>
									</tr>
								</table>
								<div class="setting-control"></div>
							</div>
							<div class="title">${t.__('View Shortcuts')}</div>
							<div class="settings-card">
								<table>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>R</kbd></td>
										<td>${t.__('Reload')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd></td>
										<td>${t.__('Hard Reload')}</td>
									</tr>
									<tr>
										<td><kbd>F11</kbd></td>
										<td>${t.__('Toggle Full Screen')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>=</kbd></td>
										<td>${t.__('Zoom In')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>-</kbd></td>
										<td>${t.__('Zoom Out')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>0</kbd></td>
										<td>${t.__('Actual Size')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd></td>
										<td>${t.__('Toggle Sidebar')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>Shift</kbd> + <kbd>I</kbd></td>
										<td>${t.__('Toggle DevTools for Zulip App')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>Shift</kbd> + <kbd>U</kbd></td>
										<td>${t.__('Toggle DevTools for Active Tab')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>Tab</kbd></td>
										<td>${t.__('Switch to Next Organization')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>Shift</kbd> + <kbd>Tab</kbd></td>
										<td>${t.__('Switch to Previous Organization')}</td>
									</tr>
								</table>
								<div class="setting-control"></div>
							</div>
							<div class="title">${t.__('History Shortcuts')}</div>
							<div class="settings-card">
								<table>
									<tr>
										<td><kbd>Alt</kbd> + <kbd>←</kbd></td>
										<td>${t.__('Back')}</td>
									</tr>
									<tr>
										<td><kbd>Alt</kbd> + <kbd>→</kbd></td>
										<td>${t.__('Forward')}</td>
									</tr>
								</table>
								<div class="setting-control"></div>
							</div>
							<div class="title">${t.__('Window Shortcuts')}</div>
							<div class="settings-card">
								<table>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>M</kbd></td>
										<td>${t.__('Minimize')}</td>
									</tr>
									<tr>
										<td><kbd>${userOSKey}</kbd> + <kbd>W</kbd></td>
										<td>${t.__('Close')}</td>
									</tr>
								</table>
								<div class="setting-control"></div>
							</div>
						</div>
		`;
	}

	openHotkeysExternalLink(): void {
		const link = 'https://zulip.com/help/keyboard-shortcuts';
		const externalCreateNewOrgElement = document.querySelector('#open-hotkeys-link');
		externalCreateNewOrgElement.addEventListener('click', async () => {
			await LinkUtil.openBrowser(new URL(link));
		});
	}

	init(): void {
		this.props.$root.innerHTML = (process.platform === 'darwin') ?
			this.templateMac() : this.templateWinLin();
		this.openHotkeysExternalLink();
	}
}
