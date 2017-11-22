#!/usr/bin/env bash

if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
    export {no_proxy,NO_PROXY}="127.0.0.1,localhost"
    export DISPLAY=:99.0
    sh -e /etc/init.d/xvfb start
    sleep 3

    echo 'Travis Screen Resolution:'
    xdpyinfo | grep dimensions
fi

npm run test

if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
    npm run test-e2e
fi
