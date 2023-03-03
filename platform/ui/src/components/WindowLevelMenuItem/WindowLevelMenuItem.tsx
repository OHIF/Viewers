import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const WindowLevelMenuItem = ({ title, subtitle, isSelected, index }) => (
  <>
    <div className={classNames(
      'flex flex-row items-center p-3 h-8 w-full hover:bg-primary-dark',
      isSelected && 'bg-primary-dark'
    )}
    >
      <span className='text-common-bright mr-2 text-base whitespace-nowrap'>
        {title}
      </span>
      <span className='flex-1 text-aqua-pale font-light text-sm whitespace-nowrap'>
        {subtitle}
      </span>
      <span className='text-primary-active ml-5 text-sm whitespace-nowrap'>{index + 1}</span>
    </div>
  </>
);

WindowLevelMenuItem.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
};

export default WindowLevelMenuItem;
