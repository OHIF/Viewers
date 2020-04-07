import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { OverlayTrigger, TableListItem, Icon, Tooltip } from '@ohif/ui';

import './MRUrographyTableItem.styl';

class MRUrographyTableItem extends Component {
  static propTypes = {
    measurementData: PropTypes.object.isRequired,
    onItemClick: PropTypes.func.isRequired,
    onRelabel: PropTypes.func,
    onDelete: PropTypes.func,
    onEvaluate: PropTypes.func,
    itemClass: PropTypes.string,
    itemIndex: PropTypes.number,
  };

  render() {
    const { warningTitle = '', hasWarnings } = this.props.measurementData;

    return (
      <React.Fragment>
        {hasWarnings ? (
          <OverlayTrigger
            key={this.props.itemIndex}
            placement="left"
            overlay={
              <Tooltip
                placement="left"
                className="in tooltip-warning"
                id="tooltip-left"
              >
                <div className="warningTitle">{warningTitle}</div>
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
        {btnLabel}
      </button>
    );
  };

  getTableListItem = () => {
    const hasWarningClass = this.props.measurementData.hasWarnings
      ? 'hasWarnings'
      : '';

    const actionButtons = [];

    if (typeof this.props.onEvaluate === 'function') {
      const evaluateButton = this.getActionButton(
        'Evaluate',
        this.onEvaluateClick
      );
      actionButtons.push(evaluateButton);
    }

    if (typeof this.props.onRelabel === 'function') {
      const relabelButton = this.getActionButton(
        'Relabel',
        this.onRelabelClick
      );
      actionButtons.push(relabelButton);
    }

    if (typeof this.props.onDelete === 'function') {
      const deleteButton = this.getActionButton('Delete', this.onDeleteClick);
      actionButtons.push(deleteButton);
    }

    return (
      <TableListItem
        itemKey={this.props.measurementData.measurementNumber}
        itemClass={`measurementItem ${this.props.itemClass} ${hasWarningClass}`}
        itemIndex={this.props.itemIndex}
        onItemClick={this.onItemClick}
      >
        <div>
          <div className="measurementLocation">
            {this.props.measurementData.label}
          </div>
          <div className="displayTexts">{this.getDataDisplayText()}</div>
          <div className="rowActions">{actionButtons}</div>
        </div>
      </TableListItem>
    );
  };

  onItemClick = event => {
    this.props.onItemClick(event, this.props.measurementData);
  };

  onRelabelClick = event => {
    // Prevent onItemClick from firing
    event.stopPropagation();

    this.props.onRelabel(event, this.props.measurementData);
  };

  onEvaluateClick = event => {
    // Prevent onItemClick from firing
    event.stopPropagation();

    this.props.onEvaluate(event, this.props.measurementData);
  };

  onDeleteClick = event => {
    // Prevent onItemClick from firing
    event.stopPropagation();

    this.props.onDelete(event, this.props.measurementData);
  };

  getDataDisplayText = () => {
    debugger;
    const { areaUnderCurve, volume } = this.props.measurementData;

    return [
      <div key={`displayText_0`} className="measurementDisplayText">
        {`AUC: ${areaUnderCurve.toFixed(2)}`}
      </div>,
      <div key={`displayText_1`} className="measurementDisplayText">
        {`Vol: ${volume.toFixed(2)}`}
      </div>,
    ];
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

export default MRUrographyTableItem;
