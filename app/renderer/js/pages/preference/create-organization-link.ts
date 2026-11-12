export function bindCreateOrganizationLink(
  element: EventTarget,
  openBrowser: (url: URL) => Promise<void>,
): void {
  element.addEventListener("click", () => {
    void openBrowser(new URL("https://zulip.com/new/"));
  });
}
