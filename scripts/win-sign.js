"use strict";

const childProcess = require("node:child_process");
const {promisify} = require("node:util");

const exec = promisify(childProcess.exec);

exports.default = async ({path, hash}) => {
  await exec(
    `powershell.exe Invoke-TrustedSigning \
-Endpoint https://eus.codesigning.azure.net/ \
-CodeSigningAccountName kandralabs \
-CertificateProfileName kandralabs \
-Files '${path}' \
-FileDigest '${hash}' \
-TimestampRfc3161 http://timestamp.acs.microsoft.com \
-TimestampDigest '${hash}'`,
    {stdio: "inherit"},
  );
};
