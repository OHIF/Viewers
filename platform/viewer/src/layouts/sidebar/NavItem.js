import React, { useState } from 'react';
import { NavLink as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';

const NavItem = ({
  className,
  href,
  open: openProp,
  title,
  onClick,
  onMobileClose,
  ...rest
}) => {
  const [open, setOpen] = useState(openProp);

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen);
  };

  const handleClick = e => {
    if (onClick) {
      e.preventDefault();
      onClick();
      onMobileClose(0);
    }
  };

  return (
    <div key={title}>
      <RouterLink exact to={href} onClick={handleClick}>
        <div
          style={{
            borderBottom: '1px solid #ffffff41',
            padding: '8px',
            marginBottom: '10px',
          }}
        >
          <h3
            style={{
              // color: 'grey',
              fontWeight: '700',
            }}
          >
            {title}
          </h3>
        </div>
      </RouterLink>
    </div>
  );
};

NavItem.propTypes = {
  className: PropTypes.string,
  href: PropTypes.string,
  open: PropTypes.bool,
  title: PropTypes.string.isRequired,
};

NavItem.defaultProps = {
  open: false,
};

export default NavItem;
