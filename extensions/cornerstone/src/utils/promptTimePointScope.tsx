import React from 'react';
import { FooterAction } from '@ohif/ui-next';
import i18n from '@ohif/i18n';

export type TimePointScope = 'all' | 'each';

function TimePointScopeDialog({ hide, onChoose }) {
  const choose = (scope: TimePointScope) => {
    onChoose(scope);
    hide();
  };
  return (
    <div className="text-foreground text-[13px]">
      <p>{i18n.t('Tools:This series has more than one time point.')}</p>
      <p className="mt-2">
        {i18n.t(
          'Tools:"All time points" makes one segmentation that shows on every time point. "Each time point" keeps a separate segmentation for each time point, and an edit changes only the time point on display.'
        )}
      </p>
      <FooterAction className="mt-4">
        <FooterAction.Left>
          <FooterAction.Secondary onClick={hide}>{i18n.t('Common:Cancel')}</FooterAction.Secondary>
        </FooterAction.Left>
        <FooterAction.Right>
          <FooterAction.Secondary
            dataCY="time-point-scope-each"
            onClick={() => choose('each')}
          >
            {i18n.t('Tools:Each time point')}
          </FooterAction.Secondary>
          <FooterAction.Primary
            dataCY="time-point-scope-all"
            onClick={() => choose('all')}
          >
            {i18n.t('Tools:All time points')}
          </FooterAction.Primary>
        </FooterAction.Right>
      </FooterAction>
    </div>
  );
}

/**
 * Asks whether a new segmentation of a 4D series applies to all time points
 * or to each time point separately.  Resolves to undefined when the user
 * cancels or closes the dialog.
 */
export function promptTimePointScope(
  uiDialogService: AppTypes.UIDialogService
): Promise<TimePointScope | undefined> {
  return new Promise(resolve => {
    uiDialogService.show({
      id: 'time-point-scope',
      title: i18n.t('Tools:Segmentation time points'),
      content: TimePointScopeDialog,
      shouldCloseOnEsc: true,
      contentProps: { onChoose: resolve },
      onClose: id => {
        uiDialogService.hide(id);
        resolve(undefined);
      },
    });
  });
}
