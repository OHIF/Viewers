const validPathDefinition1 = [
  {
    name: 'one',
    path: '/one',
  },
  {
    name: 'two',
    path: '/two',
  },
  {
    name: 'three',
    path: '/three',
  },
  {
    name: 'home',
    path: '/',
  },
];

const validPathDefinition2 = [
  {
    name: 'one',
    path: '/one',
  },
  {
    name: 'two',
    path: ['/two', '/four', '/'],
  },
  {
    name: 'three',
    path: '/three',
  },
];

const duplicatedNoHomePathDefinition1 = [
  {
    name: 'one',
    path: '/one',
  },
  {
    name: 'two',
    path: '/one',
  },
  {
    name: 'three',
    path: '/three',
  },
];

const duplicatedNoHomePathDefinition2 = [
  {
    name: 'one',
    path: '/one',
  },
  {
    name: 'two',
    path: ['/one'],
  },
  {
    name: 'three',
    path: '/three',
  },
];

const duplicatedNoHomePathDefinition3 = [
  {
    name: 'one',
    path: '/one',
  },
  {
    name: 'two',
    path: ['/one', '/two'],
  },
  {
    name: 'three',
    path: '/three',
  },
];

const duplicatedNoHomePathDefinition4 = [
  {
    name: 'one',
    path: '/one',
  },
  {
    name: 'two',
    path: ['/two', '/two'],
  },
  {
    name: 'three',
    path: '/three',
  },
];

const defaultPathDefinition1 = [
  {
    name: 'one',
    path: '/one',
  },
  {
    name: 'two',
    path: '/two',
  },
  {
    name: 'three',
    path: '/three',
  },
  {
    name: 'home',
    path: '/',
  },
];

const appConfig1 = {
  routes: [
    {
      name: 'other',
      path: '/other',
    },
    {
      name: 'three',
      path: '/threeawesome',
    },
  ],
};
const appConfig2 = {
  routes: [
    {
      name: 'other',
      path: '/other',
    },
  ],
};
// Result when using appConfig1 and defaultPathDefinition1
const resultRouteDefinition1 = [
  {
    name: 'one',
    path: '/one',
  },
  {
    name: 'two',
    path: '/two',
  },
  {
    name: 'home',
    path: '/',
  },
  {
    name: 'other',
    path: '/other',
  },
  {
    name: 'three',
    path: '/threeawesome',
  },
];

// Result when using appConfig2 and defaultPathDefinition1
const resultRouteDefinition2 = [
  {
    name: 'one',
    path: '/one',
  },
  {
    name: 'two',
    path: '/two',
  },
  {
    name: 'home',
    path: '/',
  },
  {
    name: 'other',
    path: '/other',
  },
  {
    name: 'three',
    path: '/three',
  },
];

const routeTemplatesModulesExtensions1 = {
  0: {
    module: resultRouteDefinition1.map(definition => {
      return {
        name: definition.name,
        template: {},
      };
    }),
  },
};

const routeTemplatesModulesExtensions2 = {
  0: {
    module: resultRouteDefinition2.map(definition => {
      return {
        name: definition.name,
        template: {},
      };
    }),
  },
};

const resultRoutes1 = [
  {
    path: '/one',
    Component: {},
    props: undefined,
  },
  {
    path: '/two',
    Component: {},
    props: undefined,
  },
  {
    path: '/',
    Component: {},
    props: undefined,
  },
  {
    path: '/other',
    Component: {},
    props: undefined,
  },
  {
    path: '/threeawesome',
    Component: {},
    props: undefined,
  },
];

const resultRoutes2 = [
  {
    path: '/one',
    Component: {},
    props: undefined,
  },
  {
    path: '/two',
    Component: {},
    props: undefined,
  },
  {
    path: '/',
    Component: {},
    props: undefined,
  },
  {
    path: '/other',
    Component: {},
    props: undefined,
  },
  {
    path: '/three',
    Component: {},
    props: undefined,
  },
];

export {
  appConfig1,
  appConfig2,
  validPathDefinition1,
  validPathDefinition2,
  routeTemplatesModulesExtensions1,
  routeTemplatesModulesExtensions2,
  duplicatedNoHomePathDefinition1,
  duplicatedNoHomePathDefinition2,
  duplicatedNoHomePathDefinition3,
  duplicatedNoHomePathDefinition4,
  defaultPathDefinition1,
  resultRouteDefinition1,
  resultRouteDefinition2,
  resultRoutes1,
  resultRoutes2,
};
