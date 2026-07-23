import React, { useEffect, useState, useCallback, ReactElement } from 'react';
import { ProgressDropdown } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

const workflowStepsToDropdownOptions = (steps = []) =>
  steps.map(step => ({
    label: step.name,
    value: step.id,
    info: step.info,
    activated: false,
    completed: false,
  }));

export function ProgressDropdownWithService(): ReactElement {
  const { servicesManager } = useSystem();
  const { workflowStepsService } = servicesManager.services;
  const [activeStepId, setActiveStepId] = useState(workflowStepsService.activeWorkflowStep?.id);

  const [dropdownOptions, setDropdownOptions] = useState(
    workflowStepsToDropdownOptions(workflowStepsService.workflowSteps)
  );

  const setCurrentAndPreviousOptionsAsCompleted = useCallback(currentOption => {
    if (currentOption.completed) {
      return;
    }

    setDropdownOptions(prevOptions => {
      const newOptionsState = [...prevOptions];
      const startIndex = newOptionsState.findIndex(option => option.value === currentOption.value);

      for (let i = startIndex; i >= 0; i--) {
        const option = newOptionsState[i];

        if (option.completed) {
          break;
        }

        newOptionsState[i] = {
          ...option,
          completed: true,
        };
      }

      return newOptionsState;
    });
  }, []);

  const handleDropdownChange = useCallback(
    ({ selectedOption }) => {
      if (!selectedOption) {
        return;
      }

      // TODO: Steps should be marked as completed after user has
      // completed some action when required (not implemented)
      setCurrentAndPreviousOptionsAsCompleted(selectedOption);
      setActiveStepId(selectedOption.value);
    },
    [setCurrentAndPreviousOptionsAsCompleted]
  );

  useEffect(() => {
    let timeoutId;

    if (activeStepId) {
      // We've used setTimeout to give it more time to update the UI since
      // create3DFilterableFromDataArray from Texture.js may take 600+ ms to run
      // when there is a new series to load in the next step but that resulted
      // in the followed React error when updating the content from left/right panels
      // and all component states were being lost:
      //   Error: Can't perform a React state update on an unmounted component
      workflowStepsService.setActiveWorkflowStep(activeStepId);
    }

    return () => clearTimeout(timeoutId);
  }, [activeStepId, workflowStepsService]);

  useEffect(() => {
    const { unsubscribe: unsubStepsChanged } = workflowStepsService.subscribe(
      workflowStepsService.EVENTS.STEPS_CHANGED,
      () => setDropdownOptions(workflowStepsToDropdownOptions(workflowStepsService.workflowSteps))
    );

    const { unsubscribe: unsubActiveStepChanged } = workflowStepsService.subscribe(
      workflowStepsService.EVENTS.ACTIVE_STEP_CHANGED,

      () => setActiveStepId(workflowStepsService.activeWorkflowStep.id)
    );

    return () => {
      unsubStepsChanged();
      unsubActiveStepChanged();
    };
  }, [servicesManager, workflowStepsService]);

  return (
    <ProgressDropdown
      options={dropdownOptions}
      value={activeStepId}
      onChange={handleDropdownChange}
    />
  );
}
