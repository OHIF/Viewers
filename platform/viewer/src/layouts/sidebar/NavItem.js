import React, { useState } from "react";
import { NavLink as RouterLink } from "react-router-dom";
import PropTypes from "prop-types";

const NavItem = ({ className, href, open: openProp, title, ...rest }) => {
  const [open, setOpen] = useState(openProp);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  return (
    <div key={title}>
      <RouterLink exact to={href}>
        <div
          style={{
            border: "2px solid #ccc",
            padding: "8px",
            marginBottom: "10px",
            borderRadius: "5px",
          }}
        >
          <h2
            style={{
              color: "grey",
            }}
          >
            {title}
          </h2>
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
