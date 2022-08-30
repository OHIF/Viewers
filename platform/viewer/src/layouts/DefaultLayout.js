import React, { useState } from "react";
import PropTypes from "prop-types";

import Sidebar from "./sidebar";
import Header from "./header";
import { Footer } from "./footer";

const DefaultLayout = ({ children }) => {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <Sidebar
        onMobileClose={() => setMobileNavOpen(false)}
        onMobileNavOpen={() => setMobileNavOpen(true)}
        openMobile={isMobileNavOpen}
      />

      <div className="portal__wraper">
        <div>{children}</div>
      </div>
    </div>
  );
};

DefaultLayout.propTypes = {
  children: PropTypes.node,
};

export default DefaultLayout;
