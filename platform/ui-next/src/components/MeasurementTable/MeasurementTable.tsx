import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icons, PanelSection, Tooltip, TooltipContent, TooltipTrigger } from '../../index';
import DataRow from '../DataRow/DataRow';
import { createContext } from '../../lib/createContext';

interface MeasurementTableContext {
  data?: any[];
  onAction?: (e, command: string | string[], uid: string) => void;
  disableEditing?: boolean;
  isExpanded: boolean;
}

const [MeasurementTableProvider, useMeasurementTableContext] =
  createContext<MeasurementTableContext>('MeasurementTable', { data: [], isExpanded: true });

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
        <PanelSection.Header
          key="measurementTableHeader"
          className="bg-secondary-dark"
        >
          <span>{`${t(title)} (${amount})`}</span>
        </PanelSection.Header>
        <PanelSection.Content key="measurementTableContent">{children}</PanelSection.Content>
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
  isUnmapped?: boolean;
  statusTooltip?: string;
}

interface RowProps {
  item: MeasurementItem;
  index: number;
}

const Row = ({ item, index }: RowProps) => {
  const { onAction, isExpanded, disableEditing } =
    useMeasurementTableContext('MeasurementTable.Row');

  const { uid } = item;
  return (
    <DataRow
      key={item.uid}
      description={item.label}
      number={index + 1}
      title={item.label}
      colorHex={item.colorHex}
      isSelected={item.isSelected}
      details={item.displayText}
      onDelete={e => onAction(e, 'removeMeasurement', uid)}
      onSelect={e => onAction(e, 'jumpToMeasurement', uid)}
      onRename={e => onAction(e, 'renameMeasurement', uid)}
      onToggleVisibility={e => onAction(e, 'toggleVisibilityMeasurement', uid)}
      onToggleLocked={e => onAction(e, 'toggleLockMeasurement', uid)}
      onColor={e => onAction(e, 'changeMeasurementColor', uid)}
      disableEditing={disableEditing}
      isVisible={item.isVisible}
      isLocked={item.isLocked}
    >
      {item.isUnmapped && (
        <DataRow.Status.Warning tooltip={item.statusTooltip} />
      )}
    </DataRow>
  );
};

MeasurementTable.Header = Header;
MeasurementTable.Body = Body;
MeasurementTable.Footer = Footer;
MeasurementTable.Row = Row;

export default MeasurementTable;
