import {remote, ipcRenderer} from 'electron';

import {htmlEscape} from 'escape-goat';

import * as Messages from '../../../../resources/messages';
import BaseComponent from '../../components/base';
import * as DomainUtil from '../../utils/domain-util';
import * as t from '../../utils/translation-util';

const {dialog} = remote;

interface ServerInfoFormProps {
	$root: Element;
	server: DomainUtil.ServerConf;
	index: number;
	onChange: () => void;
}

export default class ServerInfoForm extends BaseComponent {
	props: ServerInfoFormProps;
	$serverInfoForm: Element;
	$serverInfoAlias: Element;
	$serverIcon: Element;
	$deleteServerButton: Element;
	$openServerButton: Element;
	constructor(props: ServerInfoFormProps) {
		super();
		this.props = props;
	}

	templateHTML(): string {
		return htmlEscape`
			<div class="settings-card">
				<div class="server-info-left">
					<img class="server-info-icon" src="${this.props.server.icon}"/>
					<div class="server-info-row">
						<span class="server-info-alias">${this.props.server.alias}</span>
						<i class="material-icons open-tab-button">open_in_new</i>
					</div>
				</div>
				<div class="server-info-right">
					<div class="server-info-row server-url">
						<span class="server-url-info" title="${this.props.server.url}">${this.props.server.url}</span>
					</div>
					<div class="server-info-row">
						<div class="action red server-delete-action">
							<span>${t.__('Disconnect')}</span>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	init(): void {
		this.initForm();
		this.initActions();
	}

	initForm(): void {
		this.$serverInfoForm = this.generateNodeFromHTML(this.templateHTML());
		this.$serverInfoAlias = this.$serverInfoForm.querySelectorAll('.server-info-alias')[0];
		this.$serverIcon = this.$serverInfoForm.querySelectorAll('.server-info-icon')[0];
		this.$deleteServerButton = this.$serverInfoForm.querySelectorAll('.server-delete-action')[0];
		this.$openServerButton = this.$serverInfoForm.querySelectorAll('.open-tab-button')[0];
		this.props.$root.append(this.$serverInfoForm);
	}

	initActions(): void {
		this.$deleteServerButton.addEventListener('click', async () => {
			const {response} = await dialog.showMessageBox({
				type: 'warning',
				buttons: [t.__('YES'), t.__('NO')],
				defaultId: 0,
				message: t.__('Are you sure you want to disconnect this organization?')
			});
			if (response === 0) {
				if (DomainUtil.removeDomain(this.props.index)) {
					ipcRenderer.send('reload-full-app');
				} else {
					const {title, content} = Messages.orgRemovalError(DomainUtil.getDomain(this.props.index).url);
					dialog.showErrorBox(title, content);
				}
			}
		});

		this.$openServerButton.addEventListener('click', () => {
			ipcRenderer.send('forward-message', 'switch-server-tab', this.props.index);
		});

		this.$serverInfoAlias.addEventListener('click', () => {
			ipcRenderer.send('forward-message', 'switch-server-tab', this.props.index);
		});

		this.$serverIcon.addEventListener('click', () => {
			ipcRenderer.send('forward-message', 'switch-server-tab', this.props.index);
		});
	}
}
