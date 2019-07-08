import React, { Component } from 'react';

import { Icon } from './../elements/Icon';
import PropTypes from 'prop-types';

export default class PlayClipButton extends Component {
  static propTypes = {
    isPlaying: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    isPlaying: false,
  };

  render() {
    const iconName = this.props.isPlaying ? 'stop' : 'play';

    return (
      <div className="btn-group">
        <button
          id="playClip"
          type="button"
          className="imageViewerCommand btn btn-sm btn-default"
          data-container="body"
          data-toggle="tooltip"
          data-placement="bottom"
          title="Play/Stop Clip"
        >
          <Icon name={iconName} />
        </button>
        <button
          id="toggleCineDialog"
          type="button"
          className="imageViewerCommand btn btn-sm btn-default"
          data-container="body"
          data-toggle="tooltip"
          data-placement="bottom"
          title="Toggle CINE Dialog"
        >
          <Icon name="youtube" />
        </button>
      </div>
    );
  }
}
