import * as t from "./translation-util";

console.log("✅ messages.ts loaded!");

type DialogBoxError = {
  title: string;
  content: string;
};

/**
 * Returns a detailed error message when a Zulip server is unreachable.
 * Includes emojis and troubleshooting steps for the Reconnect Box.
 */
export function invalidZulipServerError(domain: string): string {
  // Using backticks (`) is required for ${variable} to work
  return t.__(
    `⚠️ We couldn’t reach ${domain}. Don’t worry! Here’s what you can try:

🌐 Open the URL in your web browser.
🛠️ Check your proxy settings if needed.
📦 Make sure the server is running Zulip version 1.6 or newer.
🔒 Verify the SSL certificate is valid and properly installed.

💡 Tip: Stay connected and try again if the problem persists.

For more guidance, visit:
🔗 https://zulip.readthedocs.io/en/stable/production/ssl-certificates.html`,
    { domain }
  );
}

/**
 * Returns an error object when multiple Enterprise organizations fail to load.
 */
export function enterpriseOrgError(domains: string[]): DialogBoxError {
  let domainList = "";
  for (const domain of domains) {
    // FIXED: Added backticks and proper interpolation
    domainList += `${domain}\n`;
  }

  return {
    title: t.__mf(
      "{number, plural, one {Could not add # organization} other {Could not add # organizations}}",
      { number: domains.length },
    ),
    // FIXED: Added backticks and proper interpolation
    content: `${domainList}\n${t.__("Please contact your system administrator.")}`,
  };
}

/**
 * Returns an error object when a user tries to remove a restricted organization.
 */
export function orgRemovalError(url: string): DialogBoxError {
  return {
    title: t.__("Removing {{{url}}} is a restricted operation.", { url }),
    content: t.__("Please contact your system administrator."),
  };
}