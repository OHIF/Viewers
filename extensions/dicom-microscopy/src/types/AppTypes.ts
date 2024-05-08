/* eslint-disable @typescript-eslint/no-namespace */
import MicroscopyService from '../services/MicroscopyService';

declare global {
  namespace AppTypes {
    export interface Services {
      microscopyService?: MicroscopyService;
    }
  }
}
