import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const stickyClasses = 'sticky top-0 z-20';

const NavBar = ({ className, children, isSticky }) => {
  return (
    <div
      className={classnames(
        'flex flex-row items-center bg-secondary-dark px-3 py-1 min-h-16 border-b-4 border-black',
        isSticky && stickyClasses,
        className
      )}
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
