import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import { stackSynchronizer } from '../../utils/synchronizers';

import './XNATViewportOverlay.css';

class XNATSync extends React.PureComponent {
  static propTypes = {
    viewportIndex: PropTypes.number.isRequired,
  };

  constructor(props) {
    super(props);

    const enabledElement = cornerstone.getEnabledElements()[
      props.viewportIndex
    ];
    const isSyncEnabled = stackSynchronizer.isSyncEnabled(
      enabledElement.element
    );

    this.state = {
      isChecked: isSyncEnabled,
    };

    this.onToggleClick = this.onToggleClick.bind(this);
  }

  onToggleClick(evt) {
    const target = evt.target;
    if (evt.nativeEvent && evt.nativeEvent.stopImmediatePropagation) {
      evt.nativeEvent.stopImmediatePropagation();
    }

    const element = cornerstone.getEnabledElements()[this.props.viewportIndex]
      .element;
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
          name="sync"
          tabIndex="-1"
          checked={isChecked}
          onChange={this.onToggleClick}
        />
      </div>
    );
  }
}

export default XNATSync;
