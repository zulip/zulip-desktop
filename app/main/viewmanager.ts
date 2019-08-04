'use strict';

import { BrowserWindow, ipcMain } from 'electron';
import { View, ViewProps } from './view';

import ConfigUtil = require('../renderer/js/utils/config-util');

let refreshViews: any = null;

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
			// Type checking requires spread elements to match up with a rest parameter.
			// So, using a workaround here.
			(this.views[this.selectedIndex] as any)[name as keyof View](...params);
		});

		ipcMain.on('call-specific-view-function', (e: Event, index: number, name: string, ...params: any[]) => {
			// Type checking requires spread elements to match up with a rest parameter.
			// So, using a workaround here.
			(this.views[index] as any)[name as keyof View](...params);
		});

		ipcMain.on('server-load-complete', () => {
			let viewIsNull = true;
			let viewIndex = -1;
			const mainWindow = BrowserWindow.getAllWindows()[0];
			refreshViews = setInterval(() => {
				const view = this.views[this.selectedIndex];
				if (!view || view.isDestroyed()) {
					return;
				}
				if (view.loading === false) {
					if ((viewIsNull) || (viewIndex !== view.index)) {
						viewIsNull = false;
						viewIndex = view.index;
						mainWindow.setBrowserView(view);
						this.fixBounds(mainWindow);
					}
				} else if (viewIsNull === false) {
					viewIsNull = true;
					viewIndex = -1;
					mainWindow.setBrowserView(null);
				}
			}, 200);
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
		if (!view.webContents.getURL()) {
			const { url } = view;
			view.webContents.loadURL(url);
		}
	}

	fixBounds(mainWindow: Electron.BrowserWindow): void {
		// Any updates to the sidebar width should reflect both here and in css
		const SIDEBAR_WIDTH = 54;
		const view = this.views[this.selectedIndex];
		const showSidebar = ConfigUtil.getConfigItem('showSidebar', true);
		if (!view || view.isDestroyed()) {
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
		const mainWindow = BrowserWindow.getAllWindows()[0];
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
		const mainWindow = BrowserWindow.getAllWindows()[0];
		mainWindow.setBrowserView(null);
		for (const id in this.views) {
			this.destroy(this.views[id].index);
		}
		if (refreshViews) {
			clearInterval(refreshViews);
		}
	}

	forwardMessageAll(name: string, ...args: any[]): void {
		for (const id in this.views) {
			this.views[id].webContents.send(name, ...args);
		}
	}
}

export = new ViewManager();
