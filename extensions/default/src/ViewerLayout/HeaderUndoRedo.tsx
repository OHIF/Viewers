import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

/**
 * Undo/redo buttons, shipped as one of the `ohif.headerRightSide` items. Like
 * every item in that list it takes no props and gets what it needs from
 * `useSystem()`, so a site can reorder or drop it without touching the header.
 */
function HeaderUndoRedo() {
  const { commandsManager } = useSystem();

  return (
    <div className="text-primary flex cursor-pointer items-center">
      <Button
        variant="ghost"
        className="hover:bg-muted"
        data-cy="undo-btn"
        onClick={() => {
          commandsManager.run('undo');
        }}
      >
        <Icons.Undo className="" />
      </Button>
      <Button
        variant="ghost"
        className="hover:bg-muted"
        data-cy="redo-btn"
        onClick={() => {
          commandsManager.run('redo');
        }}
      >
        <Icons.Redo className="" />
      </Button>
    </div>
  );
}

export default HeaderUndoRedo;
