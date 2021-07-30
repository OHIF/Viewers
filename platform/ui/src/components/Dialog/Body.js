import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { Typography } from '..';

const Body = ({ text, className }) => {
  const theme = 'bg-primary-dark';
  return (
    <div className={px(classnames("('relative flex-auto', theme, className)"))}>
      <div className={px('p-6')}>
        <Typography variant="body" className={px('my-4 leading-relaxed')}>
          {text}
        </Typography>
      </div>
    </div>
  );
};

Body.propTypes = {
  text: PropTypes.string,
  className: PropTypes.string,
};

export default Body;
