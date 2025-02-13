import React, { useState } from 'react';
import { InputDialog, Label } from '@ohif/ui-next';
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
};

function ReportDialog({ dataSources, hide, onSave }: ReportDialogProps) {
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(
    dataSources[0]?.value || null
  );

  const handleSave = (reportName: string) => {
    onSave({
      reportName,
      dataSource: selectedDataSource,
    });
    hide();
  };

  return (
    <div className="text-foreground mt-2 flex min-w-[300px] max-w-md flex-col gap-4">
      <div className="flex flex-col gap-3">
        {dataSources.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="data-source">Data Source</Label>
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
        <InputDialog>
          <InputDialog.Field>
            <InputDialog.Input placeholder="Enter report name" />
          </InputDialog.Field>
          <InputDialog.Actions>
            <InputDialog.ActionsSecondary onClick={hide}>Cancel</InputDialog.ActionsSecondary>
            <InputDialog.ActionsPrimary onClick={handleSave}>Save</InputDialog.ActionsPrimary>
          </InputDialog.Actions>
        </InputDialog>
      </div>
    </div>
  );
}

export { ReportDialog };
export default {
  'ohif.createReportDialog': ReportDialog,
};
