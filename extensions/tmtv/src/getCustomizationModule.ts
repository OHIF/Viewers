import toolbarCustomization from './customizations/toolbarCustomization';

/**
 * Registers the TMTV-specific capability packs (toolbar buttons and section
 * layout) so the TMTV mode can compose them by name and `?customization=`
 * modules can extend the result through the `mode` phase.
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
