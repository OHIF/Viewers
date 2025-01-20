import React from 'react';
import { useTranslation } from 'react-i18next';
import { DataRow, PanelSection } from '@ohif/ui-next';

// https://github.com/reach/reach-ui/blob/dev/packages/utils/src/context.tsx
type ContextProvider<T> = React.FC<React.PropsWithChildren<T>>;

export function createContext<ContextValueType extends object | null>(
  rootComponentName: string,
  defaultContext?: ContextValueType
): [ContextProvider<ContextValueType>, (callerComponentName: string) => ContextValueType] {
  const Ctx = React.createContext<ContextValueType | undefined>(defaultContext);

  function Provider(props: React.PropsWithChildren<ContextValueType>) {
    const { children, ...context } = props;
    const value = React.useMemo(
      () => context,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(context)
    ) as ContextValueType;
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }

  function useContext(callerComponentName: string) {
    const context = React.useContext(Ctx);
    if (context) {
      return context;
    }
    if (defaultContext) {
      return defaultContext;
    }
    throw Error(
      `${callerComponentName} must be rendered inside of a ${rootComponentName} component.`
    );
  }

  Ctx.displayName = `${rootComponentName}Context`;
  Provider.displayName = `${rootComponentName}Provider`;
  return [Provider, useContext];
}

interface MeasurementTableContext {
  items?: any[];
  onClick?: (uid: string) => void;
  onDelete?: (uid: string) => void;
  onToggleVisibility?: (uid: string) => void;
  onToggleLocked?: (uid: string) => void;
  onRename?: (uid: string) => void;
  onColor?: (uid: string) => void;
  disableEditing?: boolean;
}

const [MeasurementTableProvider, useMeasurementTableContext] =
  createContext<MeasurementTableContext>('MeasurementTable', { items: [] });

interface MeasurementDataProps extends MeasurementTableContext {
  title: string;
  children: React.ReactNode;
}

export const MeasurementTable = ({
  items = [],
  onClick,
  onDelete,
  onToggleVisibility,
  onToggleLocked,
  onRename,
  onColor,
  title,
  children,
  disableEditing = false,
}: MeasurementDataProps) => {
  const { t } = useTranslation('MeasurementTable');
  const amount = items.length;

  return (
    <MeasurementTableProvider
      items={items}
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
};

const Header = ({ children }: { children: React.ReactNode }) => {
  return <div className="measurement-table-header">{children}</div>;
};

const Body = ({ items }: { items: any[] }) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-primary-light mb-1 flex flex-1 items-center px-2 py-2 text-base">
        No tracked measurements
      </div>
    );
  }

  return (
    <div className="measurement-table-body space-y-px">
      {items.map((item, index) => (
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
}

interface RowProps {
  item: MeasurementItem;
  index: number;
}

const Row = ({ item, index }: RowProps) => {
  const { onClick, onDelete, onToggleVisibility, onToggleLocked, onRename, disableEditing } =
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
      onSelect={() => onClick(item.uid)}
      onDelete={() => onDelete(item.uid)}
      disableEditing={disableEditing}
      isVisible={item.isVisible}
      isLocked={item.isLocked}
      onToggleVisibility={() => onToggleVisibility(item.uid)}
      onToggleLocked={() => onToggleLocked(item.uid)}
      onRename={() => onRename(item.uid)}
      // onColor={() => onColor(item.uid)}
    />
  );
};

MeasurementTable.Header = Header;
MeasurementTable.Body = Body;
MeasurementTable.Footer = Footer;
MeasurementTable.Row = Row;

export default MeasurementTable;
