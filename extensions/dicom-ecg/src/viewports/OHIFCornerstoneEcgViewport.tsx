import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { RenderingEngine, Enums as csEnums, metaData } from '@cornerstonejs/core';
import type { IECGViewport } from '@cornerstonejs/core';
import { useViewportRef } from '@ohif/core';
import { buildEcgModule } from '../utils/ecgHelpers';

const { ViewportType, MetadataModules } = csEnums;

// ---------------------------------------------------------------------------
// Viewport component
// ---------------------------------------------------------------------------

let _renderingEngineCounter = 0;

function OHIFCornerstoneEcgViewport({
  displaySets,
  viewportId = 'ecg-viewport',
  servicesManager,
}: {
  displaySets: any[];
  viewportId?: string;
  servicesManager?: any;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const renderingEngineRef = useRef<RenderingEngine | null>(null);
  const providerRef = useRef<((type: string, imageId: string) => any) | null>(null);
  const viewportRef = useViewportRef(viewportId);

  if (displaySets?.length > 1) {
    throw new Error(
      'OHIFCornerstoneEcgViewport: only one display set is supported for dicom-ecg'
    );
  }

  const displaySet = displaySets[0];
  const { instance, imageIds } = displaySet;
  const imageId = imageIds?.[0];

  useEffect(() => {
    if (!elementRef.current || !imageId || !instance) {
      return;
    }

    let mounted = true;

    const userAuthenticationService =
      servicesManager?.services?.userAuthenticationService;

    // Build the ecgModule from the DICOM instance metadata
    const ecgModule = buildEcgModule(instance, userAuthenticationService);

    if (!ecgModule) {
      console.error(
        '[ECGViewport] Could not build ECG module — no WaveformSequence in instance'
      );
      return;
    }

    // Register a Cornerstone metadata provider that returns ecgModule for our imageId.
    // Priority 100 ensures it runs before the default providers.
    const provider = (type: string, id: string) => {
      if (type === MetadataModules.ECG && id === imageId) {
        return ecgModule;
      }
    };
    providerRef.current = provider;
    metaData.addProvider(provider, 100);

    // Create a unique rendering engine ID to avoid conflicts across viewports
    const renderingEngineId = `ecg-engine-${viewportId}-${++_renderingEngineCounter}`;
    const csViewportId = `ecg-cs-${viewportId}`;

    renderingEngineRef.current = new RenderingEngine(renderingEngineId);
    renderingEngineRef.current.enableElement({
      viewportId: csViewportId,
      type: ViewportType.ECG,
      element: elementRef.current,
    });

    const viewport = renderingEngineRef.current.getViewport(csViewportId) as IECGViewport;

    viewport.setEcg(imageId).catch(err => {
      if (mounted) {
        console.error('[ECGViewport] setEcg failed:', err);
      }
    });

    return () => {
      mounted = false;
      if (providerRef.current) {
        metaData.removeProvider(providerRef.current);
        providerRef.current = null;
      }
      if (renderingEngineRef.current) {
        renderingEngineRef.current.destroy();
        renderingEngineRef.current = null;
      }
    };
  }, [imageId, viewportId]);

  return (
    <div
      className="bg-primary-black h-full w-full"
      ref={el => {
        elementRef.current = el;
        if (el) {
          viewportRef.register(el);
        } else {
          viewportRef.unregister();
        }
      }}
      data-viewport-id={viewportId}
    />
  );
}

OHIFCornerstoneEcgViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object).isRequired,
  viewportId: PropTypes.string,
  servicesManager: PropTypes.object,
};

export default OHIFCornerstoneEcgViewport;
