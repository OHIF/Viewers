import React, { useEffect, useCallback, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Icon from '../Icon';
import Typography from '../Typography';

const borderStyle = 'border-b last:border-b-0 border-secondary-main';

const Dropdown = ({
  id,
  children,
  showDropdownIcon,
  list,
  itemsClassName,
  titleClassName,
  showBorders,
  alignment,
  // By default the max characters per line is the longest title
  // if you wish to override this, you can pass in a number
  maxCharactersPerLine,
}) => {
  const [open, setOpen] = useState(false);
  const element = useRef(null);

  // choose the max characters per line based on the longest title
  const longestTitle = list.reduce((acc, item) => {
    if (item.title.length > acc) {
      return item.title.length;
    }
    return acc;
  }, 0);

  maxCharactersPerLine = maxCharactersPerLine ?? longestTitle;

  const DropdownItem = useCallback(({ id, title, icon, onClick }) => {
    // Split the title into lines of length maxCharactersPerLine
    const lines = [];
    for (let i = 0; i < title.length; i += maxCharactersPerLine) {
      lines.push(title.substring(i, i + maxCharactersPerLine));
    }

    return (
      <div
        key={title}
        className={classnames(
          'flex px-4 py-2 cursor-pointer items-center transition duration-300 hover:bg-secondary-main ',
          titleClassName,
          showBorders && borderStyle
        )}
        onClick={() => {
          setOpen(false);
          onClick();
        }}
        data-cy={id}
      >
        {!!icon && <Icon name={icon} className="w-4 mr-2 text-white" />}
        <div
          style={{
            whiteSpace: 'nowrap',
          }}
        >
          {title.length > maxCharactersPerLine && (
            <div>
              {lines.map((line, index) => (
                <Typography key={index} className={itemsClassName}>
                  {line}
                </Typography>
              ))}
            </div>
          )}
          {title.length <= maxCharactersPerLine && (
            <Typography className={itemsClassName}>{title}</Typography>
          )}
        </div>
      </div>
    );
  }, []);

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
          'absolute top-100 mt-2 z-10 transition duration-300 transform bg-primary-dark border border-secondary-main rounded shadow',
          {
            'right-0 origin-top-right': alignment === 'right',
            'left-0 origin-top-left': alignment === 'left',
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
  maxTextLength: 10,
  showBorders: true,
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
  alignment: PropTypes.oneOf(['left', 'right']),
  maxCharactersPerLine: PropTypes.number,
};

export default Dropdown;
