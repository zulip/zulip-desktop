'use strict';

const {app} = require('electron').remote;

const os = require('os');

class SystemUtil {
    getOS() {
        if (os.platform() === 'darwin') {
            return 'Mac';
        }
        if (os.platform() === 'linux') {
            return 'Linux';
        }
        if (os.platform() === 'win32' || os.platform() === 'win64') {
            if (parseFloat(os.release()) < 6.2) {
                return 'Windows 7';
            } else {
                return 'Windows 10';
            }
        }
    }

    getUserAgent() {
        return 'ZulipElectron/' + app.getVersion() + ' ' + this.getOS();
    }
}

module.exports = SystemUtil;
