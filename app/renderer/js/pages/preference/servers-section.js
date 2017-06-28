'use strict';

const {ipcRenderer} = require('electron');
const BaseComponent = require(__dirname + '/../../components/base.js');

const DomainUtil = require(__dirname + '/../../utils/domain-util.js');
const Nav = require(__dirname + '/nav.js');
const ServerInfoForm = require(__dirname + '/server-info-form.js');
const NewServerForm = require(__dirname + '/new-server-form.js');

class ServersSection {
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
		this.initServers();
		this.initActions();
	}

	initServers() {
		this.props.$root.innerHTML = '';

		const servers = DomainUtil.getDomains();
		this.props.$root.innerHTML = this.template();
		this.$serverInfoContainer = document.getElementById('server-info-container');
		this.$newServerContainer = document.getElementById('new-server-container');
		this.$newServerButton = document.getElementById('new-server-action');
		
		this.$serverInfoContainer.innerHTML = servers.length ? '' : 'Add your first server to get started!';

		this.initNewServerForm();

		for (const i in servers) {
			new ServerInfoForm({
				$root: this.$serverInfoContainer,
				server: servers[i],
				index: i,
				onChange: this.handleServerInfoChange.bind(this)
			}).init();
		}
	}

	initNewServerForm() {
		new NewServerForm({
			$root: this.$newServerContainer,
			onChange: this.handleServerInfoChange.bind(this)
		}).init();
	}

	initActions() {
		this.$newServerButton.addEventListener('click', () => {
			this.$newServerContainer.classList.remove('hidden');
			this.$newServerButton.classList.remove('green');
			this.$newServerButton.classList.add('grey');
		});
	}

	handleServerInfoChange(index) {
		ipcRenderer.send('reload-main');
	}
}

module.exports = ServersSection;