---
sidebar_position: 4
sidebar_label: Internationalization
---

# Viewer: Internationalization

OHIF supports internationalization using [i18next](https://www.i18next.com/)
through the npm package [@ohif/i18n](https://www.npmjs.com/package/@ohif/i18n),
where is the main instance of i18n containing several languages and tools.

<div className="text--center">
    <p>Our translation management is powered by
    <a href="https://locize.com/" target="_blank" rel="noopener noreferrer"> Locize </a>
    through their generous support of open source.</p>
     <a href="https://locize.com/" target="_blank" rel="noopener noreferrer" style={{padding: '20px'}}>
      <img style={{width:'70px'}} src="https://pbs.twimg.com/profile_images/909709940910120961/oyB0mX2L.jpg" alt="Locize Translation Management Logo"/>
    </a>
</div>

## How to change language for the viewer?

You can take a look into user manuals to see how to change the viewer's
language. In summary, you can change the language:

- In the preference modals
- Using the language query in the URL: `lng=Test-LNG`

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

#### Using Hooks

You can use `useTranslation` hooks that is provided by `react-i18next`

You can read more about this
[here](https://react.i18next.com/latest/usetranslation-hook).

```js
import React from 'react';
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <p>{t('my translated text')}</p>;
}
```

### Using outside of OHIF viewer

OHIF Viewer already sets a main
[I18nextProvider](https://react.i18next.com/latest/i18nextprovider) connected to
the shared i18n instance from `@ohif/i18n`, all extensions inside OHIF Viewer
will share this same provider at the end, you don't need to set new providers at
all.

But, if you need to use it completely outside of OHIF viewer, you can set the
I18nextProvider this way:

```jsx
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

## Main Concepts While Translating

## Namespaces

Namespaces are being used to organize translations in smaller portions, combined
semantically or by use. Each `.json` file inside `@ohif/i18n` npm package
becomes a new namespace automatically.

- Buttons: All buttons translations
- CineDialog: Translations for the tool tips inside the Cine Player Dialog
- Common: all common jargons that can be reused like `t('$t(common:image)')`
- Header: translations related to OHIF's Header Top Bar
- MeasurementTable - Translations for the `@ohif/ui` Measurement Table
- UserPreferencesModal - Translations for the `@ohif/ui` Preferences Modal
- Modals - Translations available for other modals
- PatientInfo - Translations for patients info hover
- SidePanel - Translations for side panels
- ToolTip - Translations for tool tips

### How to use another NameSpace inside the current NameSpace?

i18next provides a parsing feature able to get translations strings from any
NameSpace, like this following example getting data from `Common` NameSpace:

```
$t('Common:Reset')
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
               index.js
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

You'll need a final object like the following, what is setting French as
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

## Test Language

We have created a test language that its translations can be seen in the locales
folder. You can copy paste the folder and its `.json` namespaces and add your
custom language translations.

> If you apply the test-LNG you can see all the elements get appended with 'Test
> {}'. For instance `Study list` becomes `Test Study list`.

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

## Contributing with new languages

We have integrated `i18next` into the OHIF Viewer and hooked it up with Locize
for translation management. Now we need your help to get the app translated into
as many languages as possible, and ensure that we haven't missed pieces of the
app that need translation. Locize has graciously offered to provide us with free
usage of their product.

Once each crowd-sourcing project is completed, we can approve it and merge the
changes into the main project. At that point, the language will be immediately
available on https://viewer.ohif.org/ for testing, and can be used in any OHIF
project. We will support usage through both the Locize CDN and by copying the
language directly into the `@ohif/i18n` package, so that end users can serve the
content from their own domains.

Here are a couple examples:

Spanish:
https://viewer.ohif.org/viewer/1.2.840.113619.2.5.1762583153.215519.978957063.78?lng=es

Chinese:
https://viewer.ohif.org/viewer/1.2.840.113619.2.5.1762583153.215519.978957063.78?lng=zh

Portuguese:
https://viewer.ohif.org/viewer/1.2.840.113619.2.5.1762583153.215519.978957063.78?lng=pt-BR

Here are some links you can use to sign up to help translate. All you have to do
is sign up, translate the strings, and click Save. On our side, we have a
dashboard to see how many strings are translated and by whom.

This is a pretty random set of languages, so please post below if you'd like a
new language link to be added:

Languages:

[French](https://www.locize.io/register?invitation=Nj8jRPaFKYwtIfNZ6Y5GVOJOpeiXNAdVuSiOg9ceaiveP6uF6y1wVXM9lgfKoYZX)

[German](https://www.locize.io/register?invitation=gChNiVi66YINTPpbKESVAVYPapwg3DkpvMSSomLTvVqBJTXrdmPvxi0WZYHER11q)

[Dutch](https://www.locize.io/register?invitation=2PGe7I184aN0cazM4GXMhzeLtGTf9Zen5uyOEFhHQ8vYkfKHkgR0mJ8dwbNlIeCG)

[Turkish](https://www.locize.io/register?invitation=NOMIXsfneqPbFDqjce5wI7Z6p2swXSjc0rHOH4KLcM6qXSNA4LGyJaLxS7nqWAe3)

[Chinese](https://www.locize.io/register?invitation=lrcUbt7DvV4aJmQeEA4SMAj5xNWr3rltOcaZW1cFc6eod0nvzSPFU4V383tDHGGn)

[Japanese](https://www.locize.io/register?invitation=AaRq2S22o5FsxArwgVuw1gZcQjoe2ffyxarqlAXOpN7JnR2sf2mfamc5qV6LG1Mn)

[Arabic](https://www.locize.io/register?invitation=BiqI6fOm1sC84N3YJLbImXmaOCk8Hc3TMGpXg7NH2R0b0OKuPCp9wlCHLoqMRpfQ)

[Hindi](https://www.locize.io/register?invitation=ph7JmOGTV95DF3EFaI1kvK5Hx98dV9w2wj9h9UhUCWnkBNAwWEdWMcyjnF94zkWb)

[Malay](https://www.locize.io/register?invitation=HsV9F5mKZyeUZYrC3XFRzNI2l0EsIh6hK0MUIKP8IYZA3GxuzfgkvWBLCFwCpDik)

[Russian](https://www.locize.io/register?invitation=da4V9Q8DVO3M1FIlvfT50ZiS8NDNgvC0dE5hHUEAp47FXy6pLXmf1cp2lgLBfLmb)

[Swedish](https://www.locize.io/register?invitation=uR4kzBZC1vhJe6jyMwYXgGPj84QDMulQRlt2s6rONU6ljUh5dgwuUyhJEtZ4REA3)

[Italian](https://www.locize.io/register?invitation=viAS1NC5q342OxtuIv3JFX9DJ3KoR4SmGoElkBlRMphsDKt4hy9bW8JfBjHlfnd7)

[Spanish](https://www.locize.io/register?invitation=ZikXW3KI4w4eo5Cf6L1aQMWaR69XAQ0a9Va3NGorH7mAPvEPXp8w8NLkPNLs5nG8)

[Ukrainian](https://www.locize.io/register?invitation=TY0s6onqH3Asl05Bh1qB44SNSABL2pTYoturwxAmcNKRnzBZFK7bGfn7kVi23Vpg)

[Vietnamese](https://www.locize.io/register?invitation=eqfHDm0vaqxGfQ5TGt6SeV0dx9b2dCp1RrMRdIRavqzOCOAfD3IElzUsyIT689cK)

[Portugese-Brazil](https://www.locize.io/register?invitation=Qc5Dq449xbblQqLTpWeMfsyFiu3gACcgpj0EIucQjjs9Ph9pzPLpq3MnZupF9t6N)

Don't see your language in the above list? Add a request
[here](https://github.com/OHIF/Viewers/issues/618) so that we can create the
language for your translation contribution.
