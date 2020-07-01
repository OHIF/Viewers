import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { Typography, Icon } from '..';

const CloseButton = ({ onClick }) => {
  const theme = 'bg-transparent fill-primary-active';
  const outline = 'outline-none focus:outline-none';
  const flex = 'flex h-full';

  return (
    <button className={classNames(flex, theme, 'border-0')} onClick={onClick}>
      <Icon name="close" className={classNames(theme, outline, 'h-3 w-3')} />
    </button>
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
