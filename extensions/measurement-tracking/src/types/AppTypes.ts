/* eslint-disable @typescript-eslint/no-namespace */
import { TrackedMeasurementsService } from '../services/TrackedMeasurementsService';

declare global {
  namespace AppTypes {
    export type TrackedMeasurementsServiceType = TrackedMeasurementsService;
    export interface Services {
      trackedMeasurementsService?: TrackedMeasurementsService;
    }
  }
}
