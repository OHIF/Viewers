import React, { useState } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

const ListMenu = ({ options = [], renderer, onClick }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const ListItem = (props) => {
    const flex = 'flex flex-row justify-between items-center';
    const theme = 'bg-indigo-dark';
    const hover = 'hover:bg-primary-dark';
    const spacing = 'p-3 h-8';

    return (
      <div
        className={classnames(
          flex,
          theme,
          spacing,
          'cursor-pointer',
          !props.isActive && hover,
          props.isActive && 'bg-primary-light',
        )}
        onClick={props.onClick}
      >
        {renderer && renderer(props)}
      </div>
    );
  };

  return (
    <div className="flex flex-col rounded-md bg-secondary-dark pt-2 pb-2">
      {options.map((option, index) => {
        const onClickHandler = () => {
          setSelectedIndex(index);
          onClick({ ...option, index });
        };

        return (
          <ListItem
            key={`ListItem${index}`}
            {...option}
            index={index}
            isActive={selectedIndex === index}
            onClick={onClickHandler}
          />
        );
      })}
    </div>
  );
};

const noop = () => { };

ListMenu.propTypes = {
  options: PropTypes.array.isRequired,
  renderer: PropTypes.func.isRequired,
  onClick: PropTypes.func
};

ListMenu.defaultProps = {
  onClick: noop
};

export default ListMenu;
