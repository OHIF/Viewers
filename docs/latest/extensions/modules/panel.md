# Module: Panel

...

```js
import MyComponent from './MyComponent.js';

export default {
  id: 'example-panel-module',

  /**
   * @param {object} params
   * @param {object} params.servicesManager
   */
  getPanelModule({ servicesManager }) {
    return {
      menuOptions: [
        {
          icon: 'list',
          label: 'Magic',
          target: 'target-component-id',
        },
      ],
      components: [
        {
          id: 'target-component-id',
          component: MyComponent,
        },
      ],
      defaultContext: ['VIEWER'],
    };
  },
};
```
