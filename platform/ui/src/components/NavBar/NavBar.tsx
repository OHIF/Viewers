import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const stickyClasses = 'sticky top-0';
const notStickyClasses = 'relative';

const NavBar = ({ className, children, isSticky }) => {
  return (
    <div
      className={classnames(
        'flex flex-row items-center bg-secondary-dark px-1 border-b-4 border-black z-20',
        isSticky && stickyClasses,
        !isSticky && notStickyClasses,
        className
      )}
      style={{ paddingTop: '4px', paddingBottom: '4px', minHeight: '52px' }}
    >
      {children}
    </div>
  );
};

NavBar.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  isSticky: PropTypes.bool,
};

export default NavBar;
