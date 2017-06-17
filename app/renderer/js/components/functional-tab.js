'use strict';

const Tab = require(__dirname + '/../components/tab.js');

class FunctionalTab extends Tab {
	constructor(props) {
		super(props);
	}

	template() {
		return `<div class="tab">
					<div class="server-tab-badge"></div>
					<div class="server-tab functional-tab">
						<i class="material-icons md-48">${this.props.materialIcon}</i>
					</div>
				</div>`;
	}
}

module.exports = FunctionalTab;
