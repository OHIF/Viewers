import { CustomizationService } from '@ohif/core';

export default {
  'ohif.contextMenu': {
    $transform: function (customizationService: CustomizationService) {
      /**
       * Applies the inheritsFrom to all the menu items.
       * This function clones the object and child objects to prevent
       * changes to the original customization object.
       */
      // Don't modify the children, as those are copied by reference
      const clonedObject = { ...this };
      clonedObject.menus = this.menus.map(menu => ({ ...menu }));

      for (const menu of clonedObject.menus) {
        const { items: originalItems } = menu;
        menu.items = [];
        for (const item of originalItems) {
          menu.items.push(customizationService.transform(item));
        }
      }
      return clonedObject;
    },
  },
};
