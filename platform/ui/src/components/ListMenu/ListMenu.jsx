import React, { useState } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

const ListMenu = ({ items = [], renderer, onClick }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const ListItem = (item) => {
    const flex = 'flex flex-row justify-between items-center';
    const theme = 'bg-indigo-dark';

    const onClickHandler = () => {
      if (item.onClick) item.onClick({ ...item });
      onClick({ ...args, item });
    };

    return (
      <div className={classnames(flex, theme, 'cursor-pointer')} onClick={onClickHandler}>
        {renderer && renderer(item)}
      </div>
    );
  };

  return (
    <div className="flex flex-col rounded-md bg-secondary-dark pt-2 pb-2">
      {items.map((item, index) => {
        const onClickHandler = () => {
          setSelectedIndex(index);
          item.onClick({ ...item, index });
        };

        return (
          <ListItem
            key={`ListItem${index}`}
            {...item}
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
  items: PropTypes.array.isRequired,
  renderer: PropTypes.func.isRequired,
  onClick: PropTypes.func
};

ListMenu.defaultProps = {
  onClick: noop
};

export default ListMenu;
