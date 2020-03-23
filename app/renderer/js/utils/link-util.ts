export function isUploadsUrl(server: string, url: URL): boolean {
	return url.origin === server && url.pathname.startsWith('/user_uploads/');
}
