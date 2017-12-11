const ConfigUtil = require('js/utils/config-util.js');
const SetupSpellChecker = require('js/spellchecker')

describe('test spell checker', function () {
  ConfigUtil.setConfigItem('enableSpellchecker', true);
  SetupSpellChecker.init()  // re-initialize after setting update

  const spellCheckHandler = SetupSpellChecker.SpellCheckHandler

  it('mark misspelled word', function () {
    expect(spellCheckHandler.isMisspelled('helpe')).toBe(true)
  })

  it('verify properly spelled word', function () {
    expect(spellCheckHandler.isMisspelled('help')).toBe(false)
  })
})
