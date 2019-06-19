'use strict';

let instance: null | CommonUtil = null;

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
	decodeString(stringInput: string): string {
		const parser = new DOMParser();
		const dom = parser.parseFromString(
			'<!doctype html><body>' + stringInput,
			'text/html');
		return dom.body.textContent;
	}
}

export = new CommonUtil();
