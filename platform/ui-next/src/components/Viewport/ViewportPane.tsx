import React from 'react';
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
  // A ref, not a render-scoped variable: refHandler runs after render, so
  // assigning a plain local there mutates a binding the render has already
  // finished with - and the local resets to null on every subsequent render.
  const dropElementRef = React.useRef(null);

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
    dropElementRef.current?.focus();
  };

  const onInteractionHandler = event => {
    focus();
    onInteraction(event);
  };

  const refHandler = element => {
    drop(element);
    dropElementRef.current = element;
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
        'group/pane relative h-full w-full overflow-hidden bg-black transition duration-300',
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
          '!border-input border-dashed': isHighlighted,
        })}
      />
    </div>
  );
}



export { ViewportPane };
