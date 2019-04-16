import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConnectedToolbarSection from './ConnectedToolbarSection';

class ToolbarModule extends Component {
  render() {
    return (
      <div className="ToolbarModule">
        <ConnectedToolbarSection />
      </div>
    );
  }
}

export default ToolbarModule;
