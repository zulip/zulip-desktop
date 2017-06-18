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

		// We'll be needing this to open images in default browser
		return (currentDomain === newDomain) && !newUrl.match(skipImages);
	}
}

module.exports = new LinkUtil();
