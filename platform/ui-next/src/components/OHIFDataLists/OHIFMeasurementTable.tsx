import React from 'react';
import { useTranslation } from 'react-i18next';
import { DataRow, PanelSection } from '../';
import { createContext } from '../../lib/createContext';

interface MeasurementTableContext {
  data?: any[];
  onClick?: (uid: string) => void;
  onDelete?: (uid: string) => void;
  onToggleVisibility?: (uid: string) => void;
  onToggleLocked?: (uid: string) => void;
  onRename?: (uid: string) => void;
  onColor?: (uid: string) => void;
  disableEditing?: boolean;
}

const [MeasurementTableProvider, useMeasurementTableContext] =
  createContext<MeasurementTableContext>('MeasurementTable', { data: [] });

interface MeasurementItem {
  uid: string;
  label: string;
  colorHex: string;
  isSelected: boolean;
  displayText: { primary: string[]; secondary: string[] };
  isVisible: boolean;
  isLocked: boolean;
  toolName: string;
}

interface OHIFMeasurementTableProps extends MeasurementTableContext {
  title: string;
  children: React.ReactNode;
}

/**
 * The top-level measurement table component, renamed to OHIFMeasurementTable.
 * Houses sub-components (Header, Body, Footer, Row) as static properties.
 */
export function OHIFMeasurementTable({
  data = [],
  onClick,
  onDelete,
  onToggleVisibility,
  onToggleLocked,
  onRename,
  onColor,
  title,
  children,
  disableEditing = false,
}: OHIFMeasurementTableProps) {
  const { t } = useTranslation('MeasurementTable');
  const amount = data.length;

  return (
    <MeasurementTableProvider
      data={data}
      onClick={onClick}
      onDelete={onDelete}
      onToggleVisibility={onToggleVisibility}
      onToggleLocked={onToggleLocked}
      onRename={onRename}
      onColor={onColor}
      disableEditing={disableEditing}
    >
      <PanelSection defaultOpen={true}>
        <PanelSection.Header className="bg-secondary-dark">
          <span>{`${t(title)} (${amount})`}</span>
        </PanelSection.Header>
        <PanelSection.Content>{children}</PanelSection.Content>
      </PanelSection>
    </MeasurementTableProvider>
  );
}

/** Sub-components for OHIFMeasurementTable */

/** Header */
function Header({ children }: { children: React.ReactNode }) {
  return <div className="measurement-table-header">{children}</div>;
}

/** Body */
function Body() {
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
}

/** Footer */
function Footer({ children }: { children: React.ReactNode }) {
  return <div className="measurement-table-footer">{children}</div>;
}

/** Row */
interface RowProps {
  item: MeasurementItem;
  index: number;
}

function Row({ item, index }: RowProps) {
  const {
    onClick,
    onDelete,
    onToggleVisibility,
    onToggleLocked,
    onRename,
    onColor,
    disableEditing,
  } = useMeasurementTableContext('MeasurementTable.Row');

  return (
    <DataRow
      key={item.uid}
      description={item.label}
      number={index + 1}
      title={item.label}
      colorHex={item.colorHex}
      isSelected={item.isSelected}
      details={item.displayText}
      onSelect={() => onClick?.(item.uid)}
      onDelete={() => onDelete?.(item.uid)}
      disableEditing={disableEditing}
      isVisible={item.isVisible}
      isLocked={item.isLocked}
      onToggleVisibility={() => onToggleVisibility?.(item.uid)}
      onToggleLocked={() => onToggleLocked?.(item.uid)}
      onRename={() => onRename?.(item.uid)}
      // onColor={() => onColor?.(item.uid)} // Uncomment if color picking is re-enabled
    />
  );
}

OHIFMeasurementTable.Header = Header;
OHIFMeasurementTable.Body = Body;
OHIFMeasurementTable.Footer = Footer;
OHIFMeasurementTable.Row = Row;
