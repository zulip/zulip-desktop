# Managing translations

A person using the Zulip app can choose from a large number of
languages for the app to present its UI in.

Within the running app, we use the library `i18n` to get the
appropriate translation for a given string ("message") used in the UI.

To manage the set of UI messages and translations for them, and
provide a nice workflow for people to contribute translations, we use
(along with the rest of the Zulip project) a service called Weblate.

### Updating the languages supported in the code

Sometimes when downloading translated strings we get a file for a new
language. This happens when we've opened up a new language for people
to contribute translations into in the Zulip project on Weblate,
which we do when someone expresses interest in contributing them.

The locales for supported languages are stored in `public/translations/supported-locales.json`

So, when a new language is added, update the `supported-locales` module.

### Updating the languages offered in the UI

The `supported-locales.json` module is also responsible for the language dropsdown ont he settings page.
Maintainers/contributors only need to add the locale to the new language which would result in addition of it to the dropdown automatically.
