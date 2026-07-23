import PropTypes from 'prop-types';
import React from 'react';
import { CodeNameCodeSequenceValues } from '../enums';
import formatContentItemValue from '../utils/formatContentItem';

const EMPTY_TAG_VALUE = '[empty]';

function OHIFCornerstoneSRContentItem(props) {
  const { contentItem, nodeIndexesTree, continuityOfContent } = props;
  const { ConceptNameCodeSequence } = contentItem;
  const { CodeValue, CodeMeaning } = ConceptNameCodeSequence;
  const isChildFirstNode = nodeIndexesTree[nodeIndexesTree.length - 1] === 0;
  const formattedValue = formatContentItemValue(contentItem) ?? EMPTY_TAG_VALUE;
  const startWithAlphaNumCharRegEx = /^[a-zA-Z0-9]/;
  const isContinuous = continuityOfContent === 'CONTINUOUS';
  const isFinding = CodeValue === CodeNameCodeSequenceValues.Finding;
  const addExtraSpace =
    isContinuous && !isChildFirstNode && startWithAlphaNumCharRegEx.test(formattedValue?.[0]);

  // Collapse sequences of white space preserving newline characters
  let className = 'whitespace-pre-line';

  if (CodeValue === CodeNameCodeSequenceValues.Finding) {
    // Preserve spaces because it is common to see tabular text in a
    // "Findings" ConceptNameCodeSequence
    className = 'whitespace-pre-wrap';
  }

  if (isContinuous) {
    return (
      <>
        <span
          className={className}
          title={CodeMeaning}
        >
          {addExtraSpace ? ' ' : ''}
          {formattedValue}
        </span>
      </>
    );
  }

  return (
    <>
      <div className="mb-2">
        <span className="font-bold">{CodeMeaning}: </span>
        {isFinding ? (
          <pre>{formattedValue}</pre>
        ) : (
          <span className={className}>{formattedValue}</span>
        )}
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
