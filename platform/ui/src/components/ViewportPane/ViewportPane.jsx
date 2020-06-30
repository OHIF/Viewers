import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDrop } from 'react-dnd';

// NOTE: If we found a way to make `useDrop` conditional,
// Or we provided a HOC of this component, we could provide
// this UI without the DragAndDropContext dependency.
function ViewportPane({
  children,
  className,
  isActive,
  onDrop,
  onInteraction,
  acceptDropsFor,
}) {
  let dropElement = null;
  const [{ isHovered, isHighlighted }, drop] = useDrop({
    accept: acceptDropsFor,
    // TODO: pass in as prop?
    drop: (droppedItem, monitor) => {
      const canDrop = monitor.canDrop();
      const isOver = monitor.isOver();

      if (canDrop && isOver && onDrop) {
        onInteractionHandler();
        onDrop(droppedItem);
      }
    },
    // Monitor, and collect props; returned as values by `useDrop`
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

  const onInteractionHandler = () => {
    onInteraction();
    focus();
  };

  const refHandler = element => {
    drop(element);
    dropElement = element;
  };

  return (
    <div
      ref={refHandler}
      // onInteractionHandler...
      // https://reactjs.org/docs/events.html#mouse-events
      // https://stackoverflow.com/questions/8378243/catch-scrolling-event-on-overflowhidden-element
      onMouseDown={onInteractionHandler}
      onClick={onInteractionHandler}
      onScroll={onInteractionHandler}
      onWheel={onInteractionHandler}
      className={classnames(
        'flex flex-col',
        'rounded-lg hover:border-primary-light transition duration-300 outline-none overflow-hidden',
        {
          'border-2 border-primary-light m-0': isActive,
          'border border-secondary-light': !isActive,
        },
        className
      )}
    >
      {children}
    </div>
  );
}

ViewportPane.propTypes = {
  /** The ViewportComp */
  children: PropTypes.node.isRequired,
  /** Classes to append to container */
  className: PropTypes.string,
  /** Bool to show active styling */
  isActive: PropTypes.bool.isRequired,
  /** Indicates drag items we should accept for drops */
  acceptDropsFor: PropTypes.string.isRequired,
  /** Function that handles drop events */
  onDrop: PropTypes.func.isRequired,
  /** Called when the viewportPane is interacted with by the user */
  onInteraction: PropTypes.func.isRequired,
};

const noop = () => { };

ViewportPane.defaultProps = {
  onInteraction: noop,
};

export default ViewportPane;
