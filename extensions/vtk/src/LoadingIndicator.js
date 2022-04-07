import './LoadingIndicator.css';

import React, { PureComponent } from 'react';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

class LoadingIndicator extends PureComponent {
  static propTypes = {
    percentComplete: PropTypes.number.isRequired,
    error: PropTypes.object,
  };

  static defaultProps = {
    percentComplete: 0,
    error: null,
  };

  render() {
    let percComplete;
    if (this.props.percentComplete && this.props.percentComplete !== 100) {
      percComplete = `${this.props.percentComplete}%`;
    }

    return (
      <React.Fragment>
        {this.props.error ? (
          <div className="imageViewerErrorLoadingIndicator loadingIndicator">
            <div className="indicatorContents">
              <h4>Error Loading Image</h4>
              <p className="description">An error has occurred.</p>
              <p className="details">{this.props.error.message}</p>
            </div>
          </div>
        ) : (
          <div className="imageViewerLoadingIndicator loadingIndicator">
            <div className="indicatorContents">
              <p>
                {this.props.t('Loading...')}
                <i className="fa fa-spin fa-circle-o-notch fa-fw" />
                {percComplete}
              </p>
            </div>
          </div>
        )}
      </React.Fragment>
    );
  }
}

export default withTranslation('Common')(LoadingIndicator);
