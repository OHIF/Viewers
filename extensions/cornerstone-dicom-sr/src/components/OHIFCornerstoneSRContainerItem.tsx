import PropTypes from 'prop-types';
import React from 'react';
import formatContentItemValue from '../utils/formatContentItem';
import { OHIFCornerstoneSREncapsulatedReport } from './OHIFCornerstoneSREncapsulatedReport';
import { utils } from '@ohif/core';
import {
  asStandardReportContentItem,
  getCodeMeaningFromConceptNameCodeSequence,
  getCodeValueFromConceptNameCodeSequence,
} from '../utils/srInspection';
import { CodeNameCodeSequenceValues } from '../enums';
import { emptyTagValue, encodings, defaultDicomEncoding, defaultWebEncoding } from '../utils/constants';


interface OHIFCornerstoneSRContainerItemProps {
  contentItem: object,
  nodeIndexesTree: Array<number>,
  continuityOfContent: string,
  rootDicomEncoding?: string,
}

function OHIFCornerstoneSRContainerItem(props: OHIFCornerstoneSRContainerItemProps) {
  const { contentItem, nodeIndexesTree, continuityOfContent, rootDicomEncoding } = props;
  const { ConceptNameCodeSequence } = asStandardReportContentItem(contentItem);
  const codeMeaning = getCodeMeaningFromConceptNameCodeSequence(ConceptNameCodeSequence);
  const codeValue = getCodeValueFromConceptNameCodeSequence(ConceptNameCodeSequence);
  const isChildFirstNode = nodeIndexesTree[nodeIndexesTree.length - 1] === 0;
  const formattedValue = formatContentItemValue(contentItem) ?? emptyTagValue;
  const startWithAlphaNumCharRegEx = /^[a-zA-Z0-9]/;
  const isContinuous = continuityOfContent === 'CONTINUOUS';
  const addExtraSpace =
    isContinuous && !isChildFirstNode && startWithAlphaNumCharRegEx.test(formattedValue?.[0]);
  //TODO: phase out once we have dcmjs PR #455 merged in and a new version of dcmjs. A comprehensive mapping is present there.
  let nodeDicomEncoding: string | null = contentItem ? contentItem.SpecificCharacterSet : null;
  nodeDicomEncoding = nodeDicomEncoding ?? rootDicomEncoding
  nodeDicomEncoding = nodeDicomEncoding ?? defaultDicomEncoding
  const webEncoding = encodings.get(nodeDicomEncoding) ?? defaultWebEncoding;

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
          content={utils.toBlob(
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

export { OHIFCornerstoneSRContainerItem };
