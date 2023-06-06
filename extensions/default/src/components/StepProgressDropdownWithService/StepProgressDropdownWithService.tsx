import React, { useEffect, useState, useCallback, ReactElement } from 'react';
import { ServicesManager } from '@ohif/core';
import { StepProgressDropdown } from '@ohif/ui';

// Long text to test tooptip size limit
const loremIpsum = new Array(7)
  .join(` Lorem ipsum, dolor sit amet consectetur adipisicing elit`)
  .substring(1);

const stagesToDropdownOptions = (stages = []) =>
  stages.map(stage => ({
    label: stage.name,
    value: stage.id,
    info: `${stage.name.toUpperCase()} information text. ${loremIpsum}`,
    activated: false,
    completed: false,
  }));

function StepProgressDropdownWithService({
  servicesManager,
}: {
  servicesManager: ServicesManager;
}): ReactElement {
  const { workflowStagesService } = servicesManager.services;
  const [activeStageId, setActiveStageId] = useState(
    workflowStagesService.activeWorkflowStage?.id
  );

  const [dropdownOptions, setDropdownOptions] = useState(
    stagesToDropdownOptions(workflowStagesService.workflowStages)
  );

  const setCurrentAndPreviousOptionsAsCompleted = useCallback(currentOption => {
    if (currentOption.completed) {
      return;
    }

    setDropdownOptions(prevOptions => {
      const newOptionsState = [...prevOptions];
      const startIndex = newOptionsState.findIndex(
        option => option.value === currentOption.value
      );

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

      // TODO: Stages should be marked as completed after user has
      // completed some action when required (not implemented)
      setCurrentAndPreviousOptionsAsCompleted(selectedOption);
      setActiveStageId(selectedOption.value);
    },
    [setCurrentAndPreviousOptionsAsCompleted]
  );

  useEffect(() => {
    let timeoutId;

    if (activeStageId) {
      // Give a little bit more time to update the UI since a method from
      // Texture.js (create3DFilterableFromDataArray) is taking some to update
      // the UI(eg: 600+ ms after moving from a 1x3 PET to a 2x3 PET/CT layout).
      timeoutId = setTimeout(() => {
        workflowStagesService.setActiveWorkflowStage(activeStageId);
      }, 100);
    }

    return () => clearTimeout(timeoutId);
  }, [activeStageId, workflowStagesService]);

  useEffect(() => {
    const {
      unsubscribe: unsubStagesChanged,
    } = workflowStagesService.subscribe(
      workflowStagesService.EVENTS.STAGES_CHANGED,
      () =>
        setDropdownOptions(
          stagesToDropdownOptions(workflowStagesService.workflowStages)
        )
    );

    const {
      unsubscribe: unsubActiveStageChanged,
    } = workflowStagesService.subscribe(
      workflowStagesService.EVENTS.ACTIVE_STAGE_CHANGED,
      () => setActiveStageId(workflowStagesService.activeWorkflowStage.id)
    );

    return () => {
      unsubStagesChanged();
      unsubActiveStageChanged();
    };
  }, [servicesManager, workflowStagesService]);

  return (
    <StepProgressDropdown
      options={dropdownOptions}
      value={activeStageId}
      onChange={handleDropdownChange}
    />
  );
}

export default StepProgressDropdownWithService;
