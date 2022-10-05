import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Icon } from '../../../../ui/src/elements/Icon';

const StepItem = ({ className, href, open, title, icon, ...rest }) => {
  return (
    <li
      className={classNames('stepper-step ', {
        'stepper-active': open,
      })}
    >
      <div className="stepper-head">
        <div
          className=""
          style={{
            display: 'flex',
            height: '100%',
            borderBottom: open ? '1px solid yellow' : null,
            alignItems: 'center',
          }}
        >
          <span
            className="stepper-head-icon"
            style={
              {
                // margin: '1.5rem 0.5rem 1.5rem 0',
              }
            }
          >
            <Icon name={icon} style={{ fontSize: '15px' }} />
          </span>
          <span className="stepper-head-text">{title}</span>
        </div>
      </div>
    </li>

    // <div
    //   className={classNames('steps', {
    //     active: openProp,
    //   })}
    // >
    //   <div className="title">{title}</div>
    // </div>
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
