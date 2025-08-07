import { id } from './id';
import CustomPanel from './custompanel';
import React, { useEffect, useState } from 'react';


console.log('🔧 Extension ID:', id); // Check if 'mammo' is printed

const getPanelModule = ({ servicesManager }) => {
  return [
    {
      name: 'PredictPanel',
      iconName: 'dot-circle',
      label: 'Predict',
      component: () => <CustomPanel servicesManager={servicesManager} />, // ✅ props passed
    },
  ];
};

const getCommandsModule = () => {
  return {
    definitions: {
      runPrediction: {
        commandFn: async () => {
          try {
            const res = await fetch('/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode: 'rtmode' }),
            });
            const result = await res.json();
            alert(`✅ Prediction complete: ${result?.output || 'Success'}`);
          } catch (err) {
            console.error('Prediction failed:', err);
            alert('❌ Prediction failed. Check console.');
          }
        },
        storeContexts: [],
      },
    },
    defaultContext: 'VIEWER',
  };
};

const getToolbarModule = () => {
  return {
    definitions: {
      predictButton: {
        id: 'predictButton',
        name: 'Predict',
        icon: 'launch-arrow',
        type: 'command',
        commandName: 'runPrediction',
        context: 'VIEWER',
        options: {
          tooltip: 'Run Prediction',
        },
      },
    },
    defaultContext: 'VIEWER',
  };
};

const preRegistration = ({ servicesManager }) => {
  const { ToolBarService } = servicesManager.services;
  ToolBarService.addButtons([
    {
      id: 'predictButton',
      name: 'Predict',
      icon: 'launch-arrow',
      type: 'command',
      commandName: 'runPrediction',
      context: 'VIEWER',
      options: {
        tooltip: 'Run Prediction',
      },
    },
  ]);
  ToolBarService.createButtonSection('PredictSection', ['predictButton']);
};

// index.tsx
const extension = {
  id,
  getPanelModule,
};

export default {
  id,
  getPanelModule,
};


