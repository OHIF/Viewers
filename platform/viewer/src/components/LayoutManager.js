import './LayoutManager.css';

import React, { Component } from 'react';
import OHIF from '@ohif/core';
import LayoutPanelDropTarget from './LayoutPanelDropTarget.js';
import PropTypes from 'prop-types';

const { StackManager } = OHIF.utils;

function defaultViewportPlugin(props) {
  return <div>{JSON.stringify(props)}</div>;
}

function EmptyViewport() {
  return (
    <div className="EmptyViewport">
      <p>Please drag a stack here to view images.</p>
    </div>
  );
}

export class LayoutManager extends Component {
  static className = 'LayoutManager';
  static defaultProps = {
    viewportData: [],
    layout: {
      viewports: [
        {
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
        },
      ],
    },
    activeViewportIndex: 0,
    availablePlugins: {
      defaultViewportPlugin,
    },
    defaultPlugin: 'defaultViewportPlugin',
  };

  static propTypes = {
    viewportData: PropTypes.array.isRequired,
    activeViewportIndex: PropTypes.number.isRequired,
    layout: PropTypes.object.isRequired,
    availablePlugins: PropTypes.object.isRequired,
    setViewportData: PropTypes.func,
    studies: PropTypes.array,
    children: PropTypes.node,
  };

  onDrop = ({ viewportIndex, item }) => {
    if (this.props.setViewportData) {
      this.props.setViewportData({ viewportIndex, item });
    }
  };

  getViewportComponent(viewportName = this.props.defaultPlugin) {
    const ViewportComponent = this.props.availablePlugins[viewportName];

    if (!ViewportComponent) {
      throw new Error(
        `No Viewport available with name: ${viewportName}. Available viewport's: ${JSON.stringify(
          this.props.availablePlugins
        )}`
      );
    }

    return ViewportComponent;
  }

  getContent(ViewportComponent, viewportIndex) {
    return (
      <LayoutPanelDropTarget onDrop={this.onDrop} viewportIndex={viewportIndex}>
        {ViewportComponent}
      </LayoutPanelDropTarget>
    );
  }

  render() {
    if (!this.props.viewportData.length) {
      return '';
    }

    const { studies, viewportData } = this.props;
    const viewports = this.props.layout.viewports;
    const viewportElements = viewports.map((layout, viewportIndex) => {
      const displaySet = viewportData[viewportIndex];

      // Use whichever plugin is currently in use in the panel
      // unless nothing is specified. If nothing is specified
      // and the display set has a plugin specified, use that.
      //
      // TODO: Change this logic to:
      // - Plugins define how capable they are of displaying a SopClass
      // - When updating a panel, ensure that the currently enabled plugin
      // in the viewport is capable of rendering this display set. If not
      // then use the most capable available plugin
      let plugin = layout.plugin;
      if (!layout.plugin && displaySet && displaySet.plugin) {
        plugin = displaySet.plugin;
      }

      // ~~ EXPERIMENTAL
      // Find using displaySet
      const study = studies.find(
        study => study.studyInstanceUid === displaySet.studyInstanceUid
      );
      const studyDisplaySet = study.displaySets.find(set => {
        return set.displaySetInstanceUid === displaySet.displaySetInstanceUid;
      });

      // Get stack from Stack Manager
      const storedStack = StackManager.findOrCreateStack(
        study,
        studyDisplaySet
      );
      const {
        studyInstanceUid,
        displaySetInstanceUid,
        imageIds,
        frameRate,
      } = storedStack;
      console.log(storedStack);

      let childrenWithProps = null;

      // TODO: Does it make more sense to use Context?
      if (this.props.children && this.props.children.length) {
        childrenWithProps = this.props.children.map((child, index) => {
          return React.cloneElement(child, {
            viewportIndex: this.props.viewportIndex,
            key: index,
          });
        });
      }
      // ~~ EXPERIMENTAL

      const ViewportComponent = displaySet
        ? this.getViewportComponent(plugin)
        : EmptyViewport;
      const ViewportComponentWithProps = (
        <>
          <ViewportComponent
            tools={[]} // TODO: Fix
            imageIds={imageIds}
            frameRate={frameRate}
            // We shouldn't need this?
            // Used in `ConnectedCornerstoneViewport`
            viewportIndex={viewportIndex}
          />
          {childrenWithProps}
        </>
      );

      const content = this.getContent(
        ViewportComponentWithProps,
        viewportIndex
      );

      let className = 'viewport-container';
      if (this.props.activeViewportIndex === viewportIndex) {
        className += ' active';
      }

      return (
        <div key={viewportIndex} className={className} style={{ ...layout }}>
          {content}
        </div>
      );
    });

    return <div className={LayoutManager.className}>{viewportElements}</div>;
  }
}

export default LayoutManager;
