'use strict';

const Tab = require(__dirname + '/../components/tab.js');

class ServerTab extends Tab {
	template() {
		return `<div class="tab">
					<div class="server-tab-badge"></div>
					<div class="server-tab" style="background-image: url(${this.props.icon});"></div>
				</div>`;
	}

	init() {
		super.init();

		this.$badge = this.$el.getElementsByClassName('server-tab-badge')[0];
	}

	updateBadge(count) {
		if (count > 0) {
			const formattedCount = count > 999 ? '1K+' : count;

			this.$badge.innerHTML = formattedCount;
			this.$badge.classList.add('active');
		} else {
			this.$badge.classList.remove('active');
		}
	}
}

module.exports = ServerTab;
