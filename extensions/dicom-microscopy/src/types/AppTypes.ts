/* eslint-disable @typescript-eslint/no-namespace */
import MicroscopyServiceType from '../services/MicroscopyService';

declare global {
  namespace AppTypes {
    export interface Services {
      microscopyService?: MicroscopyServiceType;
    }
    type MicroscopyService = MicroscopyServiceType;
  }
}
