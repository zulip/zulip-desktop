'use strict';

const wurl = require('wurl');
const DomainUtil = require('./domain-util.js');

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

	isURLNarrow(url) {
		const domains = DomainUtil.getDomains();
		for (const domain in domains) {
			if (url.startsWith(domains[domain].url)) {
				return true;
			}
		}
		return false;
	}

	isInternal(currentUrl, newUrl) {
		const currentDomain = wurl('hostname', currentUrl);
		const newDomain = wurl('hostname', newUrl);

		const sameDomainUrl = (currentDomain === newDomain || newUrl === currentUrl + '/');
		const isUploadsUrl = newUrl.includes(currentUrl + '/user_uploads/');
		const isInternalUrl = newUrl.includes('/#narrow') || isUploadsUrl;

		return {
			isInternalUrl: sameDomainUrl && isInternalUrl,
			isUploadsUrl
		};
	}

	isImage(url) {
		// test for images extension as well as urls like .png?s=100
		const isImageUrl = /\.(bmp|gif|jpg|jpeg|png|webp)\?*.*$/i;
		return isImageUrl.test(url);
	}

	isPDF(url) {
		// test for pdf extension
		const isPDFUrl = /\.(pdf)\?*.*$/i;
		return isPDFUrl.test(url);
	}
}

module.exports = new LinkUtil();
