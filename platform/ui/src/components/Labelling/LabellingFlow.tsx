import SelectTree from '../SelectTree';
import React, { Component } from 'react';
import LabellingTransition from './LabellingTransition';
import cloneDeep from 'lodash.clonedeep';
import CustomizableRenderComponent from '../../utils/CustomizableRenderComponent';

interface PropType {
  labellingDoneCallback: (label: string) => void;
  measurementData: any;
  labelData: any;
  exclusive: boolean;
  componentClassName: any;
  customizationService: any;
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
  searchItem: boolean;
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
    const label = itemSelected.label || itemSelected.value;
    this.closePopup();
    return this.props.labellingDoneCallback(label);
  };

  labellingStateFragment = () => {
    return (
      <CustomizableRenderComponent
        customizationId={'measurement.labellingComponent'}
        FallbackComponent={SelectTree}
        selectTreeSelectCalback={this.selectTreeSelectCalback}
        closePopup={this.closePopup}
        label={this.state.label}
        measurementData={this.props.measurementData}
        items={this.currentItems}
        exclusive={this.props.exclusive}
        selectTreeFirstTitle={'Select Label'}
      />
    );
  };
}

export default LabellingFlow;
