import viewCode from './viewCode';
import laterality from './laterality';
import isNewestOfModality from './isNewestOfModality';

export default function registerHangingProtocolAttributes({ servicesManager }) {
  const { hangingProtocolService } = servicesManager.services;
  hangingProtocolService.addCustomAttribute('ViewCode', 'View Code Designator:Value', viewCode);
  hangingProtocolService.addCustomAttribute('Laterality', 'Laterality of object', laterality);
  hangingProtocolService.addCustomAttribute(
    'isNewestOfModality',
    'No newer display set of the same Modality in the study',
    isNewestOfModality
  );
}
