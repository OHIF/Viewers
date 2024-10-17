import React from 'react';
import { useTranslation } from 'react-i18next';
import { DataRow, PanelSection } from '../../index';

const MeasurementTable = ({
  data = [],
  title,
  onClick = () => {},
  onEdit = () => {},
  onDelete = () => {},
  children,
}: withAppTypes) => {
  const { t } = useTranslation('MeasurementTable');
  const amount = data.length;

  return (
    <PanelSection
      title={`${t(title)} (${amount})`}
      defaultOpen={true}
    >
      {children}
      <div className="space-y-px">
        {data.map((measurementItem, index) => (
          <DataRow
            key={index + 1}
            number={index + 1}
            title={measurementItem.toolName}
            colorHex={measurementItem.colorHex}
            isSelected={measurementItem.isActive}
            details={measurementItem.displayText}
            onSelect={() =>
              onClick({ uid: measurementItem.uid, isActive: measurementItem.isActive })
            }
            onDelete={() =>
              onDelete({ uid: measurementItem.uid, isActive: measurementItem.isActive })
            }
            disableEditing={true}
            isVisible={true}
            isLocked={false}
            onToggleVisibility={() => {}}
            onToggleLocked={() => {}}
            onRename={() => {}}
            onColor={() => {}}
          />
        ))}
      </div>
      {data.length === 0 && (
        <div className="text-primary-light bg-background mb-1 flex flex-1 items-center px-2 py-2 text-base">
          {t('No tracked measurements')}
        </div>
      )}
    </PanelSection>
  );
};

export default MeasurementTable;
