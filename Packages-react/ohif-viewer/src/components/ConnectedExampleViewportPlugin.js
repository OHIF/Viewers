import { connect } from 'react-redux';
import ExampleViewportPlugin from './ExampleViewportPlugin';

// We don't really need Redux to do this, this is just an example
const mapStateToProps = (state, ownProps) => {
  const { displaySet } = ownProps.viewportData;
  const { studyInstanceUid, seriesInstanceUid } = displaySet;

  return {
    studyInstanceUid,
    seriesInstanceUid,
    displaySet
  };
};

const ConnectedExampleViewportPlugin = connect(
  mapStateToProps,
  null
)(ExampleViewportPlugin);

export default ConnectedExampleViewportPlugin;
