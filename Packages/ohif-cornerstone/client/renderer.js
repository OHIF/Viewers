import { Meteor, OHIF } from '../namespace';

const rendererPath = 'settings.public.ui.cornerstoneRenderer';
OHIF.cornerstone.renderer = OHIF.utils.ObjectPath.get(Meteor, rendererPath) || '';
