import styles from './SidePanel.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class SidePanel extends Component {
  static propTypes = {
    from: PropTypes.string.isRequired,
    isOpen: PropTypes.bool.isRequired,
    children: PropTypes.node,
  };

  constructor(props) {
    super(props);
    console.log(props);
    console.log(styles['sidebar-menu']);
  }

  render() {
    return (
      <section
        className={classNames(
          'sidebar-menu',
          styles[`from-${this.props.from}`],
          {
            'is-open': this.props.isOpen,
          }
        )}
      >
        {this.props.children}
      </section>
    );
  }
}

export default SidePanel;
