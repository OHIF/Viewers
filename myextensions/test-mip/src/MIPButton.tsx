// MIPButton.jsx (safe, state-tracking - does NOT restore on second click)
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@ohif/ui-next';

function MipButton({ commandsManager, servicesManager, ...props }) {
  const [isMipActive, setIsMipActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const detectMipActive = useCallback(() => {
    try {
      const services = servicesManager?.services || {};
      const cornerstoneViewportService = services.cornerstoneViewportService;
      const viewportGridService = services.viewportGridService;
      if (!cornerstoneViewportService && !viewportGridService) return false;

      const viewportIds =
        cornerstoneViewportService?.getViewportIds?.() ||
        Object.keys(viewportGridService?.getState?.()?.viewports || {});

      for (const vpId of viewportIds) {
        const wrapper = cornerstoneViewportService?.getCornerstoneViewport?.(vpId);
        if (!wrapper) continue;
        const opts =
          typeof wrapper.getOptions === 'function' ? wrapper.getOptions() : wrapper.options || {};
        const blend = opts?.blendMode ?? opts?.blend;
        if (
          typeof blend === 'string' &&
          ['MIP', 'MAXIMUM_INTENSITY_BLEND', 'MAXIMUM_INTENSITY'].includes(String(blend))
        ) {
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }, [servicesManager]);

  useEffect(() => {
    setIsMipActive(detectMipActive());
    const iv = setInterval(() => {
      const active = detectMipActive();
      setIsMipActive(prev => (prev === active ? prev : active));
    }, 500);
    return () => clearInterval(iv);
  }, [detectMipActive]);

  const handleClick = async () => {
    if (busy) return;
    if (!commandsManager) {
      console.error('MipButton: no commandsManager provided');
      return;
    }

    // Determine current MIP state (live)
    const currentlyMipActive = detectMipActive();

    setBusy(true);
    try {
      if (currentlyMipActive) {
        // If MIP already active -> disable it (restore + remove HP)
        // use 'mip.disable' which restores snapshot or forces 1x1 and clears protocol
        await commandsManager.runCommand?.('mip.disable');
      } else {
        // If MIP not active -> set layout and toggle MIP
        await commandsManager.runCommand?.('mip.setMIPLayoutAndToggle', {});
      }

      // small delay to allow wrapper/layout changes to apply before re-detect
      setTimeout(() => {
        if (!mountedRef.current) return;
        setIsMipActive(detectMipActive());
        setBusy(false);
      }, 500);
    } catch (err) {
      console.error('MipButton error:', err);
      setBusy(false);
    }
  };

  return (
    <div className="mt-1 ml-4 flex items-center">
      <Button
        variant={isMipActive ? 'primary' : 'secondary'}
        onClick={handleClick}
        disabled={busy}
        aria-label="Toggle MIP"
        {...props}
      >
        MIP
      </Button>
    </div>
  );
}

export default MipButton;
