import React from 'react';
import PropTypes from 'prop-types';
import { FormattedValue } from '../../elements';

const SegmentStats = props => {
  const { metadata, frameIndex } = props;

  const segmentLabelCell = (
    <td className="left-aligned-cell">
      <div className="stats-label-cell" style={{ borderColor: metadata.color }}>
        {metadata.SegmentLabel}
      </div>
    </td>
  );

  const stats2D = metadata.stats.stats2D;
  const imageStats = stats2D[frameIndex];
  if (!imageStats || imageStats.invalidated) {
    return <tr>{segmentLabelCell}</tr>;
  }
  const data = imageStats.data;

  return (
    <tr>
      {segmentLabelCell}
      <td>{data.area && <FormattedValue value={data.area} />}</td>
      <td>{data.mean && <FormattedValue value={data.mean} />}</td>
      <td>{data.stdDev && <FormattedValue value={data.stdDev} />}</td>
    </tr>
  );
};

SegmentStats.propTypes = {
  metadata: PropTypes.object.isRequired,
  frameIndex: PropTypes.number.isRequired,
};

export default SegmentStats;
