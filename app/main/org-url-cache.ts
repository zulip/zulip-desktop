// Cache of configured organization origins for cross-org link handling
// This is updated by the renderer process when orgs change

let cachedOrgOrigins: string[] = [];

export function updateOrgUrls(urls: string[]): void {
  cachedOrgOrigins = urls.map((url) => new URL(url).origin);
}

export function isConfiguredOrgUrl(url: URL): boolean {
  return cachedOrgOrigins.includes(url.origin);
}
