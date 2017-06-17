'use strict';

const Tab = require(__dirname + '/../components/tab.js');

class ServerTab extends Tab {
	constructor(props) {
		super(props);
	}

	template() {
		return `<div class="tab">
					<div class="server-tab-badge"></div>
					<div class="server-tab" style="background-image: url(${this.props.icon});"></div>
				</div>`;
	}
}

module.exports = ServerTab;
