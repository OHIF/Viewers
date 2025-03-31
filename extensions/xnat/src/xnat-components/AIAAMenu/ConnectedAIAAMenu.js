import { connect } from 'react-redux';
import AIAAMenu from './AIAAMenu.js';
import OHIF from '@ohif/core';

const { setUserPreferences } = OHIF.redux.actions;

const mapStateToProps = state => {
  const { preferences } = state;
  return {
    featureStore: preferences.experimentalFeatures.NVIDIAClaraAIAA,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onUpdateFeatureStore: featureStore => {
      dispatch(setUserPreferences(
        {
          experimentalFeatures: {
            NVIDIAClaraAIAA: {
              ...featureStore,
            },
          },
        }
      ));
    },
  };
};

const ConnectedAIAAMenu = connect(
  mapStateToProps,
  mapDispatchToProps
)(AIAAMenu);

export default ConnectedAIAAMenu;
