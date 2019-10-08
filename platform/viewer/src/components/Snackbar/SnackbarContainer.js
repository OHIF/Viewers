import React from 'react';
import SnackbarItem from './SnackbarItem';
import './Snackbar.css';
import { useSnackbarContext } from '../../context/SnackbarContext';

const SnackbarContainer = () => {
  const { snackbarItems, hide } = useSnackbarContext();

  const renderItem = item => {
    if (!item.title && !item.message && item.visible) {
      console.warn(
        'Snackbar cannot be rendered without required parameters: title | message'
      );

      return null;
    }

    return <SnackbarItem key={item.itemId} options={item} onClose={hide} />;
  };

  if (!snackbarItems) {
    return null;
  }

  const renderItems = () => {
    const items = {
      topLeft: [],
      topCenter: [],
      topRight: [],
      bottomLeft: [],
      bottomCenter: [],
      bottomRight: [],
    };

    snackbarItems.map(item => {
      items[item.position].push(item);
    });

    return (
      <div>
        {Object.keys(items).map(pos => {
          if (!items[pos].length) {
            return null;
          }

          return (
            <div key={pos} className={`sbContainer sb-${pos}`}>
              {items[pos].map(item => (
                <div key={item.id}>{renderItem(item)}</div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return <>{renderItems()}</>;
};

export default SnackbarContainer;
