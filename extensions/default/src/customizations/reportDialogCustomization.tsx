import React, { useState } from 'react';
import { InputDialog } from '@ohif/ui-next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ohif/ui-next';

type DataSource = {
  value: string;
  label: string;
  placeHolder: string;
};

type ReportDialogProps = {
  dataSources: DataSource[];
  hide: () => void;
  onSave: (data: { reportName: string; dataSource: string | null }) => void;
  onCancel: () => void;
};

function ReportDialog({ dataSources, hide, onSave, onCancel }: ReportDialogProps) {
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(
    dataSources?.[0]?.value ?? null
  );

  const handleSave = (reportName: string) => {
    onSave({
      reportName,
      dataSource: selectedDataSource,
    });
    hide();
  };

  const handleCancel = () => {
    onCancel();
    hide();
  };

  const showDataSourceSelect = dataSources?.length > 1;

  return (
    <div className="text-foreground mt-2 flex min-w-[400px] max-w-md flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className={showDataSourceSelect ? 'flex gap-4' : ''}>
          {showDataSourceSelect && (
            <div className="mt-1 w-1/3">
              <Select
                value={selectedDataSource}
                onValueChange={setSelectedDataSource}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map(source => (
                    <SelectItem
                      key={source.value}
                      value={source.value}
                    >
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className={showDataSourceSelect ? 'mt-1 w-2/3' : 'w-full'}>
            <InputDialog>
              <InputDialog.Field>
                <InputDialog.Input placeholder="Report name" />
              </InputDialog.Field>
            </InputDialog>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <InputDialog>
            <InputDialog.Actions>
              <InputDialog.ActionsSecondary onClick={handleCancel}>
                Cancel
              </InputDialog.ActionsSecondary>
              <InputDialog.ActionsPrimary onClick={handleSave}>Save</InputDialog.ActionsPrimary>
            </InputDialog.Actions>
          </InputDialog>
        </div>
      </div>
    </div>
  );
}

export { ReportDialog };
export default {
  'ohif.createReportDialog': ReportDialog,
};
