const SetupSpellChecker = require('js/spellchecker')

describe('test spell checker', function () {
  SetupSpellChecker.init(true)
  const spellCheckHandler = SetupSpellChecker.SpellCheckHandler
  it('mark misspelled word', function () {
    expect(spellCheckHandler.isMisspelled('helpe')).toBe(true)
  })

  it('verify properly spelled word', function () {
    expect(spellCheckHandler.isMisspelled('help')).toBe(false)
  })
})
