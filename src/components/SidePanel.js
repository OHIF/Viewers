import './SidePanel.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class SidePanel extends Component {
  static propTypes = {
    from: PropTypes.string.isRequired,
    isOpen: PropTypes.bool.isRequired,
    children: PropTypes.node,
  };

  render() {
    const fromSideClass =
      this.props.from === 'right' ? 'from-right' : 'from-left';

    return (
      <section
        className={classNames('sidepanel', fromSideClass, {
          'is-open': this.props.isOpen,
        })}
      >
        {this.props.children}
      </section>
    );
  }
}

export default SidePanel;
