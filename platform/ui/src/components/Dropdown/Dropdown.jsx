import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icon, Typography } from '@ohif/ui';

const Dropdown = ({ children, showDropdownIcon, list }) => {
  const [open, setOpen] = useState(false);
  const element = useRef(null);

  const DropdownItem = ({ title, icon, onClick, index }) => {
    const itemsAmount = list.length;
    const isLastItem = itemsAmount === index + 1;

    return (
      <div
        key={title}
        className={classnames(
          'flex px-4 py-2 cursor-pointer items-center transition duration-300 hover:bg-secondary-main',
          {
            'border-b border-secondary-main': !isLastItem,
          }
        )}
        onClick={() => {
          setOpen(false);
          onClick();
        }}
      >
        {!!icon && <Icon name={icon} className="text-white w-4 mr-2" />}
        <Typography>{title}</Typography>
      </div>
    );
  };

  DropdownItem.defaultProps = {
    icon: '',
    onClick: () => {},
  };

  DropdownItem.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.string,
    onClick: PropTypes.func,
    index: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  };

  const renderTitleElement = () => {
    return (
      <div className="flex text-white items-center">
        {children}
        {showDropdownIcon && (
          <Icon name="chevron-down" className="text-white ml-1" />
        )}
      </div>
    );
  };

  const toggleList = () => {
    setOpen(s => !s);
  };

  const handleClick = e => {
    if (element.current && !element.current.contains(e.target)) {
      setOpen(false);
    }
  };

  const renderList = () => {
    return (
      <div
        className={classnames(
          'absolute origin-top-right transition duration-300 transform top-100 right-0 mt-2 z-10 bg-primary-dark border border-secondary-main rounded shadow',
          {
            'scale-0': !open,
            'scale-100': open,
          }
        )}
      >
        {list.map((item, idx) => (
          <DropdownItem
            title={item.title}
            icon={item.icon}
            onClick={item.onClick}
            key={idx}
            index={idx}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    document.addEventListener('click', handleClick);

    if (!open) {
      document.removeEventListener('click', handleClick);
    }
  }, [open]);

  return (
    <div data-cy="dropdown" ref={element} className="relative">
      <div className="cursor-pointer flex items-center" onClick={toggleList}>
        {renderTitleElement()}
      </div>

      {renderList()}
    </div>
  );
};

Dropdown.defaultProps = {
  showDropdownIcon: true,
};

Dropdown.propTypes = {
  children: PropTypes.node.isRequired,
  showDropdownIcon: PropTypes.bool,
  /** Items to render in the select's drop down */
  list: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func,
    })
  ),
};

export default Dropdown;
