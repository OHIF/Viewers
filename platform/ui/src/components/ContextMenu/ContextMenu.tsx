import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import CustomizableRenderComponent from '../../utils/CustomizableRenderComponent';

const ContextMenu = ({ items, ...props }) => {
  const contextMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!contextMenuRef?.current) {
      return;
    }

    const contextMenu = contextMenuRef.current;

    const boundingClientRect = contextMenu.getBoundingClientRect();
    if (boundingClientRect.bottom + boundingClientRect.height > window.innerHeight) {
      props.defaultPosition.y = props.defaultPosition.y - boundingClientRect.height;
    }
    if (boundingClientRect.right + boundingClientRect.width > window.innerWidth) {
      props.defaultPosition.x = props.defaultPosition.x - boundingClientRect.width;
    }
  }, [props.defaultPosition]);

  if (!items) {
    return null;
  }

  return (
    <div
      ref={contextMenuRef}
      data-cy="context-menu"
      className={
        'bg-secondary-dark relative z-50 block w-48 rounded ' + props?.contentProps?.className
      }
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, index) => {
        return CustomizableRenderComponent({
          customizationId: 'ui.ContextMenuItem',
          item,
          index,
          ...props,
        });
      })}
    </div>
  );
};

ContextMenu.propTypes = {
  defaultPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      action: PropTypes.func.isRequired,
    })
  ),
};

export default ContextMenu;
