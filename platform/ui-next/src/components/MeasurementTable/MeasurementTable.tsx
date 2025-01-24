import React from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonEnums, Dialog } from '@ohif/ui';

import { DataRow, PanelSection } from '../../index';
import { createContext } from '../../lib/createContext';
import { Button, Icons } from '../../index';

interface MeasurementTableContext {
  data?: any[];
  onAction?: (e, command: string | string[], uid: string) => void;
  disableEditing?: boolean;
  isExpanded: boolean;
  uiDialogService: unknown;
  onUntrackConfirm: () => void;
}

const [MeasurementTableProvider, useMeasurementTableContext] =
  createContext<MeasurementTableContext>('MeasurementTable', { data: [] });

interface MeasurementDataProps extends MeasurementTableContext {
  title: string;
  children: React.ReactNode;
}

const MeasurementTable = ({
  data = [],
  onAction,
  isExpanded = true,
  title,
  children,
  disableEditing = false,
  uiDialogService,
  onUntrackConfirm,
}: MeasurementDataProps) => {
  const { t } = useTranslation('MeasurementTable');
  const amount = data.length;

  return (
    <MeasurementTableProvider
      data={data}
      onAction={onAction}
      isExpanded={isExpanded}
      disableEditing={disableEditing}
    >
      <PanelSection defaultOpen={true}>
        <PanelSection.Header className="bg-secondary-dark">
          <span>{`${t(title)} (${amount})`}</span>
          <Button
            size="sm"
            variant="ghost"
            className="pl-0.5"
            onClick={event => {
              event.stopPropagation();
              uiDialogService.create({
                id: 'untrack-and-delete-all-measurements',
                centralize: true,
                isDraggable: false,
                showOverlay: true,
                content: Dialog,
                contentProps: {
                  title: 'Untrack and Delete All Measurements',
                  body: () => (
                    <div className="bg-primary-dark text-white">
                      <p>Are you sure you want to untrack study and delete all measurements?</p>
                      <p className="mt-2">This action cannot be undone.</p>
                    </div>
                  ),
                  actions: [
                    {
                      id: 'cancel',
                      text: 'Cancel',
                      type: ButtonEnums.type.secondary,
                    },
                    {
                      id: 'yes',
                      text: 'Untrack and Delete All',
                      type: ButtonEnums.type.primary,
                      classes: ['untrack-and-delete-all-yes-button'],
                    },
                  ],
                  onClose: () =>
                    uiDialogService.dismiss({ id: 'untrack-and-delete-all-measurements' }),
                  onSubmit: async ({ action }) => {
                    switch (action.id) {
                      case 'yes':
                        onUntrackConfirm();
                        uiDialogService.dismiss({ id: 'untrack-and-delete-all-measurements' });
                        break;
                      case 'cancel':
                        uiDialogService.dismiss({ id: 'untrack-and-delete-all-measurements' });
                        break;
                    }
                  },
                  onStart: () => {
                    console.log('Dialog drag started');
                  },
                  onDrag: (_event: unknown, data: unknown) => {
                    console.log('Dialog is being dragged', data);
                  },
                  onStop: () => {
                    console.log('Dialog drag stopped');
                  },
                  defaultPosition: { x: 0, y: 0 },
                  onClickOutside: () => {
                    uiDialogService.dismiss({ id: 'delete-all-measurements' });
                  },
                },
              });
            }}
          >
            <Icons.Delete />
            Untrack
          </Button>
        </PanelSection.Header>
        <PanelSection.Content>{children}</PanelSection.Content>
      </PanelSection>
    </MeasurementTableProvider>
  );
};

const Header = ({ children }: { children: React.ReactNode }) => {
  return <div className="measurement-table-header">{children}</div>;
};

const Body = () => {
  const { data } = useMeasurementTableContext('MeasurementTable.Body');

  if (!data || data.length === 0) {
    return (
      <div className="text-primary-light mb-1 flex flex-1 items-center px-2 py-2 text-base">
        No tracked measurements
      </div>
    );
  }

  return (
    <div className="measurement-table-body space-y-px">
      {data.map((item, index) => (
        <Row
          key={item.uid}
          item={item}
          index={index}
        />
      ))}
    </div>
  );
};

const Footer = ({ children }: { children: React.ReactNode }) => {
  return <div className="measurement-table-footer">{children}</div>;
};

interface MeasurementItem {
  uid: string;
  label: string;
  colorHex: string;
  isSelected: boolean;
  displayText: { primary: string[]; secondary: string[] };
  isVisible: boolean;
  isLocked: boolean;
  toolName: string;
  isExpanded: boolean;
}

interface RowProps {
  item: MeasurementItem;
  index: number;
}

const Row = ({ item, index }: RowProps) => {
  const { onAction, isExpanded, disableEditing } =
    useMeasurementTableContext('MeasurementTable.Row');

  return (
    <DataRow
      key={item.uid}
      description={item.label}
      number={index + 1}
      title={item.label}
      colorHex={item.colorHex}
      isSelected={item.isSelected}
      details={item.displayText}
      onAction={(e, command) => onAction(e, command, item.uid)}
      disableEditing={disableEditing}
      isExpanded={isExpanded}
      isVisible={item.isVisible}
      isLocked={item.isLocked}
    />
  );
};

MeasurementTable.Header = Header;
MeasurementTable.Body = Body;
MeasurementTable.Footer = Footer;
MeasurementTable.Row = Row;

export default MeasurementTable;
