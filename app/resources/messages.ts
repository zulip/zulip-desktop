class Messages {
	invalidZulipServerError(domain: string): string {
		return `${domain} does not appear to be a valid Zulip server. Make sure that
			\n • You can connect to that URL in a web browser.\
			\n • If you need a proxy to connect to the Internet, that you've configured your proxy in the Network settings.\
			\n • It's a Zulip server. (The oldest supported version is 1.6).\
			\n • The server has a valid certificate. (You can add custom certificates in Settings > Organizations).`;
	}

	noOrgsError(domain: string): string {
		return `${domain} does not have any organizations added.\
		\nPlease contact your server administrator.`;
	}

	certErrorMessage(domain: string, error: string): string {
		return `Do you trust certificate from ${domain}? \n ${error}`;
	}

	certErrorDetail(): string {
		return `The organization you're connecting to is either someone impersonating the Zulip server you entered, or the server you're trying to connect to is configured in an insecure way.
		\nIf you have a valid certificate please add it from Settings>Organizations and try to add the organization again.
		\nUnless you have a good reason to believe otherwise, you should not proceed.
		\nYou can click here if you'd like to proceed with the connection.`;
	}
}

export = new Messages();
