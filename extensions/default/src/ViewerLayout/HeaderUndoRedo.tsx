import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icons } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { useUndoRedoState } from './useUndoRedoState';

/**
 * Undo/redo buttons, shipped as one of the `ohif.headerRightSide` items. Like
 * every item in that list it takes no props and gets what it needs from
 * `useSystem()`, so a site can reorder or drop it without touching the header.
 */
function HeaderUndoRedo() {
  const { commandsManager } = useSystem();
  const { t } = useTranslation();
  const { canUndo, canRedo } = useUndoRedoState();

  return (
    <div className="text-primary flex items-center">
      <Button
        variant="ghost"
        className="hover:bg-muted cursor-pointer"
        data-cy="undo-btn"
        disabled={!canUndo}
        aria-label={t('Header:Undo')}
        onClick={() => {
          commandsManager.run('undo');
        }}
      >
        <Icons.Undo className="" />
      </Button>
      <Button
        variant="ghost"
        className="hover:bg-muted cursor-pointer"
        data-cy="redo-btn"
        disabled={!canRedo}
        aria-label={t('Header:Redo')}
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
