import React, { useState } from 'react';
import PropTypes from 'prop-types';

import Sidebar from './sidebar';
import Header from './header';
import { Footer } from './footer';

const DashboardLayout = ({ children }) => {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      <Header onMobileNavOpen={() => setMobileNavOpen(true)} />
      <Sidebar
        onMobileClose={() => setMobileNavOpen(false)}
        onMobileNavOpen={() => setMobileNavOpen(true)}
        openMobile={isMobileNavOpen}
      />

      <div className="portal__wraper">
        <div>{children}</div>
      </div>
      <Footer />
    </div>
  );
};

DashboardLayout.propTypes = {
  children: PropTypes.node,
};

export default DashboardLayout;
