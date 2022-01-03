import { parameters } from '@storybook/addon-docs/dist/esm/frameworks/react/config';
import { addParameters } from '@storybook/react';
import { DocsPage, DocsContainer } from '@storybook/addon-docs/blocks';
import { ComponentName } from '../src/storybook/components';
import '../src/tailwind.css';

addParameters({
  docs: {
    ...parameters.docs,
    inlineStories: true,
    container: ({ children, context }) => (
      <DocsContainer context={context}>{children}</DocsContainer>
    ),
    page: DocsPage,
    components: {
      h1: ComponentName,
    },
  },
  viewMode: 'docs',
  previewTabs: {
    'storybook/docs/panel': {
      index: -1,
    },
    canvas: { title: 'Sandbox' },
  },
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  viewport: {
    disable: true,
  },
  backgrounds: {
    default: 'OHIF-v3',
    values: [
      {
        name: 'White',
        value: '#FFFFFF',
      },
      {
        name: 'OHIF-v3',
        value: '#090C29',
      },
      {
        name: 'Light',
        value: '#F8F8F8',
      },
      {
        name: 'Dark',
        value: '#333333',
      },
    ],
  },
});

export const decorators = [];
