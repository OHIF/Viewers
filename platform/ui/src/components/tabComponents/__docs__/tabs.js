export default tabs = [
  {
    name: 'tabName1',
    Component: () => {
      return <div>tab 1 Content</div>;
    },
    customProps: {},
    hidden: false,
  },
  {
    name: 'tabName2',
    Component: () => {
      return <div>tab 2 Content</div>;
    },
    customProps: {},
    hidden: false,
  },
  {
    name: 'tabName3',
    Component: () => {
      return <div>tab 3 Content</div>;
    },
    customProps: {},
    hidden: true,
  },
];
