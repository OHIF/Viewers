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

  const DropdownItem = useCallback(
    ({ id, title, icon, onClick }) => {
      // Split the title into lines of length maxCharactersPerLine
      const lines = [];
      for (let i = 0; i < title.length; i += maxCharactersPerLine) {
        lines.push(title.substring(i, i + maxCharactersPerLine));
      }

      return (
        <div
          key={title}
          className={classnames(
            'hover:bg-secondary-main flex cursor-pointer items-center px-4 py-2 transition duration-300 ',
            titleClassName,
            showBorders && borderStyle
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
          <div
            style={{
              whiteSpace: 'nowrap',
            }}
          >
            {title.length > maxCharactersPerLine && (
              <div>
                {lines.map((line, index) => (
                  <Typography
                    key={index}
                    className={itemsClassName}
                  >
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
    },
    [maxCharactersPerLine, itemsClassName, titleClassName, showBorders]
  );

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
          'top-100 border-secondary-main absolute z-10 mt-2 transform rounded border bg-black shadow transition duration-300',
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
  maxCharactersPerLine: 20,
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
  showBorders: PropTypes.bool,
};

export default Dropdown;
