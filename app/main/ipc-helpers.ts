/**
 * This file contains the functions which make use of Main process APIs with already functioning code in Renderer process.
 */
import {Notification, nativeImage} from 'electron';

import fetch from 'node-fetch';

export const showDarwinNotification = async (
	event: Electron.IpcMainEvent,
	notificationOptions: Electron.NotificationConstructorOptions,
	profilePicURL: string
) => {
	const profilePic = await getNativeImagefromUrl(profilePicURL);
	notificationOptions.icon = profilePic;

	const notification = new Notification(notificationOptions);
	notification.show();
	notification.on('reply', (_event, response) => {
		event.sender.send('replied', response);
	});
};

/* TODO: Migrate url->dataUri conversion part to renderer process
	to make use of browser caching of images.
*/
const getNativeImagefromUrl = async (imageURL: string) => {
	try {
		const response = await fetch(imageURL);
		const buffer = await response.buffer();
		const base64String = buffer.toString('base64');
		const dataUri = `data:image/png;base64,${base64String}`;
		const image = nativeImage.createFromDataURL(dataUri);
		return image;
	} catch (error) {
		console.error(error);
		return null;
	}
};
