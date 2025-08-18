import PropTypes from 'prop-types';
import React from 'react';
import formatContentItemValue from '../utils/formatContentItem';
import { OHIFCornerstoneSREncapsulatedReport } from './OHIFCornerstoneSREncapsulatedReport';
import { stringToBlob } from '../utils/payload';

const EMPTY_TAG_VALUE = '[empty]';

function OHIFCornerstoneSRContainerItem(props) {
  const { contentItem, nodeIndexesTree, continuityOfContent } = props;
  const { ConceptNameCodeSequence } = contentItem;
  const { CodeValue, CodeMeaning } = ConceptNameCodeSequence;
  const isChildFirstNode = nodeIndexesTree[nodeIndexesTree.length - 1] === 0;
  const formattedValue = formatContentItemValue(contentItem) ?? EMPTY_TAG_VALUE;

  return (
    <>
      <div className="mb-2">
        <span className="font-bold">{CodeMeaning}: </span>
        <OHIFCornerstoneSREncapsulatedReport
          content={stringToBlob(
            formattedValue,
          )}
          expectB64={false}
        >
        </OHIFCornerstoneSREncapsulatedReport>
      </div>
    </>
  );
}

OHIFCornerstoneSRContainerItem.propTypes = {
  contentItem: PropTypes.object,
  nodeIndexesTree: PropTypes.arrayOf(PropTypes.number),
  continuityOfContent: PropTypes.string,
};

export { OHIFCornerstoneSRContainerItem };
