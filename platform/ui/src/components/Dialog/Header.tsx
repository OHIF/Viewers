import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import Typography from '../Typography';
import Icon from '../Icon';

const CloseButton = ({ onClick }) => {
  return (
    <Icon
      data-cy="close-button"
      onClick={onClick}
      name="close"
      className="text-primary-active cursor-pointer"
    />
  );
};

CloseButton.propTypes = {
  onClick: PropTypes.func,
};

const Header = ({ title, noCloseButton = false, onClose }) => {
  const theme = 'bg-primary-dark';
  const flex = 'flex items-center justify-between';
  const padding = 'pb-[20px]';

  return (
    <div className={classNames(theme, flex, padding)}>
      <Typography
        variant="h6"
        color="primaryLight"
        className="!leading-[1.2]"
      >
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

export default Header;
