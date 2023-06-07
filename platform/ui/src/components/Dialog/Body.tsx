import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import Typography from '../Typography';

const Body = ({ text, className }) => {
  const theme = 'bg-primary-dark';
  return (
    <div className={classNames('relative flex-auto', theme, className)}>
      <Typography
        variant="inherit"
        color="initial"
        className="text-[14px] !leading-[1.2]"
      >
        {text}
      </Typography>
    </div>
  );
};

Body.propTypes = {
  text: PropTypes.string,
  className: PropTypes.string,
};

export default Body;
