import {shell} from 'electron';
import fs from 'fs';
import os from 'os';
import path from 'path';

import escape from 'escape-html';

export function isUploadsUrl(server: string, url: URL): boolean {
	return url.origin === server && url.pathname.startsWith('/user_uploads/');
}

export async function openBrowser(url: URL): Promise<void> {
	if (['http:', 'https:', 'mailto:'].includes(url.protocol)) {
		await shell.openExternal(url.href);
	} else {
		// For security, indirect links to non-whitelisted protocols
		// through a real web browser via a local HTML file.
		const dir = fs.mkdtempSync(
			path.join(os.tmpdir(), 'zulip-redirect-')
		);
		const file = path.join(dir, 'redirect.html');
		fs.writeFileSync(file, `\
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Refresh" content="0; url=${escape(url.href)}" />
        <title>Redirecting</title>
        <style>
            html {
                font-family: menu, "Helvetica Neue", sans-serif;
            }
        </style>
    </head>
    <body>
        <p>Opening <a href="${escape(url.href)}">${escape(url.href)}</a>…</p>
    </body>
</html>
`);
		await shell.openPath(file);
		setTimeout(() => {
			fs.unlinkSync(file);
			fs.rmdirSync(dir);
		}, 15000);
	}
}
