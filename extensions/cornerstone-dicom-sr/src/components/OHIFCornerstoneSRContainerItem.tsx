import PropTypes from 'prop-types';
import React from 'react';
import formatContentItemValue from '../utils/formatContentItem';
import { OHIFCornerstoneSREncapsulatedReport } from './OHIFCornerstoneSREncapsulatedReport';
import { stringToBlob } from '../utils/payload';
import {
  asStandardReportContentItem,
  getCodeMeaningFromConceptNameCodeSequence,
  getCodeValueFromConceptNameCodeSequence,
} from '../utils/srInspection';
import { CodeNameCodeSequenceValues } from '../enums';

const EMPTY_TAG_VALUE = '[empty]';
const encodings = {
  'default': 'latin1',
  'ISO 2022 IR 100': 'latin1'
}

function OHIFCornerstoneSRContainerItem(props) {
  const { contentItem, nodeIndexesTree, continuityOfContent } = props;
  const { ConceptNameCodeSequence } = asStandardReportContentItem(contentItem);
  const codeMeaning = getCodeMeaningFromConceptNameCodeSequence(ConceptNameCodeSequence);
  const codeValue = getCodeValueFromConceptNameCodeSequence(ConceptNameCodeSequence);
  const isChildFirstNode = nodeIndexesTree[nodeIndexesTree.length - 1] === 0;
  const formattedValue = formatContentItemValue(contentItem) ?? EMPTY_TAG_VALUE;
  const startWithAlphaNumCharRegEx = /^[a-zA-Z0-9]/;
  const isContinuous = continuityOfContent === 'CONTINUOUS';
  const addExtraSpace =
    isContinuous && !isChildFirstNode && startWithAlphaNumCharRegEx.test(formattedValue?.[0]);
  //TODO: phase out once we have dcmjs PR #455 merged in and a new version of dcmjs. A comprehensive mapping is present there.
  const dicomEncoding = contentItem ? contentItem.SpecificCharacterSet : 'ISO 2022 IR 100'
  const webEncoding = dicomEncoding in encodings ? encodings[dicomEncoding] : encodings['default'];

    // Collapse sequences of white space preserving newline characters
  let className = 'whitespace-pre-line';

  if (codeValue === CodeNameCodeSequenceValues.Finding) {
    // Preserve spaces because it is common to see tabular text in a
    // "Findings" ConceptNameCodeSequence
    className = 'whitespace-pre-wrap';
  }

  if (isContinuous) {
    return (
      <>
        <span
          className={className}
          title={codeMeaning}
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
        <span className="font-bold">{codeMeaning}: </span>
        <OHIFCornerstoneSREncapsulatedReport
          content={stringToBlob(
            formattedValue,
          )}
          encoding={ webEncoding }
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
