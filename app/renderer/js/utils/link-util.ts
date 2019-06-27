'use strict';

// TODO: TypeScript - Add @types/
import wurl = require('wurl');

let instance: null | LinkUtil = null;

interface IsInternalResponse {
	isInternalUrl: boolean;
	isUploadsUrl: boolean;
}

class LinkUtil {
	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		return instance;
	}

	isInternal(currentUrl: string, newUrl: string): IsInternalResponse {
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

	isImage(url: string): boolean {
		// test for images extension as well as urls like .png?s=100
		const isImageUrl = /\.(bmp|gif|jpg|jpeg|png|webp)\?*.*$/i;
		return isImageUrl.test(url);
	}

	isPDF(url: string): boolean {
		// test for pdf extension
		const isPDFUrl = /\.(pdf)\?*.*$/i;
		return isPDFUrl.test(url);
	}
}

export = new LinkUtil();
