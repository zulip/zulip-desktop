# Troubleshooting

* App icon will only show in the release version. The dev version will use the Electron icon
* If you see issue, try deleting `node_modules` and `npm install`
* Electron is more or less Chrome, you can get developer tools using `CTRL+SHIFT+I` (Windows) or `CMD+OPTION+I` (Mac)

### Error : ChecksumMismatchError
- Try deleting the `node_modules` directory and reinstalling dependencies using `npm install`

### Error : Module version mismatch. Expected 50, got 51
- Make sure you have installed [node-gyp](https://github.com/nodejs/node-gyp#installation) dependencies properly

### Error: Desktop Notifications not working
- Make sure the **Show Desktop Notifications** setting option is set to be true
- Check your OS notifications center settings
