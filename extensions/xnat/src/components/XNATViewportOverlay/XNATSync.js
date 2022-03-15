import React from 'react';
import cornerstone from 'cornerstone-core';
import stackSynchronizer from '../../utils/StackSynchronizer/StackSynchronizer';

import './XNATViewportOverlay.css';


class XNATSync extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isChecked: false,
    };

    this.onToggleClick = this.onToggleClick.bind(this);
  }

  onToggleClick({ target }) {
    let viewportIndex = window.store.getState().viewports.activeViewportIndex;
    const element = cornerstone.getEnabledElements()[viewportIndex].element;
    if (target.checked) {
      stackSynchronizer.add(element);
    } else {
      stackSynchronizer.remove(element);
    }

    this.setState({ isChecked: target.checked });
  }

  render() {
    const { isChecked } = this.state;

    return (
      <div>
        Sync
        <input
          className="syncCheckbox"
          type="checkbox"
          name="smooth"
          checked={isChecked}
          onChange={this.onToggleClick}
        />
      </div>
    );
  }
}

export default XNATSync;
