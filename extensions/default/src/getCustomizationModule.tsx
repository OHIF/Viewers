import React from 'react';
import DataSourceSelector from './Panels/DataSourceSelector';

/**
 *
 * Note: this is an example of how the customization module can be used
 * using the customization module. Below, we are adding a new custom route
 * to the application at the path /custom and rendering a custom component
 * Real world use cases of the having a custom route would be to add a
 * custom page for the user to view their profile, or to add a custom
 * page for login etc.
 */
export default function getCustomizationModule() {
  return [
    {
      name: 'helloPage',
      value: {
        id: 'customRoutes',
        routes: [
          {
            path: '/custom',
            children: () => (
              <h1 style={{ color: 'white' }}>Hello Custom Route</h1>
            ),
          },
        ],
      },
    },

    // Example customization to list a set of datasources
    {
      name: 'datasources',
      value: {
        id: 'customRoutes',
        routes: [
          {
            path: '/datasources',
            children: DataSourceSelector,
          },
        ],
      },
    },

    {
      name: 'default',
      value: [
        {
          id: 'ohif.overlayItem',
          uiType: 'uiType',
          content: function(props) {
            if (this.condition && !this.condition(props)) return null;

            const { instance } = props;
            const value =
              instance && this.attribute
                ? instance[this.attribute]
                : this.contentF && typeof this.contentF === 'function'
                ? this.contentF(props)
                : null;
            if (!value) return null;

            return (
              <span
                className="overlay-item flex flex-row"
                style={{ color: this.color || undefined }}
                title={this.title || ''}
              >
                {this.label && (
                  <span className="mr-1 shrink-0">{this.label}</span>
                )}
                <span className="font-light">{value}</span>
              </span>
            );
          },
        },
      ],
    },
  ];
}
