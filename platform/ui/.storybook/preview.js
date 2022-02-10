export const parameters = {
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
};

export const decorators = [];
