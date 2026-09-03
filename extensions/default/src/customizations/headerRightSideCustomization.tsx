import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

/**
 * The right side of the viewer header's menu bar, ahead of the patient info and
 * settings menu. Named for where it sits rather than what it holds, because
 * what it holds is entirely up to the `ohif.headerRightSide` customization —
 * this default happens to be undo/redo buttons.
 *
 * `ViewerHeader` renders the customization as a component, so a replacement is
 * free to use hooks (as this default does to reach the commands manager). Set
 * the customization to `null` to leave the area empty.
 */
function HeaderRightSide() {
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
  'ohif.headerRightSide': HeaderRightSide,
};
