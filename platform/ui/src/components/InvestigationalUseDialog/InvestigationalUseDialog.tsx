import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';
import Button, { ButtonEnums } from '../Button';

export enum showDialogOption {
  NeverShowDialog = 'never',
  AlwaysShowDialog = 'always',
  ShowOnceAndConfigure = 'configure',
}

const InvestigationalUseDialog = ({ options }) => {
  const { option, days } = options;
  const [isHidden, setIsHidden] = useState(true);

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
          setIsHidden(isExpired);
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
    <div className="fixed bottom-2 z-50 flex w-full justify-center">
      <div className="bg-secondary-dark flex w-[90%] items-center justify-between rounded p-2">
        <div className="flex items-center gap-4">
          <Icon
            name="info-link"
            className="h-10 w-10"
          />
          <div className="flex flex-col">
            <div className="text-white">
              OHIF Viewer is{' '}
              <span className="text-primary-light">for investigational use only</span>
            </div>
            <div className="text-white">
              The viewer is to be used for lorem ipsum.{' '}
              <span className="text-primary-main">Learn more about OHIF Viewer</span>
            </div>
          </div>
        </div>
        <Button
          type={ButtonEnums.type.primary}
          onClick={handleConfirmAndHide}
        >
          Confirm and Hide
        </Button>
      </div>
    </div>
  );
};

InvestigationalUseDialog.propTypes = {
  options: PropTypes.shape({
    option: PropTypes.oneOf(Object.values(showDialogOption)).isRequired,
    days: PropTypes.number,
  }).isRequired,
};

InvestigationalUseDialog.defaultProps = {
  options: {
    option: showDialogOption.AlwaysShowDialog,
  },
};

export default InvestigationalUseDialog;
