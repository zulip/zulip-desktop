const path = require('path')

const TEMP_DIR = process.platform === 'win32' ? 'C:\\Windows\\Temp' : '/tmp'
const TEST_DIR = path.join(TEMP_DIR, 'ZulipTests')
const TEST_APP_PRODUCT_NAME = 'ZulipTest'

module.exports = {
  TEST_DIR,
  TEST_APP_PRODUCT_NAME
}
