import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import Button, { ButtonEnums } from '../Button';

const Footer = ({ actions = [], className, onSubmit = () => {}, value }) => {
  const flex = 'flex items-center justify-end';
  const padding = 'pt-[20px]';

  return (
    <div className={classNames(flex, padding, className)}>
      {actions?.map((action, index) => {
        const isFirst = index === 0;

        const onClickHandler = event => onSubmit({ action, value, event });

        return (
          <Button
            key={index}
            name={action.text}
            className={classNames({ 'ml-2': !isFirst }, action.classes)}
            type={action.type}
            onClick={onClickHandler}
          >
            {action.text}
          </Button>
        );
      })}
    </div>
  );
};

const noop = () => {};

Footer.propTypes = {
  className: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      value: PropTypes.any,
      type: PropTypes.oneOf([ButtonEnums.type.primary, ButtonEnums.type.secondary]).isRequired,
      classes: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
};

export default Footer;
