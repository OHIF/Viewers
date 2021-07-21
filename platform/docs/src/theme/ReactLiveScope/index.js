/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classnames from 'classnames';
import moment from 'moment';
import * as ui from '@ohif/ui';
import utils from '../../utils/';

// Add react-live imports you need here
const ReactLiveScope = {
  React,
  ...React,
  ...ui,
  classnames,
  utils,
  moment,
};

export default ReactLiveScope;
