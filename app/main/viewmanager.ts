'use strict';

import { ipcMain, BrowserView } from 'electron';
import { View, ViewProps } from './view';
import { mainWindow } from '.';

import ConfigUtil = require('../renderer/js/utils/config-util');

// ViewManager Class allows us to create, delete and manage several instances of View class
class ViewManager {
	views: { [key: number]: View };
	selectedIndex: number;
	domains: { [key: string]: string };

	constructor() {
		this.views = {};
		this.selectedIndex = -1;
		this.registerIpcs();
	}

	registerIpcs(): void {
		ipcMain.on('create-view', (e: Event, props: ViewProps) => {
			this.create(props);
		});

		ipcMain.on('select-view', (e: Event, index: number) => {
			this.select(index);
		});

		ipcMain.on('destroy-view', (e: Event, index: number) => {
			this.destroy(index);
		});

		ipcMain.on('destroy-all-views', () => {
			this.destroyAll();
		});

		ipcMain.on('show-notification-settings', (e: Event, index: number) => {
			this.showNotificationSettings(index);
		});

		ipcMain.on('switch-url', (e: Event, index: number, url: string) => {
			this.switchUrl(index, url);
		});

		// Sends a message to the selected View's webContents.
		ipcMain.on('forward-view-message', (e: Event, name: string, ...params: any[]) => {
			this.views[this.selectedIndex].webContents.send(name, ...params);
		});

		// Sends a message to each View's webContents.
		ipcMain.on('forward-message-all', (e: Event, name: string, ...params: any[]) => {
			this.forwardMessageAll(name, ...params);
		});

		// Calls a function for the selected View.
		ipcMain.on('call-view-function', (e: Event, name: string, ...params: any[]) => {
			this.callViewFunction(this.selectedIndex, name, ...params);
		});

		// This call will be used in handle external link logic
		// ipcMain.on('call-specific-view-function', (e: Event, index: number, name: string, ...params: any[]) => {
		// 	// Type checking requires spread elements to match up with a rest parameter.
		// 	// So, using a workaround here.
		// 	(this.views[index] as any)[name as keyof View](...params);
		// });

		// Calls a function for the View with the given index.
		ipcMain.on('call-specific-view-function', (e: Event, index: number, name: string, ...params: any[]) => {
			this.callViewFunction(index, name, ...params);
		});

		ipcMain.on('toggle-silent', (e: Event, state: boolean) => {
			for (const id in this.views) {
				const view = this.views[id];
				try {
					view.webContents.setAudioMuted(state);
				} catch (err) {
					// view is not ready yet
					view.webContents.addListener('dom-ready', () => {
						view.webContents.setAudioMuted(state);
					});
				}
			}
		});

		ipcMain.on('focus-view-with-contents', (e: Event, contents: Electron.webContents) => {
			const view = BrowserView.fromWebContents(contents);
			if (view.webContents) {
				view.webContents.focus();
			}
		});
	}

	showNotificationSettings(index: number): void {
		this.views[index].showNotificationSettings();
	}

	switchUrl(index: number, url: string): void {
		const view = this.views[index];
		view.webContents.loadURL(url);
	}

	// Creates a new View and appends it to this.views.
	create(props: ViewProps): void {
		if (this.views[props.index]) {
			return;
		}
		const view = new View(props);
		this.views[props.index] = view;
		view.webContents.loadURL(props.url);
		view.setAutoResize({ width: true, height: true });
	}

	// Selects a view with the specified index.
	select(index: number): void {
		const view = this.views[index];
		if (!view || view.isDestroyed()) {
			console.log('Attempt to select a view that does not exist.');
			return;
		}
		this.selectedIndex = index;
		mainWindow.setBrowserView(view);
		this.fixBounds();
		if (!view.webContents.getURL()) {
			const { url } = view;
			view.webContents.loadURL(url);
		}
	}

	// BrowserView is like a separate BrowserWindow displayed inside the mainWindow
	// So, it requires its bounds to be set everytime it is selected.
	fixBounds(): void {
		// Any updates to the sidebar width should reflect both here and in css
		const SIDEBAR_WIDTH = 54;
		const view = this.views[this.selectedIndex];
		const showSidebar = ConfigUtil.getConfigItem('showSidebar', true);
		if (!view) {
			return;
		}
		const { width, height } = mainWindow.getContentBounds();

		view.setBounds({
			x: showSidebar ? SIDEBAR_WIDTH : 0,
			y: 0,
			width: showSidebar ? width - SIDEBAR_WIDTH : width,
			height
		});
	}

	// Destroys View with specified index.
	destroy(index: number): void {
		const view = this.views[index];
		if (!view || view.isDestroyed()) {
			console.log('Attempt to delete a view that does not exist.');
			return;
		}
		if (mainWindow.getBrowserView() === view) {
			mainWindow.setBrowserView(null);
		}
		view.destroy();
		delete this.views[index];
	}

	// Destroys all Views.
	destroyAll(): void {
		mainWindow.setBrowserView(null);
		for (const id in this.views) {
			this.destroy(this.views[id].index);
		}
	}

	// Calls a function in View class of a specified index.
	callViewFunction(index: number, name: string, ...params: any[]): void {
		const view = this.views[index];
		if (!view || view.isDestroyed()) {
			return;
		}
		(view as any)[name as keyof View](...params);
	}

	// Forwards a message to webContents of each view.
	forwardMessageAll(name: string, ...args: any[]): void {
		for (const id in this.views) {
			this.views[id].webContents.send(name, ...args);
		}
	}
}

export = new ViewManager();
