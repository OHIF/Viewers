import { OHIF } from 'meteor/ohif:core';
import devModeMediator from './demoModeMediator.js';
import './components';
import './routes.js';

OHIF.demoMode = devModeMediator;

