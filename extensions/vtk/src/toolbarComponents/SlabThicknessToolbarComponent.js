import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Range, Checkbox, OldSelect } from '@ohif/ui';

import './slab-thickness-toolbar-button.styl';

const SLIDER = {
  MIN: 0.1,
  MAX: 1000,
  STEP: 0.1,
};

const ToolbarLabel = props => {
  const { label } = props;
  return <div className="toolbar-button-label">{label}</div>;
};

ToolbarLabel.propTypes = {
  label: PropTypes.string.isRequired,
};

const ToolbarSlider = props => {
  const { value, min, max, onChange } = props;
  return (
    <div className="toolbar-slider-container">
      <label htmlFor="toolbar-slider">{value}mm</label>
      <Range
        value={value}
        min={min}
        max={max}
        step={SLIDER.STEP}
        onChange={onChange}
        id="toolbar-slider"
      />
    </div>
  );
};

ToolbarSlider.propTypes = {
  value: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

const _getSelectOptions = button => {
  return button.operationButtons.map(button => {
    return {
      key: button.label,
      value: button.id,
    };
  });
};

const _getClassNames = (isActive, className) => {
  return classnames('toolbar-button', 'slab-thickness', className, {
    active: isActive,
  });
};

const _applySlabThickness = (
  value,
  modeChecked,
  toolbarClickCallback,
  button
) => {
  if (!modeChecked || !toolbarClickCallback) {
    return;
  }

  const { actionButton } = button;

  const generateOperation = (operation, value) => {
    // Combine slider value into slider operation
    const generatedOperation = { ...operation };
    generatedOperation.commandOptions = {
      ...operation.commandOptions,
      slabThickness: value,
    };

    return generatedOperation;
  };

  const operation = generateOperation(actionButton, value);
  toolbarClickCallback(operation, event);
};

const _applyModeOperation = (
  operation,
  modeChecked,
  toolbarClickCallback,
  button
) => {
  // in case modeChecked has not being triggered by user yet
  if (typeof modeChecked !== 'boolean') {
    return;
  }

  const { deactivateButton } = button;

  const _operation = modeChecked ? operation : deactivateButton;
  if (toolbarClickCallback && _operation) {
    toolbarClickCallback(_operation);
  }
};

const _getInitialState = currentSelectedOption => {
  return {
    value: SLIDER.MIN,
    sliderMin: SLIDER.MIN,
    sliderMax: SLIDER.MAX,
    modeChecked: undefined,
    operation: currentSelectedOption,
  };
};

const INITIAL_OPTION_INDEX = 0;
const _getInitialtSelectedOption = (button = {}) => {
  return (
    button.operationButtons && button.operationButtons[INITIAL_OPTION_INDEX]
  );
};

function SlabThicknessToolbarComponent({
  parentContext,
  toolbarClickCallback,
  button,
  activeButtons,
  isActive,
  className,
}) {
  const currentSelectedOption = _getInitialtSelectedOption(button);
  const [state, setState] = useState(_getInitialState(currentSelectedOption));
  const { label, operationButtons } = button;
  const _className = _getClassNames(isActive, className);
  const selectOptions = _getSelectOptions(button);
  function onChangeSelect(selectedValue) {
    // find select value
    const operation = operationButtons.find(
      button => button.id === selectedValue
    );

    if (operation === state.operation) {
      return;
    }

    setState({ ...state, operation });
  }

  function onChangeCheckbox(checked) {
    setState({ ...state, modeChecked: checked });
  }

  function onChangeSlider(event) {
    const value = Number(event.target.value);

    if (value !== state.value) {
      setState({ ...state, value, modeChecked: true });
    }
  }

  useEffect(() => {
    _applyModeOperation(
      state.operation,
      state.modeChecked,
      toolbarClickCallback,
      button
    );
  }, [state.modeChecked, state.operation]);

  useEffect(() => {
    _applySlabThickness(
      state.value,
      state.modeChecked,
      toolbarClickCallback,
      button
    );
  }, [state.operation, state.modeChecked, state.value]);

  return (
    <div className={_className}>
      <div className="container">
        <ToolbarSlider
          value={state.value}
          min={state.sliderMin}
          max={state.sliderMax}
          onChange={onChangeSlider}
        />
        <ToolbarLabel key="toolbar-label" label={label} />
      </div>
      <div className="controller">
        <Checkbox
          label="mode"
          checked={state.modeChecked}
          onChange={onChangeCheckbox}
        ></Checkbox>
        <OldSelect
          key="toolbar-select"
          options={selectOptions}
          value={selectOptions[INITIAL_OPTION_INDEX].value}
          onChange={onChangeSelect}
        ></OldSelect>
      </div>
    </div>
  );
}

SlabThicknessToolbarComponent.propTypes = {
  parentContext: PropTypes.object.isRequired,
  toolbarClickCallback: PropTypes.func.isRequired,
  button: PropTypes.object.isRequired,
  activeButtons: PropTypes.array.isRequired,
  isActive: PropTypes.bool,
  className: PropTypes.string,
};

export default SlabThicknessToolbarComponent;
