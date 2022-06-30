import React from 'react';
import PropTypes from 'prop-types';
import { store } from 'cornerstone-tools';

import '../XNATRoiPanel.styl';
import cornerstone from 'cornerstone-core';
import { Icon } from '@ohif/ui';
import showModal from '../common/showModal.js';
import LabelEditModal from '../common/LabelEditModal.js';

const modules = store.modules;

/**
 * @class WorkingCollectionListItem - Renders metadata for the working
 * ROIContour Collection.
 */
export default class WorkingCollectionListItem extends React.Component {
  static propTypes = {
    roiContourIndex: PropTypes.any,
    metadata: PropTypes.any,
    activeROIContourIndex: PropTypes.any,
    onRoiChange: PropTypes.any,
    onRoiRemove: PropTypes.any,
    SeriesInstanceUID: PropTypes.any,
    onClick: PropTypes.func,
  };

  static defaultProps = {
    roiContourIndex: undefined,
    metadata: undefined,
    activeROIContourIndex: undefined,
    onRoiChange: undefined,
    onRoiRemove: undefined,
    SeriesInstanceUID: undefined,
    onClick: undefined,
  };

  constructor(props = {}) {
    super(props);

    this.onEditClick = this.onEditClick.bind(this);
    this.onUpdateLabel = this.onUpdateLabel.bind(this);
    this.onShowHideClick = this.onShowHideClick.bind(this);

    const { visible, name } = this.props.metadata;

    this.state = {
      visible,
      name,
    };
  }

  onUpdateLabel(data) {
    const { newLabel, itemId } = data;
    const { SeriesInstanceUID } = this.props;

    const freehand3DModule = modules.freehand3D;

    freehand3DModule.setters.ROIContourName(
      newLabel,
      SeriesInstanceUID,
      'DEFAULT',
      itemId
    );

    this.setState({ name: newLabel });
  }

  onEditClick() {
    const { metadata } = this.props;
    const onUpdateLabel = this.onUpdateLabel;
    showModal(LabelEditModal, {
      labelTag: 'ROI Name',
      currentLabel: metadata.name,
      itemId: metadata.uid,
      onUpdateProperty: onUpdateLabel,
    });
  }

  /**
   * onShowHideClick - Toggles the visibility of the collections ROI Contours.
   *
   * @returns {null}
   */
  onShowHideClick() {
    const { metadata } = this.props;
    const { visible } = this.state;

    metadata.visible = !visible;
    this.setState({ visible: !visible });

    cornerstone.getEnabledElements().forEach(enabledElement => {
      cornerstone.updateImage(enabledElement.element);
    });
  }

  render() {
    const {
      roiContourIndex,
      metadata,
      onRoiChange,
      onRoiRemove,
      onClick,
      activeROIContourIndex,
    } = this.props;

    const checked = activeROIContourIndex === roiContourIndex;
    const name = metadata.name;
    const polygonCount = metadata.polygonCount;
    const roiContourColor = metadata.color;

    const { visible } = this.state;
    const showHideIcon = visible ? (
      <Icon name="eye" width="13px" height="13px" />
    ) : (
      <Icon name="eye-closed" width="13px" height="13px" />
    );

    return (
      <tr>
        <td className="centered-cell" style={{ backgroundColor: roiContourColor }}>
          <input
            type="radio"
            checked={checked}
            onChange={() => onRoiChange(roiContourIndex)}
            style={{ backgroundColor: roiContourColor }}
          />
        </td>
        <td className="left-aligned-cell">
          <a
            style={{ cursor: 'pointer', color: 'var(--text-primary-color)' }}
            onClick={this.onEditClick}
          >
            {name}
          </a>
        </td>
        <td className="centered-cell">
          <a
            style={{ cursor: 'pointer', color: 'white' }}
            onClick={() => (polygonCount ? onClick(metadata.uid) : null)}
          >
            {polygonCount}
          </a>
        </td>
        <td className="">
          <button className="small" onClick={() => onRoiRemove(metadata.uid)}>
            <Icon name="trash" width="13px" height="13px" />
          </button>
        </td>
        <td className="">
          <button className="small" onClick={this.onShowHideClick}>
            {showHideIcon}
          </button>
        </td>
      </tr>
    );
  }
}
