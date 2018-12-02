import { OHIF } from 'meteor/ohif:core';

import './absoluteUrl';
import './objectPath';
import guid from './guid';

OHIF.utils = OHIF.utils || {}
OHIF.utils.guid = guid;
