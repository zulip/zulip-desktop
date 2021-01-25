import {remote} from 'electron';

import DefaultNotification from './default-notification';
import {appId} from './helpers';

const {app} = remote;

// From https://github.com/felixrieseberg/electron-windows-notifications#appusermodelid
// On windows 8 we have to explicitly set the appUserModelId otherwise notification won't work.
app.setAppUserModelId(appId);

export interface NotificationData {
	close: () => void;
	title: string;
	dir: NotificationDirection;
	lang: string;
	body: string;
	tag: string;
	image: string;
	icon: string;
	badge: string;
	vibrate: readonly number[];
	timestamp: number;
	renotify: boolean;
	silent: boolean;
	requireInteraction: boolean;
	data: unknown;
	actions: readonly NotificationAction[];
}

export function newNotification(
	title: string,
	options: NotificationOptions | undefined,
	dispatch: (type: string, eventInit: EventInit) => boolean
): NotificationData {
	const notification = new DefaultNotification(title, options);
	for (const type of ['click', 'close', 'error', 'show']) {
		notification.addEventListener(type, (ev: Event) => {
			if (!dispatch(type, ev)) {
				ev.preventDefault();
			}
		});
	}

	return {
		close: () => {
			notification.close();
		},
		title: notification.title,
		dir: notification.dir,
		lang: notification.lang,
		body: notification.body,
		tag: notification.tag,
		image: notification.image,
		icon: notification.icon,
		badge: notification.badge,
		vibrate: notification.vibrate,
		timestamp: notification.timestamp,
		renotify: notification.renotify,
		silent: notification.silent,
		requireInteraction: notification.requireInteraction,
		data: notification.data,
		actions: notification.actions
	};
}
