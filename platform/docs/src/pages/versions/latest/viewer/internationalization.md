# Viewer: Internationalization

OHIF supports internationalization using [i18next](https://www.i18next.com/)
through the npm package [@ohif/i18n](https://www.npmjs.com/package/@ohif/i18n),
where is the main instance of i18n containing several languages and tools.

<div class='row'>
  <div class='column'>
    <p>Our translation management is powered by <a href="https://locize.com/" target="_blank" rel="noopener noreferrer">Locize</a> through their generous support of open source.</p>
  </div>
  <div class='column'>
    <a href="https://locize.com/" target="_blank" rel="noopener noreferrer" style='padding: 20px'>
      <img src="../assets/img/locizeSponsor.svg" alt="Locize Translation Management Logo">
    </a>
  </div>
</div>

## Installing

```bash
yarn add @ohif/i18n

# OR

npm install --save @ohif/i18n
```

## How it works

After installing `@ohif/i18n` npm package, the translation function
[t](https://www.i18next.com/overview/api#t) can be used [with](#with-react) or
[without](#without-react) React.

A translation will occur every time a text match happens in a
[t](https://www.i18next.com/overview/api#t) function.

The [t](https://www.i18next.com/overview/api#t) function is responsible for
getting translations using all the power of i18next.

E.g.

Before:

```html
<div>my translated text</div>
```

After:

```html
<div>{t('my translated text')}</div>
```

If the translation.json file contains a key that matches the HTML content e.g.
`my translated text`, it will be replaced automatically by the
[t](https://www.i18next.com/overview/api#t) function.

---

### With React

This section will introduce you to [react-i18next](https://react.i18next.com/)
basics and show how to implement the [t](https://www.i18next.com/overview/api#t)
function easily.

#### Using HOCs

In most cases we used
[High Order Components](https://react.i18next.com/latest/withtranslation-hoc) to
share the `t` function among OHIF's components.

E.g.

```js
import React from 'react';
import { withTranslation } from '@ohif/i18n';

function MyComponent({ t, i18n }) {
  return <p>{t('my translated text')}</p>;
}

export default withTranslation('MyNameSpace')(MyComponent);
```

> Important: if you are using React outside the OHIF Viewer, check the
> [I18nextProvider](#using-outside-of-ohif-viewer) section, `withTranslation`
> HOC doesnt works without a I18nextProvider

#### Using Hooks

Also, it's possible to get the `t` tool using
[React Hooks](https://react.i18next.com/latest/usetranslation-hook), but it
requires at least React > 16.8 😉

### Using outside of OHIF viewer

OHIF Viewer already sets a main
[I18nextProvider](https://react.i18next.com/latest/i18nextprovider) connected to
the shared i18n instance from `@ohif/i18n`, all extensions inside OHIF Viewer
will share this same provider at the end, you don't need to set new providers at
all.

But, if you need to use it completely outside of OHIF viewer, you can set the
I18nextProvider this way:

```js
import i18n from '@ohif/i18n';
import { I18nextProvider } from 'react-i18next';
import App from './App';

<I18nextProvider i18n={i18n}>
  <App />
</I18nextProvider>;
```

After setting `I18nextProvider` in your React App, all translations from
`@ohif/i18n` should be available following the basic [With React](#with-react)
usage.

---

### Without React

When needed, you can also use available translations _without React_.

E.g.

```js
import { T } from '@ohif/i18n';
console.log(T('my translated text'));
console.log(T('$t(Common:Play) my translated text'));
```

---

# Main Concepts While Translating

## Namespaces

Namespaces are being used to organize translations in smaller portions, combined
semantically or by use. Each `.json` file inside `@ohif/i18n` npm package
becomes a new namespace automatically.

- Buttons: All buttons translations
- CineDialog: Translations for the toll tips inside the Cine Player Dialog
- Common: all common jargons that can be reused like `t('$t(common:image)')`
- Header: translations related to OHIF's Header Top Bar
- MeasurementTable - Translations for the `@ohif/ui` Measurement Table
- UserPreferencesModal - Translations for the `@ohif/ui` Preferences Modal

### How to use another NameSpace inside the current NameSpace?

i18next provides a parsing feature able to get translations strings from any
NameSpace, like this following example getting data from `Common` NameSpace:

```
$t(Common:Reset)
```

## Extending Languages in @ohif/i18n

Sometimes, even using the same language, some nouns or jargons can change
according to the country, states or even from Hospital to Hospital.

In this cases, you don't need to set an entire language again, you can extend
languages creating a new folder inside a pre existent language folder and
@ohif/i18n will do the hard work.

This new folder must to be called with a double character name, like the `UK` in
the following file tree:

```bash
 |-- src
    |-- locales
    index.js
        |-- en
            |-- Buttons.json
            index.js
            | UK
               |-- Buttons.js
               indes.js
            | US
               |-- Buttons.js
               index.js
  ...
```

All properties inside a Namespace will be merged in the new sub language, e.g
`en-US` and `en-UK` will merge the props with `en`, using i18next's fallback
languages tool.

You will need to export all Json files in your `index.js` file, mounting an
object like this:

```js
   {
     en: {
       NameSpace: {
         keyWord1: 'keyWord1Translation',
         keyWord2: 'keyWord2Translation',
         keyWord3: 'keyWord3Translation',
       }
     },
     'en-UK': {
       NameSpace: {
         keyWord1: 'keyWord1DifferentTranslation',
       }
     }
   }
```

Please check the `index.js` files inside locales folder for an example of this
exporting structure.

### Extending languages dynamically

You have access to the i18next instance, so you can use the
[addResourceBundle](https://www.i18next.com/how-to/add-or-load-translations#add-after-init)
method to add and change language resources as needed.

E.g.

```js
import { i18n } from '@ohif/i18n';
i18next.addResourceBundle('pt-BR', 'Buttons', {
  Angle: 'Ângulo',
});
```

---

### How to set a whole new language

To set a brand new language you can do it in two different ways:

- Opening a pull request for `@ohif/i18n` and sharing the translation with the
  community. 😍 Please see [Contributing](#contributing-with-new-languages)
  section for further information.

- Setting it only in your project or extension:

You'll need a a final object like the following, what is setting French as
language, and send it to `addLocales` method.

```js
const newLanguage =
   {
     fr: {
       Commons: {
          "Reset": "Réinitialiser",
          "Previous": "Précédent",
       },
       Buttons: {
         "Rectangle": "Rectangle",
         "Circle": "Cercle",
       }
     }
```

To make it easier to translate, you can copy the .json files in the /locales
folder and theirs index.js exporters, keeping same keys and NameSpaces.
Importing the main index.js file, will provide you an Object as expected by the
method `addlocales`;

E.g. of `addLocales` usage

```js
import { addLocales } from '@ohif/i18n';
import locales from './locales/index.js';
addLocales(locales);
```

You can also set them manually, one by one, using this
[method](#extending-languages-dynamically).

---

## Language Detections

@ohif/i18n uses
[i18next-browser-languageDetector](https://github.com/i18next/i18next-browser-languageDetector)
to manage detections, also exports a method called initI18n that accepts a new
detector config as parameter.

### Changing the language

OHIF Viewer accepts a query param called `lng` in the url to change the
language.

E.g.

```
https://docs.ohif.org/demo/?lng=es-MX
```

### Language Persistence

The user's language preference is kept automatically by the detector and stored
at a cookie called 'i18next', and in a localstorage key called 'i18nextLng'.
These names can be changed with a new
[Detector Config](https://github.com/i18next/i18next-browser-languageDetector).

## Debugging translations

There is an environment variable responsible for debugging the translations,
called `REACT_APP_I18N_DEBUG`.

Run the project as following to get full debug information:

```bash
REACT_APP_I18N_DEBUG=true yarn run dev
```

### Contributing with new languages

Contributions of any kind are welcome! Please check the
[instructions](../development/contributing.md).
