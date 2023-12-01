import SelectTree from '../SelectTree';
import React, { Component } from 'react';
import LabellingTransition from './LabellingTransition';
import PropTypes from 'prop-types';
import cloneDeep from 'lodash.clonedeep';

class LabellingFlow extends Component {
  static propTypes = {
    labellingDoneCallback: PropTypes.func.isRequired,
    measurementData: PropTypes.object.isRequired,
    projectConfig: PropTypes.shape({
      labels: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string,
          value: PropTypes.string.isRequired,
        })
      ),
    }),
  };

  constructor(props) {
    super(props);
    const { label } = props.measurementData;
    this.initialItems = props.labelData.items;
    this.currentItems = cloneDeep(this.initialItems);
    let style = props.componentStyle;

    this.state = {
      location,
      label,
      componentStyle: style,
      confirmationState: false,
      displayComponent: true,
    };
    this.mainElement = React.createRef();
  }

  componentDidMount() { }

  componentDidUpdate = () => {
    this.repositionComponent();
  };

  render() {
    if (this.props.projectConfig && this.props.projectConfig.labels) {
      this.initialItems = this.props.projectConfig.labels;
      this.currentItems = cloneDeep(this.initialItems);
    }

    let mainElementClassName = 'labellingComponent';
    const style = Object.assign({}, this.state.componentStyle);
    if (this.state.skipAddLabelButton) {
      if (style.left - 160 < 0) {
        style.left = 0;
      } else {
        style.left -= 160;
      }
    }

    if (this.state.editLocation) {
      style.top = '20px';
      style.left = '20px';
    }
    return (
      <LabellingTransition
        displayComponent={this.state.displayComponent}
        onTransitionExit={this.props.labellingDoneCallback}
      >
        <>
          <div className="labellingComponent-overlay"></div>
          <div
            className={mainElementClassName}
            style={style}
            ref={this.mainElement}
          >
            {this.labellingStateFragment()}
          </div>
        </>
      </LabellingTransition>
    );
  }

  selectTreeSelectCalback = (event, itemSelected) => {
    const label = itemSelected.value;
    this.setState({
      displayComponent: false,
    });

    if (this.isTouchScreen) {
      this.setTimeout = setTimeout(() => {
        this.setState({
          displayComponent: false,
        });
      }, 2000);
    }
    return this.props.labellingDoneCallback(label);
  };

  labellingStateFragment = () => {
    return (
      <SelectTree
        items={this.currentItems}
        columns={1}
        onSelected={this.selectTreeSelectCalback}
        selectTreeFirstTitle="Assign Label"
        onComponentChange={this.repositionComponent}
      />
    );
  };

  calculateTopDistance = () => {
    const height = window.innerHeight - window.innerHeight * 0.3;
    let top = this.state.componentStyle.top - height / 2 + 55;
    if (top < 0) {
      top = 0;
    } else {
      if (top + height > window.innerHeight) {
        top -= top + height - window.innerHeight;
      }
    }
    return top;
  };

  repositionComponent = () => {
    // SetTimeout for the css animation to end.
    setTimeout(() => {
      if (!this.mainElement.current) {
        return;
      }

      this.mainElement.current.style.maxHeight = '70vh';
      const top = this.calculateTopDistance();
      this.mainElement.current.style.top = `${top}px`;
    }, 200);
  };
}

export default LabellingFlow;
