'use strict';

// TODO: TypeScript - Add @types/
import wurl = require('wurl');

interface IsInternalResponse {
	isInternalUrl: boolean;
	isUploadsUrl: boolean;
}

export function isInternal(currentUrl: string, newUrl: string): IsInternalResponse {
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

export function isImage(url: string): boolean {
	// test for images extension as well as urls like .png?s=100
	const isImageUrl = /\.(bmp|gif|jpg|jpeg|png|webp)\?*.*$/i;
	return isImageUrl.test(url);
}

export function isPDF(url: string): boolean {
	// test for pdf extension
	const isPDFUrl = /\.(pdf)\?*.*$/i;
	return isPDFUrl.test(url);
}
