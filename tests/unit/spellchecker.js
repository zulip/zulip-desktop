const ConfigUtil = require('js/utils/config-util.js');
const SetupSpellChecker = require('js/spellchecker')

if(process.platform === 'darwin') {
	describe('test spell checker', function () {
	  // enable spellchecker settings
	  ConfigUtil.setConfigItem('enableSpellchecker', true);
	  ConfigUtil.setConfigItem('spellcheckerLanguage', 'en');
	  var dictionary = ['apple', 'pear', 'banana', 'pie'];
		// console.log(dictionary);  
	  SetupSpellChecker.init(dictionary);  // re-initialize after setting update
	  const spellCheckHandler = SetupSpellChecker.SpellCheckHandler

	  it('mark misspelled word', function () {
	    expect(spellCheckHandler.isMisspelled('asdasdasdw')).toBe(true)
	  })

	  it('verify properly spelled word', function () {
	    expect(spellCheckHandler.isMisspelled('help')).toBe(false)
	  })
	})
}