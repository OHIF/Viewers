import React, { Component } from 'react';
import OHIFCornerstoneViewport from './OHIFCornerstoneViewport.js';
import ToolbarModule from './ToolbarModule.js';

/**
 * Pass in 'children' to a React component. The purpose of this is to
 * allow end users of this extension to pass in components which will
 * be rendered on top of the base components.
 *
 * @param WrappedComponent
 * @param children
 * @return {function(*): *}
 */
function componentWithProps(WrappedComponent, children, customProps) {
  return function(props) {
    const extraProps = {
      customProps
    };
    if (children.viewport) {
      extraProps.children = children.viewport;
    }

    const mergedProps = Object.assign({}, props, extraProps);

    return <WrappedComponent {...mergedProps} />;
  };
}

// Note: If you are authoring extensions which use stateful libraries (e.g. cornerstone-core, react-redux) as peerDependencies and are also duplicated at the application level, try using 'yalc' to link it to the application, rather than yarn link. This can help fix 'module not found' issues.
// https://github.com/whitecolor/yalc

export default class OHIFCornerstoneExtension {
  constructor(props) {
    const { children = {}, customProps = {} } = props;
    this.children = children;
    this.customProps = customProps;
  }

  /**
   * Extension ID is a unique id, might be used for namespacing extension specific redux actions/reducers (?)
   */
  getExtensionId() {
    return 'cornerstone';
  }

  getViewportModule() {
    return componentWithProps(
      OHIFCornerstoneViewport,
      this.children,
      this.customProps
    );
  }

  getSopClassHandler() {
    return null;
  }

  getPanelModule() {
    return null;
  }

  getToolbarModule() {
    return ToolbarModule;
  }
}
