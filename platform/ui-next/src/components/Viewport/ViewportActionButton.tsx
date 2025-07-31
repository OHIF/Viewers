import React from 'react';

interface ViewportActionButtonProps {
  id?: string;
  onInteraction(...args: unknown[]): unknown;
  commands?: unknown[];
  children?: React.ReactNode;
}

/**
 * A button that can trigger commands when clicked.
 */
function ViewportActionButton({
  onInteraction,
  commands,
  id,
  children
}: ViewportActionButtonProps) {
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

export { ViewportActionButton };
