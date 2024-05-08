/* eslint-disable @typescript-eslint/no-namespace */
import MicroscopyServiceType from '../services/MicroscopyService';

declare global {
  namespace AppTypes {
    export type MicroscopyService = MicroscopyServiceType;
    export interface Services {
      microscopyService?: MicroscopyServiceType;
    }
  }
}
