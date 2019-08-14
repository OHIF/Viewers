import { Component } from "react";
import PropTypes from "prop-types";
import OHIF from "@ohif/core";

class StudyLoadingMonitor extends Component {
  static propTypes = {
    studies: PropTypes.array.isRequired,
    setStudyLoadingProgress: PropTypes.func.isRequired,
    clearStudyLoadingProgress: PropTypes.func.isRequired
  };

  componentDidMount() {
    // TODO: This is pretty ugly. The thing is that the StudyLoadingListener
    // needs to update the Redux store, but shouldn't know that it exists.
    // I am therefore passing in some functions to update the store instead,
    // but this should definitely be cleaned up somehow.
    const options = {
      _setProgressData: (progressId, progressData) => {
        this.props.setStudyLoadingProgress(progressId, progressData);
      },
      _clearProgressById: progressId => {
        this.props.clearStudyLoadingProgress(progressId);
      }
    };

    const { StudyLoadingListener } = OHIF.classes;
    this.studyLoadingListener = StudyLoadingListener.getInstance(options);
    this.studyLoadingListener.clear();
    this.studyLoadingListener.addStudies(this.props.studies);
  }

  render() {
    return null;
  }

  componentWillUnmount() {
    // Destroy stack loading listeners when we close the viewer
    this.studyLoadingListener.clear();
  }
}

export default StudyLoadingMonitor;
