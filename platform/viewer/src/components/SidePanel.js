import './SidePanel.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class SidePanel extends Component {
  static propTypes = {
    from: PropTypes.string.isRequired,
    isOpen: PropTypes.bool.isRequired,
    children: PropTypes.node,
    width: PropTypes.string,
  };

  render() {
    const fromSideClass =
      this.props.from === 'right' ? 'from-right' : 'from-left';

    const styles = this.props.width
      ? {
          maxWidth: this.props.width,
          marginRight: this.props.isOpen
            ? '0'
            : Number.parseInt(this.props.width) * -1,
        }
      : {};

    return (
      <section
        style={styles}
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
