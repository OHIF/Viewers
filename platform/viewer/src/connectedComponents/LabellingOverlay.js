import React, { Component } from 'react';
import PropTypes from 'prop-types';
import LabellingManager from '../components/Labelling/LabellingManager';

class LabellingOverlay extends Component {
  static propTypes = {
    visible: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    visible: false,
  };

  render() {
    if (!this.props.visible) {
      return null;
    }

    return <LabellingManager {...this.props} />;
  }
}

export default LabellingOverlay;
