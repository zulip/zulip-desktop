# Customizing Link Protocols

The Zulip app supports opening certain link protocols directly in their associated system applications. These are known as **whitelisted protocols**.

## Default Whitelisted Protocols

By default, the following protocols are whitelisted:

```
http https mailto tel sip
```

Links using these protocols are opened directly by the system.

All other protocols are considered potentially unsafe and are therefore opened indirectly—through a local HTML file—in your default web browser.

## Extending the Whitelisted Protocols

It is possible to customize the list of whitelisted protocols by editing the `settings.json` file located at: `userdata/Zulip/config/settings.json`

To add or modify the list, the `whitelistedProtocols` key can be updated. For example:

```json
{
    ...
    "whitelistedProtocols": [
        "http:",
        "https:",
        "mailto:"
    ]
    ...
}
```

Note: Each protocol should include the trailing colon (:), e.g., "mailto:" instead of "mailto".
