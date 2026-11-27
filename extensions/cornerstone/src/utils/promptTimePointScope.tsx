import React from 'react';
import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@ohif/ui-next';
import i18n from '@ohif/i18n';

export type TimePointScope = 'all' | 'each';

function TimePointScopeDialog({ hide, onChoose }) {
  const choose = (scope: TimePointScope) => {
    onChoose(scope);
    hide();
  };
  return (
    <div className="text-foreground text-base">
      <p className="mb-3">{i18n.t('Tools:This series has multiple time points.')}</p>
      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col shadow-none">
          <CardHeader className="space-y-1 p-3">
            <CardTitle className="text-base font-normal leading-snug tracking-normal">
              {i18n.t('Tools:Create a segmentation for each time point')}
            </CardTitle>
            <CardDescription className="leading-snug">
              {i18n.t('Tools:Changes apply only to the time point shown.')}
            </CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto p-3 pt-0">
            <Button
              variant="default"
              className="w-full"
              dataCY="time-point-scope-each"
              onClick={() => choose('each')}
            >
              {i18n.t('Tools:Each time point')}
            </Button>
          </CardFooter>
        </Card>
        <Card className="flex flex-col shadow-none">
          <CardHeader className="space-y-1 p-3">
            <CardTitle className="text-base font-normal leading-snug tracking-normal">
              {i18n.t('Tools:Create one segmentation, shown on every time point')}
            </CardTitle>
            <CardDescription className="leading-snug">
              {i18n.t('Tools:Changes apply to every time point.')}
            </CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto p-3 pt-0">
            <Button
              variant="default"
              className="w-full"
              dataCY="time-point-scope-all"
              onClick={() => choose('all')}
            >
              {i18n.t('Tools:All time points')}
            </Button>
          </CardFooter>
        </Card>
      </div>
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
