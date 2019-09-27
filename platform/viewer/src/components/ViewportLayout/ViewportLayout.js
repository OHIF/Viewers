import './ViewportLayout.css';

import React, { Component } from 'react';
import OHIF from '@ohif/core';
import LayoutPanelDropTarget from './LayoutPanelDropTarget.js';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useDrop } from 'react-dnd';
//
import EmptyViewport from './EmptyViewport.js';
import DefaultViewport from './DefaultViewport.js';

const { StackManager } = OHIF.utils;

export class ViewportLayout extends Component {
  static defaultProps = {
    activeViewportIndex: 0,
    availablePlugins: {
      DefaultViewport,
    },
    defaultPlugin: 'DefaultViewport',
  };

  static propTypes = {
    activeViewportIndex: PropTypes.number.isRequired,
    layout: PropTypes.arrayOf(
      PropTypes.shape({
        height: PropTypes.string,
        width: PropTypes.string,
        studyInstanceUid: PropTypes.string,
        displaySetInstanceUid: PropTypes.string,
        plugin: PropTypes.string,
      })
    ),
    availablePlugins: PropTypes.object.isRequired,
    setViewportData: PropTypes.func,
    studies: PropTypes.array,
    children: PropTypes.node,
  };

  onDrop = ({ viewportIndex, item }) => {
    console.log('DROPPED!');
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

  render() {
    const { studies, layout } = this.props;

    if (!layout.length) {
      return '';
    }

    console.log('VPL:', layout);

    const magic = layout.map((viewport, viewportIndex) => {
      // Use whichever plugin is currently in use in the panel
      // unless nothing is specified. If nothing is specified
      // and the display set has a plugin specified, use that.
      //
      // TODO: Change this logic to:
      // - Plugins define how capable they are of displaying a SopClass
      // - When updating a panel, ensure that the currently enabled plugin
      // in the viewport is capable of rendering this display set. If not
      // then use the most capable available plugin
      const plugin = viewport.plugin;
      // ~~ EXPERIMENTAL
      // Find using displaySet
      const study = studies.find(
        study => study.studyInstanceUid === viewport.studyInstanceUid
      );
      const studyDisplaySet = study.displaySets.find(set => {
        return set.displaySetInstanceUid === viewport.displaySetInstanceUid;
      });

      // Get stack from Stack Manager
      const storedStack =
        StackManager.findOrCreateStack(
          study,
          studyDisplaySet // TODO: Study contains this display set. Why do we need to pass both? Should just take displaySetInstanceUid?
        ) || {};
      const {
        studyInstanceUid,
        displaySetInstanceUid,
        imageIds,
        frameRate,
      } = storedStack;
      console.log('storedStack: ', storedStack);

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

      const ViewportComponent = imageIds
        ? this.getViewportComponent(plugin)
        : EmptyViewport;
      const classes = ['viewport-container'];
      if (this.props.activeViewportIndex === viewportIndex) {
        classes.push('active');
      }

      //////
      // https://react-dnd.github.io/react-dnd/docs/api/use-drop
      const [collectedProps, drop] = useDrop({
        accept: 'thumbnail',
        drop: this.onDrop,
      });

      return (
        // <LayoutPanelDropTarget
        //   onDrop={this.onDrop}
        //   viewportIndex={viewportIndex}
        //   className={classNames(...classes)}
        //   style={{ height: viewport.height, width: viewport.width }}
        //   key={viewportIndex}
        // >
        <>
          <ViewportComponent
            ref={drop}
            // Different "Viewport Types"? Feels too rigid to lock all into these props
            tools={[]} // TODO: Fix
            imageIds={imageIds}
            frameRate={frameRate}
            // We shouldn't need this?
            // Used in `ConnectedCornerstoneViewport`
            viewportIndex={viewportIndex}
            // height + width
            style={{ height: viewport.height, width: viewport.width }}
          />
          {childrenWithProps}
        </>
        // </LayoutPanelDropTarget>
      );
    });

    console.log('MAGIC: ', magic);

    return magic;
  }
}

export default ViewportLayout;
