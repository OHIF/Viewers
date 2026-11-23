import { useSystem } from '../contextProviders/SystemProvider';
import type { DisplaySetOrder } from '../services/DisplaySetService/DisplaySetService';
import type { DisplaySet } from '../types';

/**
 * Returns a getter for the active display sets in the named order. The getter
 * reads the order when it is called, so a component does not re-render when
 * the order changes. A component that must re-render subscribes to
 * `DISPLAY_SET_ORDER_CHANGED` and `DISPLAY_SETS_CHANGED`.
 */
export function useDisplaySetOrder(order: DisplaySetOrder = 'default'): () => DisplaySet[] {
  const { servicesManager } = useSystem();
  const { displaySetService } = servicesManager.services;
  return () => displaySetService.getDisplaySets({ order });
}
