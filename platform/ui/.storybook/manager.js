// .storybook/manager.js

import { addons } from '@storybook/addons';
import ohifTheme from './OHIFTheme';
import favicon from '/static/favicon.png';

const link = document.createElement('link');
link.setAttribute('rel', 'shortcut icon');
link.setAttribute('href', favicon);
document.head.appendChild(link);

addons.setConfig({
  theme: ohifTheme,
});
