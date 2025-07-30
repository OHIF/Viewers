import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useDrop } from 'react-dnd';

/**
 * The "pane" that encloses a Cornerstone or other type of Viewport. This handles
 * drag-and-drop for display sets, activation on click, etc.
 */
function ViewportPane({
  children,
  className,
  customStyle,
  isActive,
  onDrop,
  onDoubleClick,
  onInteraction = () => {},
  acceptDropsFor,
}) {
  let dropElement = null;

  const [{ isHovered, isHighlighted }, drop] = useDrop({
    accept: acceptDropsFor,
    drop: (droppedItem, monitor) => {
      if (monitor.canDrop() && monitor.isOver() && onDrop) {
        onInteraction();
        onDrop(droppedItem);
      }
    },
    collect: monitor => ({
      isHighlighted: monitor.canDrop(),
      isHovered: monitor.isOver(),
    }),
  });

  const focus = () => {
    if (dropElement) {
      dropElement.focus();
    }
  };

  const onInteractionHandler = event => {
    focus();
    onInteraction(event);
  };

  const refHandler = element => {
    drop(element);
    dropElement = element;
  };

  return (
    <div
      ref={refHandler}
      onPointerDown={onInteractionHandler}
      onDoubleClick={onDoubleClick}
      onClick={onInteractionHandler}
      onScroll={onInteractionHandler}
      onWheel={onInteractionHandler}
      className={classNames(
        'group/pane relative h-full w-full overflow-hidden transition duration-300',
        className
      )}
      style={customStyle}
    >
      <div className={classNames('relative h-full w-full', className)}>{children}</div>

      {/* Border overlay */}
      <div
        className={classNames('pointer-events-none absolute inset-0 rounded-md border', {
          'border-highlight': isActive,
          'group-hover/pane:border-highlight/50 border-transparent': !isActive,
          '!border-secondary-light border-dashed': isHighlighted,
        })}
      />
    </div>
  );
}

ViewportPane.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  isActive: PropTypes.bool.isRequired,
  acceptDropsFor: PropTypes.string.isRequired,
  onDrop: PropTypes.func.isRequired,
  onInteraction: PropTypes.func.isRequired,
  onDoubleClick: PropTypes.func,
  customStyle: PropTypes.object,
};

export { ViewportPane };
