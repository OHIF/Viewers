import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { Button } from '..';

const Footer = ({ actions, className, onSubmit, value }) => {
  const flex = 'flex items-center justify-end';
  const border = 'border-t-2 border-solid border-black rounded-b';
  const spacing = 'p-6';
  const theme = 'bg-primary-dark';

  return (
    <div className={classNames(flex, border, spacing, theme, className)}>
      {actions.map((action, index) => {
        const isFirst = index === 0;
        const isPrimary = action.type === 'primary';

        const onClickHandler = event => onSubmit({ action, value, event });

        return (
          <Button
            key={index}
            className={classNames({ 'ml-2': !isFirst }, action.classes)}
            color={isPrimary ? 'primary' : undefined}
            onClick={onClickHandler}
            style={{ transition: 'all .15s ease', height: 34 }}
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
      type: PropTypes.oneOf(['primary', 'secondary', 'cancel']).isRequired,
      classes: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
};

Footer.defaultProps = {
  onSubmit: noop,
  actions: [],
};

export default Footer;
