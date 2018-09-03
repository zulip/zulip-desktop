'use strict';

let instance = null;

class CommonUtil {
	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}
		return instance;
	}

	// unescape already encoded/escaped strings
	decodeString(string) {
		const parser = new DOMParser();
		const dom = parser.parseFromString(
			'<!doctype html><body>' + string,
			'text/html');
		return dom.body.textContent;
	}
}

module.exports = new CommonUtil();
