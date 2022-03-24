import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import XNATSeriesThumbnails from './XNATSeriesThumbnails';
import './XNATStudyBrowser.styl';

function XNATStudyItem(props) {
  const {
    study,
    studyIndex,
    onThumbnailClick,
    onThumbnailDoubleClick,
    supportsDrag,
  } = props;

  const [expanded, setExpanded] = useState(studyIndex === 0);

  const getExpandIcon = () => {
    if (expanded) {
      return <Icon name="xnat-tree-minus" />;
    }
    return <Icon name="xnat-tree-plus" />;
  };

  return (
    <React.Fragment key={studyIndex}>
      <div className="studyDescription">
        <a
          className="btn btn-sm btn-secondary"
          onClick={() => setExpanded(!expanded)}
        >
          {getExpandIcon()}
        </a>
        {study.StudyDescription}
      </div>
      {expanded ? (
        <XNATSeriesThumbnails
          study={study}
          studyIndex={studyIndex}
          onThumbnailClick={onThumbnailClick}
          onThumbnailDoubleClick={onThumbnailDoubleClick}
          supportsDrag={supportsDrag}
        />
      ) : null}
    </React.Fragment>
  );
}

const noop = () => {};

XNATStudyItem.propTypes = {
  study: PropTypes.any,
  studyIndex: PropTypes.any,
  supportsDrag: PropTypes.bool,
  onThumbnailClick: PropTypes.func,
  onThumbnailDoubleClick: PropTypes.func,
};

XNATStudyItem.defaultProps = {
  study: undefined,
  studyIndex: undefined,
  supportsDrag: true,
  onThumbnailClick: noop,
  onThumbnailDoubleClick: noop,
};

export { XNATStudyItem };
