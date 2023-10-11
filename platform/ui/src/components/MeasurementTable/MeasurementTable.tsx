import React, { useState, useEffect, useRef } from 'react';
import { ServicesManager } from '@ohif/core';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import MeasurementItem from './MeasurementItem';
import { eventTarget, EVENTS } from '@cornerstonejs/core';
import { useAppConfig } from '@state';

const MeasurementTable = ({ data: dataReceived, title, onClick, onEdit, servicesManager }) => {
  servicesManager = servicesManager as ServicesManager;
  const { customizationService, viewportGridService, measurementService } =
    servicesManager.services;

  const [appConfig] = useAppConfig();
  const filterSRs = appConfig?.filterSRs;

  const [data, _setData] = useState([]);
  const [fullData, _setFullData] = useState([]);
  const dataRef = useRef();
  const fullDataRef = useRef();

  const setData = param => {
    dataRef.current = param;
    _setData(param);
  };

  const setFullData = param => {
    fullDataRef.current = param;
    _setFullData(param);
  };

  function activeViewportChanged(evt) {
    const { activeViewportId, viewports } = viewportGridService.getState();
    const activeViewport = viewports.get(activeViewportId);
    if (activeViewport?.displaySetInstanceUIDs?.length) {
      const referenceDisplaySetUID = activeViewport.displaySetInstanceUIDs[0];
      const actualData = fullDataRef.current;
      if (actualData) {
        const newData = actualData.filter(item => {
          const measurement = measurementService.getMeasurement(item.uid);
          return measurement.displaySetInstanceUID === referenceDisplaySetUID;
        });
        setData(newData);
      }
    } else {
      setData(fullDataRef.current);
    }
  }

  if (filterSRs) {
    useEffect(() => {
      activeViewportChanged({});
    }, [fullData]);

    useEffect(() => {
      const unsubscriptionActiveViewportChanged = viewportGridService.subscribe(
        viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
        activeViewportChanged
      );

      eventTarget.addEventListener(EVENTS.STACK_VIEWPORT_NEW_STACK, activeViewportChanged);

      return () => {
        unsubscriptionActiveViewportChanged();
      };
    }, []);

    if (fullData.length !== dataReceived.length) {
      setFullData(dataReceived);
    }
  } else {
    if (data.length !== dataReceived.length) {
      setData(dataReceived);
    }
  }
  const { t } = useTranslation('MeasurementTable');
  const amount = data.length;

  const itemCustomization = customizationService.getCustomization('MeasurementItem', {
    content: MeasurementItem,
    contentProps: {},
  });
  const CustomMeasurementItem = itemCustomization.content;

  return (
    <div>
      <div className="bg-secondary-main flex justify-between px-2 py-1">
        <span className="text-base font-bold uppercase tracking-widest text-white">{t(title)}</span>
        <span className="text-base font-bold text-white">{amount}</span>
      </div>
      <div className="ohif-scrollbar max-h-112 overflow-hidden">
        {data.length !== 0 &&
          data.map((measurementItem, index) => (
            <CustomMeasurementItem
              key={measurementItem.uid}
              uid={measurementItem.uid}
              index={index + 1}
              label={measurementItem.label}
              isActive={measurementItem.isActive}
              displayText={measurementItem.displayText}
              item={measurementItem}
              onClick={onClick}
              onEdit={onEdit}
            />
          ))}
        {data.length === 0 && (
          <div className="group flex cursor-default border border-transparent bg-black transition duration-300">
            <div className="bg-primary-dark text-primary-light group-hover:bg-secondary-main w-6 py-1 text-center text-base transition duration-300"></div>
            <div className="flex flex-1 items-center justify-between px-2 py-4">
              <span className="text-primary-light mb-1 flex flex-1 items-center text-base">
                {t('No tracked measurements')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

MeasurementTable.defaultProps = {
  data: [],
  onClick: () => {},
  onEdit: () => {},
};

MeasurementTable.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      uid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      displayText: PropTypes.arrayOf(PropTypes.string),
      isActive: PropTypes.bool,
    })
  ),
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
};

export default MeasurementTable;
