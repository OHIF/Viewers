import React from 'react';
import PropTypes from 'prop-types';
// import { Helmet } from "react-helmet-async";

import { forwardRef } from 'react';
// @mui

// ----------------------------------------------------------------------

const Page = forwardRef(({ children, title = '' }, ref) => (
  <>
    {/* <Helmet>
      <title>{`${title}`}</title>
      {meta}
    </Helmet> */}

    <div ref={ref} className="page-container">
      {children}
    </div>
  </>
));

Page.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  meta: PropTypes.node,
};

export default Page;
