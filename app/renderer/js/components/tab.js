'use strict';

const BaseComponent = require(__dirname + '/../components/base.js');

class Tab extends BaseComponent {
	constructor(params) {
		super();

		const {url, icon, name, type, $root, onClick} = params;
		this.url = url;
		this.name = name;
		this.icon = icon;
		this.type = type;
		this.$root = $root;
		this.onClick = onClick;

		this.init();
	}

	template() {
		if (this.type === Tab.SERVER_TAB) {
			return `<div class="tab" domain="${this.url}">
						<div class="server-tab-badge"></div>
						<div class="server-tab" style="background-image: url(${this.icon});"></div>
					</div>`;
		} else {
			return `<div class="tab" domain="${this.url}">
						<div class="server-tab-badge"></div>
						<div class="server-tab settings-tab">
							<i class="material-icons md-48">settings</i>
						</div>
					</div>`;
		}
	}

	init() {
		this.$el = this.generateNodeFromTemplate(this.template());
		this.$badge = this.$el.getElementsByClassName('server-tab-badge')[0];
		this.$root.appendChild(this.$el);

		this.registerListeners();
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

	registerListeners() {
		this.$el.addEventListener('click', this.onClick);
	}

	activate() {
		this.$el.classList.add('active');
	}

	deactivate() {
		this.$el.classList.remove('active');
	}
}

Tab.SERVER_TAB = 0;
Tab.SETTINGS_TAB = 1;

module.exports = Tab;
