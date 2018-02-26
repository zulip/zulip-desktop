# This script rename .zip files build from electron builder
# to have ${os}.zip 

set -e
set -x
 
ZIP_BUILD_FILE=`ls dist/*.zip`
echo ZIP_BUILD_FILE
mv ZIP_BUILD_FILE `node -pe "'$ZIP_BUILD_FILE'.replace('.zip', '-$1.zip')"`
