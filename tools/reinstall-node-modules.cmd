@echo off

echo "Removing node_modules"
rmdir /s /q node_modules

echo "node_modules removed reinstalling npm packages"
npm i
