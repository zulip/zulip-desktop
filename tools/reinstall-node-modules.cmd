@echo off

echo "Removing node_modules and app/node_modules"
rmdir /s /q node_modules
rmdir /s /q app/node_modules

echo "node_modules removed reinstalling npm packages"
npm i
