import { ToolbarService } from '@ohif/core';

/**
 * Evaluates the condition of a button based on its properties and returns the appropriate button component.
 * If the button has a type and is primary with items, it evaluates nested buttons.
 * Otherwise, it evaluates a single button.
 *
 * @param options - The options for evaluating the button condition.
 * @param options.button - The button object to evaluate.
 * @param options.viewportId - The ID of the viewport.
 * @param options.toolGroup - The tool group.
 * @param options.services - The services object.
 * @returns {React.ReactNode} The evaluated button component.
 */
export function evaluateButtonCondition({ button, viewportId, toolGroup, services }) {
  const { componentProps: props } = button;

  if (!props.type && !props.items) {
    return button;
  }

  const isNested = props.primary && props.items.length > 0;

  if (isNested) {
    const s = evaluateNestedButtons({ button, viewportId, toolGroup, services });
    debugger;
    return s;
  }

  return evaluateSingleButton({ button, props, viewportId, toolGroup, services });
}

function evaluateCondition({ props, viewportId, toolGroup, services }) {
  const { viewportGridService, displaySetService } = services;
  const { condition } = props;

  if (!condition) {
    return true;
  }

  const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);
  return (
    displaySetUIDs &&
    condition({
      displaySets: displaySetUIDs.map(displaySetService.getDisplaySetByUID),
      toolGroup,
    })
  );
}

/**
 * Evaluates the state of a single toolbar button.
 * @param {Object} options - The options for evaluating the button state.
 * @param {Object} options.button - The button object.
 * @param {Object} options.props - The props object.
 * @param {string} options.viewportId - The ID of the viewport.
 * @param {string} options.toolGroup - The tool group.
 * @param {Object} options.services - The services object.
 * @returns {Object} - The evaluated button state.
 */
function evaluateSingleButton({ button = null, props, viewportId, toolGroup, services }) {
  if (!props.type && !props.items) {
    return button ?? props;
  }

  if ([ToolbarService.ButtonTypes.ACTION, ToolbarService.ButtonTypes.TOGGLE].includes(props.type)) {
    const isConditionMet = evaluateCondition({ props, viewportId, toolGroup, services });
    return isConditionMet ? button ?? props : { ...(button ?? props), disabled: true };
  }
  return evaluateButtonInToolGroup({ props, toolGroup, button });
}

/**
 * Evaluates the state of a toolbar button within a tool group.
 * @param {Object} options - The options for evaluating the button state.
 * @param {Object} options.props - The props object containing the commands and other properties.
 * @param {Object} options.toolGroup - The tool group object containing the tool options.
 * @param {Object} [options.button=null] - The button object to evaluate. If not provided, the props object will be evaluated.
 * @returns {Object} - The evaluated button state, which may include the button object with disabled property set to true.
 */
function evaluateButtonInToolGroup({ props, toolGroup, button = null }) {
  const toolName = props.commands[0].commandOptions.toolName;
  const isToolInGroup = Object.keys(toolGroup.toolOptions).includes(toolName);

  return isToolInGroup ? button ?? props : { ...(button ?? props), disabled: true };
}

/**
 * Evaluates the state of nested buttons in the toolbar.
 *
 * @param {Object} options - The options for evaluating the nested buttons.
 * @param {Object} options.button - The button object containing component properties.
 * @param {string} options.viewportId - The ID of the viewport.
 * @param {string} options.toolGroup - The tool group.
 * @param {Object} options.services - The services object.
 * @returns {Object} - The updated button object with evaluated component properties.
 */
function evaluateNestedButtons({ button, viewportId, toolGroup, services }) {
  const { items, primary, secondary } = button.componentProps;

  const UpdatedPrimary = evaluateSingleButton({ props: primary, viewportId, toolGroup, services });
  const UpdatedSecondary = evaluateSingleButton({
    props: secondary,
    viewportId,
    toolGroup,
    services,
  });

  return {
    ...button,
    componentProps: {
      ...button.componentProps,
      primary: UpdatedPrimary,
      secondary: UpdatedSecondary,
      items: items.map(item =>
        evaluateSingleButton({ props: item, viewportId, toolGroup, services })
      ),
    },
  };
}
