import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { Typography, Icon } from '..';

const CloseButton = ({ onClick }) => {
  return (
    <Icon
      data-cy="close-button"
      onClick={onClick}
      name="close"
      className="cursor-pointer text-primary-active w-6 h-6"
    />
  );
};

CloseButton.propTypes = {
  onClick: PropTypes.func,
};

const Header = ({ title, noCloseButton, onClose }) => {
  const theme = 'bg-secondary-main';
  const flex = 'flex items-center justify-between';
  const border = 'border-b-2 border-solid border-black rounded-t';
  const spacing = 'p-4';

  return (
    <div className={classNames(theme, flex, border, spacing)}>
      <Typography variant="h6" className="text-primary-active">
        {title}
      </Typography>
      {!noCloseButton && <CloseButton onClick={onClose} />}
    </div>
  );
};

Header.propTypes = {
  className: PropTypes.string,
  title: PropTypes.string,
  noCloseButton: PropTypes.bool,
  onClose: PropTypes.func,
};

Header.defaultProps = {
  noCloseButton: false
};

export default Header;
