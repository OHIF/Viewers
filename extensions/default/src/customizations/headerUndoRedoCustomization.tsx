import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

/**
 * The undo/redo section of the viewer header's right hand menu bar.
 *
 * Registered as the `ohif.headerUndoRedo` customization, which the header
 * renders as a component: return whatever should sit there, or set the
 * customization to `null` to leave the slot empty. Because it is a component
 * (not a value) a replacement is free to use hooks — as this default does to
 * reach the commands manager.
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

export default {
  'ohif.headerUndoRedo': HeaderUndoRedo,
};
