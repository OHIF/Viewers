import React from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import { Icon } from '@ohif/ui';
import ColoredCircle from '../common/ColoredCircle';

import '../XNATRoiPanel.styl';

const modules = cornerstoneTools.store.modules;

/**
 * @class LockedCollectionsListItem - Renders metadata for an individual locked
 * ROIContour Collection.
 */
export default class LockedCollectionsListItem extends React.Component {
  static propTypes = {
    collection: PropTypes.any,
    onUnlockClick: PropTypes.any,
    SeriesInstanceUID: PropTypes.any,
    onClick: PropTypes.func,
  };

  static defaultProps = {
    collection: undefined,
    onUnlockClick: undefined,
    SeriesInstanceUID: undefined,
    onClick: undefined,
  };

  constructor(props = {}) {
    super(props);

    const { metadata, ROIContourArray } = props.collection;
    const collectionVisible = metadata.visible;
    const contourRoiVisible = [];
    ROIContourArray.forEach(roi => contourRoiVisible.push(roi.metadata.visible));

    this.state = {
      expanded: false,
      collectionVisible,
      contourRoiVisible,
    };

    this.onToggleVisibilityClick = this.onToggleVisibilityClick.bind(this);
    this.onCollectionShowHideClick = this.onCollectionShowHideClick.bind(this);
    this.onShowHideClick = this.onShowHideClick.bind(this);
  }

  /**
   * onToggleVisibilityClick - Callback that toggles the expands/collapses the
   * list of collection metadata.
   *
   * @returns {null}
   */
  onToggleVisibilityClick() {
    const { expanded } = this.state;

    this.setState({ expanded: !expanded });
  }

  /**
   * onCollectionShowHideClick - Toggles the visibility of the collections ROI Contours.
   *
   * @returns {null}
   */
  onCollectionShowHideClick() {
    const { collection, SeriesInstanceUID } = this.props;
    const { collectionVisible } = this.state;
    const structureSet = modules.freehand3D.getters.structureSet(
      SeriesInstanceUID,
      collection.metadata.uid
    );

    structureSet.visible = !collectionVisible;
    this.setState({ collectionVisible: !collectionVisible });

    cornerstone.getEnabledElements().forEach(enabledElement => {
      cornerstone.updateImage(enabledElement.element);
    });
  }

  /**
   * onCollectionShowHideClick - Toggles the visibility of the collections ROI Contours.
   *
   * @returns {null}
   */
  onShowHideClick(index) {
    const { metadata, ROIContourArray } = this.props.collection;
    const { contourRoiVisible } = this.state;

    const contourRoi = ROIContourArray[index];
    const visible = contourRoiVisible[index];

    contourRoi.metadata.visible = contourRoiVisible[index] = !visible;
    this.setState({ contourRoiVisible: contourRoiVisible });

    cornerstone.getEnabledElements().forEach(enabledElement => {
      cornerstone.updateImage(enabledElement.element);
    });
  }

  render() {
    const { collection, onUnlockClick, onClick } = this.props;
    const { expanded, collectionVisible, contourRoiVisible } = this.state;

    const metadata = collection.metadata;
    const ROIContourArray = collection.ROIContourArray;

    const expandStyle = expanded ? {} : { transform: 'rotate(90deg)' };

    return (
      <div className="collectionSection">
        <div className="header">
          <h5>{metadata.name}</h5>
          <div className="icons">
            <Icon
              name="lock"
              className="icon"
              width="20px"
              height="20px"
              onClick={() => {
                onUnlockClick(metadata.uid);
              }}
            />
            <Icon
              name={collectionVisible ? "eye" : "eye-closed"}
              className="icon"
              width="20px"
              height="20px"
              onClick={this.onCollectionShowHideClick}
            />
            <Icon
              name={`angle-double-${expanded ? 'down' : 'up'}`}
              className="icon"
              style={expandStyle}
              width="20px"
              height="20px"
              onClick={() => {
                this.setState({ expanded: !expanded });
              }}
            />
          </div>
        </div>

        {expanded && (
          <>
            <table className="collectionTable">
              <thead>
                <tr>
                  <th width="5%" className="centered-cell">
                    #
                  </th>
                  <th width="75%" className="left-aligned-cell">
                    ROI Name
                  </th>
                  <th width="10%" className="centered-cell">
                    N
                  </th>
                  <th width="10%" className="centered-cell" />
                </tr>
              </thead>
              <tbody>
                {ROIContourArray.map((contourRoi, index) => (
                  <tr key={contourRoi.metadata.uid}>
                    <td className="centered-cell">
                      <ColoredCircle color={contourRoi.metadata.color} />
                    </td>
                    <td className="left-aligned-cell">
                      {contourRoi.metadata.name}
                    </td>
                    <td className="centered-cell">
                      <a
                        style={{ cursor: 'pointer', color: 'white' }}
                        onClick={() => contourRoi.metadata.polygonCount ? onClick(contourRoi.metadata.uid) : null}
                      >
                        {contourRoi.metadata.polygonCount}
                      </a>
                    </td>
                    <td>
                      <button
                        className="small"
                        onClick={() => this.onShowHideClick(index)}
                      >
                        <Icon
                          name={contourRoiVisible[index] ? 'eye' : 'eye-closed'}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    );
  }
}
