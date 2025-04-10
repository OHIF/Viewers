import React from 'react';
import PropTypes from 'prop-types';
import csTools from 'cornerstone-tools';
import { Icon } from '@ohif/ui';
import WorkingCollectionListItem from './WorkingCollectionListItem.js';
import { refreshViewports, ROI_COLOR_TEMPLATES } from '../../utils/index.js';

import '../XNATRoiPanel.styl';

const modules = csTools.store.modules;

/**
 * @class WorkingRoiCollectionList - Renders a list of
 * ROI contours, displaying metadata of the working ROIContour
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
    let activeColorTemplate = ROI_COLOR_TEMPLATES.CUSTOM.id;
    const structureSet = modules.freehand3D.getters.structureSet(
      props.SeriesInstanceUID,
      'DEFAULT'
    );
    if (structureSet) {
      collectionVisible = structureSet.visible;
      activeColorTemplate = structureSet.activeColorTemplate;
    }

    this.state = {
      isExpanded: true,
      collectionVisible,
      activeColorTemplate,
    };

    this.onCollectionShowHideClick = this.onCollectionShowHideClick.bind(this);
    this.onCollectionColorTemplateChanged = this.onCollectionColorTemplateChanged.bind(
      this
    );
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

    refreshViewports();
  }

  onCollectionColorTemplateChanged(evt) {
    const value = evt.target.value;

    const { SeriesInstanceUID } = this.props;
    const structureSet = modules.freehand3D.getters.structureSet(
      SeriesInstanceUID,
      'DEFAULT'
    );

    modules.freehand3D.setters.updateStructureSetColorTemplate(
      structureSet,
      value
    );

    this.setState({ activeColorTemplate: value });

    refreshViewports();
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

    const { isExpanded, collectionVisible, activeColorTemplate } = this.state;

    const canChangeRoiColor =
      activeColorTemplate === ROI_COLOR_TEMPLATES.CUSTOM.id;

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
          <div className={`header${isExpanded ? ' expanded' : ''}`}>
            <div
              className="editableWrapper"
              style={{ flex: 1, marginRight: 5, marginLeft: 2 }}
            >
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
              <span style={{ position: 'absolute', right: 2, top: 2 }}>
                <Icon name="xnat-pencil" />
              </span>
            </div>
            <div className="icons">
              <button onClick={onNewRoiButtonClick}>
                <Icon name="xnat-tree-plus" /> Contour ROI
              </button>
              <Icon
                name={collectionVisible ? 'eye' : 'eye-closed'}
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
                title={isExpanded ? 'Collapse' : 'Expand'}
              />
            </div>
          </div>

          {isExpanded && (
            <div>
              <div className="header subHeading">
                <Icon
                  name="xnat-colormap"
                  width="18px"
                  height="18px"
                  title="Active Color Template"
                />
                <select
                  value={activeColorTemplate}
                  onChange={this.onCollectionColorTemplateChanged}
                >
                  {Object.keys(ROI_COLOR_TEMPLATES).map(key => {
                    if (key !== ROI_COLOR_TEMPLATES.META.id) {
                      return (
                        <option key={key} value={key}>
                          {ROI_COLOR_TEMPLATES[key].desc}
                        </option>
                      );
                    }
                  })}
                </select>
              </div>
              <table className="collectionTable">
                <thead>
                  <tr>
                    <th width="5%" className="centered-cell">
                      #
                    </th>
                    <th width="45%" className="left-aligned-cell">
                      ROI Name
                    </th>
                    <th width="10%" className="centered-cell">
                      <abbr title="Number of contours">N</abbr>
                    </th>
                    <th width="10%" className="" />
                    <th width="10%" className="" />
                    {canChangeRoiColor && <th width="10%" className="" />}
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
                        canChangeRoiColor={canChangeRoiColor}
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
