# Managing translations

A person using the Zulip app can choose from a large number of
languages for the app to present its UI in.

Within the running app, we use the library `i18n` to get the
appropriate translation for a given string ("message") used in the UI.

To manage the set of UI messages and translations for them, and
provide a nice workflow for people to contribute translations, we use
(along with the rest of the Zulip project) a service called Transifex.


## Maintainers: syncing to/from Transifex

### Setup

You'll want Transifex's CLI client, `tx`.

* Install in your homedir with `easy_install transifex-client` or `pip3 install --user transifex-client`.
  Or you can use your Zulip dev server virtualenv, which has it.

* Configure a `.transifexrc` with your API token.  See [upstream
  instructions](https://docs.transifex.com/client/client-configuration#transifexrc).

  This can go either in your homedir, or in your working tree to make
  the configuration apply only locally; it's already ignored in our
  `.gitignore`.

* You'll need to be added [as a "maintainer"][tx-zulip-maintainers] to
  the Zulip project on Transifex.  (Upstream [recommends
  this][tx-docs-maintainers] as the set of permissions on a Transifex
  project needed for interacting with it as a developer.)

[tx-zulip-maintainers]: https://www.transifex.com/zulip/zulip/settings/maintainers/
[tx-docs-maintainers]: https://docs.transifex.com/teams/understanding-user-roles#project-maintainers


### Uploading strings to translate

Run `tx push -s`.

This uploads from `app/translations/en.json` to the
set of strings Transifex shows for contributors to translate.
(See `.tx/config` for how that's configured.)


### Downloading translated strings

Run `tools/tx-pull`.

This writes to files `app/translations/<lang>.json`.
(See `.tx/config` for how that's configured.)

Then look at the following sections to see if further updates are
needed to take full advantage of the new or updated translations.


### Updating the languages supported in the code

Sometimes when downloading translated strings we get a file for a new
language.  This happens when we've opened up a new language for people
to contribute translations into in the Zulip project on Transifex,
which we do when someone expresses interest in contributing them.

The locales for supported languages are stored in `app/translations/supported-locales.json`

So, when a new language is added, update the `supported-locales` module.


### Updating the languages offered in the UI

The `supported-locales.json` module is also responsible for the language dropsdown ont he settings page.
Maintainers/contributors only need to add the locale to the new language which would result in addition of it to the dropdown automatically.
