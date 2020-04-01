import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const NavBar = ({ className, children }) => {
  return (
    <div
      className={classnames(
        'flex flex-row items-center bg-custom-navy px-3 py-1 sticky top-0 z-10 border-b-4 border-black',
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
};

export default NavBar;
