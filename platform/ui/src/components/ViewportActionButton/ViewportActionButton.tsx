import PropTypes from 'prop-types';
import React from 'react';

function ViewportActionButton({ onInteraction, commands, id, children }) {
  return (
    <div
      className="bg-primary-main hover:bg-primary-light ml-1 cursor-pointer rounded px-1.5 hover:text-black"
      // Using onMouseUp here because onClick is not working when the viewport is not active and is styled with pointer-events:none
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

export default ViewportActionButton;
