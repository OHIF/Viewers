import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const WindowLevelMenuItem = ({ title, subtitle, isActive, index }) => (
  <>
    <div className={classNames(
      'flex flex-row items-center p-3 h-8 w-full hover:bg-primary-dark',
      isActive && 'bg-primary-dark'
    )}
    >
      <span className='text-white mr-2 text-base'>
        {title}
      </span>
      <span className='flex-1 text-aqua-pale font-thin text-sm'>
        {subtitle}
      </span>
      <span className='text-primary-active ml-5 text-sm'>{index + 1}</span>
    </div>
  </>
);

WindowLevelMenuItem.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
};

export default WindowLevelMenuItem;
