import React, { Component } from 'react';
import classnames from 'classnames';
import { Range, Icon, ExpandableToolMenu } from '@ohif/ui';

import './slab-thickness-toolbar-button.styl';

const ToolbarLabel = props => {
  const { label, isExpanded } = props;
  return (
    <div className="toolbar-button-label">
      {label}
      <Icon
        name={isExpanded ? 'caret-up' : 'caret-down'}
        className="expand-caret"
      />
    </div>
  );
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
        step={0.1}
        onChange={onChange}
        id="toolbar-slider"
      />
    </div>
  );
};

const SLIDER = {
  MIN: 0.1,
  MAX: 1000,
};

export default class SlabThicknessToolbarComponent extends Component {
  constructor() {
    super();
    this.state = {
      value: SLIDER.MAX,
      sliderMin: SLIDER.MIN,
      sliderMax: SLIDER.MAX,
      operation: undefined,
    };
  }

  onChangeOperation(button, event, props) {
    const { id: currentOpId = '' } = this.state.operation || {};
    const { id: nextOpId = '' } = props || {};

    if (currentOpId !== nextOpId) {
      this.setState(
        {
          operation: props,
        },
        () => {
          const { toolbarClickCallback } = this.props;
          if (toolbarClickCallback) {
            toolbarClickCallback(button, event);
          }
          this.applySlabThickness();
        }
      );
    }
  }

  applySlabThickness() {
    const { value } = this.state;
    const { toolbarClickCallback, button } = this.props;
    const { actionButton } = button;

    const isOperationEnabled = button => {
      const { enabledOn = [] } = button;
      const { id: currentOpId = '' } = this.state.operation || {};
      return enabledOn.some(opId => currentOpId && opId == currentOpId);
    };

    const generateOperation = (operation, value) => {
      // Combine slider value into slider operation
      const generatedOperation = { ...operation };
      generatedOperation.commandOptions = {
        ...operation.commandOptions,
        slabThickness: value,
      };
    };

    if (
      toolbarClickCallback &&
      actionButton &&
      isOperationEnabled(actionButton)
    ) {
      const operation = generateOperation(actionButton, value);
      toolbarClickCallback(operation, event);
    }
  }

  onChangeSlider(event) {
    const value = Number(event.target.value);

    if (value !== this.state.value) {
      this.setState({ value }, () => {
        this.applySlabThickness();
      });
    }
  }

  getLabel() {
    const { isActive, labelWhenActive, button } = this.props;
    return isActive && labelWhenActive ? labelWhenActive : button.label;
  }

  getClassNames() {
    const { isActive, className } = this.props;
    return classnames('toolbar-button', 'slab-thickness', className, {
      active: isActive,
    });
  }

  bindButtonsListeners(button) {
    return button.buttons.map(childButton => {
      childButton.onClick = this.onChangeOperation.bind(this, childButton);
      return childButton;
    });
  }

  getActiveCommand(button, activeButtons) {
    let activeCommand;
    button.buttons.forEach(childButton => {
      if (activeButtons.indexOf(childButton.id) > -1) {
        activeCommand = childButton.id;
      }
    });

    return activeCommand;
  }

  render() {
    const { value = 0.1 } = this.state;

    const className = this.getClassNames();
    const { button, activeButtons } = this.props;
    const label = this.getLabel();
    const expandableButtons = this.bindButtonsListeners(button);
    const activeCommand = this.getActiveCommand(button, activeButtons);

    return (
      <div className={className}>
        <ToolbarSlider
          value={value}
          min={this.state.sliderMin}
          max={this.state.sliderMax}
          onChange={this.onChangeSlider.bind(this)}
        />
        <ExpandableToolMenu
          {...button}
          buttons={expandableButtons}
          activeCommand={activeCommand}
        >
          <ToolbarLabel key="tool-bar-label" />
        </ExpandableToolMenu>
      </div>
    );
  }
}
