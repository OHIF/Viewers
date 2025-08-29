import { useEffect, useState, useRef, useCallback } from 'react';
import { useSystem } from '../contextProviders/SystemProvider';
import type { Customization } from '../services/CustomizationService/types';

/**
 * Hook that subscribes to customization changes and triggers rerenders when they occur.
 */
export function useCustomization(customizationKey: string): Customization | undefined {
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;

  // Use a ref to store the key(s) for comparison
  const keyRef = useRef(customizationKey);

  const getCustomizationValue = useCallback(() => {
    return customizationService.getCustomization(customizationKey);
  }, [customizationKey, customizationService]);

  // Initialize with current value
  const [value, setValue] = useState(getCustomizationValue);

  useEffect(() => {
    // Check if keys have changed
    const keysChanged = keyRef.current !== customizationKey;
    if (keysChanged) {
      keyRef.current = customizationKey;
      setValue(getCustomizationValue());
    }

    // Handler for customization changes
    const handleCustomizationChange = () => {
      const newValue = getCustomizationValue();
      setValue(newValue);
    };

    // Subscribe to all customization events
    const subscriptions = [
      customizationService.subscribe(
        customizationService.EVENTS.MODE_CUSTOMIZATION_MODIFIED,
        handleCustomizationChange
      ),
      customizationService.subscribe(
        customizationService.EVENTS.GLOBAL_CUSTOMIZATION_MODIFIED,
        handleCustomizationChange
      ),
      customizationService.subscribe(
        customizationService.EVENTS.DEFAULT_CUSTOMIZATION_MODIFIED,
        handleCustomizationChange
      ),
    ];

    // Cleanup subscriptions on unmount or when keys change
    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [customizationService, customizationKey, getCustomizationValue]);

  return value;
}
