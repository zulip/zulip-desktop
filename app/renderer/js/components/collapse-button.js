'use strict';

const BaseComponent = require(__dirname + '/../components/base.js');

class CollapseButton extends BaseComponent {
	constructor(props) {
		super();
		this.init();
	}

	init() {
        this.sidebarShown = true;

        this.$sidebar = document.getElementById('sidebar');
        this.$el = document.getElementById('collapse-button');
        this.$icon = this.$el.querySelector('i');

		this.registerListeners();
	}

	registerListeners() {
		this.$el.addEventListener('click', this.toggleSidebar.bind(this));
	}

    toggleSidebar() {
        if (this.sidebarShown) {
            this.$sidebar.classList.add('hidden');
            this.$icon.innerHTML = 'keyboard_arrow_right';
        } else {
            this.$sidebar.classList.remove('hidden');
            this.$icon.innerHTML = 'keyboard_arrow_left';
        }
        this.sidebarShown = !this.sidebarShown;
    }
}

module.exports = CollapseButton;
