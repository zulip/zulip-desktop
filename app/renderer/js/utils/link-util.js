'use strict';

const wurl = require('wurl');

let instance = null;

class LinkUtil {
	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		return instance;
	}

	isInternal(currentUrl, newUrl) {
		const currentDomain = wurl('hostname', currentUrl);
		const newDomain = wurl('hostname', newUrl);

		const skipImages = '.jpg|.gif|.png|.jpeg|.JPG|.PNG';
		const skipPages = ['integrations', 'api'];

		const getskipPagesUrl = newUrl.substring(8, newUrl.length);

		return (currentDomain === newDomain) && !newUrl.match(skipImages) && !skipPages.includes(getskipPagesUrl.split('/')[1]);
	}
}

module.exports = new LinkUtil();
