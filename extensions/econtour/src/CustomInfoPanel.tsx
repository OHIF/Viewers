import React, { useEffect, useState } from 'react';
import { SegmentationTable } from '@ohif/ui-next';
import { useActiveViewportSegmentationRepresentations } from '@ohif/extension-cornerstone';
import { metaData } from '@cornerstonejs/core';
import { useSystem } from '@ohif/core/src';
import { useImageViewer } from '@ohif/ui-next';
import { useQuery } from '@tanstack/react-query';

export default function CustomSegmentationPanel({ children }: withAppTypes) {
  const { commandsManager, servicesManager } = useSystem();
  const { customizationService, displaySetService } = servicesManager.services;
  const internalImageViewer = useImageViewer();
  const StudyInstanceUIDs = internalImageViewer.StudyInstanceUIDs;

  // Function to fetch contour info
  const fetchContourInfo = async (studyUID: string) => {
    if (!studyUID) {
      return null;
    }

    // Customize the environment as needed
    const environment = 'development';
    const baseUrl = environment ? `https://${environment}.econtour.org` : 'https://econtour.org';

    const response = await fetch(`${baseUrl}/api/study/?studyUID=${studyUID}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.debug('No contour data found for this study');
        return null;
      }
      throw new Error(`Error fetching contour data: ${response.status}`);
    }

    const data = await response.json();
    console.debug('Contour info retrieved:', data);
    return data.responseBody;
  };

  // Use React Query to fetch and cache contour info
  const {
    data: contourInfo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contourInfo', StudyInstanceUIDs?.[0]],
    queryFn: () => (StudyInstanceUIDs?.[0] ? fetchContourInfo(StudyInstanceUIDs[0]) : null),
    enabled: !!StudyInstanceUIDs?.[0],
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });

  return (
    <div>
      <h1>Custom Info Panel</h1>
    </div>
  );
}
