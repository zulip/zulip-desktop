'use strict';

import { ipcMain, BrowserView } from 'electron';
import { View, ViewProps } from './view';
import { mainWindow } from '.';

import ConfigUtil = require('../renderer/js/utils/config-util');

class ViewManager {
	views: { [key: number]: View };
	selectedIndex: number;

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

		ipcMain.on('forward-view-message', (e: Event, name: string, ...params: any[]) => {
			this.views[this.selectedIndex].webContents.send(name, ...params);
		});

		ipcMain.on('forward-message-all', (e: Event, name: string, ...params: any[]) => {
			this.forwardMessageAll(name, ...params);
		});

		ipcMain.on('call-view-function', (e: Event, name: string, ...params: any[]) => {
			this.callViewFunction(this.selectedIndex, name, ...params);
		});

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
					view.addListener('dom-ready', () => {
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

	create(props: ViewProps): void {
		if (this.views[props.index]) {
			return;
		}
		const view = new View(props);
		this.views[props.index] = view;
		view.webContents.loadURL(props.url);
	}

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
		view.setAutoResize({ width: true, height: true });
	}

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

	destroyAll(): void {
		mainWindow.setBrowserView(null);
		for (const id in this.views) {
			this.destroy(this.views[id].index);
		}
	}

	callViewFunction(index: number, name: string, ...params: any[]): void {
		const view = this.views[index];
		if (!view || view.isDestroyed()) {
			return;
		}
		(view as any)[name as keyof View](...params);
	}

	forwardMessageAll(name: string, ...args: any[]): void {
		for (const id in this.views) {
			this.views[id].webContents.send(name, ...args);
		}
	}
}

export = new ViewManager();
