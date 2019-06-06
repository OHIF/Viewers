# Translating
OHIF supports internationalization using [i18next](https://www.i18next.com/) through the npm package [ohif-i18n](https://www.npmjs.com/package/ohif-i18n), where is the main instance of i18n containing several languages and tools.

### Installing
```bash
yarn add ohif-i18n

# OR

npm install --save ohif-i18n
```

### How it works
After installing `ohif-i18n` npm package, the translation function [t](https://www.i18next.com/overview/api#t) can be used [with](#with-react) or [without](#without-react) React.

A translation will occur every time a text match happens in a [t](https://www.i18next.com/overview/api#t) function.

The [t](https://www.i18next.com/overview/api#t) function is responsible for getting translations using all the power of i18next.

E.g.

Before:
````html
<div>my translated text</div>
````
After:
````html
<div>{t('my translated text')}</div>
````

If the translation.json file contains a key that matches the HTML content e.g. `my translated text`, it will be replaced automatically by the [t](https://www.i18next.com/overview/api#t) function.

---
#### With React
This section will introduce you to [react-i18next](https://react.i18next.com/) basics and show how to implement the [t](https://www.i18next.com/overview/api#t) function easily.

##### Using HOCs
In most cases we used [High Order Components](https://react.i18next.com/latest/withtranslation-hoc) to get the `t` tool between OHIF's components.

E.g. 

```js
import React from 'react';
import { withTranslation } from 'ohif-i18n';

function MyComponent({ t, i18n }) {
  return <p>{t('my translated text')}</p>
}

export default withTranslation('MyNameSpace')(MyComponent);
```
> Important: if you are using React outside the OHIF Viewer, check the [I18nextProvider](#using-outside-of-ohif-viewer) section, `withTranslation` HOC doesnt works without a I18nextProvider

##### Using Hooks
Also, it's possible to get the `t` tool using [React Hooks](https://react.i18next.com/latest/usetranslation-hook), but it requires at least React > 16.8. 


#### Using outside of OHIF viewer 
OHIF Viewer already sets a main [I18nextProvider](https://react.i18next.com/latest/i18nextprovider) connected to the shared i18n instance from `ohif-i18n`, 
all extensions inside the Viewer will share this same provider at the end, you don't need a provider when developing a react Extension if you use `ohif-i18n`;

But, if you need to use it completely outside of OHIF viewer, you can set the I18nextProvider this way:

```js
import i18n, { I18nextProvider } from 'ohif-i18n';
import App from './App';

<I18nextProvider i18n={i18n}>
  <App />
</I18nextProvider>
```
After setting `I18nextProvider` in your React App, all translations from `ohif-i18n` should be available following [With React](#with-react) usage.

----

#### Without React
When needed, you can also use available translations *without React*.

E.g.

```js
import { t } from 'ohif-i18n';
console.log( t('my translated text') );
```

---

# Main Concepts While Translating

### - Namespaces 
Namespaces are being used to organize translations in smaller portions, combined semantically or by use.
Each `.json` file inside `ohif-i18n` npm package becomes a new namespace automatically. 


- Buttons: All buttons translations
- CineDialog: Translations for the toll tips inside the Cine Player Dialog
- common: all common jargons that can be reused like `t('$t(common:image)')`
- Header: translations related to OHIF's Header Top Bar

### - Extending Languages in ohif-i18n
Sometimes, even in the same language, some nouns or jargons can change in different countries, states or even from Hospital to Hospital, in this cases, we can extend languages.

To extend a language, create a new folder inside a language with two characters as name, like the `UK` in the following file tree:

<img src="/assets/img/ohif-i18n-extending-files-tree.png" alt="Files Tree for Extending Purpouses" style="margin: 0 auto;" />

All properties inside a Namespace (.json file) will be replaced in the new sub language, e.g en-US, en-UK, es-AR, es-MX, etc.


#### - Extending languages dynamically

Once you have access to the i18n instance, you can use the [addResourceBundle](https://www.i18next.com/how-to/add-or-load-translations#add-after-init) method to add and change language resources.

E.g.
```js
import { i18n } from 'ohif-i18n';
i18next.addResourceBundle('pt-BR', 'Buttons', {
  'Angle': 'Ângulo'
});
```
------

### How to set a whole new language
To set a brand new language you can do it in two different ways:
* Opening a pull request for `ohif-i18n` and sharing the translation with the community. Please see [Contributing](#contributing-with-new-languages) section for further information
* Setting it only in your project or extension

To set it apart of `ohif-i18n`, follow this snippet:

File: myJsonFileWithLanguage.json // TODO - This example is a working in progress
```json
{
  "prop1": "value1",
  "prop2": "value2",
  "prop3": "value3",
  "prop4": "value4"
}
```

```js
import { extendLanguage } from 'ohif-i18n';
import myJsonFileWithLanguage from './myJsonFileWithLanguage.json';

extendLanguage(myJsonFileWithLanguage);
// TODO - This example is a working in progress
```


#Debugging translations
#TODO - WIP

### Contributing with new languages
This project follows the
[all-contributors](https://github.com/all-contributors/all-contributors)
specification. Contributions of any kind are welcome!

