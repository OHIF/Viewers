/*
Copyright (c) MONAI Consortium
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Component } from 'react';
import PropTypes from 'prop-types';

import './BaseTab.css';
import { UIModalService, UINotificationService } from '@ohif/core';
import { currentSegmentsInfo } from '../../utils/SegUtils';

export default class BaseTab extends Component {
  static propTypes = {
    tabIndex: PropTypes.number,
    info: PropTypes.any,
    client: PropTypes.func,
    updateView: PropTypes.func,
    onSelectActionTab: PropTypes.func,
    onOptionsConfig: PropTypes.func,
    getActiveViewportInfo: PropTypes.func,
    servicesManager: PropTypes.any,
    commandsManager: PropTypes.any,
  };

  notification: any;
  uiModelService: any;
  tabId: string;

  constructor(props) {
    super(props);
    this.notification = new UINotificationService();
    this.uiModelService = new UIModalService();
    this.tabId = 'tab-' + this.props.tabIndex;
  }

  onSelectActionTab = (evt) => {
    this.props.onSelectActionTab(evt.currentTarget.value);
  };
  onEnterActionTab = () => {};
  onLeaveActionTab = () => {};
  onSegmentCreated = (id) => {};
  onSegmentUpdated = (id) => {};
  onSegmentDeleted = (id) => {};
  onSegmentSelected = (id) => {};
  onSelectModel = (model) => {};

  segmentInfo = () => {
    return currentSegmentsInfo(
      this.props.servicesManager.services.segmentationService
    ).info;
  };
}
