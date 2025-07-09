import React from 'react';
import { DicomMetadataStore, utils } from '@ohif/core';
import { Enums } from '@cornerstonejs/tools';
import defaultContextMenuCustomization from './customizations/defaultContextMenuCustomization';
import helloPageCustomization from './customizations/helloPageCustomization';
import labellingFlowCustomization from './customizations/labellingFlowCustomization';
import viewportNotificationCustomization from './customizations/notificationCustomization';
import layoutSelectorCustomization from './customizations/layoutSelectorCustomization';

/**
 * Maps XNAT metadata to a format the study browser expects
 * @param studies - Array of studies from DicomMetadataStore
 * @returns Mapped studies with proper display fields
 */
function mapXNATMetadataForDisplay(studies) {
  if (!studies || !studies.length) {
    return studies;
  }

  return studies.map(study => {
    // Get current date if needed for defaults
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const currentTime = new Date().toTimeString().slice(0, 8).replace(/:/g, '');

    // Ensure key fields exist with proper formatting
    const patientName = study.PatientName || 'No Name';
    const patientId = study.PatientID || '';
    const accessionNumber = study.AccessionNumber || '';

    // Set a default date if missing
    if (!study.StudyDate) {
      console.log('XNAT: Setting default study date as none was provided');
      study.StudyDate = today;
    }

    const studyDate = study.StudyDate
      ? utils.formatDate(study.StudyDate)
      : utils.formatDate(today);

    // Set a default time if missing
    if (!study.StudyTime) {
      console.log('XNAT: Setting default study time as none was provided');
      study.StudyTime = currentTime;
    }

    const studyTime = study.StudyTime
      ? utils.formatTime(study.StudyTime)
      : utils.formatTime(currentTime);

    const modalities = study.Modalities || study.ModalitiesInStudy || '';
    const studyDescription = study.StudyDescription || 'No Description';

    // Map any XNAT specific fields that might be missing or named differently
    return {
      ...study,
      PatientName: patientName,
      PatientID: patientId,
      AccessionNumber: accessionNumber,
      StudyDate: studyDate,
      StudyTime: studyTime,
      ModalitiesInStudy: modalities,
      StudyDescription: studyDescription,
      // Ensure display fields are set
      displayStudyDate: studyDate,
      displayPatientName: typeof patientName === 'object' ? patientName.Alphabetic : patientName,
      displayStudyDescription: studyDescription,
    };
  });
}

/**
 * Apply custom styling to the study browser
 */
function CustomizableXNATViewportLabels({ servicesManager }) {
  const { customizationService } = servicesManager.services;

  if (customizationService) {
    customizationService.addModeCustomizations([
      {
        id: 'xnatStyleOverrides',
        keys: ['ohif.studyList.studyDate.label', 'ohif.studyList.studyDescription.label'],
        styles: { font: 'bold 14px Arial' },
      },
    ]);
  }

  return null;
}

/**
 * Enhance the XNAT metadata handling in OHIF viewer
 * This customization improves the display of XNAT studies in the study browser
 */
export default function getCustomizationModule({ servicesManager, extensionManager }) {
  // Add hooks to enhance study metadata when retrieved from DicomMetadataStore
  // Override the getStudy method to map metadata properly
  const originalGetStudy = DicomMetadataStore.getStudy;
  DicomMetadataStore.getStudy = function (studyInstanceUID) {
    const study = originalGetStudy.call(DicomMetadataStore, studyInstanceUID);
    if (!study) return null;

    // Apply our metadata mapping to this study
    const mappedStudies = mapXNATMetadataForDisplay([study]);
    return mappedStudies[0];
  };

  // Also hook into getStudyInstanceUIDs to ensure all studies are processed
  const originalGetStudyInstanceUIDs = DicomMetadataStore.getStudyInstanceUIDs;
  DicomMetadataStore.getStudyInstanceUIDs = function () {
    const studyUIDs = originalGetStudyInstanceUIDs.call(DicomMetadataStore);
    return studyUIDs;
  };

  // Return customization module with proper name for each element
  return [
    {
      name: 'contextMenu',
      value: defaultContextMenuCustomization,
    },
    {
      name: 'helloPage',
      value: helloPageCustomization,
    },
    {
      name: 'labellingFlow',
      value: labellingFlowCustomization,
    },
    {
      name: 'viewportNotification',
      value: viewportNotificationCustomization,
    },
    {
      name: 'default',
      value: {
        ...layoutSelectorCustomization,
        // Ensure measurement tools are enabled by default for passive rendering
        tools: {
          Length: {
            mode: 'Enabled',
          },
          Bidirectional: {
            mode: 'Enabled',
          },
          EllipticalROI: {
            mode: 'Enabled',
          },
          CircleROI: {
            mode: 'Enabled',
          },
          RectangleROI: {
            mode: 'Enabled',
          },
          ArrowAnnotate: {
            mode: 'Enabled',
          },
        },
        autoCineModalities: ['OT', 'US'],
        'viewportOverlay.topLeft': [],
        'viewportOverlay.topRight': [],
        'viewportOverlay.bottomLeft': [],
        'viewportOverlay.bottomRight': [],
      },
    },
    {
      name: 'ohif.divider',
      value: {
        label: 'XNAT Extensions',
        color: 'rgb(29, 174, 160)',
      },
    },
    {
      name: 'xnat.customizationModule.summary',
      value: {
        content: {
          title: 'XNAT Integration',
          label: 'Enhanced with XNAT features',
          image: '',
        },
        renderer: {
          id: 'summaryCard',
        },
      },
    },
  ];
}
