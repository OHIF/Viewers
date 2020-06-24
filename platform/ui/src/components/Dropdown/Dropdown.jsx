import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icon, Typography } from '@ohif/ui';

const Dropdown = ({ titleElement, title, list }) => {
  const [open, setOpen] = useState(false);
  const element = useRef(null);

  const renderTitleElement = () => {
    if (titleElement) {
      return titleElement;
    }

    return (
      <div className="flex">
        <Typography>{title}</Typography>
        <Icon name="chevron-down" className="text-white ml-1" />
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
    const itemsAmount = list.length;

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
        {list.map(
          (
            {
              title: itemTitle,
              icon: itemIcon,
              onClick: itemOnClick = () => {},
            },
            idx
          ) => (
            <div
              key={itemTitle}
              className={classnames(
                'flex px-4 py-2 cursor-pointer items-center transition duration-300 hover:bg-secondary-main',
                {
                  'border-b border-secondary-main': itemsAmount !== idx + 1,
                }
              )}
              onClick={() => {
                setOpen(false);
                itemOnClick();
              }}
            >
              {!!itemIcon && (
                <Icon name={itemIcon} className="text-white w-4 mr-2" />
              )}
              <Typography>{itemTitle}</Typography>
            </div>
          )
        )}
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

Dropdown.propTypes = {
  titleElement: PropTypes.node,
  title: PropTypes.string,
  /** Items to render in the select's drop down */
  list: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func,
      link: PropTypes.string,
    })
  ),
};

export default Dropdown;
