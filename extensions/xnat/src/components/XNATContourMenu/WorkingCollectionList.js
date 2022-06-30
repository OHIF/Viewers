import React from 'react';
import PropTypes from 'prop-types';
import csTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import { Icon } from '@ohif/ui';
import WorkingCollectionListItem from './WorkingCollectionListItem.js';

import '../XNATRoiPanel.styl';

const modules = csTools.store.modules;

/**
 * @class WorkingRoiCollectionList - Renders a list of
 * WorkingCollectionListItem, displaying metadata of the working ROIContour
 * Collection.
 */
export default class WorkingRoiCollectionList extends React.Component {
  static propTypes = {
    workingCollection: PropTypes.any,
    activeROIContourIndex: PropTypes.any,
    onRoiChange: PropTypes.any,
    onRoiRemove: PropTypes.any,
    SeriesInstanceUID: PropTypes.any,
    onContourClick: PropTypes.func,
    onRoiCollectionNameChange: PropTypes.func,
    onNewRoiButtonClick: PropTypes.func,
  };

  static defaultProps = {
    workingCollection: undefined,
    activeROIContourIndex: undefined,
    onRoiChange: undefined,
    onRoiRemove: undefined,
    SeriesInstanceUID: undefined,
    onContourClick: undefined,
    onRoiCollectionNameChange: undefined,
    onNewRoiButtonClick: undefined,
  };

  constructor(props = {}) {
    super(props);

    let collectionVisible = true;
    const structureSet = modules.freehand3D.getters.structureSet(
      props.SeriesInstanceUID,
      'DEFAULT'
    );
    if (structureSet && structureSet.metadata) {
      collectionVisible = structureSet.metadate.visible;
    }

    this.state = {
      isExpanded: true,
      collectionVisible,
    };

    this.onCollectionShowHideClick = this.onCollectionShowHideClick.bind(this);
  }

  /**
   * onCollectionShowHideClick - Toggles the visibility of the collections ROI Contours.
   *
   * @returns {null}
   */
  onCollectionShowHideClick() {
    const { SeriesInstanceUID } = this.props;
    const { collectionVisible } = this.state;
    const structureSet = modules.freehand3D.getters.structureSet(
      SeriesInstanceUID,
      'DEFAULT'
    );

    structureSet.visible = !collectionVisible;
    this.setState({ collectionVisible: !collectionVisible });

    cornerstone.getEnabledElements().forEach(enabledElement => {
      cornerstone.updateImage(enabledElement.element);
    });
  }

  render() {
    const {
      workingCollection,
      activeROIContourIndex,
      onRoiChange,
      onRoiRemove,
      SeriesInstanceUID,
      onContourClick,
      onNewRoiButtonClick,
      onRoiCollectionNameChange,
    } = this.props;

    const { isExpanded, collectionVisible } = this.state;

    // default structurset
    const defaultStructureSet = modules.freehand3D.getters.structureSet(
      SeriesInstanceUID
    );
    const defaultStructureSetName =
      defaultStructureSet.name === '_' ? '' : defaultStructureSet.name;

    const expandStyle = isExpanded ? {} : { transform: 'rotate(90deg)' };

    return (
      <React.Fragment>
        <div className="collectionSection">
          <div className="header">
            <h5 style={{ flex: 1, marginRight: 5, marginLeft: 2 }}>
              <input
                name="roiContourName"
                className="roiEdit"
                onChange={onRoiCollectionNameChange}
                type="text"
                autoComplete="off"
                defaultValue={defaultStructureSetName}
                placeholder="Unnamed ROI collection"
                tabIndex="1"
              />
            </h5>
            <div className="icons">
              <button onClick={onNewRoiButtonClick}>
                <Icon name="xnat-tree-plus" /> Contour ROI
              </button>
              <Icon
                name={collectionVisible ? "eye" : "eye-closed"}
                className="icon"
                width="20px"
                height="20px"
                onClick={this.onCollectionShowHideClick}
              />
              <Icon
                name={`angle-double-${isExpanded ? 'down' : 'up'}`}
                className="icon"
                style={expandStyle}
                width="20px"
                height="20px"
                onClick={() => {
                  this.setState({ isExpanded: !isExpanded });
                }}
              />
            </div>
          </div>

          {isExpanded && (
            <div>
              <table className="collectionTable">
                <thead>
                  <tr>
                    <th width="5%" className="centered-cell">
                      #
                    </th>
                    <th width="55%" className="left-aligned-cell">
                      ROI Name
                    </th>
                    <th width="10%" className="centered-cell">
                      <abbr title="Number of contours">N</abbr>
                    </th>
                    <th width="10%" className="" />
                    <th width="10%" className="" />
                  </tr>
                </thead>
                <tbody>
                  {SeriesInstanceUID &&
                    workingCollection.map(roiContour => (
                      <WorkingCollectionListItem
                        key={roiContour.metadata.uid}
                        roiContourIndex={roiContour.index}
                        metadata={roiContour.metadata}
                        activeROIContourIndex={activeROIContourIndex}
                        onRoiChange={onRoiChange}
                        onRoiRemove={onRoiRemove}
                        SeriesInstanceUID={SeriesInstanceUID}
                        onClick={onContourClick}
                      />
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </React.Fragment>
    );
  }
}
