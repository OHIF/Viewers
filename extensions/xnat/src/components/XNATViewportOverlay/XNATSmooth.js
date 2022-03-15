import React from 'react';
import cornerstone from 'cornerstone-core';
import PropTypes from 'prop-types';
import { commandsManager } from '@ohif/viewer/src/App';

import './XNATViewportOverlay.css';

class XNATSmooth extends React.PureComponent {
  static propTypes = {
    viewportIndex: PropTypes.number,
  };

  constructor(props) {
    super(props);

    this.state = {
      smooth: true,
    };

    this.onToggleClick = this.onToggleClick.bind(this);
  }

  onToggleClick({ target }) {
    const { smooth } = this.state;

    // let viewportIndex = window.store.getState().viewports.activeViewportIndex;
    const dom = commandsManager.runCommand('getActiveViewportEnabledElement');
    const enabledElement = cornerstone.getEnabledElement(dom);
    enabledElement.viewport.pixelReplication = smooth;
    cornerstone.updateImage(enabledElement.element);

    this.setState({ smooth: !smooth });
  }

  render() {
    const { smooth } = this.state;

    return (
      <div>
        Smooth
        <input
          className="smoothCheckbox"
          type="checkbox"
          name="smooth"
          tabIndex="-1"
          checked={smooth}
          onChange={this.onToggleClick}
        />
      </div>
    );
  }
}

export default XNATSmooth;
