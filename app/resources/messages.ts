interface DialogBoxError {
	title: string;
	content: string;
}

export function invalidZulipServerError(domain: string): string {
	return `${domain} does not appear to be a valid Zulip server. Make sure that
		\n • You can connect to that URL in a web browser.\
		\n • If you need a proxy to connect to the Internet, that you've configured your proxy in the Network settings.\
		\n • It's a Zulip server. (The oldest supported version is 1.6).\
		\n • The server has a valid certificate. (You can add custom certificates in Settings > Organizations). \
		\n • The SSL is correctly configured for the certificate. Check out the SSL troubleshooting guide -
		\n https://zulip.readthedocs.io/en/stable/production/ssl-certificates.html`;
}

export function noOrgsError(domain: string): string {
	return `${domain} does not have any organizations added.\
	\nPlease contact your server administrator.`;
}

export function certErrorMessage(domain: string, error: string): string {
	return `Certificate error for ${domain}\n${error}`;
}

export function certErrorDetail(): string {
	return `The organization you're connecting to is either someone impersonating the Zulip server you entered, or the server you're trying to connect to is configured in an insecure way.
	\nIf you have a valid certificate please add it from Settings>Organizations and try to add the organization again.`;
}

export function enterpriseOrgError(length: number, domains: string[]): DialogBoxError {
	let domainList = '';
	for (const domain of domains) {
		domainList += `• ${domain}\n`;
	}

	return {
		title: `Could not add the following ${length === 1 ? 'organization' : 'organizations'}`,
		content: `${domainList}\nPlease contact your system administrator.`
	};
}

export function orgRemovalError(url: string): DialogBoxError {
	return {
		title: `Removing ${url} is a restricted operation.`,
		content: 'Please contact your system administrator.'
	};
}
