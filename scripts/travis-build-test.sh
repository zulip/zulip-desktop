#!/usr/bin/env bash

# exit script if fails
set -e;

if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
    export {no_proxy,NO_PROXY}="127.0.0.1,localhost"
    export DISPLAY=:99.0
    sh -e /etc/init.d/xvfb start
    sleep 3

    echo 'Travis Screen Resolution:'
    xdpyinfo | grep dimensions
fi

npm run test

# Remove this condition when unit test for linux is added
if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
    npm run test-unit
fi

# Disabling e2e tests on Travis as spectron tests timeout on their hardware
# npm run test-e2e

