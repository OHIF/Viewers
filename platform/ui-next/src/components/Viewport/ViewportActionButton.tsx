import React from 'react';
import PropTypes from 'prop-types';

/**
 * A button that can trigger commands when clicked.
 */
function ViewportActionButton({ onInteraction, commands, id, children }) {
  return (
    <div
      className="bg-primary-main hover:bg-primary-light ml-1 cursor-pointer rounded px-1.5 hover:text-black"
      // Using onMouseUp because onClick wasn't firing if pointer-events are none.
      onMouseUp={() => {
        onInteraction({
          itemId: id,
          commands,
        });
      }}
    >
      {children}
    </div>
  );
}

ViewportActionButton.propTypes = {
  id: PropTypes.string,
  onInteraction: PropTypes.func.isRequired,
  commands: PropTypes.array,
  children: PropTypes.node,
};

export { ViewportActionButton };
