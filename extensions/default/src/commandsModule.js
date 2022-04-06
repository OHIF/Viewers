const commandsModule = ({ servicesManager, commandsManager }) => {
  const {
    MeasurementService,
    ViewportGridService,
    ToolBarService,
    HangingProtocolService,
    CineService,
  } = servicesManager.services;

  const actions = {
    setMeasurementsActiveProp: ({ ids, value }) => {
      const measurementsToUpdate = MeasurementService.mapMeasurementsBy(
        measurement => {
          if (ids.includes(measurement.id)) {
            measurement.active = value;

            // also ensure it is visible in case activating it.
            if (value) {
              measurement.visible = true;
            }
          } else {
            measurement.active = false;
          }

          return measurement;
        }
      );

      MeasurementService.updateMany(measurementsToUpdate, true);
    },
    /**
     * Toggle the visibility of measurements. If param.ids:
     *  - undefined: a bulk operation will be executed
     *  - []: it will toggle the visibility of current active measurement (MeasurementService)
     *  - ['idstring']: it will toggle the visibility of measurement that has id as 'idstring'
     * 
     * @param {Object} param 
     * @param {String} param.ids
     * @returns 
     */
    toggleMeasurementsVisibility: ({ ids }) => {
      let _ids = ids;

      const activeMeasurement =
        MeasurementService.findMeasurementBy(
          measurement => !!measurement.active
        ) || {};

      const measurementsToUpdate = [];

      // bulk op
      if (!_ids) {
        // aux list to allow op o(n)
        const measurementsToUpdateAuxV = [];
        const measurementsToUpdateAuxF = [];
        // accumulator to tell whether there is at least one visible.
        let acc;
        MeasurementService.forEachMeasurement(measurement => {
          const nextValue = !measurement.visible;

          if (!acc) {
            acc = measurement.visible;
          } else {
            acc = acc || measurement.visible;
          }

          const measurementToUpdate = {
            ...measurement,
            visible: nextValue,
          };

          if (nextValue) {
            measurementsToUpdateAuxV.push(measurementToUpdate);
          } else {
            measurementsToUpdateAuxF.push(measurementToUpdate);
          }
        });

        // accumulator true means there was at one item visible, which should be changed to not visible.
        if (acc) {
          measurementsToUpdate.push(...measurementsToUpdateAuxF);
        } else {
          measurementsToUpdate.push(...measurementsToUpdateAuxV);
        }
      } else {
        const updatedMeasurement =
          ids.length === 0
            ? activeMeasurement
            : MeasurementService.getMeasurement(_ids[0]);

        if (!updatedMeasurement) {
          return;
        }
        measurementsToUpdate.push({
          ...updatedMeasurement,
          visible: !updatedMeasurement.visible,
        });
      }

      MeasurementService.updateMany(measurementsToUpdate, true);
    },
    clearMeasurements: () => {
      MeasurementService.clear();
    },
    toggleCine: () => {
      const { viewports } = ViewportGridService.getState();
      const { isCineEnabled } = CineService.getState();
      CineService.setIsCineEnabled(!isCineEnabled);
      ToolBarService.setButton('Cine', { props: { isActive: !isCineEnabled } });
      viewports.forEach((_, index) =>
        CineService.setCine({ id: index, isPlaying: false })
      );
    },
    nextStage: () => {
      // next stage in hanging protocols
      HangingProtocolService.nextProtocolStage();
    },
    previousStage: () => {
      HangingProtocolService.previousProtocolStage();
    },
  };

  const definitions = {
    setMeasurementsActiveProp: {
      commandFn: actions.setMeasurementsActiveProp,
      storeContexts: [],
      options: {},
    },
    toggleMeasurementsVisibility: {
      commandFn: actions.toggleMeasurementsVisibility,
      storeContexts: [],
      options: {},
    },
    clearMeasurements: {
      commandFn: actions.clearMeasurements,
      storeContexts: [],
      options: {},
    },
    toggleCine: {
      commandFn: actions.toggleCine,
      storeContexts: [],
      options: {},
    },
    nextStage: {
      commandFn: actions.nextStage,
      storeContexts: [],
      options: {},
    },
    previousStage: {
      commandFn: actions.previousStage,
      storeContexts: [],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'DEFAULT',
  };
};

export default commandsModule;
