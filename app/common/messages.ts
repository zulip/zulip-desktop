type DialogBoxError = {
  title: string;
  content: string;
};

export function invalidZulipServerError(domain: string): string {
  return `${domain} does not appear to be a valid Zulip server. Make sure that
 • You can connect to that URL in a web browser.
 • If you need a proxy to connect to the Internet, that you've configured your proxy in the Network settings.
 • It's a Zulip server. (The oldest supported version is 1.6).
 • The server has a valid certificate.
 • The SSL is correctly configured for the certificate. Check out the SSL troubleshooting guide -
 https://zulip.readthedocs.io/en/stable/production/ssl-certificates.html`;
}

export function enterpriseOrgError(
  length: number,
  domains: string[],
): DialogBoxError {
  let domainList = "";
  for (const domain of domains) {
    domainList += `• ${domain}\n`;
  }

  return {
    title: `Could not add the following ${
      length === 1 ? "organization" : "organizations"
    }`,
    content: `${domainList}\nPlease contact your system administrator.`,
  };
}

export function orgRemovalError(url: string): DialogBoxError {
  return {
    title: `Removing ${url} is a restricted operation.`,
    content: "Please contact your system administrator.",
  };
}

export function enterpriseInvalidJson(
  pathToConfigFile: string,
): DialogBoxError {
  return {
    title: "Invalid JSON",
    content: `Correct the invalid JSON format in global_config.json.\nIt can be found in:\n${pathToConfigFile}`,
  };
}
