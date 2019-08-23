import './DownloadScreenShot.styl';

import React, { PureComponent } from 'react';
import { withTranslation } from '../../utils/LanguageProvider';
import { Icon } from './../../elements/Icon';
import PropTypes from 'prop-types';

class DownloadScreenShot extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {

    };
  }

  render() {
    return (
      <div className="DownloadScreenShot">
        <img src="https://static.c.realme.com/IN/thread/1131829455673622528.png" alt="as"/>
      </div>
    )
  }
}

const connectedComponent = withTranslation('DownloadScreenShot')(DownloadScreenShot);
export { connectedComponent as DownloadScreenShot };
export default connectedComponent;