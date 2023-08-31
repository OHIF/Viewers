import React, { useEffect, useCallback, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Icon from '../Icon';
import Typography from '../Typography';

const Dropdown = ({ id, children, showDropdownIcon, list, titleClassName }) => {
  const [open, setOpen] = useState(false);
  const element = useRef(null);

  const DropdownItem = useCallback(({ id, title, icon, onClick }) => {
    return (
      <div
        key={title}
        className={classnames(
          'hover:bg-secondary-main border-secondary-main flex cursor-pointer items-center border-b px-4 py-2 transition duration-300 last:border-b-0'
        )}
        onClick={() => {
          setOpen(false);
          onClick();
        }}
        data-cy={id}
      >
        {!!icon && (
          <Icon
            name={icon}
            className="mr-2 w-4 text-white"
          />
        )}
        <Typography className={titleClassName}>{title}</Typography>
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
      <div className="flex items-center">
        {children}
        {showDropdownIcon && (
          <Icon
            name="chevron-down"
            className="ml-1"
          />
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
          'top-100 bg-primary-dark border-secondary-main absolute right-0 z-10 mt-2 origin-top-right transform rounded border shadow transition duration-300',
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
    <div
      data-cy="dropdown"
      ref={element}
      className="relative"
    >
      <div
        className="flex cursor-pointer items-center"
        onClick={toggleList}
      >
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
  titleClassName: PropTypes.string,
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
