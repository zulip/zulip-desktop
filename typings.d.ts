'use strict';
declare module '@electron-elements/send-feedback';
declare module 'node-mac-notifier';
declare module 'wurl';

interface PageParamsObject {
	realm_uri: string;
	default_language: string;
	external_authentication_methods: any;
}
// eslint-disable-next-line unicorn/prevent-abbreviations
declare let page_params: PageParamsObject;

// This is mostly zulip side of code we access from window
interface Window {
	$: any;
	narrow: any;
}

interface ZulipWebWindow extends Window {
	electron_bridge: any;
	tray: any;
	lightbox: any;
}
