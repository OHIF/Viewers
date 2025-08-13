import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Icons } from '@ohif/ui-next';
import { Button } from '../Button';
import { useTranslation } from 'react-i18next';

export enum showDialogOption {
  NeverShowDialog = 'never',
  AlwaysShowDialog = 'always',
  ShowOnceAndConfigure = 'configure',
}

const InvestigationalUseDialog = ({
  dialogConfiguration = {
    option: showDialogOption.AlwaysShowDialog,
  },
}) => {
  const { option, days } = dialogConfiguration;
  const [isHidden, setIsHidden] = useState(true);
  const { t } = useTranslation('InvestigationalUseDialog');

  useEffect(() => {
    const dialogLocalState = localStorage.getItem('investigationalUseDialog');
    const dialogSessionState = sessionStorage.getItem('investigationalUseDialog');

    switch (option) {
      case showDialogOption.NeverShowDialog:
        setIsHidden(true);
        break;
      case showDialogOption.AlwaysShowDialog:
        setIsHidden(!!dialogSessionState);
        break;
      case showDialogOption.ShowOnceAndConfigure:
        if (dialogLocalState) {
          const { expiryDate } = JSON.parse(dialogLocalState);
          const isExpired = new Date() > new Date(expiryDate);
          setIsHidden(!isExpired);
        } else {
          setIsHidden(false);
        }
        break;
      default:
        setIsHidden(true);
    }
  }, [option, days]);

  const handleConfirmAndHide = () => {
    const expiryDate = new Date();

    switch (option) {
      case showDialogOption.ShowOnceAndConfigure:
        expiryDate.setDate(expiryDate.getDate() + days);
        localStorage.setItem('investigationalUseDialog', JSON.stringify({ expiryDate }));
        break;
      case showDialogOption.AlwaysShowDialog:
        sessionStorage.setItem('investigationalUseDialog', 'hidden');
        break;
    }
    setIsHidden(true);
  };

  if (isHidden) {
    return null;
  }

  return (
    <div className="fixed bottom-2 z-50 flex h-[86px] w-full justify-center">
      <div className="bg-secondary-dark border-primary-dark flex w-[90%] items-center justify-between rounded-lg border-2 pl-[22px] pr-[22px] pt-[10px] pb-[10px] shadow-lg">
        <div className="flex items-center gap-4">
          <Icons.InvestigationalUse className="h-18 w-18" />
          <div className="flex flex-col">
            <div className="text-[19px] text-white">
              OHIF Viewer is{' '}
              <span className="text-primary-light">{t('for investigational use only')}</span>
            </div>
            <div className="text-[13px] text-white">
              <span
                className="text-primary-active cursor-pointer"
                onClick={() => window.open('https://ohif.org/', '_blank')}
              >
                {t('Learn more about OHIF Viewer')}
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={handleConfirmAndHide}
          className="bg-primary-main"
          dataCY="confirm-and-hide-button"
        >
          {t('Confirm and hide')}
        </Button>
      </div>
    </div>
  );
};

InvestigationalUseDialog.propTypes = {
  dialogConfiguration: PropTypes.shape({
    option: PropTypes.oneOf(Object.values(showDialogOption)).isRequired,
    days: PropTypes.number,
  }),
};

export default InvestigationalUseDialog;
