import './SidePanel.css';

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const SidePanel = ({ from, isOpen, children, width }) => {
  const fromSideClass = from === 'right' ? 'from-right' : 'from-left';

  const styles = width
    ? {
        maxWidth: width,
        marginRight: isOpen ? '0' : Number.parseInt(width) * -1,
      }
    : {};

  return (
    <section
      style={styles}
      className={classNames('sidepanel', fromSideClass, {
        'is-open': isOpen,
      })}
    >
      {children}
    </section>
  );
};

SidePanel.propTypes = {
  from: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  children: PropTypes.node,
  width: PropTypes.string,
};

export default SidePanel;
