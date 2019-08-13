import './LayoutManager.css';

import React, { Component } from 'react';

import LayoutPanelDropTarget from './LayoutPanelDropTarget.js';
import PropTypes from 'prop-types';

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
    supportsDragAndDrop: true,
    availablePlugins: {
      defaultViewportPlugin,
    },
    defaultPlugin: 'defaultViewportPlugin',
  };

  static propTypes = {
    viewportData: PropTypes.array.isRequired,
    supportsDragAndDrop: PropTypes.bool.isRequired,
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

  getPluginComponent = plugin => {
    const pluginComponent = this.props.availablePlugins[
      plugin || this.props.defaultPlugin
    ];

    if (!pluginComponent) {
      throw new Error(
        `No Viewport Plugin available for plugin ${plugin}. Available plugins: ${JSON.stringify(
          this.props.availablePlugins
        )}`
      );
    }

    return pluginComponent;
  };

  getChildComponent(plugin, data, viewportIndex, children) {
    if (data.displaySet) {
      const PluginComponent = this.getPluginComponent(plugin);

      return (
        <PluginComponent
          viewportData={data}
          viewportIndex={viewportIndex}
          children={[children]}
        />
      );
    }

    return <EmptyViewport />;
  }

  getContent(childComponent, supportsDragAndDrop, viewportIndex) {
    if (supportsDragAndDrop) {
      return (
        <LayoutPanelDropTarget
          onDrop={this.onDrop}
          viewportIndex={viewportIndex}
        >
          {childComponent}
        </LayoutPanelDropTarget>
      );
    }

    return <div className="LayoutPanel">{childComponent}</div>;
  }

  render() {
    if (!this.props.viewportData.length) {
      return '';
    }

    const { supportsDragAndDrop, studies, viewportData } = this.props;
    const viewports = this.props.layout.viewports;
    const viewportElements = viewports.map((layout, viewportIndex) => {
      const displaySet = viewportData[viewportIndex];
      const data = {
        displaySet,
        studies,
      };

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

      const childComponent = this.getChildComponent(
        plugin,
        data,
        viewportIndex,
        this.props.children
      );
      const content = this.getContent(
        childComponent,
        supportsDragAndDrop,
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
