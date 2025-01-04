import React, { Component, createRef } from 'react';
import cloneDeep from 'lodash.clonedeep';
import { LabelInfo } from './types';
import LabellingTransition from './LabellingTransition';
import SelectTree from './SelectTree';

interface OHIFLabellingFlowProps {
  labellingDoneCallback: (label: string) => void;
  measurementData: any;
  labelData: any;
  exclusive: boolean;
  componentClassName: any;
}

interface OHIFLabellingFlowState {
  label: string;
  componentClassName: any;
  confirmationState: boolean;
  displayComponent: boolean;
}

class OHIFLabellingFlow extends Component<OHIFLabellingFlowProps, OHIFLabellingFlowState> {
  currentItems: Array<LabelInfo> = [];
  mainElement: React.RefObject<HTMLDivElement>;

  constructor(props: OHIFLabellingFlowProps) {
    super(props);
    const { label } = props.measurementData;
    const className = props.componentClassName || {};

    this.state = {
      label,
      componentClassName: className,
      confirmationState: false,
      displayComponent: true,
    };

    this.mainElement = createRef();
  }

  render() {
    const { labelData } = this.props;
    if (labelData) {
      this.currentItems = cloneDeep(labelData);
    }

    return (
      <LabellingTransition
        displayComponent={this.state.displayComponent}
        onTransitionExit={this.props.labellingDoneCallback}
      >
        <div
          className={this.state.componentClassName}
          ref={this.mainElement}
        >
          {this.labellingStateFragment()}
        </div>
      </LabellingTransition>
    );
  }

  closePopup = () => {
    this.setState({ displayComponent: false });

    // Optionally a delayed set if you want some effect:
    setTimeout(() => {
      this.setState({ displayComponent: false });
    }, 2000);
  };

  selectTreeSelectCallback = (_event: any, itemSelected: LabelInfo) => {
    const label = itemSelected.value;
    this.closePopup();
    return this.props.labellingDoneCallback(label);
  };

  labellingStateFragment = () => {
    return (
      <SelectTree
        items={this.currentItems}
        columns={1}
        onSelected={this.selectTreeSelectCallback}
        closePopup={this.closePopup}
        selectTreeFirstTitle="Annotation"
        exclusive={this.props.exclusive}
        label={this.state.label}
      />
    );
  };
}

export default OHIFLabellingFlow;
