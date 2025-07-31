import * as t from "./translation-util.ts";

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

export function enterpriseOrgError(domains: string[]): DialogBoxError {
  let domainList = "";
  for (const domain of domains) {
    domainList += `• ${domain}\n`;
  }

  return {
    title: t.__mf(
      "{number, plural, one {Could not add # organization} other {Could not add # organizations}}",
      {number: domains.length},
    ),
    content: `${domainList}\n${t.__("Please contact your system administrator.")}`,
  };
}

export function orgRemovalError(url: string): DialogBoxError {
  return {
    title: t.__("Removing {{{url}}} is a restricted operation.", {url}),
    content: t.__("Please contact your system administrator."),
  };
}
