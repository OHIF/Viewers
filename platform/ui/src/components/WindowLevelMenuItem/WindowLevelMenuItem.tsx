import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const WindowLevelMenuItem = ({ title, subtitle, isSelected, index }) => (
  <>
    <div
      className={classNames(
        'hover:bg-primary-dark flex h-8 w-full flex-row items-center p-3',
        isSelected && 'bg-primary-dark'
      )}
    >
      <span className="text-common-bright mr-2 whitespace-nowrap text-base">{title}</span>
      <span className="text-aqua-pale flex-1 whitespace-nowrap text-sm font-light">{subtitle}</span>
      <span className="text-primary-active ml-5 whitespace-nowrap text-sm">{index + 1}</span>
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
