import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const StepItem = ({ className, href, open: openProp, title, ...rest }) => {
  return (
    <div
      className={classNames('steps', {
        active: openProp,
      })}
    >
      <div className="title">{title}</div>
    </div>
  );
};

StepItem.propTypes = {
  className: PropTypes.string,
  href: PropTypes.string,
  open: PropTypes.bool,
  title: PropTypes.string.isRequired,
};

StepItem.defaultProps = {
  open: false,
};

export default StepItem;
