'use strict';

const BaseSection = require(__dirname + '/base-section.js');

class ShortcutsSection extends BaseSection {
	constructor(props) {
		super();
		this.props = props;
	}

	templateMac() {
		const userOSKey = '⌘';

		return `
            <div class="settings-pane">
              <div class="title">Application Shortcuts</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>,</kbd></td>
                    <td>Settings</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>K</kbd></td>
                    <td>Keyboard Shortcuts</td>
                  </tr>
                  <tr>
                    <td><kbd>Shift</kbd><kbd>${userOSKey}</kbd><kbd>D</kbd></td>
                    <td>Reset App Settings</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>L</kbd></td>
                    <td>Log Out</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>H</kbd></td>
                    <td>Hide Zulip</td>
                  </tr>
                  <tr>
                    <td><kbd>Option</kbd><kbd>${userOSKey}</kbd><kbd>H</kbd></td>
                    <td>Hide Others</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>Q</kbd></td>
                    <td>Quit Zulip</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
              <div class="title">Edit Shortcuts</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>Z</kbd></td>
                    <td>Undo</td>
                  </tr>
                  <tr>
                    <td><kbd>Shift</kbd><kbd>${userOSKey}</kbd><kbd>Z</kbd></td>
                    <td>Redo</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>X</kbd></td>
                    <td>Cut</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>C</kbd></td>
                    <td>Copy</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>V</kbd></td>
                    <td>Paste</td>
                  </tr>
                  <tr>
                    <td><kbd>Shift</kbd><kbd>${userOSKey}</kbd><kbd>V</kbd></td>
                    <td>Paste and Match Style</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>A</kbd></td>
                    <td>Select All</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>F</kbd></td>
                    <td>Find</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>G</kbd></td>
                    <td>Find Next</td>
                  </tr>
                  <tr>
                    <td><kbd>Control</kbd><kbd>${userOSKey}</kbd><kbd>Space</kbd></td>
                    <td>Emoji & Symbols</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
              <div class="title">View Shortcuts</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>R</kbd></td>
                    <td>Reload</td>
                  </tr>
                  <tr>
                    <td><kbd>Shift</kbd><kbd>${userOSKey}</kbd><kbd>R</kbd></td>
                    <td>Hard Reload</td>
                  </tr>
                  <tr>
                    <td><kbd>Control</kbd><kbd>${userOSKey}</kbd><kbd>F</kbd></td>
                    <td>Enter Full Screen</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>=</kbd></td>
                    <td>Zoom In</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>-</kbd></td>
                    <td>Zoom Out</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>0</kbd></td>
                    <td>Actual Size</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>S</kbd></td>
                    <td>Toggle Sidebar</td>
                  </tr>
                  <tr>
                    <td><kbd>Option</kbd><kbd>${userOSKey}</kbd><kbd>I</kbd></td>
                    <td>Toggle DevTools for Zulip App</td>
                  </tr>
                  <tr>
                    <td><kbd>Option</kbd><kbd>${userOSKey}</kbd><kbd>U</kbd></td>
                    <td>Toggle DevTools for Active Tab</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
              <div class="title">History Shortcuts</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>←</kbd></td>
                    <td>Back</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>→</kbd></td>
                    <td>Forward</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
              <div class="title">Window Shortcuts</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>M</kbd></td>
                    <td>Minimize</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd><kbd>W</kbd></td>
                    <td>Close</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
            </div>
		`;
	}

	templateWinLin() {
		const userOSKey = 'Ctrl';

		return `
            <div class="settings-pane">
              <div class="title">Application Shortcuts</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>,</kbd></td>
                    <td>Settings</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>K</kbd></td>
                    <td>Keyboard Shortcuts</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>L</kbd></td>
                    <td>Log Out</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>Q</kbd></td>
                    <td>Quit Zulip</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
              <div class="title">Edit Shortcuts</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>Z</kbd></td>
                    <td>Undo</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>Y</kbd></td>
                    <td>Redo</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>X</kbd></td>
                    <td>Cut</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>C</kbd></td>
                    <td>Copy</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>V</kbd></td>
                    <td>Paste</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd></td>
                    <td>Paste and Match Style</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>A</kbd></td>
                    <td>Select All</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
              <div class="title">View Shortcuts</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>R</kbd></td>
                    <td>Reload</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd></td>
                    <td>Hard Reload</td>
                  </tr>
                  <tr>
                    <td><kbd>F11</kbd></td>
                    <td>Toggle Full Screen</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>=</kbd></td>
                    <td>Zoom In</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>-</kbd></td>
                    <td>Zoom Out</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>0</kbd></td>
                    <td>Actual Size</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>S</kbd></td>
                    <td>Toggle Sidebar</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>Shift</kbd> + <kbd>I</kbd></td>
                    <td>Toggle DevTools for Zulip App</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>Shift</kbd> + <kbd>U</kbd></td>
                    <td>Toggle DevTools for Active Tab</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
              <div class="title">History Shortcuts</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>Alt</kbd> + <kbd>←</kbd></td>
                    <td>Back</td>
                  </tr>
                  <tr>
                    <td><kbd>Alt</kbd> + <kbd>→</kbd></td>
                    <td>Forward</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
              <div class="title">Window Shortcuts</div>
              <div class="settings-card">
                <table>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>M</kbd></td>
                    <td>Minimize</td>
                  </tr>
                  <tr>
                    <td><kbd>${userOSKey}</kbd> + <kbd>W</kbd></td>
                    <td>Close</td>
                  </tr>
                </table>
                <div class="setting-control"></div>
              </div>
            </div>
		`;
	}

	init() {
		this.props.$root.innerHTML = (process.platform === 'darwin') ?
			this.templateMac() : this.templateWinLin();
	}
}

module.exports = ShortcutsSection;
