import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

const rendererPath = 'settings.public.ui.cornerstoneRenderer';
OHIF.cornerstone.renderer = OHIF.utils.ObjectPath.get(Meteor, rendererPath) || '';
