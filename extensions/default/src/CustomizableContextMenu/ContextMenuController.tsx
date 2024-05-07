import * as ContextMenuItemsBuilder from './ContextMenuItemsBuilder';
import ContextMenu from '../../../../platform/ui/src/components/ContextMenu/ContextMenu';
import { CommandsManager } from '@ohif/core';
import { annotation as CsAnnotation } from '@cornerstonejs/tools';
import { Menu, MenuItem, Point, ContextMenuProps } from './types';

/**
 * The context menu controller is a helper class that knows how
 * to manage context menus based on the UI Customization Service.
 * There are a few parts to this:
 *    1. Basic controls to manage displaying and hiding context menus
 *    2. Menu selection services, which use the UI customization service
 *       to choose which menu to display
 *    3. Menu item adapter services to convert menu items into displayable and actionable items.
 *
 * The format for a menu is defined in the exported type MenuItem
 */
export default class ContextMenuController {
  commandsManager: CommandsManager;
  services: AppTypes.Services;
  menuItems: Menu[] | MenuItem[];

  constructor(servicesManager: AppTypes.ServicesManager, commandsManager: CommandsManager) {
    this.services = servicesManager.services;
    this.commandsManager = commandsManager;
  }

  closeContextMenu() {
    this.services.uiDialogService.dismiss({ id: 'context-menu' });
  }

  /**
   * Figures out which context menu is appropriate to display and shows it.
   *
   * @param contextMenuProps - the context menu properties, see ./types.ts
   * @param viewportElement - the DOM element this context menu is related to
   * @param defaultPointsPosition - a default position to show the context menu
   */
  showContextMenu(
    contextMenuProps: ContextMenuProps,
    viewportElement,
    defaultPointsPosition
  ): void {
    if (!this.services.uiDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    const { event, subMenu, menuId, menus, selectorProps } = contextMenuProps;

    const annotationManager = CsAnnotation.state.getAnnotationManager();
    const { locking } = CsAnnotation;
    const targetAnnotationId = selectorProps?.nearbyToolData?.annotationUID as string;
    const isLocked = locking.isAnnotationLocked(
      annotationManager.getAnnotation(targetAnnotationId)
    );

    if (isLocked) {
      console.warn('Annotation is locked.');
      return;
    }

    const items = ContextMenuItemsBuilder.getMenuItems(
      selectorProps || contextMenuProps,
      event,
      menus,
      menuId
    );

    this.services.uiDialogService.dismiss({ id: 'context-menu' });
    this.services.uiDialogService.create({
      id: 'context-menu',
      isDraggable: false,
      preservePosition: false,
      preventCutOf: true,
      defaultPosition: ContextMenuController._getDefaultPosition(
        defaultPointsPosition,
        event?.detail,
        viewportElement
      ),
      event,
      content: ContextMenu,

      // This naming is part of the uiDialogService convention
      // Clicking outside simply closes the dialog box.
      onClickOutside: () => this.services.uiDialogService.dismiss({ id: 'context-menu' }),

      contentProps: {
        items,
        selectorProps,
        menus,
        event,
        subMenu,
        eventData: event?.detail,

        onClose: () => {
          this.services.uiDialogService.dismiss({ id: 'context-menu' });
        },

        /**
         * Displays a sub-menu, removing this menu
         * @param {*} item
         * @param {*} itemRef
         * @param {*} subProps
         */
        onShowSubMenu: (item, itemRef, subProps) => {
          if (!itemRef.subMenu) {
            console.warn('No submenu defined for', item, itemRef, subProps);
            return;
          }
          this.showContextMenu(
            {
              ...contextMenuProps,
              menuId: itemRef.subMenu,
            },
            viewportElement,
            defaultPointsPosition
          );
        },

        // Default is to run the specified commands.
        onDefault: (item, itemRef, subProps) => {
          this.commandsManager.run(item, {
            ...selectorProps,
            ...itemRef,
            subProps,
          });
        },
      },
    });
  }

  static getDefaultPosition = (): Point => {
    return {
      x: 0,
      y: 0,
    };
  };

  static _getEventDefaultPosition = eventDetail => ({
    x: eventDetail && eventDetail.currentPoints.client[0],
    y: eventDetail && eventDetail.currentPoints.client[1],
  });

  static _getElementDefaultPosition = element => {
    if (element) {
      const boundingClientRect = element.getBoundingClientRect();
      return {
        x: boundingClientRect.x,
        y: boundingClientRect.y,
      };
    }

    return {
      x: undefined,
      y: undefined,
    };
  };

  static _getCanvasPointsPosition = (points = [], element) => {
    const viewerPos = ContextMenuController._getElementDefaultPosition(element);

    for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
      const point = {
        x: points[pointIndex][0] || points[pointIndex]['x'],
        y: points[pointIndex][1] || points[pointIndex]['y'],
      };
      if (
        ContextMenuController._isValidPosition(point) &&
        ContextMenuController._isValidPosition(viewerPos)
      ) {
        return {
          x: point.x + viewerPos.x,
          y: point.y + viewerPos.y,
        };
      }
    }
  };

  static _isValidPosition = (source): boolean => {
    return source && typeof source.x === 'number' && typeof source.y === 'number';
  };

  /**
   * Returns the context menu default position. It look for the positions of: canvasPoints (got from selected), event that triggers it, current viewport element
   */
  static _getDefaultPosition = (canvasPoints, eventDetail, viewerElement) => {
    function* getPositionIterator() {
      yield ContextMenuController._getCanvasPointsPosition(canvasPoints, viewerElement);
      yield ContextMenuController._getEventDefaultPosition(eventDetail);
      yield ContextMenuController._getElementDefaultPosition(viewerElement);
      yield ContextMenuController.getDefaultPosition();
    }

    const positionIterator = getPositionIterator();

    let current = positionIterator.next();
    let position = current.value;

    while (!current.done) {
      position = current.value;

      if (ContextMenuController._isValidPosition(position)) {
        positionIterator.return();
      }
      current = positionIterator.next();
    }

    return position;
  };
}
