'use strict';

const { shell } = require('electron');

const BaseSection = require(__dirname + '/base-section.js');

class ShortcutsSection extends BaseSection {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
            <div class="settings-pane">
              <div class="title">Desktop-specific</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>Ctrl/Cmd</kbd> + <kbd>,</kbd></td>
                    <td>Manage servers</td>
                  </tr>
                  <tr>
                    <td><kbd>Ctrl/Cmd</kbd> + <kbd>[</kbd></td>
                    <td>Back</td>
                  </tr>
                  <tr>
                    <td><kbd>Ctrl/Cmd</kbd> + <kbd>]</kbd></td>
                    <td>Forward</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
              <div class="title">Navigation</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>/</kbd></td>
                    <td>Initiate a search</td>
                  </tr>
                  <tr>
                    <td><kbd>q</kbd></td>
                    <td>Search people</td>
                  </tr>
                  <tr>
                    <td><kbd>w</kbd></td>
                    <td>Search streams</td>
                  </tr>
                  <tr>
                    <td><kbd>↑</kbd>, <kbd>k</kbd></td>
                    <td>Previous message</td>
                  </tr>
                  <tr>
                    <td><kbd>↓</kbd>, <kbd>j</kbd></td>
                    <td>Next message</td>
                  </tr>
									<tr>
                    <td><kbd>PgUp</kbd>, <kbd>K</kbd></td>
                    <td>Scroll up</td>
                  </tr>
                  <tr>
                    <td><kbd>PgDn</kbd>, <kbd>Space</kbd>, <kbd>J</kbd></td>
                    <td>Scroll down</td>
                  </tr>
                  <tr>
                    <td><kbd>End</kbd>, <kbd>G</kbd></td>
                    <td>Last message</td>
                  </tr>
                  <tr>
                    <td><kbd>Home</kbd></td>
                    <td>First message</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
              <div class="title">Composing Messages</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>Enter</kbd>, <kbd>r</kbd></td>
                    <td>Reply to message</td>
                  </tr>
                  <tr>
                    <td><kbd>R</kbd></td>
                    <td>Reply to author</td>
                  </tr>
                  <tr>
                    <td><kbd>c</kbd></td>
                    <td>New stream message</td>
                  </tr>
                  <tr>
                    <td><kbd>C</kbd></td>
                    <td>New private message</td>
                  </tr>
                  <tr>
                    <td><kbd>@</kbd></td>
                    <td>Compose a reply @-mentioning author</td>
                  </tr>
									<tr>
                    <td><kbd>PgUp</kbd>, <kbd>K</kbd></td>
                    <td>Scroll up</td>
                  </tr>
                  <tr>
                    <td><kbd>Ctrl/Cmd</kbd> + <kbd>Enter</kbd></td>
                    <td>Send message</td>
                  </tr>
                  <tr>
                    <td><kbd>Shift</kbd> + <kbd>Enter</kbd></td>
                    <td>Insert new line</td>
                  </tr>
                  <tr>
                    <td><kbd>Esc</kbd>, <kbd>Ctrl</kbd> + <kbd>[</kbd></td>
                    <td>Cancel compose</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
							<div class="title">Message Actions</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>←</kbd></td>
                    <td>Edit your last message</td>
                  </tr>
                  <tr>
                    <td><kbd>u</kbd></td>
                    <td>Show message sender's profile</td>
                  </tr>
                  <tr>
                    <td><kbd>v</kbd></td>
                    <td>Show images in thread</td>
                  </tr>
                  <tr>
                    <td><kbd>*</kbd></td>
                    <td>Star selected message</td>
                  </tr>
                  <tr>
                    <td><kbd>+</kbd></td>
                    <td>React to selected message with 👍</td>
                  </tr>
                  <tr>
                    <td><kbd>-</kbd></td>
                    <td>Collapse/show selected message</td>
                  </tr>
                  <tr>
                    <td><kbd>M</kbd></td>
                    <td>Toggle topic mute</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
							<div class="title">Narrowing</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>s</kbd></td>
                    <td>Narrow by stream</td>
                  </tr>
                  <tr>
                    <td><kbd>S</kbd></td>
                    <td>Narrow by topic</td>
                  </tr>
                  <tr>
                    <td><kbd>P</kbd></td>
                    <td>Narrow to all private messages</td>
                  </tr>
                  <tr>
                    <td><kbd>n</kbd></td>
                    <td>Narrow to next unread topic</td>
                  </tr>
                  <tr>
                    <td><kbd>A</kbd>, <kbd>D</kbd></td>
                    <td>Cycle between stream narrows</td>
                  </tr>
                  <tr>
                    <td><kbd>Esc</kbd>, <kbd>Ctrl/Cmd</kbd> + <kbd>[</kbd></td>
                    <td>Return to Home view</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
							<div class="title">Menus</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>g</kbd></td>
                    <td>Toggle the gear menu</td>
                  </tr>
                  <tr>
                    <td><kbd>i</kbd></td>
                    <td>Open message menu</td>
                  </tr>
                  <tr>
                    <td><kbd>:</kbd></td>
                    <td>Open reactions menu</td>
                  </tr>
                  <tr>
                    <td><kbd>?</kbd></td>
                    <td>Show keyboard shortcuts</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
							<div class="title">Drafts</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>d</kbd></td>
                    <td>View drafts</td>
                  </tr>
                  <tr>
                    <td><kbd>↑</kbd></td>
                    <td>Select previous draft</td>
                  </tr>
                  <tr>
                    <td><kbd>↓</kbd></td>
                    <td>Select next draft</td>
                  </tr>
                  <tr>
                    <td><kbd>PgUp</kbd> (<kbd>Fn</kbd> + <kbd>↑</kbd>)</td>
                    <td>Scroll up</td>
                  </tr>
									<tr>
                    <td><kbd>Space</kbd>, <kbd>PgDn</kbd> (<kbd>Fn</kbd> + <kbd>↓</kbd>)</td>
                    <td>Scroll down</td>
                  </tr>
									<tr>
                    <td><kbd>Home</kbd> (<kbd>Fn</kbd> + <kbd>←</kbd>)</td>
                    <td>Select first draft</td>
                  </tr>
									<tr>
                    <td><kbd>End</kbd> (<kbd>Fn</kbd> + <kbd>→</kbd>), <kbd>G</kbd></td>
                    <td>Select last draft</td>
                  </tr>
									<tr>
                    <td><kbd>Enter</kbd> (<kbd>Return</kbd>)</td>
                    <td>Edit selected draft</td>
                  </tr>
									<tr>
                    <td><kbd>Backspace</kbd> (<kbd>Delete</kbd>)</td>
                    <td>Delete selected draft</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
							<div class="title">Streams</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>↑</kbd> and <kbd>↓</kbd></td>
                    <td>Scroll through streams</td>
                  </tr>
                  <tr>
                    <td><kbd>←</kbd> and <kbd>→</kbd></td>
                    <td>Switch between tabs</td>
                  </tr>
                  <tr>
                    <td><kbd>V</kbd></td>
                    <td>View stream messages</td>
                  </tr>
                  <tr>
                    <td><kbd>S</kbd></td>
                    <td>Subscribe/unsubscribe from selected stream</td>
                  </tr>
                  <tr>
                    <td><kbd>n</kbd></td>
                    <td>Create new stream</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
							<div class="title">Documentation</div>
              <div class="settings-card">
								<span id="open-shortcuts-url">
									Detailed keyboard shortcuts documentation found here
									<i class="material-icons open-tab-button">open_in_new</i>
								</span>
                <div class="setting-control"></div>
              </div>
            </div>
		`;
	}

	init() {
		this.props.$root.innerHTML = this.template();
		this.openExternalShortcutsLink();
	}

	openExternalShortcutsLink() {
		const externalShortcutsLink = document.getElementById('open-shortcuts-url');
		externalShortcutsLink.addEventListener('click', () => {
			shell.openExternal('https://chat.zulip.org/help/keyboard-shortcuts');
		});
	}
}

module.exports = ShortcutsSection;
