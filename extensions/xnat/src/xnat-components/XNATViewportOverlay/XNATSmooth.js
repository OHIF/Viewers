import React from 'react';
import cornerstone from 'cornerstone-core';
import PropTypes from 'prop-types';

import './XNATViewportOverlay.css';

class XNATSmooth extends React.PureComponent {
  static propTypes = {
    viewportIndex: PropTypes.number.isRequired,
  };

  constructor(props) {
    super(props);

    const enabledElement = cornerstone.getEnabledElements()[
      props.viewportIndex
    ];

    this.state = {
      pixelReplication: enabledElement.viewport.pixelReplication,
    };

    this.unmounted = false;

    this.onToggleClick = this.onToggleClick.bind(this);
    this.getPixelReplication = this.getPixelReplication.bind(this);
  }

  getPixelReplication() {
    if (!this.unmounted) {
      const enabledElement = cornerstone.getEnabledElements()[
        this.props.viewportIndex
      ];

      if (
        this.state.pixelReplication !== enabledElement.viewport.pixelReplication
      ) {
        this.setState({
          pixelReplication: enabledElement.viewport.pixelReplication,
        });
      }
    }
  }

  componentDidMount() {
    setTimeout(() => {
      this.getPixelReplication();
    }, 800);
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  onToggleClick(evt) {
    evt.stopPropagation();
    if (evt.nativeEvent && evt.nativeEvent.stopImmediatePropagation) {
      evt.nativeEvent.stopImmediatePropagation();
    }
    // evt.stopPropagation();
    const { pixelReplication } = this.state;

    // let viewportIndex = window.store.getState().viewports.activeViewportIndex;
    const enabledElement = cornerstone.getEnabledElements()[
      this.props.viewportIndex
    ];
    enabledElement.viewport.pixelReplication = !pixelReplication;
    cornerstone.updateImage(enabledElement.element);

    this.setState({ pixelReplication: !pixelReplication });
  }

  render() {
    const { pixelReplication } = this.state;

    return (
      <div>
        Smooth
        <input
          className="smoothCheckbox"
          type="checkbox"
          name="smooth"
          tabIndex="-1"
          checked={!pixelReplication}
          onChange={this.onToggleClick}
        />
      </div>
    );
  }
}

export default XNATSmooth;
