import PropTypes from 'prop-types';
import React from 'react';
import formatContentItemValue from '../utils/formatContentItem';
import { OHIFCornerstoneSRContentItemReport } from './OHIFCornerstoneSRContentItemReport';
import { stringToBlob } from '../utils/payload';

const EMPTY_TAG_VALUE = '[empty]';

function OHIFCornerstoneSRContentItem(props) {
  const { contentItem, nodeIndexesTree, continuityOfContent } = props;
  const { ConceptNameCodeSequence } = contentItem;
  const { CodeValue, CodeMeaning } = ConceptNameCodeSequence;
  const isChildFirstNode = nodeIndexesTree[nodeIndexesTree.length - 1] === 0;
  const formattedValue = formatContentItemValue(contentItem) ?? EMPTY_TAG_VALUE;

  return (
    <>
      <div className="mb-2">
        <span className="font-bold">{CodeMeaning}: </span>
        <OHIFCornerstoneSRContentItemReport
          content={stringToBlob(
            formattedValue,
          )}
          expectB64={false}
        >
        </OHIFCornerstoneSRContentItemReport>
      </div>
    </>
  );
}

OHIFCornerstoneSRContentItem.propTypes = {
  contentItem: PropTypes.object,
  nodeIndexesTree: PropTypes.arrayOf(PropTypes.number),
  continuityOfContent: PropTypes.string,
};

export { OHIFCornerstoneSRContentItem };
