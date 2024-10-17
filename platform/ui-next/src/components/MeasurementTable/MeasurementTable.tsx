import React from 'react';
import { useTranslation } from 'react-i18next';
import { DataRow, PanelSection } from '../../index';
import { createContext } from '../../lib/createContext';

const [MeasurementTableProvider, useMeasurementTableContext] = createContext<{ data: any[] }>(
  'MeasurementTable',
  { data: [] }
);

const MeasurementTable = ({
  data = [],
  title,
  children,
}: {
  data: any[];
  title: string;
  children: React.ReactNode;
}) => {
  const { t } = useTranslation('MeasurementTable');
  const amount = data.length;

  return (
    <MeasurementTableProvider data={data}>
      <PanelSection
        title={`${t(title)} (${amount})`}
        defaultOpen={true}
      >
        {children}
      </PanelSection>
    </MeasurementTableProvider>
  );
};

const Header = ({ children }: { children: React.ReactNode }) => {
  return <div className="measurement-table-header">{children}</div>;
};

const Body = ({
  onClick,
  onDelete,
}: {
  onClick: (uid: string, isActive: boolean) => void;
  onDelete: (uid: string, isActive: boolean) => void;
}) => {
  const { data } = useMeasurementTableContext('MeasurementTable.Body');

  if (!data || data.length === 0) {
    return (
      <div className="text-primary-light bg-background mb-1 flex flex-1 items-center px-2 py-2 text-base">
        No tracked measurements
      </div>
    );
  }

  return (
    <div className="measurement-table-body space-y-px">
      {data.map((measurementItem, index) => (
        <Row
          key={measurementItem.uid}
          measurementItem={measurementItem}
          index={index}
          onClick={() => onClick(measurementItem.uid, measurementItem.isActive)}
          onDelete={() => onDelete(measurementItem.uid, measurementItem.isActive)}
        />
      ))}
    </div>
  );
};

const Footer = ({ children }: { children: React.ReactNode }) => {
  return <div className="measurement-table-footer">{children}</div>;
};

const Row = ({
  measurementItem,
  index,
  onClick,
  onDelete,
}: {
  measurementItem: any;
  index: number;
  onClick: (uid: string, isActive: boolean) => void;
  onDelete: (uid: string, isActive: boolean) => void;
}) => {
  return (
    <DataRow
      key={measurementItem.uid}
      number={index + 1}
      title={measurementItem.toolName}
      colorHex={measurementItem.colorHex}
      isSelected={measurementItem.isActive}
      details={measurementItem.displayText}
      onSelect={() => onClick({ uid: measurementItem.uid, isActive: measurementItem.isActive })}
      onDelete={() => onDelete({ uid: measurementItem.uid, isActive: measurementItem.isActive })}
      disableEditing={true}
      isVisible={true}
      isLocked={false}
      onToggleVisibility={() => {}}
      onToggleLocked={() => {}}
      onRename={() => {}}
      onColor={() => {}}
    />
  );
};

MeasurementTable.Header = Header;
MeasurementTable.Body = Body;
MeasurementTable.Footer = Footer;
MeasurementTable.Row = Row;

export default MeasurementTable;
