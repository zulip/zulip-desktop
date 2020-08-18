/**
 * This file contains the functions which make use of Main process APIs with already functioning code in Renderer process.
 */
import {Notification} from 'electron';

export const showDarwinNotification = (
	event: Electron.IpcMainEvent,
	notificationOptions: Electron.NotificationConstructorOptions
) => {
	const notification = new Notification(notificationOptions);
	notification.show();

	notification.on('reply', (_event, response) => {
		event.sender.send('replied', response);
	});
};
