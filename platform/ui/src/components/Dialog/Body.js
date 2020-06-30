import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { Typography } from '../../components';

const Body = ({ text, className }) => {
  return (
    <div className={classNames('relative flex-auto', className)}>
      <div className="p-6">
        <Typography variant="body" className="my-4 leading-relaxed">
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
