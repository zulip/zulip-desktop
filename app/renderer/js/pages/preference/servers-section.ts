import * as t from '../../utils/translation-util';

import BaseSection from './base-section';
import NewServerForm from './new-server-form';

interface ServersSectionProps {
	$root: Element;
}

export default class ServersSection extends BaseSection {
	props: ServersSectionProps;
	$newServerContainer: Element;
	constructor(props: ServersSectionProps) {
		super();
		this.props = props;
	}

	template(): string {
		return `
		<div class="add-server-modal">
			<div class="modal-container">
				<div class="settings-pane" id="server-settings-pane">
					<div class="page-title">${t.__('Add a Zulip organization')}</div>
					<div id="new-server-container"></div>
				</div>
			</div>
		</div>
		`;
	}

	init(): void {
		this.initServers();
	}

	initServers(): void {
		this.props.$root.innerHTML = '';

		this.props.$root.innerHTML = this.template();
		this.$newServerContainer = document.querySelector('#new-server-container');

		this.initNewServerForm();
	}

	initNewServerForm(): void {
		new NewServerForm({
			$root: this.$newServerContainer,
			onChange: this.reloadApp
		}).init();
	}
}
