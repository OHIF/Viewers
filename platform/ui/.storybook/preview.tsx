import React from 'react';
import { DocsPage, DocsContainer } from '@storybook/addon-docs';
import {
  Heading,
  SectionName,
  Footer,
  AnchorListItem,
  LinkComponent,
} from '../src/storybook/components';

import '../src/tailwind.css';
import './custom.css';

// https://github.com/mondaycom/monday-ui-react-core/tree/master/.storybook

export const parameters = {
  docs: {
    inlineStories: true,
    container: ({ children, context }) => (
      <DocsContainer context={context}>{children}</DocsContainer>
    ),
    page: DocsPage,
    components: {
      Heading,
      Footer,
      h2: SectionName,
      h3: ({ children }) => <h3 className="my-2 to-blue-900 text-xl">{children}</h3>,
      li: AnchorListItem,
      a: LinkComponent,
      p: ({ children }) => <p className="font-inter my-2 text-gray-800">{children}</p>,
      // todo: add pre and code
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
  options: {
    storySort: {
      order: ['Welcome', 'Contribute', 'Foundations', 'Modals', '*'],
    },
  },
};

export const decorators = [];
