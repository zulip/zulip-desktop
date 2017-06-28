'use strict';

const {ipcRenderer} = require('electron');
const BaseComponent = require(__dirname + '/../../components/base.js');

class GeneralSection {
	constructor(props) {
		this.props = props;
	}

    template() {
        return `
            <div class="settings-pane" id="server-settings-pane">
                <div class="title">Manage Servers</div>
                <div class="actions-container">
                    <div class="action green" id="new-server-action">
                        <i class="material-icons">add_box</i>
                        <span>New Server</span>
                    </div>
				</div>
                <div id="new-server-container" class="hidden"></div>
                <div class="sub-title">Existing Servers</div>
                <div id="server-info-container"></div>
            </div>
        `;
    }

	init() {
        this.props.$root.innerHTML = '';
		this.initActions();
	}

	initActions() {
	}

	handleServerInfoChange(index) {
		ipcRenderer.send('reload-main');
	}
}

module.exports = GeneralSection;