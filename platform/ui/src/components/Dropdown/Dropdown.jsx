import React, { useEffect, useCallback, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icon, Typography } from '../';

const Dropdown = ({ id, children, showDropdownIcon, list }) => {
  const [open, setOpen] = useState(false);
  const element = useRef(null);

  const DropdownItem = useCallback(({ id, title, icon, onClick }) => {
    return (
      <div
        key={title}
        className={classnames(
          'flex px-4 py-2 cursor-pointer items-center transition duration-300 hover:bg-secondary-main border-b last:border-b-0 border-secondary-main'
        )}
        onClick={() => {
          setOpen(false);
          onClick();
        }}
        data-cy={id}
      >
        {!!icon && <Icon name={icon} className="text-white w-4 mr-2" />}
        <Typography>{title}</Typography>
      </div>
    );
  }, []);

  DropdownItem.defaultProps = {
    icon: '',
  };

  DropdownItem.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    icon: PropTypes.string,
    onClick: PropTypes.func.isRequired,
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
          'absolute top-100 right-0 mt-2 z-10 origin-top-right transition duration-300 transform bg-primary-dark border border-secondary-main rounded shadow',
          {
            'scale-0': !open,
            'scale-100': open,
          }
        )}
        data-cy={`${id}-dropdown`}
      >
        {list.map((item, idx) => (
          <DropdownItem
            id={item.id}
            title={item.title}
            icon={item.icon}
            onClick={item.onClick}
            key={idx}
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
  id: PropTypes.string,
  children: PropTypes.node.isRequired,
  showDropdownIcon: PropTypes.bool,
  /** Items to render in the select's drop down */
  list: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func.isRequired,
    })
  ).isRequired,
};

export default Dropdown;
