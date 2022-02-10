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

window.STORYBOOK_GA_ID = "G-3S63CTHNP6"
window.STORYBOOK_REACT_GA_OPTIONS = {}
