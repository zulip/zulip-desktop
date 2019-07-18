'use strict';

import { BrowserWindow, ipcMain } from 'electron';
import { View, ViewProps } from './view';

import ConfigUtil = require('../renderer/js/utils/config-util');

class ViewManager {
	views: { [key: number]: View };
	selectedIndex: number;

	constructor() {
		this.views = {};
		this.selectedIndex = 0;
		this.registerIpcs();
	}

	registerIpcs(): void {
		ipcMain.on('view-create', (e: Event, props: ViewProps) => {
			this.create(props);
		});

		ipcMain.on('view-select', (e: Event, index: number) => {
			this.select(index);
		});

		ipcMain.on('view-destroy', (e: Event, index: number) => {
			this.destroy(index);
		});

		ipcMain.on('view-destroy-all', () => {
			this.destroyAll();
		});

		ipcMain.on('forward-message-view', (e: Event, name: string, ...params: any[]) => {
			this.views[this.selectedIndex].webContents.send(name, ...params);
		});

		ipcMain.on('forward-message-all', (e: Event, name: string, ...params: any[]) => {
			this.forwardMessageAll(name, ...params);
		});

		ipcMain.on('call-view-function', (e: Event, name: string, ...params: any[]) => {
			const fn = this.views[this.selectedIndex][name as keyof View];
			if (typeof fn === 'function') {
				// Type checking requires spread elements to match up with a rest parameter.
				// So, using a workaround here.
				(fn as any)(...params);
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
		const mainWindow = BrowserWindow.getAllWindows()[0];
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
		mainWindow.setBrowserView(view);
		view.webContents.focus();
		this.fixBounds();
	}

	fixBounds(): void {
		const SIDEBAR_WIDTH = 54;
		const view = this.views[this.selectedIndex];
		const showSidebar = ConfigUtil.getConfigItem('showSidebar', true);
		if (!view || view.isDestroyed()) {
			console.log('Attempt to fix bounds for a view that does not exist.');
			return;
		}
		const mainWindow = BrowserWindow.getAllWindows()[0];
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
	}

	forwardMessageAll(name: string, ...args: any[]): void {
		for (const id in this.views) {
			this.views[id].webContents.send(name, ...args);
		}
	}
}

export = new ViewManager();
