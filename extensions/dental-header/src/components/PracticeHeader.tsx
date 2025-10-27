import { Icons, Switch } from '@ohif/ui-next';
import React, { useState } from 'react';

import ToothSelector from './ToothSelector';
import classNames from 'classnames';

interface PracticeHeaderProps {
  practiceName?: string;
  patientInfo?: {
    name?: string;
    id?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  onToothSelect?: (toothNumber: string, system: 'FDI' | 'Universal', selected: any) => void;
  selectedTooth?: string;
  numberingSystem?: 'FDI' | 'Universal';
  isReturnEnabled?: boolean;
  onClickReturnButton?: () => void;
  WhiteLabeling?: {
    createLogoComponentFn?: (React: any, props: any) => ReactNode;
  };
  toggleSwitch?: () => void;
  isToggled?: boolean;
}

function PracticeHeader({
  practiceName = 'Dental Practice',
  patientInfo,
  onToothSelect,
  selectedTooth,
  numberingSystem = 'FDI',
  isReturnEnabled,
  onClickReturnButton,
  WhiteLabeling,
  toggleSwitch,
  isToggled,
  ...props
}: PracticeHeaderProps) {
  const [currentNumberingSystem, setCurrentNumberingSystem] = useState<'FDI' | 'Universal'>(
    numberingSystem
  );

  const onClickReturn = () => {
    if (isReturnEnabled && onClickReturnButton) {
      onClickReturnButton();
    }
  };

  const toggleNumberingSystem = () => {
    const newSystem = currentNumberingSystem === 'FDI' ? 'Universal' : 'FDI';
    setCurrentNumberingSystem(newSystem);
  };

  return (
    <div className="dental-theme practice-header flex w-full items-center justify-between">
      {/* Practice Name and Logo */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div
            className={classNames(
              'mr-3 inline-flex items-center',
              isReturnEnabled && 'cursor-pointer'
            )}
            onClick={onClickReturn}
            data-cy="return-to-work-list"
          >
            {isReturnEnabled && <Icons.ArrowLeft className="text-primary ml-1 h-7 w-7" />}
            <div className="ml-1">
              {WhiteLabeling?.createLogoComponentFn?.(React, props) || <Icons.OHIFLogo />}
            </div>
          </div>
          {/* Dental Name and Patient Info */}
          <div>
            <h1 className="practice-name text-xl font-bold text-white">{practiceName}</h1>
            {patientInfo && (
              <div className="patient-info text-sm text-white/90">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">{patientInfo.name || 'Patient Name'}</span>
                  <span>ID: {patientInfo.id || 'N/A'}</span>
                  {patientInfo.dateOfBirth && <span>DOB: {patientInfo.dateOfBirth}</span>}
                  {patientInfo.gender && <span>Gender: {patientInfo.gender}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls Group - Tooth Selector, Numbering System, and Theme Switch */}
      <div className="controls-group">
        {/* Tooth Selector */}
        <ToothSelector
          onToothSelect={onToothSelect}
          selectedTooth={selectedTooth}
          numberingSystem={currentNumberingSystem}
        />

        {/* Numbering System Toggle */}
        <button
          onClick={toggleNumberingSystem}
          className="numbering-system-button rounded-md border px-3 py-1 text-sm font-medium transition-all duration-200"
        >
          {currentNumberingSystem === 'FDI' ? 'FDI' : 'Universal'}
        </button>

        {/* Theme Switch */}
        <div className="flex items-center gap-2">
          <Switch
            checked={isToggled}
            onCheckedChange={toggleSwitch}
          />
          <span className="text-foreground text-base">{isToggled ? 'Dark' : 'Light'}</span>
        </div>
      </div>
    </div>
  );
}

export default PracticeHeader;
