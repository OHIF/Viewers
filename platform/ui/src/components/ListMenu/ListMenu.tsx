import React, { useState } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

const flex = 'flex flex-row justify-between items-center';
const theme = 'bg-indigo-dark text-white';

const ListMenu = ({ items = [], renderer, onClick = () => {} }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const ListItem = ({ item, index, isSelected }) => {
    const onClickHandler = () => {
      setSelectedIndex(index);
      onClick({ item, selectedIndex: index });
      item.onClick?.({ ...item, index, isSelected });
    };

    return (
      <div
        className={classnames(flex, theme, {
          'cursor-pointer': !item.disabled,
          'ohif-disabled': item.disabled,
        })}
        onClick={onClickHandler}
        data-cy={item.id}
      >
        {renderer && renderer({ ...item, index, isSelected })}
      </div>
    );
  };

  return (
    <div
      className="bg-secondary-dark flex flex-col gap-[4px] overflow-auto rounded-md p-1"
      style={{ maxHeight: 'calc(100vh - 5rem)' }}
    >
      {items.map((item, index) => {
        return (
          <ListItem
            key={`ListItem${index}`}
            index={index}
            isSelected={selectedIndex === index}
            item={item}
          />
        );
      })}
    </div>
  );
};

ListMenu.propTypes = {
  items: PropTypes.array.isRequired,
  renderer: PropTypes.func.isRequired,
  onClick: PropTypes.func,
};

export default ListMenu;
