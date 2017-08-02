# Troubleshooting

* App icon will only show in the release version. The dev version will use the Electron icon
* If you see issue, try deleting `node_modules` and `npm install`
* Electron is more or less Chrome, you can get developer tools using `CMD+ALT+I`

### Error : ChecksumMismatchError
- Try deleteing `node_modules` && `app/node_modules` directories. Re-install dependencies using `npm install`.

### Error : Module version mismatch. Expected 50, got 51
- Make sure you have installed [node-gyp](https://github.com/nodejs/node-gyp#installation) dependencies properly.
