# This script rename .zip files build from electron builder
# to have ${os}.zip 

set -e
set -x

# make a zips directory to hold all the renamed files
# we move them out when every zip file for each file is renamed
mkdir -p dist/zips

ZIP_BUILD_FILE=`ls dist/*.zip`
echo ZIP_BUILD_FILE
mv ZIP_BUILD_FILE `node -pe "'$ZIP_BUILD_FILE'.replace('.zip', '-$1.zip')"`
mv dist/*.zip dist/zips/
