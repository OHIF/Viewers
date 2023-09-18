// .storybook/manager.js

import { addons } from '@storybook/addons';
import ohifTheme from './OHIFTheme';

const link = document.createElement('link');
link.setAttribute('rel', 'shortcut icon');
document.head.appendChild(link);

addons.setConfig({
  theme: ohifTheme,
});

window.STORYBOOK_GA_ID = 'G-3S63CTHNP6';
window.STORYBOOK_REACT_GA_OPTIONS = {};
