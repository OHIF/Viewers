import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from '../../contextProviders';

import { Icon } from './../../elements/Icon';
import { OverlayTrigger } from './../overlayTrigger';
import { Tooltip } from './../tooltip';
import { TableListItem } from './../tableList/TableListItem.js';

import './MeasurementTableItem.styl';

const ColoredCircle = ({ color }) => {
  return <div className="item-color" style={{ backgroundColor: color }}></div>;
};

ColoredCircle.propTypes = {
  color: PropTypes.string.isRequired,
};

class MeasurementTableItem extends Component {
  static propTypes = {
    measurementData: PropTypes.object.isRequired,
    onItemClick: PropTypes.func.isRequired,
    onRelabel: PropTypes.func,
    onDelete: PropTypes.func,
    onEditDescription: PropTypes.func,
    itemClass: PropTypes.string,
    itemIndex: PropTypes.number,
    t: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      collapsed: true,
      visible: true,
    };
  }

  render() {
    const {
      warningTitle = '',
      hasWarnings,
      isReadOnly,
    } = this.props.measurementData;

    return (
      <React.Fragment>
        {hasWarnings && !isReadOnly ? (
          <OverlayTrigger
            key={this.props.itemIndex}
            placement="left"
            overlay={
              <Tooltip
                placement="left"
                className="in tooltip-warning"
                id="tooltip-left"
              >
                <div className="warningTitle">{this.props.t(warningTitle)}</div>
                <div className="warningContent">{this.getWarningContent()}</div>
              </Tooltip>
            }
          >
            <div>{this.getTableListItem()}</div>
          </OverlayTrigger>
        ) : (
          <React.Fragment>{this.getTableListItem()}</React.Fragment>
        )}
      </React.Fragment>
    );
  }

  getActionButton = (btnLabel, onClickCallback) => {
    return (
      <button key={btnLabel} className="btnAction" onClick={onClickCallback}>
        <span style={{ marginRight: '4px' }}>
          <Icon name="edit" width="14px" height="14px" />
        </span>
        {this.props.t(btnLabel)}
      </button>
    );
  };

  getTableListItem = () => {
    const hasWarningClass =
      this.props.measurementData.hasWarnings &&
      !this.props.measurementData.isReadOnly
        ? 'hasWarnings'
        : '';

    const actionButtons = [];

    if (typeof this.props.onRelabel === 'function') {
      const relabelButton = this.getActionButton(
        'Relabel',
        this.onRelabelClick
      );
      actionButtons.push(relabelButton);
    }
    if (typeof this.props.onEditDescription === 'function') {
      const descriptionButton = this.getActionButton(
        'Description',
        this.onEditDescriptionClick
      );
      actionButtons.push(descriptionButton);
    }
    if (typeof this.props.onDelete === 'function') {
      const deleteButton = this.getActionButton('Delete', this.onDeleteClick);
      actionButtons.push(deleteButton);
    }

    if (
      this.props.measurementData.isSRText === true &&
      this.props.measurementData.labels &&
      this.props.measurementData.labels.length > 0
    ) {
      return (
        <React.Fragment>
          <TableListItem
            key={this.props.measurementData.measurementNumber}
            itemKey={this.props.measurementData.measurementNumber}
            itemClass={`measurementItem ${this.props.itemClass} ${hasWarningClass}`}
            itemIndex={this.props.itemIndex}
            onItemClick={this.onItemClick}
          >
            <div>
              <div className="measurementLocation">
                {this.props.t(this.props.measurementData.label, {
                  keySeparator: '>',
                  nsSeparator: '|',
                })}
              </div>
            </div>
            <div className="icons">
              <div className="displayTexts">{this.getDataDisplayText()}</div>
              <Icon
                className={`eye-icon`}
                name={this.state.visible ? 'eye' : 'eye-closed'}
                width="20px"
                height="20px"
                onClick={() => {
                  this.props.measurementData.labels.forEach(label => {
                    label.visible = !this.state.visible;
                  });

                  this.setState({
                    visible: !this.state.visible,
                  });
                }}
              />
              <Icon
                className={`angle-double-${
                  this.state.collapsed ? 'down' : 'up'
                }`}
                name={`angle-double-${this.state.collapsed ? 'down' : 'up'}`}
                width="20px"
                height="20px"
                onClick={() => {
                  this.setState({
                    collapsed: !this.state.collapsed,
                  });
                }}
              />
            </div>
          </TableListItem>
          {this.state.collapsed &&
            this.props.measurementData.labels.map((SRLabel, index) => {
              return (
                <TableListItem
                  key={index}
                  itemKey={index}
                  itemMeta={<ColoredCircle color={SRLabel.color} />}
                  itemMetaClass="item-color-section"
                  onItemClick={this.onItemClick}
                >
                  <div>
                    <div className="icons">
                      <span>{SRLabel.label + ' : ' + SRLabel.value}</span>
                      <Icon
                        className={`eye-icon`}
                        name={SRLabel.visible ? 'eye' : 'eye-closed'}
                        width="20px"
                        height="20px"
                        onClick={() => {
                          SRLabel.visible = !SRLabel.visible;
                        }}
                      />
                    </div>
                  </div>
                </TableListItem>
              );
            })}
        </React.Fragment>
      );
    } else {
      return (
        <TableListItem
          key={this.props.measurementData.measurementNumber}
          itemKey={this.props.measurementData.measurementNumber}
          itemClass={`measurementItem ${this.props.itemClass} ${hasWarningClass}`}
          itemIndex={this.props.itemIndex}
          onItemClick={this.onItemClick}
        >
          <div>
            <div className="measurementLocation">
              {this.props.t(this.props.measurementData.label, {
                keySeparator: '>',
                nsSeparator: '|',
              })}
            </div>
            <div className="displayTexts">{this.getDataDisplayText()}</div>
            {!this.props.measurementData.isReadOnly && (
              <div className="rowActions">{actionButtons}</div>
            )}
          </div>
        </TableListItem>
      );
    }
  };

  onItemClick = event => {
    this.props.onItemClick(event, this.props.measurementData);
  };

  onRelabelClick = event => {
    // Prevent onItemClick from firing
    event.stopPropagation();

    this.props.onRelabel(event, this.props.measurementData);
  };

  onEditDescriptionClick = event => {
    // Prevent onItemClick from firing
    event.stopPropagation();

    this.props.onEditDescription(event, this.props.measurementData);
  };

  onDeleteClick = event => {
    // Prevent onItemClick from firing
    event.stopPropagation();

    this.props.onDelete(event, this.props.measurementData);
  };

  getDataDisplayText = () => {
    return this.props.measurementData.data.map((data, index) => {
      return (
        <div key={`displayText_${index}`} className="measurementDisplayText">
          {data.displayText ? data.displayText : '...'}
        </div>
      );
    });
  };

  getWarningContent = () => {
    const { warningList = '' } = this.props.measurementData;

    if (Array.isArray(warningList)) {
      const listedWarnings = warningList.map((warn, index) => {
        return <li key={index}>{warn}</li>;
      });

      return <ol>{listedWarnings}</ol>;
    } else {
      return <React.Fragment>{warningList}</React.Fragment>;
    }
  };
}

const connectedComponent = withTranslation('MeasurementTable')(
  MeasurementTableItem
);
export { connectedComponent as MeasurementTableItem };
export default connectedComponent;
