import SelectTree from '../SelectTree';
import React, { Component } from 'react';
import LabellingTransition from './LabellingTransition';
import cloneDeep from 'lodash.clonedeep';

interface PropType {
  labellingDoneCallback: (label: string) => void;
  measurementData: any;
  labelData: any;
  exclusive: boolean;
  componentClassName: any;
}

interface StateType {
  location: Location;
  label: string;
  componentClassName: any;
  confirmationState: boolean;
  displayComponent: boolean;
}

export interface LabelInfo {
  label: string;
  value: string;
}

class LabellingFlow extends Component<PropType> {
  currentItems: Array<LabelInfo> = [];
  state: StateType;
  mainElement;

  constructor(props) {
    super(props);
    const { label } = props.measurementData;
    const className = props.componentClassName;

    this.state = {
      location,
      label,
      componentClassName: className,
      confirmationState: false,
      displayComponent: true,
    };
    this.mainElement = React.createRef();
  }

  render() {
    if (this.props.labelData) {
      this.currentItems = cloneDeep(this.props.labelData);
    }

    const className = Object.assign({}, this.state.componentClassName);

    return (
      <LabellingTransition
        displayComponent={this.state.displayComponent}
        onTransitionExit={this.props.labellingDoneCallback}
      >
        <>
          <div
            className={className}
            ref={this.mainElement}
          >
            {this.labellingStateFragment()}
          </div>
        </>
      </LabellingTransition>
    );
  }

  closePopup = () => {
    this.setState({
      displayComponent: false,
    });

    setTimeout(() => {
      this.setState({
        displayComponent: false,
      });
    }, 2000);
  };

  selectTreeSelectCalback = (event, itemSelected) => {
    const label = itemSelected.value;
    this.closePopup();
    return this.props.labellingDoneCallback(label);
  };

  labellingStateFragment = () => {
    return (
      <SelectTree
        items={this.currentItems}
        columns={1}
        onSelected={this.selectTreeSelectCalback}
        closePopup={this.closePopup}
        selectTreeFirstTitle="Annotation"
        exclusive={this.props.exclusive}
        label={this.state.label}
      />
    );
  };
}

export default LabellingFlow;
