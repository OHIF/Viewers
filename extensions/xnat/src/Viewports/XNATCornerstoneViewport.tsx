/**
 * XNAT wrapper for OHIFCornerstoneViewport that ensures the viewport is enabled
 * when viewportId changes (e.g. when "No protocol matches, defaulting to..." uses
 * a different layout). The cornerstone OHIFCornerstoneViewport only calls
 * enableViewport on mount; when viewportId changes due to protocol fallback,
 * the viewport must be re-enabled before setViewportData runs.
 */
import React, { useLayoutEffect, useEffect, useRef } from 'react';
import { OHIFCornerstoneViewport } from '@ohif/extension-cornerstone';
import { useViewportRefs, useSystem } from '@ohif/core';

// const XNAT_STACK_FALLBACK_PROTOCOL_ID = 'xnatStackFallback';

/** Reload the viewer with stack protocol in the URL so the error boundary is cleared. */
// function reloadWithStackProtocol(): void {
//   try {
//     const url = new URL(window.location.href);
//     url.searchParams.set('hangingProtocolId', XNAT_STACK_FALLBACK_PROTOCOL_ID);
//     console.warn(
//       'XNAT: Volume rendering error detected, reloading with single stack viewport (hangingProtocolId=xnatStackFallback).'
//     );
//     window.location.replace(url.toString());
//   } catch (e) {
//     console.warn('XNAT: Failed to reload with stack protocol:', e);
//   }
// }

function isVolumeRenderingError(message: string, stack?: string): boolean {
  const msg = String(message || '');
  const st = String(stack || '');
  const fromStack = st.includes('setMapperShaderParameters') || st.includes('updateShaders') || st.includes('vtkVolumeFS');
  return (
    msg.includes('Error compiling shader') ||
    msg.includes('vtkVolumeFS') ||
    (msg.includes('Cannot read properties of null') && (msg.includes('isAttributeUsed') || fromStack)) ||
    (msg.includes('isAttributeUsed') && msg.includes('setMapperShaderParameters')) ||
    fromStack
  );
}

function runFallbackToStack(hangingProtocolService: any): void {
  try {
    const hpState = hangingProtocolService.getState();
    // if (hpState.protocolId === XNAT_STACK_FALLBACK_PROTOCOL_ID) return;
    // reloadWithStackProtocol();
  } catch (e) {
    console.warn('XNAT: MPR fallback to single-stack failed:', e);
  }
}

interface VolumeErrorBoundaryProps {
  hangingProtocolService: any;
  children?: React.ReactNode;
}

interface VolumeErrorBoundaryState {
  hasError: boolean;
}

class VolumeErrorBoundary extends React.Component<
  VolumeErrorBoundaryProps,
  VolumeErrorBoundaryState
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    const { hangingProtocolService } = this.props;
    setTimeout(
      () => requestAnimationFrame(() => runFallbackToStack(hangingProtocolService)),
      50
    );
  }

  render() {
    return this.props.children as React.ReactNode;
  }
}

function XNATCornerstoneViewport(props: React.ComponentProps<typeof OHIFCornerstoneViewport>) {
  const { viewportOptions } = props;
  const viewportId = viewportOptions?.viewportId;
  const syncGroups = viewportOptions?.syncGroups;
  const { servicesManager } = useSystem();
  const { getViewportElement } = useViewportRefs();
  const { cornerstoneViewportService, hangingProtocolService, syncGroupService } = servicesManager.services;
  const fallbackRef = useRef<(() => void) | null>(null);

  fallbackRef.current = () => {
    runFallbackToStack(hangingProtocolService);
  };

  // Global listener for errors that never hit our boundary (e.g. thrown in async/rAF).
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const message = String(event.message || event.error?.message || '');
      const stack = event.error?.stack ?? '';
      if (!isVolumeRenderingError(message, stack)) return;
      // Defer so we're fully out of the error stack; next frame after a short delay.
      setTimeout(() => requestAnimationFrame(() => fallbackRef.current?.()), 50);
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = String(reason?.message ?? reason ?? '');
      const stack = reason?.stack ?? '';
      if (!isVolumeRenderingError(message, stack)) return;
      setTimeout(() => requestAnimationFrame(() => fallbackRef.current?.()), 50);
    };
    window.addEventListener('error', onError, true);
    window.addEventListener('unhandledrejection', onUnhandledRejection, true);
    return () => {
      window.removeEventListener('error', onError, true);
      window.removeEventListener('unhandledrejection', onUnhandledRejection, true);
    };
  }, [hangingProtocolService]);

  // Apply MPR sync groups (camera/pan/zoom) when this viewport's data is set.
  // Sync groups from the HP are in viewportOptions; we add this viewport to them
  // so movement and zoom stay in sync across axial/sagittal/coronal. Done only in XNAT extension.
  useEffect(() => {
    if (!viewportId || !syncGroups?.length || !syncGroupService) return;
    const applySync = () => {
      const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
      if (!viewportInfo) return;
      const renderingEngineId = viewportInfo.getRenderingEngineId?.();
      if (!renderingEngineId) return;
      syncGroupService.addViewportToSyncGroup(viewportId, renderingEngineId, syncGroups);
    };
    const unsub = cornerstoneViewportService.subscribe(
      cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
      (evt: { viewportId: string }) => {
        if (evt.viewportId !== viewportId) return;
        applySync();
      }
    );
    // Apply once in case viewport was already ready before we subscribed
    const t = setTimeout(applySync, 100);
    return () => {
      clearTimeout(t);
      if (typeof unsub === 'function') unsub();
    };
  }, [viewportId, syncGroups, cornerstoneViewportService, syncGroupService]);

  // useLayoutEffect runs synchronously after refs are set, before child's useEffect.
  // This ensures enableViewport runs before loadViewportData->setViewportData.
  useLayoutEffect(() => {
    if (!viewportId) return;
    const element = getViewportElement(viewportId);
    if (element) {
      cornerstoneViewportService.enableViewport(
        viewportId,
        element as HTMLDivElement
      );
    }
  }, [viewportId]);

  return (
    <VolumeErrorBoundary hangingProtocolService={hangingProtocolService}>
      <OHIFCornerstoneViewport {...props} servicesManager={servicesManager} />
    </VolumeErrorBoundary>
  );
}

export default XNATCornerstoneViewport;
