import { SplitButton, Icon, ToolbarButton } from '@ohif/ui';
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function ToolbarSplitButtonWithServices({
  isRadio,
  isAction,
  groupId,
  primary,
  secondary,
  items,
  renderer,
  onInteraction,
  servicesManager,
}) {
  const { toolbarService } = servicesManager?.services;
  const { ButtonInteractionType } = toolbarService.constructor;
  const { ACTION, TOGGLE, TOOL } = ButtonInteractionType;

  const [state, setState] = useState({
    primary,
    secondary,
    items: [],
    isPrimaryActive: false,
  });

  const isThereAnActiveToolInNestedMenu = () => {
    return items.some(item => {
      return item.type === TOOL && item.isActive;
    });
  };

  /* Bubbles up individual item clicks */
  const getSplitButtonItems = useCallback(
    items =>
      items.map((item, index) => ({
        ...item,
        index,
        onClick: () => {
          onInteraction({
            groupId,
            itemId: item.id,
            interactionType: item.type,
            commands: item.commands,
          });

          // after we click on an item we should perform a logic to determine
          // who is the active item

          // - If action or a toggle is clicked
          //    - if there is already an active tool in nested menu (probe) probe should still be the primary and not the action or toggle
          // - There is not active tool in nested menu it is convenient to bring that toggle and action to the top
          const isActionButton = [ACTION, TOGGLE].includes(item.type);
          const primaryItem =
            !isActionButton || isThereAnActiveToolInNestedMenu()
              ? { ...item, index }
              : state.primary;

          setState(prevState => ({
            ...prevState,
            primary: primaryItem,
          }));
        },
      })),
    []
  );

  useEffect(() => {
    setState({ primary, secondary, items: getSplitButtonItems(items) });
  }, [primary, secondary, items, getSplitButtonItems]);

  if (!state?.primary) {
    return null;
  }

  const PrimaryButtonComponent =
    toolbarService?.getButtonComponentForUIType(state.primary.uiType) ?? ToolbarButton;

  const DefaultListItemRenderer = ({ type, icon, label, t, isActive }) => {
    const itemIsToggleAndActive = type === TOGGLE && isActive;

    return (
      <div
        className={classNames(
          'hover:bg-primary-dark flex h-8 w-full flex-row items-center p-3',
          'whitespace-pre text-base',
          {
            'bg-primary-dark hover:bg-primary-dark hover:text-primary-light text-[#348CFD] text-[#348CFD]':
              itemIsToggleAndActive,
          }
        )}
      >
        {icon && (
          <span className="mr-4">
            <Icon
              name={icon}
              className="h-5 w-5"
            />
          </span>
        )}
        <span className="mr-5">{t(label)}</span>
      </div>
    );
  };

  const listItemRenderer = renderer || DefaultListItemRenderer;

  return (
    <SplitButton
      primary={state.primary}
      secondary={state.secondary}
      items={state.items}
      isActive={state.isPrimaryActive}
      groupId={groupId}
      renderer={listItemRenderer}
      onInteraction={onInteraction}
      Component={props => (
        <PrimaryButtonComponent
          {...props}
          servicesManager={servicesManager}
        />
      )}
    />
  );
}

// function ToolbarSplitButtonWithServices({
//   groupId,
//   primary,
//   secondary,
//   items,
//   renderer,
//   onInteraction,
//   servicesManager,
// }) {
//   const { toolbarService } = servicesManager?.services;

//   /* Bubbles up individual item clicks */
//   const getSplitButtonItems = useCallback(
//     items =>
//       items.map((item, index) => ({
//         ...item,
//         index,
//         onClick: () => {
//           const { id, type, commands } = item;
//           onInteraction({
//             groupId,
//             itemId: id,
//             interactionType: type,
//             commands,
//           });
//         },
//       })),
//     [onInteraction, groupId]
//   );

//   const DefaultListItemRenderer = ({ icon, label, t, id }) => {
//     return (
//       <div
//         className={classNames(
//           'hover:bg-primary-dark flex h-8 w-full flex-row items-center p-3',
//           'whitespace-pre text-base'
//         )}
//       >
//         {icon && (
//           <span className="mr-4">
//             <Icon
//               name={icon}
//               className="h-5 w-5"
//             />
//           </span>
//         )}
//         <span className="mr-5">{t(label)}</span>
//       </div>
//     );
//   };

//   const PrimaryButtonComponent =
//     toolbarService?.getButtonComponentForUIType(primary.uiType) ?? ToolbarButton;

//   const listItemRenderer = renderer || DefaultListItemRenderer;

//   return (
//     <SplitButton
//       isActive={false}
//       primary={primary}
//       secondary={secondary}
//       items={getSplitButtonItems(items)}
//       groupId={groupId}
//       renderer={listItemRenderer}
//       onInteraction={onInteraction}
//       Component={props => (
//         <PrimaryButtonComponent
//           {...props}
//           servicesManager={servicesManager}
//         />
//       )}
//     />
//   );
// }

ToolbarSplitButtonWithServices.propTypes = {
  isRadio: PropTypes.bool,
  isAction: PropTypes.bool,
  groupId: PropTypes.string,
  primary: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['tool', 'action', 'toggle']).isRequired,
    uiType: PropTypes.string,
  }),
  secondary: PropTypes.shape({
    id: PropTypes.string,
    icon: PropTypes.string.isRequired,
    label: PropTypes.string,
    tooltip: PropTypes.string.isRequired,
    isActive: PropTypes.bool,
  }),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['tool', 'action', 'toggle']).isRequired,
      icon: PropTypes.string,
      label: PropTypes.string,
      tooltip: PropTypes.string,
    })
  ),
  renderer: PropTypes.func,
  onInteraction: PropTypes.func.isRequired,
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      toolbarService: PropTypes.object,
    }),
  }),
};

ToolbarSplitButtonWithServices.defaultProps = {
  isRadio: false,
  isAction: false,
};

export default ToolbarSplitButtonWithServices;
