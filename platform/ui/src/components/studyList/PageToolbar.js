import React, { PureComponent } from 'react';

import { Icon } from './../../elements/Icon';
import PropTypes from 'prop-types';

class PageToolbar extends PureComponent {
  static propTypes = {
    onImport: PropTypes.func,
  };

  onImport = event => {
    if (this.props.onImport) {
      this.props.onImport(event);
    }
  };

  getImportTool() {
    if (this.props.onImport) {
      return (
        <div className="addNewStudy btn-file">
          <label
            htmlFor="btnImport"
            style={{ width: '18px' }}
            onClick={this.onImport}
          >
            <Icon name="plus" />
          </label>
        </div>
      );
    }
  }

  render() {
    return <div className="studylistToolbar">{this.getImportTool()}</div>;
  }
}

export { PageToolbar };
