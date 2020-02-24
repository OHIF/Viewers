import './ViewerMain.css';

import { Component } from 'react';
import { ConnectedViewportGrid } from './../components/ViewportGrid/index.js';
import PropTypes from 'prop-types';
import React from 'react';

class ViewerMain extends Component {
  static propTypes = {
    activeViewportIndex: PropTypes.number.isRequired,
    studies: PropTypes.array,
    viewportSpecificData: PropTypes.object.isRequired,
    layout: PropTypes.object.isRequired,
    // @TODO: Add a reducer to set multiple viewport data in a batch operation
    setViewportSpecificData: PropTypes.func.isRequired,
    clearViewportSpecificData: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      displaySets: [],
      displaySetGroups: [],
    };
  }

  updateDisplaySets(callback) {
    const { studies } = this.props;
    if (studies) {
      const displaySets = [];
      const displaySetGroups = [];
      studies.forEach(study => {
        const group = [];
        study.displaySets.forEach(dSet => {
          if (!dSet.plugin) {
            dSet.plugin = 'cornerstone';
          }
          group.push(dSet);
          displaySets.push(dSet);
        });
        displaySetGroups.push(group);
      });
      this.setState({ displaySets, displaySetGroups }, callback);
    }
  }

  // @TODO: Deletion?
  getDisplaySets(studies) {
    const displaySets = [];
    studies.forEach(study => {
      study.displaySets.forEach(dSet => {
        if (!dSet.plugin) {
          dSet.plugin = 'cornerstone';
        }
        displaySets.push(dSet);
      });
    });

    return displaySets;
  }

  findDisplaySet(studies, StudyInstanceUID, displaySetInstanceUID) {
    const study = studies.find(study => {
      return study.StudyInstanceUID === StudyInstanceUID;
    });

    if (!study) {
      return;
    }

    return study.displaySets.find(displaySet => {
      return displaySet.displaySetInstanceUID === displaySetInstanceUID;
    });
  }

  componentDidMount() {
    // Add beforeUnload event handler to check for unsaved changes
    //window.addEventListener('beforeunload', unloadHandlers.beforeUnload);

    // Get all the display sets for the viewer studies
    this.updateDisplaySets(this.fillEmptyViewportPanes.bind(this, true));
  }

  componentDidUpdate(prevProps) {
    const prevLayoutId = prevProps.layout.model.id;
    const currLayoutId = this.props.layout.model.id;
    const studiesChanged = this.props.studies !== prevProps.studies;
    const isVtk = this.props.layout.viewports.some(vp => !!vp.vtk);

    if (studiesChanged || (currLayoutId !== prevLayoutId && !isVtk)) {
      const displaySets = this.getDisplaySets(this.props.studies);
      this.setState({ displaySets }, this.fillEmptyViewportPanes);
      this.updateDisplaySets(
        this.fillEmptyViewportPanes.bind(this, studiesChanged)
      );
    }
  }

  fillEmptyViewportPanes = forceUpdate => {
    const dirtyViewportPanes = [];
    const { layout, viewportSpecificData } = this.props;
    const { displaySets, displaySetGroups } = this.state;

    if (!displaySets || !displaySets.length) {
      return;
    }

    if (
      forceUpdate &&
      layout.groups &&
      layout.groups.length > 1 &&
      layout.groups.length === displaySetGroups.length
    ) {
      layout.groups.forEach((group, j) => {
        const displaySetGroup = displaySetGroups[j];
        const displaySetGroupLimit = displaySetGroup.length - 1;
        for (let i = 0, limit = group.viewports.length; i < limit; ++i) {
          const ds = displaySetGroup[Math.min(displaySetGroupLimit, i)];
          this.setViewportData({
            viewportIndex: i,
            viewportGroup: j,
            StudyInstanceUID: ds.StudyInstanceUID,
            displaySetInstanceUID: ds.displaySetInstanceUID,
          });
        }
      });
      return;
    }

    for (let i = 0; i < layout.viewports.length; i++) {
      const viewportPane = viewportSpecificData[i];
      const isNonEmptyViewport =
        !forceUpdate &&
        viewportPane &&
        viewportPane.StudyInstanceUID &&
        viewportPane.displaySetInstanceUID;

      if (isNonEmptyViewport) {
        dirtyViewportPanes.push({
          StudyInstanceUID: viewportPane.StudyInstanceUID,
          displaySetInstanceUID: viewportPane.displaySetInstanceUID,
        });

        continue;
      }

      const foundDisplaySet =
        displaySets.find(
          ds =>
            !dirtyViewportPanes.some(
              v => v.displaySetInstanceUID === ds.displaySetInstanceUID
            )
        ) || displaySets[displaySets.length - 1];

      dirtyViewportPanes.push(foundDisplaySet);
    }

    dirtyViewportPanes.forEach((vp, i) => {
      if (vp && vp.StudyInstanceUID) {
        this.setViewportData({
          viewportIndex: i,
          StudyInstanceUID: vp.StudyInstanceUID,
          displaySetInstanceUID: vp.displaySetInstanceUID,
        });
      }
    });
  };

  setViewportData = ({
    viewportIndex,
    viewportGroup,
    StudyInstanceUID,
    displaySetInstanceUID,
  }) => {
    const displaySet = this.findDisplaySet(
      this.props.studies,
      StudyInstanceUID,
      displaySetInstanceUID
    );

    this.props.setViewportSpecificData(viewportIndex, displaySet, {
      viewportGroup,
    });
  };

  render() {
    const { viewportSpecificData } = this.props;
    const viewportData = viewportSpecificData
      ? Object.values(viewportSpecificData)
      : [];

    return (
      <div className="ViewerMain">
        {this.state.displaySets.length && (
          <ConnectedViewportGrid
            studies={this.props.studies}
            viewportData={viewportData}
            setViewportData={this.setViewportData}
          >
            {/* Children to add to each viewport that support children */}
          </ConnectedViewportGrid>
        )}
      </div>
    );
  }

  componentWillUnmount() {
    // Clear the entire viewport specific data
    const { viewportSpecificData } = this.props;
    Object.keys(viewportSpecificData).forEach(viewportIndex => {
      this.props.clearViewportSpecificData(viewportIndex);
    });

    // TODO: These don't have to be viewer specific?
    // Could qualify for other routes?
    // hotkeys.destroy();

    // Remove beforeUnload event handler...
    //window.removeEventListener('beforeunload', unloadHandlers.beforeUnload);
    // Destroy the synchronizer used to update reference lines
    //OHIF.viewer.updateImageSynchronizer.destroy();
    // TODO: Instruct all plugins to clean up themselves
    //
    // Clear references to all stacks in the StackManager
    //StackManager.clearStacks();
    // @TypeSafeStudies
    // Clears OHIF.viewer.Studies collection
    //OHIF.viewer.Studies.removeAll();
    // @TypeSafeStudies
    // Clears OHIF.viewer.StudyMetadataList collection
    //OHIF.viewer.StudyMetadataList.removeAll();
  }
}

export default ViewerMain;
