# Configuring Zulip Desktop for multiple users

If you're a system admin and want to add certain organizations to the Zulip app for
all users of your system, you can do so by creating an enterprise config file.
The file should be placed at `/etc/zulip-desktop-config` for Linux and macOS computers
and inside `C:\Program Files\Zulip-Desktop-Config` on Windows.
It must be named `global_config.json` in both cases. 

To specify the preset organization you want to add for other users, you will need to
add the `json` shown below to the `global_config.json`. Replace `https://chat.zulip.org` with the
organization you want to add. You can also specify multiple organizations. 

```json
{
	"presetOrganizations": ["https://chat.zulip.org"],
	"autoUpdate": false
}
```

The above example adds [Zulip Community](https://chat.zulip.org) to Zulip every time the app is loaded. 
Users can add new organizations at all times, but cannot remove any organizations listed under `presetOrganizations`.

If you'd like to remove organizations and have admin access, you'll need to change the config file and remove the concerned URL from the `value` field.

It also turns off automatic updates for every Zulip user on the same machine. 

Currently, we only support `presetOrganizations` and `autoUpdate` settings. We are working on other settings as well, and will update this page when we add support for more.
