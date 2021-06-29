import { Component } from 'react';
import PropTypes from 'prop-types';
import OHIF from '@ohif/core';

const { StudyLoadingListener } = OHIF.classes;

class StudyLoadingMonitor extends Component {
  static propTypes = {
    studies: PropTypes.array.isRequired,
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.props.studies !== prevProps.studies) {
      this.studyLoadingListener.clear();
      this.studyLoadingListener.addStudies(this.props.studies);
    }
  }

  componentDidMount() {
    this.studyLoadingListener = StudyLoadingListener.getInstance();
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
