import React from 'react';
import PropTypes from 'prop-types';
import { store } from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import { Icon } from '@ohif/ui';
import showModal from '../common/showModal.js';
import LabelEditModal from '../common/LabelEditModal.js';
import { ROIContourColorPicker, FormattedValue } from '../../elements';
import {
  refreshViewports,
  ROI_COLOR_TEMPLATES,
  XNAT_EVENTS,
} from '../../utils/index.js';

import '../XNATRoiPanel.styl';

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
    canChangeRoiColor: PropTypes.bool,
  };

  static defaultProps = {
    roiContourIndex: undefined,
    metadata: undefined,
    activeROIContourIndex: undefined,
    onRoiChange: undefined,
    onRoiRemove: undefined,
    SeriesInstanceUID: undefined,
    onClick: undefined,
    canChangeRoiColor: true,
  };

  constructor(props = {}) {
    super(props);

    this.onEditClick = this.onEditClick.bind(this);
    this.onUpdateLabel = this.onUpdateLabel.bind(this);
    this.onUpdateColor = this.onUpdateColor.bind(this);
    this.onShowHideClick = this.onShowHideClick.bind(this);
    this.eventListenerHandler = this.eventListenerHandler.bind(this);

    const { visible, name, color, stats } = this.props.metadata;

    this.state = {
      visible,
      name,
      color,
      volumeCm3: stats.volumeCm3,
    };

    this.addEventListeners();
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  addEventListeners() {
    this.removeEventListeners();

    document.addEventListener(
      XNAT_EVENTS.CONTOUR_COMPLETED,
      this.eventListenerHandler
    );
    document.addEventListener(
      XNAT_EVENTS.CONTOUR_REMOVED,
      this.eventListenerHandler
    );
  }

  removeEventListeners() {
    document.removeEventListener(
      XNAT_EVENTS.CONTOUR_COMPLETED,
      this.eventListenerHandler
    );
    document.removeEventListener(
      XNAT_EVENTS.CONTOUR_REMOVED,
      this.eventListenerHandler
    );
  }

  eventListenerHandler(evt) {
    const { uid, stats } = this.props.metadata;
    if (evt.detail.roiContourUid === uid) {
      this.setState({ volumeCm3: stats.volumeCm3 });
    }
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

    const structureSet = modules.freehand3D.getters.structureSet(
      SeriesInstanceUID,
      'DEFAULT'
    );

    const color = modules.freehand3D.setters.updateROIContourColor(
      structureSet,
      itemId,
      {
        colorTemplateId: structureSet.activeColorTemplate,
      }
    );

    refreshViewports();

    this.setState({ name: newLabel, color: color });
  }

  onUpdateColor(data) {
    const { color, ROIContourUid } = data;
    const { SeriesInstanceUID } = this.props;

    const structureSet = modules.freehand3D.getters.structureSet(
      SeriesInstanceUID,
      'DEFAULT'
    );

    modules.freehand3D.setters.updateROIContourColor(
      structureSet,
      ROIContourUid,
      { colorTemplateId: ROI_COLOR_TEMPLATES.CUSTOM.id, customColor: color }
    );

    refreshViewports();

    this.setState({ color: color });
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
      canChangeRoiColor,
    } = this.props;

    const checked = activeROIContourIndex === roiContourIndex;
    const { name, stats } = metadata;
    const polygonCount = metadata.polygonCount;

    const { visible, color, volumeCm3 } = this.state;
    const showHideIcon = visible ? (
      <Icon name="eye" width="13px" height="13px" />
    ) : (
      <Icon name="eye-closed" width="13px" height="13px" />
    );

    return (
      <tr>
        <td
          className="centered-cell"
          style={{ backgroundColor: metadata.color }}
        >
          <input
            type="radio"
            checked={checked}
            onChange={() => onRoiChange(roiContourIndex)}
            style={{ backgroundColor: metadata.color }}
          />
        </td>
        <td className="left-aligned-cell">
          <div className="editableWrapper">
            <a
              style={{ cursor: 'pointer', color: 'var(--text-primary-color)' }}
              onClick={this.onEditClick}
            >
              {name}
              <span>
                <Icon name="xnat-pencil" />
              </span>
            </a>
            {volumeCm3 !== 0 && (
              <div>
                <FormattedValue
                  prefix={'Volume'}
                  value={volumeCm3}
                  suffix={stats.units.volumeUnitCm}
                  sameLine={true}
                />
              </div>
            )}
          </div>
        </td>
        <td className="centered-cell">
          <a
            style={{ cursor: 'pointer', color: 'var(--text-primary-color)' }}
            onClick={() => (polygonCount ? onClick(metadata.uid) : null)}
          >
            {polygonCount}
          </a>
        </td>
        <td className="">
          <button className="small" onClick={this.onShowHideClick}>
            {showHideIcon}
          </button>
        </td>
        {canChangeRoiColor && (
          <td className="">
            <ROIContourColorPicker
              ROIContourUid={metadata.uid}
              roiContourColor={metadata.color}
              onUpdateROIContourColor={this.onUpdateColor}
            />
          </td>
        )}
        <td className="">
          <button className="small" onClick={() => onRoiRemove(metadata.uid)}>
            <Icon name="trash" width="13px" height="13px" />
          </button>
        </td>
      </tr>
    );
  }
}
