'use strict';

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
              <div id="appearance-option-settings" class="settings-card">
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
              <div id="appearance-option-settings" class="settings-card">
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
            </div>
		`;
	}

	init() {
		this.props.$root.innerHTML = this.template();
	}
}

module.exports = ShortcutsSection;
