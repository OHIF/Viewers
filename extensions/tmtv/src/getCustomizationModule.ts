import toolbarCustomization from './customizations/toolbarCustomization';

/**
 * Registers the TMTV defaults (toolbar buttons/sections, tool group
 * additions and panel lists) so the TMTV mode can reference them by name and
 * `?customization=` modules can extend them.
 */
export default function getCustomizationModule() {
  return [
    {
      name: 'default',
      value: {
        ...toolbarCustomization,
      },
    },
  ];
}
