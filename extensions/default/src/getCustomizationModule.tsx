import defaultContextMenuCustomization from './customizations/defaultContextMenuCustomization';
import helloPageCustomization from './customizations/helloPageCustomization';
import datasourcesCustomization from './customizations/datasourcesCustomization';
import multimonitorCustomization from './customizations/multimonitorCustomization';
import customRoutesCustomization from './customizations/customRoutesCustomization';
import studyBrowserCustomization from './customizations/studyBrowserCustomization';
import overlayItemCustomization from './customizations/overlayItemCustomization';
import contextMenuCustomization from './customizations/contextMenuCustomization';
import menuContentCustomization from './customizations/menuContentCustomization';
import getDataSourceConfigurationCustomization from './customizations/dataSourceConfigurationCustomization';
import progressDropdownCustomization from './customizations/progressDropdownCustomization';
import sortingCriteriaCustomization from './customizations/sortingCriteriaCustomization';

/**
 *
 * Note: this is an example of how the customization module can be used
 * using the customization module. Below, we are adding a new custom route
 * to the application at the path /custom and rendering a custom component
 * Real world use cases of the having a custom route would be to add a
 * custom page for the user to view their profile, or to add a custom
 * page for login etc.
 */
export default function getCustomizationModule({ servicesManager, extensionManager }) {
  return [
    {
      name: 'helloPage',
      value: helloPageCustomization,
    },
    {
      name: 'datasources',
      value: datasourcesCustomization,
    },
    {
      name: 'multimonitor',
      value: multimonitorCustomization,
    },
    {
      name: 'default',
      value: {
        ...customRoutesCustomization,
        ...studyBrowserCustomization,
        ...overlayItemCustomization,
        ...contextMenuCustomization,
        ...menuContentCustomization,
        ...getDataSourceConfigurationCustomization({ servicesManager, extensionManager }),
        ...progressDropdownCustomization,
        ...sortingCriteriaCustomization,
        ...defaultContextMenuCustomization,
      },
    },
  ];
}
