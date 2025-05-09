import React from 'react';
import { FooterAction } from '@ohif/ui-next';

export function UntrackSeriesModal({ hide, onConfirm, message }) {
  return (
    <div className="text-foreground text-[13px]">
      <div>
        <p>{message}</p>
        <p className="mt-2">
          This action cannot be undone and will delete all your existing measurements.
        </p>
      </div>
      <FooterAction className="mt-4">
        <FooterAction.Right>
          <FooterAction.Secondary onClick={hide}>Cancel</FooterAction.Secondary>
          <FooterAction.Primary
            onClick={() => {
              onConfirm();
              hide();
            }}
          >
            Untrack
          </FooterAction.Primary>
        </FooterAction.Right>
      </FooterAction>
    </div>
  );
}
